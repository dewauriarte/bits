import prisma from '../config/database';
import { CasillaType } from '../services/mario-party.service';

interface Casilla {
  posicion: number;
  tipo: CasillaType;
  nombre: string;
  descripcion?: string;
  color: string;
}

async function seedBoards() {
  console.log('🎲 Creando tableros predeterminados...');

  // Tablero 1: Aventura en la Selva (PEQUEÑO)
  const aventuraSelva = {
    nombre: 'Aventura en la Selva',
    tema: 'jungle',
    total_casillas: 15,  // Reducido a 15 casillas
    config_casillas: generateBoardConfig(15, 'jungle'),
    imagen_preview: '/images/boards/jungle.jpg',
    posiciones_estrellas: [6, 11],  // Ajustado para el tablero pequeño
    activo: true
  };

  // Tablero 2: Viaje Espacial (PEQUEÑO)
  const viajeEspacial = {
    nombre: 'Viaje Espacial',
    tema: 'space',
    total_casillas: 18,  // Reducido a 18 casillas
    config_casillas: generateBoardConfig(18, 'space'),
    imagen_preview: '/images/boards/space.jpg',
    posiciones_estrellas: [7, 14],  // Ajustado
    activo: true
  };

  // Tablero 3: Reino Submarino (PEQUEÑO)
  const reinoSubmarino = {
    nombre: 'Reino Submarino',
    tema: 'underwater',
    total_casillas: 12,  // Reducido a 12 casillas
    config_casillas: generateBoardConfig(12, 'underwater'),
    imagen_preview: '/images/boards/underwater.jpg',
    posiciones_estrellas: [5, 9],  // Ajustado
    activo: true
  };

  // Tablero 4: Castillo Encantado (PEQUEÑO)
  const castilloEncantado = {
    nombre: 'Castillo Encantado',
    tema: 'castle',
    total_casillas: 16,  // Reducido a 16 casillas
    config_casillas: generateBoardConfig(16, 'castle'),
    imagen_preview: '/images/boards/castle.jpg',
    posiciones_estrellas: [6, 12],  // Ajustado
    activo: true
  };

  // Tablero 5: Desierto Mágico (PEQUEÑO)
  const desiertoMagico = {
    nombre: 'Desierto Mágico',
    tema: 'desert',
    total_casillas: 20,  // Reducido a 20 casillas (máximo)
    config_casillas: generateBoardConfig(20, 'desert'),
    imagen_preview: '/images/boards/desert.jpg',
    posiciones_estrellas: [8, 15],  // Ajustado
    activo: true
  };

  try {
    // Crear tableros si no existen
    const tableros = [
      aventuraSelva,
      viajeEspacial,
      reinoSubmarino,
      castilloEncantado,
      desiertoMagico
    ];

    for (const tablero of tableros) {
      const existing = await prisma.tableros.findFirst({
        where: { nombre: tablero.nombre }
      });

      if (!existing) {
        await prisma.tableros.create({
          data: tablero as any
        });
        console.log(`✅ Tablero "${tablero.nombre}" creado`);
      } else {
        console.log(`⏭️  Tablero "${tablero.nombre}" ya existe`);
      }
    }

    console.log('✅ Tableros predeterminados creados exitosamente');
  } catch (error) {
    console.error('❌ Error creando tableros:', error);
    throw error;
  }
}

/**
 * Generar configuración de casillas para un tablero
 */
function generateBoardConfig(totalCasillas: number, tema: string): Casilla[] {
  const casillas: Casilla[] = [];
  const nombresPorTema = getNombresPorTema(tema);
  
  // Distribuir tipos de casillas
  const distribucion = {
    [CasillaType.NORMAL]: Math.floor(totalCasillas * 0.35),    // 35%
    [CasillaType.PREGUNTA]: Math.floor(totalCasillas * 0.30),  // 30%
    [CasillaType.ESTRELLA]: 2,                                 // Solo 2 estrellas
    [CasillaType.EVENTO]: Math.floor(totalCasillas * 0.15),    // 15%
    [CasillaType.TRAMPA]: Math.floor(totalCasillas * 0.10),    // 10%
    [CasillaType.DUELO]: Math.floor(totalCasillas * 0.08),     // 8%
  };

  // Crear array con tipos según distribución
  const tipos: CasillaType[] = [];
  Object.entries(distribucion).forEach(([tipo, cantidad]) => {
    for (let i = 0; i < cantidad; i++) {
      tipos.push(tipo as CasillaType);
    }
  });

  // Completar con casillas normales si faltan
  while (tipos.length < totalCasillas) {
    tipos.push(CasillaType.NORMAL);
  }

  // Mezclar aleatoriamente (excepto primera y última)
  const middle = tipos.slice(1, tipos.length - 1);
  for (let i = middle.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [middle[i], middle[j]] = [middle[j], middle[i]];
  }

  // Primera casilla siempre es START
  tipos[0] = CasillaType.NORMAL;
  // Última casilla también normal
  tipos[tipos.length - 1] = CasillaType.NORMAL;
  
  // Reconstruir array completo
  const finalTipos = [tipos[0], ...middle, tipos[tipos.length - 1]];

  // Crear configuración de casillas
  finalTipos.forEach((tipo, index) => {
    const casilla: Casilla = {
      posicion: index,
      tipo: tipo,
      nombre: index === 0 ? 'INICIO' : 
              index === totalCasillas - 1 ? 'META' :
              nombresPorTema[tipo]?.[Math.floor(Math.random() * nombresPorTema[tipo].length)] || 
              `Casilla ${index}`,
      descripcion: getDescripcionPorTipo(tipo),
      color: getColorPorTipo(tipo)
    };

    casillas.push(casilla);
  });

  return casillas;
}

