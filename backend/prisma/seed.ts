import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import seedBoards from '../src/seeds/boards.seed';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Hash password
  const hashedPassword = await bcrypt.hash('Admin123!', 10);

  // 1 Admin
  const admin = await prisma.usuarios.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
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
  const profesor1 = await prisma.usuarios.upsert({
    where: { username: 'prof_maria' },
    update: {},
    create: {
      username: 'prof_maria',
      email: 'maria@appquiz.com',
      password_hash: await bcrypt.hash('Prof123!', 10),
      nombre: 'María',
      apellido: 'González',
      rol: 'profesor',
      estado: 'activo',
    },
  });

  const profesor2 = await prisma.usuarios.upsert({
    where: { username: 'prof_carlos' },
    update: {},
    create: {
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
      const usuario = await prisma.usuarios.upsert({
        where: { username: est.username },
        update: {},
        create: {
          username: est.username,
          email: `${est.username}@estudiante.com`,
          password_hash: await bcrypt.hash('Est123!', 10),
          nombre: est.nombre,
          apellido: est.apellido,
          rol: 'estudiante',
          estado: 'activo',
        },
      });

      // Crear o actualizar perfil gamer para cada estudiante
      await prisma.perfiles_gamer.upsert({
        where: { usuario_id: usuario.id },
        update: {},
        create: {
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
  const gradosData = [
    { nombre: 'Kinder 1', nivel: 'preescolar', orden: 1 },
    { nombre: 'Kinder 2', nivel: 'preescolar', orden: 2 },
    { nombre: 'Kinder 3', nivel: 'preescolar', orden: 3 },
    { nombre: '1° Primaria', nivel: 'primaria', orden: 4 },
    { nombre: '2° Primaria', nivel: 'primaria', orden: 5 },
    { nombre: '3° Primaria', nivel: 'primaria', orden: 6 },
    { nombre: '4° Primaria', nivel: 'primaria', orden: 7 },
    { nombre: '5° Primaria', nivel: 'primaria', orden: 8 },
    { nombre: '6° Primaria', nivel: 'primaria', orden: 9 },
  ];
  
  const grados = await Promise.all(
    gradosData.map(async (grado) => {
      const existing = await prisma.grados.findFirst({
        where: { nombre: grado.nombre },
      });
      if (!existing) {
        return prisma.grados.create({ data: grado });
      }
      return existing;
    })
  );

  console.log(`✅ Grados creados: ${grados.length}`);

  // Materias
  const materiasData = [
    { nombre: 'Matemáticas', icono: '🔢' },
    { nombre: 'Lengua', icono: '📚' },
    { nombre: 'Ciencias Naturales', icono: '🔬' },
    { nombre: 'Ciencias Sociales', icono: '🌍' },
    { nombre: 'Inglés', icono: '🇬🇧' },
    { nombre: 'Arte', icono: '🎨' },
    { nombre: 'Educación Física', icono: '⚽' },
  ];
  
  const materias = await Promise.all(
    materiasData.map(async (materia) => {
      const existing = await prisma.materias.findFirst({
        where: { nombre: materia.nombre },
      });
      if (!existing) {
        return prisma.materias.create({ data: materia });
      }
      return existing;
    })
  );

  console.log(`✅ Materias creadas: ${materias.length}`);

  // Seed tableros para Mario Party
  console.log('\n🎲 Creando tableros para modo Mario Party...');
  await seedBoards();

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
