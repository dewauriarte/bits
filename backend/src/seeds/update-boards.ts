import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateBoards() {
  console.log('🔄 Actualizando tableros existentes a 10-20 casillas...');

  try {
    // Actualizar Aventura en la Selva
    await prisma.tableros.updateMany({
      where: { nombre: 'Aventura en la Selva' },
      data: { 
        total_casillas: 15,
        posiciones_estrellas: [6, 11]
      }
    });
    console.log('✅ Aventura en la Selva: 15 casillas');

    // Actualizar Viaje Espacial
    await prisma.tableros.updateMany({
      where: { nombre: 'Viaje Espacial' },
      data: { 
        total_casillas: 18,
        posiciones_estrellas: [7, 14]
      }
    });
    console.log('✅ Viaje Espacial: 18 casillas');

    // Actualizar Reino Submarino
    await prisma.tableros.updateMany({
      where: { nombre: 'Reino Submarino' },
      data: { 
        total_casillas: 12,
        posiciones_estrellas: [5, 9]
      }
    });
    console.log('✅ Reino Submarino: 12 casillas');

    // Actualizar Castillo Encantado
    await prisma.tableros.updateMany({
      where: { nombre: 'Castillo Encantado' },
      data: { 
        total_casillas: 16,
        posiciones_estrellas: [6, 12]
      }
    });
    console.log('✅ Castillo Encantado: 16 casillas');

    // Actualizar Desierto Mágico
    await prisma.tableros.updateMany({
      where: { nombre: 'Desierto Mágico' },
      data: { 
        total_casillas: 20,
        posiciones_estrellas: [8, 15]
      }
    });
    console.log('✅ Desierto Mágico: 20 casillas (máximo)');

    // Regenerar las configuraciones de casillas para cada tablero
    const tableros = await prisma.tableros.findMany();
    
    for (const tablero of tableros) {
      const configCasillas = generateBoardConfig(tablero.total_casillas, tablero.tema || 'default');
      
      await prisma.tableros.update({
        where: { id: tablero.id },
        data: { config_casillas: configCasillas }
      });
      
      console.log(`📋 Configuración actualizada para ${tablero.nombre}`);
    }

    console.log('\n🎉 ¡Todos los tableros actualizados correctamente!');
    console.log('📊 Resumen:');
    console.log('  - Aventura en la Selva: 15 casillas');
    console.log('  - Viaje Espacial: 18 casillas');
    console.log('  - Reino Submarino: 12 casillas');
    console.log('  - Castillo Encantado: 16 casillas');
    console.log('  - Desierto Mágico: 20 casillas');

  } catch (error) {
    console.error('❌ Error actualizando tableros:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Generar configuración de casillas simplificada para niños
function generateBoardConfig(totalCasillas: number, _tema?: string): any[] {
  const casillas: any[] = [];
  
  // Distribución simplificada para tableros pequeños
  const distribucion = {
    NORMAL: Math.floor(totalCasillas * 0.35),    // 35% normales
    PREGUNTA: Math.floor(totalCasillas * 0.30),  // 30% preguntas
    ESTRELLA: 2,                                  // Solo 2 estrellas
    EVENTO: Math.floor(totalCasillas * 0.15),    // 15% eventos
    TRAMPA: Math.floor(totalCasillas * 0.10),    // 10% trampas
    DUELO: Math.max(1, Math.floor(totalCasillas * 0.05)), // 5% duelos (mínimo 1)
  };

  // Asegurar que no excedemos el total
  const totalAsignado = Object.values(distribucion).reduce((a, b) => a + b, 0);
  if (totalAsignado < totalCasillas) {
    distribucion.NORMAL += totalCasillas - totalAsignado;
  }

  // Crear array con tipos
  const tipos: string[] = [];
  Object.entries(distribucion).forEach(([tipo, cantidad]) => {
    for (let i = 0; i < cantidad && tipos.length < totalCasillas; i++) {
      tipos.push(tipo);
    }
  });

  // Mezclar aleatoriamente (excepto primera y última)
  for (let i = tipos.length - 1; i > 1; i--) {
    const j = Math.floor(Math.random() * (i - 1)) + 1;
    [tipos[i], tipos[j]] = [tipos[j], tipos[i]];
  }

  // Primera casilla siempre NORMAL
  tipos[0] = 'NORMAL';

  // Crear configuración
  for (let i = 0; i < totalCasillas; i++) {
    casillas.push({
      posicion: i + 1,
      tipo: tipos[i] || 'NORMAL',
      nombre: `Casilla ${i + 1}`,
      descripcion: getDescripcionCasilla(tipos[i] || 'NORMAL'),
      color: getColorCasilla(tipos[i] || 'NORMAL')
    });
  }

  return casillas;
}

function getDescripcionCasilla(tipo: string): string {
  const descripciones: Record<string, string> = {
    NORMAL: 'Una casilla tranquila',
    PREGUNTA: '¡Responde una pregunta!',
    ESTRELLA: '¡Consigue una estrella!',
    EVENTO: '¡Algo especial sucede!',
    TRAMPA: '¡Cuidado con la trampa!',
    DUELO: '¡Reta a otro jugador!'
  };
  return descripciones[tipo] || 'Casilla normal';
}

function getColorCasilla(tipo: string): string {
  const colores: Record<string, string> = {
    NORMAL: '#10b981',    // Verde
    PREGUNTA: '#3b82f6',  // Azul
    ESTRELLA: '#fbbf24',  // Amarillo
    EVENTO: '#a855f7',    // Morado
    TRAMPA: '#6b7280',    // Gris
    DUELO: '#ef4444'      // Rojo
  };
  return colores[tipo] || '#10b981';
}

// Ejecutar
updateBoards().catch(console.error);
