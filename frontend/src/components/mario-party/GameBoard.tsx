import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMarioPartyStore } from '@/stores/marioPartyStore';
import { cn } from '@/lib/utils';

interface Position {
  x: number;
  y: number;
}

export default function GameBoard() {
  const boardRef = useRef<HTMLDivElement>(null);
  const [boardPositions, setBoardPositions] = useState<Position[]>([]);

  const { 
    gameState, 
    board,
    animatedPositions,
    isMoving
  } = useMarioPartyStore();

  // Debug
  useEffect(() => {
    if (board) {
      console.log('📋 Tablero cargado:', {
        nombre: board.nombre,
        total_casillas: board.total_casillas,
        config_casillas: board.config_casillas?.slice(0, 5) // Primeras 5 casillas
      });
    }
    if (gameState) {
      console.log('🎮 Estado del juego:', {
        jugadores: gameState.players,
        posiciones_animadas: animatedPositions
      });
    }
  }, [board, gameState, animatedPositions]);

  // Calcular posiciones del tablero
  useEffect(() => {
    if (!board || !boardRef.current) return;

    const container = boardRef.current;
    const width = container.offsetWidth;
    const padding = 50;
    
    // Configuración del tablero - CASILLAS EXTRA GRANDES PARA NIÑOS
    const cellSize = 128; // Extra grande (32 * 4 = 128px para w-32)
    const cellGap = 25;  // Buen espacio entre casillas
    const totalSize = cellSize + cellGap;
    
    // Calcular dimensiones del grid
    const cols = Math.floor((width - padding * 2) / totalSize);
    const rows = Math.ceil(board.total_casillas / cols);
    
    const positions: Position[] = [];
    
    // Crear patrón zigzag (serpentina)
    for (let row = 0; row < rows; row++) {
      const isEvenRow = row % 2 === 0;
      const colsInRow = Math.min(cols, board.total_casillas - row * cols);
      
      for (let col = 0; col < colsInRow; col++) {
        const actualCol = isEvenRow ? col : (colsInRow - 1 - col);
        positions.push({
          x: padding + actualCol * totalSize,
          y: padding + row * totalSize
        });
      }
    }
    
    setBoardPositions(positions);
  }, [board]);

  if (!gameState || !board) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">Cargando tablero...</p>
      </div>
    );
  }

  return (
    <div className="relative" ref={boardRef}>
      <div className="p-6 bg-gradient-to-br from-slate-200 via-gray-200 to-stone-200 rounded-xl min-h-[500px]">
        
        {/* Renderizar casillas */}
        {board.config_casillas.map((casilla, index) => {
          const pos = boardPositions[index];
          if (!pos) return null;

          // Usar posición animada si existe, si no usar posición real
          const playersHere = gameState.players.filter(p => {
            const currentPos = animatedPositions[p.player_id] || p.position;
            return currentPos === casilla.posicion;
          });

          return (
            <div
              key={casilla.posicion}
              className="absolute"
              style={{ 
                left: `${pos.x}px`, 
                top: `${pos.y}px`,
              }}
            >
              {/* Casilla SIMPLE Y GRANDE PARA NIÑOS */}
              <motion.div
                className={cn(
                  "relative w-32 h-32 rounded-3xl", // Extra grande para niños
                  "flex items-center justify-center",
                  "shadow-md transition-all", // Sin borde aquí porque lo añadimos en getCasillaBorderColor
                  getCasillaBorderColor(casilla.tipo),
                  getCasillaBackground(casilla.tipo),
                  playersHere.length > 0 && "scale-105" // Pequeña animación cuando hay jugador
                )}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ 
                  delay: index * 0.03,
                  type: "spring",
                  stiffness: 300,
                  damping: 20
                }}
                whileHover={{ scale: 1.05 }} // Interacción sutil
              >
                {/* Icono de casilla GIGANTE para niños */}
                <div className="text-6xl select-none text-white">
                  {getCasillaIcon(casilla.tipo)}
                </div>
                
                {/* Número de casilla MUY VISIBLE */}
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-white rounded-full border-[5px] border-gray-800 flex items-center justify-center text-xl font-black text-gray-800 shadow-md">
                  {casilla.posicion}
                </div>
              </motion.div>

              {/* Jugadores en esta casilla */}
              <AnimatePresence mode="wait">
                {playersHere.map((player, playerIndex) => {
                  const offset = getPlayerOffset(playerIndex, playersHere.length);
                  const isCurrentTurn = gameState.current_turn === player.player_id;
                  const isPlayerMoving = isMoving && isCurrentTurn;
                  
                  return (
                    <motion.div
                      key={player.player_id}
                      className={cn(
                        "absolute z-20",
                        isCurrentTurn && "z-30"
                      )}
                      initial={{ 
                        scale: 0,
                        x: -40 + offset.x,
                        y: -40 + offset.y
                      }}
                      animate={{ 
                        scale: isCurrentTurn ? 1.4 : 1,
                        x: -45 + offset.x,
                        y: -45 + offset.y,
                        // Salto más pronunciado y divertido cuando se mueve
                        ...(isPlayerMoving && {
                          y: [-45 + offset.y, -70 + offset.y, -45 + offset.y],
                          rotate: [0, -10, 10, 0] // Pequeño giro divertido
                        })
                      }}
                      exit={{ 
                        scale: 0,
                        opacity: 0
                      }}
                      transition={{
                        type: "spring",
                        stiffness: isPlayerMoving ? 100 : 200,
                        damping: isPlayerMoving ? 15 : 20,
                        duration: isPlayerMoving ? 0.6 : 0.3
                      }}
                    >
                      {/* Indicador de turno */}
                      {isCurrentTurn && (
                        <motion.div
                          className="absolute -top-8 left-1/2 transform -translate-x-1/2"
                          animate={{ 
                            y: [0, -5, 0],
                          }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        >
                          <div className="bg-yellow-400 text-black px-2 py-1 rounded-full text-xs font-bold shadow-lg whitespace-nowrap">
                            TURNO
                          </div>
                        </motion.div>
                      )}

                      {/* Avatar del jugador GRANDE Y CLARO */}
                      <div 
                        className={cn(
                          "w-20 h-20 rounded-full flex items-center justify-center font-bold shadow-xl border-4 border-white",
                          "bg-gradient-to-br select-none",
                          getPlayerGradient(playerIndex)
                        )}
                      >
                        <span className="text-4xl">
                          {player.avatar || '😊'}
                        </span>
                      </div>

                      {/* Estrellas y monedas */}
                      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
                        {player.estrellas > 0 && (
                          <div className="bg-yellow-400 text-black text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                            {player.estrellas}
                          </div>
                        )}
                        <div className="bg-amber-400 text-black text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                          {player.monedas}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          );
        })}

        {/* Posiciones de estrellas */}
        {gameState.estrellas_posiciones?.map((star, index) => {
          const pos = boardPositions[star.posicion];
          if (!pos || !star.activa) return null;

          return (
            <motion.div
              key={index}
              className="absolute z-10"
              style={{ 
                left: `${pos.x + 32}px`, 
                top: `${pos.y - 20}px`
              }}
              animate={{ 
                rotate: 360,
                scale: [1, 1.2, 1]
              }}
              transition={{
                rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                scale: { duration: 2, repeat: Infinity }
              }}
            >
              <div className="text-3xl">⭐</div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// Helpers
function getCasillaIcon(tipo: any): string {
  const tipoUpper = String(tipo).toUpperCase();
  const icons: Record<string, string> = {
    'NORMAL': '○',  // Círculo blanco para mejor contraste
    'PREGUNTA': '❓',
    'ESTRELLA': '⭐',
    'DUELO': '⚔️',
    'EVENTO': '🎁',
    'TRAMPA': '💀'
  };
  return icons[tipoUpper] || '○';
}

function getCasillaBorderColor(_tipo: any): string {
  // Borde gris sutil para todas las casillas (sin importar el tipo)
  return 'border-gray-300 border-2';
}

function getCasillaBackground(tipo: any): string {
  const tipoUpper = String(tipo).toUpperCase();
  switch (tipoUpper) {
    case 'NORMAL': return 'bg-green-600';      // Verde oscuro sólido
    case 'PREGUNTA': return 'bg-blue-600';     // Azul oscuro sólido
    case 'ESTRELLA': return 'bg-yellow-500';   // Amarillo oscuro sólido
    case 'DUELO': return 'bg-red-600';         // Rojo oscuro sólido
    case 'EVENTO': return 'bg-purple-600';     // Morado oscuro sólido
    case 'TRAMPA': return 'bg-gray-600';       // Gris oscuro sólido
    default: return 'bg-green-600';
  }
}

// Calcular offset para que múltiples jugadores no se superpongan
function getPlayerOffset(index: number, total: number): Position {
  if (total === 1) return { x: 0, y: 0 };
  
  const angle = (index * 360) / total;
  const radius = 20;
  return {
    x: Math.cos(angle * Math.PI / 180) * radius,
    y: Math.sin(angle * Math.PI / 180) * radius
  };
}

// Obtener gradiente de color para cada jugador (colores suaves para niños)
function getPlayerGradient(index: number): string {
  const gradients = [
    'from-blue-300 to-blue-400',    // Azul suave
    'from-red-300 to-red-400',      // Rojo suave
    'from-green-300 to-green-400',  // Verde suave
    'from-yellow-300 to-yellow-400', // Amarillo suave
    'from-purple-300 to-purple-400', // Morado suave
    'from-pink-300 to-pink-400',     // Rosa suave
    'from-orange-300 to-orange-400', // Naranja suave
    'from-cyan-300 to-cyan-400'      // Cyan suave
  ];
  return gradients[index % gradients.length];
}
