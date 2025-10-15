import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Hash password
  const hashedPassword = await bcrypt.hash('Admin123!', 10);

  // 1 Admin
  const admin = await prisma.usuarios.create({
    data: {
      username: 'admin',
      email: 'admin@appquiz.com',
      password_hash: hashedPassword,
      nombre: 'Administrador',
      apellido: 'Sistema',
      rol: 'admin',
      estado: 'activo',
    },
  });

  // 2 Profesores
  const profesor1 = await prisma.usuarios.create({
    data: {
      username: 'prof_maria',
      email: 'maria@appquiz.com',
      password_hash: await bcrypt.hash('Prof123!', 10),
      nombre: 'María',
      apellido: 'González',
      rol: 'profesor',
      estado: 'activo',
    },
  });

  const profesor2 = await prisma.usuarios.create({
    data: {
      username: 'prof_carlos',
      email: 'carlos@appquiz.com',
      password_hash: await bcrypt.hash('Prof123!', 10),
      nombre: 'Carlos',
      apellido: 'Rodríguez',
      rol: 'profesor',
      estado: 'activo',
    },
  });

  // 10 Estudiantes
  const estudiantes = await Promise.all(
    [
      { username: 'est_juan', nombre: 'Juan', apellido: 'Pérez' },
      { username: 'est_ana', nombre: 'Ana', apellido: 'Torres' },
      { username: 'est_luis', nombre: 'Luis', apellido: 'Martínez' },
      { username: 'est_sofia', nombre: 'Sofía', apellido: 'López' },
      { username: 'est_diego', nombre: 'Diego', apellido: 'Ramírez' },
      { username: 'est_carmen', nombre: 'Carmen', apellido: 'Díaz' },
      { username: 'est_pedro', nombre: 'Pedro', apellido: 'Sánchez' },
      { username: 'est_laura', nombre: 'Laura', apellido: 'Fernández' },
      { username: 'est_miguel', nombre: 'Miguel', apellido: 'Castro' },
      { username: 'est_elena', nombre: 'Elena', apellido: 'Morales' },
    ].map(async (est) => {
      const usuario = await prisma.usuarios.create({
        data: {
          username: est.username,
          email: `${est.username}@estudiante.com`,
          password_hash: await bcrypt.hash('Est123!', 10),
          nombre: est.nombre,
          apellido: est.apellido,
          rol: 'estudiante',
          estado: 'activo',
        },
      });

      // Crear perfil gamer para cada estudiante
      await prisma.perfiles_gamer.create({
        data: {
          usuario_id: usuario.id,
          nivel: 1,
          experiencia: 0,
          puntos_totales: 0,
          copas: 0,
          trofeos_oro: 0,
          trofeos_plata: 0,
          trofeos_bronce: 0,
        },
      });

      return usuario;
    })
  );

  console.log(`✅ Usuarios creados: ${estudiantes.length + 3}`);
  console.log(`   - Admin: ${admin.username}`);
  console.log(`   - Profesores: ${profesor1.username}, ${profesor2.username}`);
  console.log(`   - Estudiantes: ${estudiantes.length}`);

  // Grados
  const grados = await Promise.all([
    prisma.grados.create({ data: { nombre: 'Inicial 3 años', nivel: 'inicial', orden: 1 } }),
    prisma.grados.create({ data: { nombre: 'Inicial 4 años', nivel: 'inicial', orden: 2 } }),
    prisma.grados.create({ data: { nombre: 'Inicial 5 años', nivel: 'inicial', orden: 3 } }),
    prisma.grados.create({ data: { nombre: '1° Primaria', nivel: 'primaria', orden: 4 } }),
    prisma.grados.create({ data: { nombre: '2° Primaria', nivel: 'primaria', orden: 5 } }),
    prisma.grados.create({ data: { nombre: '3° Primaria', nivel: 'primaria', orden: 6 } }),
    prisma.grados.create({ data: { nombre: '4° Primaria', nivel: 'primaria', orden: 7 } }),
    prisma.grados.create({ data: { nombre: '5° Primaria', nivel: 'primaria', orden: 8 } }),
    prisma.grados.create({ data: { nombre: '6° Primaria', nivel: 'primaria', orden: 9 } }),
  ]);

  console.log(`✅ Grados creados: ${grados.length}`);

  // Materias
  const materias = await Promise.all([
    prisma.materias.create({ data: { nombre: 'Matemáticas', icono: '🔢' } }),
    prisma.materias.create({ data: { nombre: 'Lengua', icono: '📚' } }),
    prisma.materias.create({ data: { nombre: 'Ciencias Naturales', icono: '🔬' } }),
    prisma.materias.create({ data: { nombre: 'Ciencias Sociales', icono: '🌍' } }),
    prisma.materias.create({ data: { nombre: 'Inglés', icono: '🇬🇧' } }),
    prisma.materias.create({ data: { nombre: 'Arte', icono: '🎨' } }),
    prisma.materias.create({ data: { nombre: 'Educación Física', icono: '⚽' } }),
  ]);

  console.log(`✅ Materias creadas: ${materias.length}`);

  console.log('\n✅ Seed completado exitosamente!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