/**
 * Obtener nombres temáticos por tipo de casilla
 */
function getNombresPorTema(tema: string): Record<string, string[]> {
  const temas: Record<string, Record<string, string[]>> = {
    jungle: {
      [CasillaType.NORMAL]: ['Sendero', 'Claro', 'Río', 'Puente'],
      [CasillaType.PREGUNTA]: ['Templo Antiguo', 'Ruinas', 'Cascada'],
      [CasillaType.ESTRELLA]: ['Altar Dorado', 'Tesoro Perdido'],
      [CasillaType.EVENTO]: ['Tótem Misterioso', 'Árbol Sagrado'],
      [CasillaType.TRAMPA]: ['Arenas Movedizas', 'Trampa de Lianas'],
      [CasillaType.DUELO]: ['Arena de Batalla', 'Círculo Ritual']
    },
    space: {
      [CasillaType.NORMAL]: ['Órbita', 'Asteroide', 'Estación', 'Satélite'],
      [CasillaType.PREGUNTA]: ['Laboratorio', 'Observatorio', 'Telescopio'],
      [CasillaType.ESTRELLA]: ['Estrella Nova', 'Nebulosa'],
      [CasillaType.EVENTO]: ['Portal Cósmico', 'Anomalía'],
      [CasillaType.TRAMPA]: ['Agujero Negro', 'Campo de Asteroides'],
      [CasillaType.DUELO]: ['Arena Galáctica', 'Plataforma de Combate']
    },
    underwater: {
      [CasillaType.NORMAL]: ['Corriente', 'Coral', 'Algas', 'Roca'],
      [CasillaType.PREGUNTA]: ['Biblioteca Hundida', 'Nave Pirata', 'Gruta'],
      [CasillaType.ESTRELLA]: ['Perla Gigante', 'Tesoro Submarino'],
      [CasillaType.EVENTO]: ['Remolino Mágico', 'Burbuja Misteriosa'],
      [CasillaType.TRAMPA]: ['Corriente Traicionera', 'Tentáculos'],
      [CasillaType.DUELO]: ['Arena Submarina', 'Coliseo Atlante']
    },
    castle: {
      [CasillaType.NORMAL]: ['Pasillo', 'Escalera', 'Torre', 'Jardín'],
      [CasillaType.PREGUNTA]: ['Biblioteca', 'Salón del Trono', 'Capilla'],
      [CasillaType.ESTRELLA]: ['Cámara del Tesoro', 'Corona Real'],
      [CasillaType.EVENTO]: ['Espejo Mágico', 'Fuente de los Deseos'],
      [CasillaType.TRAMPA]: ['Calabozo', 'Trampa de Pinchos'],
      [CasillaType.DUELO]: ['Patio de Armas', 'Arena de Caballeros']
    },
    desert: {
      [CasillaType.NORMAL]: ['Duna', 'Oasis', 'Palmera', 'Roca del Desierto'],
      [CasillaType.PREGUNTA]: ['Pirámide', 'Esfinge', 'Tumba Antigua'],
      [CasillaType.ESTRELLA]: ['Joya del Faraón', 'Lámpara Mágica'],
      [CasillaType.EVENTO]: ['Espejismo', 'Tormenta de Arena'],
      [CasillaType.TRAMPA]: ['Arena Movediza', 'Escorpiones'],
      [CasillaType.DUELO]: ['Arena del Desierto', 'Círculo de Fuego']
    }
  };

  return temas[tema as keyof typeof temas] || temas.jungle;
}

/**
 * Obtener descripción por tipo de casilla
 */
function getDescripcionPorTipo(tipo: CasillaType): string {
  const descripciones = {
    [CasillaType.NORMAL]: 'Casilla normal, descansa un momento',
    [CasillaType.PREGUNTA]: 'Responde correctamente para avanzar 2 casillas extra',
    [CasillaType.ESTRELLA]: '¡Mini-juego! Responde 3 preguntas para ganar una estrella',
    [CasillaType.EVENTO]: 'Gira la ruleta de eventos sorpresa',
    [CasillaType.TRAMPA]: '¡Cuidado! Pierdes tu próximo turno',
    [CasillaType.DUELO]: 'Reta a un oponente a un duelo de conocimientos'
  };
  
  return descripciones[tipo] || 'Casilla especial';
}

/**
 * Obtener color por tipo de casilla
 */
function getColorPorTipo(tipo: CasillaType): string {
  const colores = {
    [CasillaType.NORMAL]: '#90EE90',    // Verde claro
    [CasillaType.PREGUNTA]: '#87CEEB',  // Azul cielo  
    [CasillaType.ESTRELLA]: '#FFD700',  // Dorado
    [CasillaType.EVENTO]: '#DDA0DD',    // Morado claro
    [CasillaType.TRAMPA]: '#DC143C',    // Rojo oscuro
    [CasillaType.DUELO]: '#FF6B6B'      // Rojo claro
  };
  
  return colores[tipo] || '#FFFFFF';
}

// Ejecutar seed si se llama directamente
if (require.main === module) {
  seedBoards()
    .then(() => {
      console.log('✅ Seed completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en seed:', error);
      process.exit(1);
    });
}

export default seedBoards;
