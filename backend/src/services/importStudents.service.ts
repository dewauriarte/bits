import prisma from '../config/database';
import bcrypt from 'bcrypt';

export interface StudentRow {
  username: string;
  nombre: string;
  apellido: string;
}

export interface ImportResult {
  total: number;
  nuevos: number;
  existentes: number;
  errores: string[];
  estudiantes: {
    username: string;
    nombre: string;
    apellido: string;
    esNuevo: boolean;
    password?: string;
  }[];
}

export class ImportStudentsService {
  private readonly DEFAULT_PASSWORD = '1234';

  /**
   * Crear un nuevo estudiante y agregarlo a una clase
   */
  async createAndAddStudent(
    claseId: string,
    profesorId: string,
    studentData: StudentRow
  ): Promise<any> {
    const bcrypt = require('bcrypt');
    
    // Verificar que la clase existe y pertenece al profesor
    const clase = await prisma.clases.findUnique({
      where: { id: claseId },
    });

    if (!clase) {
      throw new Error('Clase no encontrada');
    }

    if (clase.profesor_id !== profesorId) {
      throw new Error('No tienes permiso para agregar estudiantes a esta clase');
    }

    // Validar datos
    if (!studentData.username || !studentData.nombre || !studentData.apellido) {
      throw new Error('Username, nombre y apellido son obligatorios');
    }

    const cleanUsername = studentData.username.trim().toLowerCase();

    // Verificar si ya existe
    const existingUser = await prisma.usuarios.findUnique({
      where: { username: cleanUsername },
    });

    if (existingUser) {
      throw new Error(`El username "${cleanUsername}" ya está registrado`);
    }

    // Hash de contraseña
    const passwordHash = await bcrypt.hash(this.DEFAULT_PASSWORD, 10);

    // Crear usuario
    const usuario = await prisma.usuarios.create({
      data: {
        username: cleanUsername,
        email: null,
        password_hash: passwordHash,
        nombre: studentData.nombre.trim(),
        apellido: studentData.apellido.trim(),
        rol: 'estudiante',
        estado: 'activo',
        tipo_auth: 'username',
        fecha_nacimiento: null,
      },
    });

    // Crear perfil gamer
    await prisma.perfiles_gamer.create({
      data: {
        usuario_id: usuario.id,
        nivel: 1,
        experiencia: 0,
        puntos_totales: BigInt(0),
        copas: 0,
        trofeos_oro: 0,
        trofeos_plata: 0,
        trofeos_bronce: 0,
      },
    });

    // Inscribir en la clase
    await prisma.clase_estudiantes.create({
      data: {
        clase_id: claseId,
        estudiante_id: usuario.id,
        estado: 'activo',
      },
    });

    return {
      usuario,
      password: this.DEFAULT_PASSWORD,
    };
  }

  /**
   * Importar estudiantes a una clase
   * @param claseId - ID de la clase
   * @param profesorId - ID del profesor que importa
   * @param students - Array de estudiantes del Excel
   */
  async importStudents(
    claseId: string,
    profesorId: string,
    students: StudentRow[]
  ): Promise<ImportResult> {
    // Verificar que la clase existe y pertenece al profesor
    const clase = await prisma.clases.findUnique({
      where: { id: claseId },
    });

    if (!clase) {
      throw new Error('Clase no encontrada');
    }

    if (clase.profesor_id !== profesorId) {
      throw new Error('No tienes permiso para importar estudiantes a esta clase');
    }

    const result: ImportResult = {
      total: students.length,
      nuevos: 0,
      existentes: 0,
      errores: [],
      estudiantes: [],
    };

    // Hash de la contraseña por defecto
    const defaultPasswordHash = await bcrypt.hash(this.DEFAULT_PASSWORD, 10);

    for (const studentData of students) {
      try {
        // Validar datos obligatorios
        if (!studentData.username || !studentData.nombre || !studentData.apellido) {
          result.errores.push(
            `Fila con datos incompletos: ${JSON.stringify(studentData)}`
          );
          continue;
        }

        // Limpiar username (sin espacios, lowercase)
        const cleanUsername = studentData.username.trim().toLowerCase();

        // Verificar si el usuario ya existe
        let usuario = await prisma.usuarios.findUnique({
          where: { username: cleanUsername },
        });

        const esNuevo = !usuario;

        // Si no existe, crear el usuario
        if (!usuario) {
          usuario = await prisma.usuarios.create({
            data: {
              username: cleanUsername,
              email: null,
              password_hash: defaultPasswordHash,
              nombre: studentData.nombre.trim(),
              apellido: studentData.apellido.trim(),
              rol: 'estudiante',
              estado: 'activo',
              tipo_auth: 'username',
              fecha_nacimiento: null,
            },
          });

          // Crear perfil gamer para el nuevo estudiante
          await prisma.perfiles_gamer.create({
            data: {
              usuario_id: usuario.id,
              nivel: 1,
              experiencia: 0,
              puntos_totales: BigInt(0),
              copas: 0,
              trofeos_oro: 0,
              trofeos_plata: 0,
              trofeos_bronce: 0,
            },
          });

          result.nuevos++;
        } else {
          result.existentes++;
        }

        // Verificar si ya está inscrito en la clase
        const yaInscrito = await prisma.clase_estudiantes.findFirst({
          where: {
            clase_id: claseId,
            estudiante_id: usuario.id,
          },
        });

        // Si no está inscrito, inscribirlo
        if (!yaInscrito) {
          await prisma.clase_estudiantes.create({
            data: {
              clase_id: claseId,
              estudiante_id: usuario.id,
              estado: 'activo',
            },
          });
        }

        result.estudiantes.push({
          username: cleanUsername,
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          esNuevo,
          password: esNuevo ? this.DEFAULT_PASSWORD : undefined,
        });
      } catch (error: any) {
        console.error('Error processing student:', error);
        result.errores.push(
          `Error procesando ${studentData.username}: ${error.message}`
        );
      }
    }

    return result;
  }

  /**
   * Validar formato del archivo Excel parseado
   */
  validateStudentData(data: any[]): StudentRow[] {
    const students: StudentRow[] = [];

    for (const row of data) {
      // Saltar filas vacías o encabezados
      if (!row.username && !row.nombre && !row.apellido) {
        continue;
      }

      students.push({
        username: row.username || row.Username || row.USERNAME || '',
        nombre: row.nombre || row.Nombre || row.NOMBRE || '',
        apellido: row.apellido || row.Apellido || row.APELLIDO || '',
      });
    }

    return students;
  }

  /**
   * Generar plantilla Excel como CSV
   */
  generateTemplate(): string {
    const headers = ['username', 'nombre', 'apellido'];
    const example1 = ['estudiante1', 'Juan', 'Pérez'];
    const example2 = ['estudiante2', 'María', 'García'];
    
    return `${headers.join(',')}
${example1.join(',')}
${example2.join(',')}`;
  }
}
