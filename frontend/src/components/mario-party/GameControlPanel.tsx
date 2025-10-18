import { motion } from 'framer-motion';
import { useMarioPartyStore } from '@/stores/marioPartyStore';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Star,
  Coins,
  Clock,
  Trophy,
  ChevronRight,
  RotateCw
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import DiceRoller from './DiceRoller';
import TurnTimer from './TurnTimer';
import { cn } from '@/lib/utils';

export default function GameControlPanel() {
  const { 
    gameState, 
    currentPlayer,
    nextTurn,
    isMyTurn,
    getMyPlayer
  } = useMarioPartyStore();

  if (!gameState) {
    return null;
  }

  const myPlayer = getMyPlayer();
  const sortedPlayers = [...gameState.players].sort((a, b) => {
    // Ordenar por estrellas, luego por monedas
    if (b.estrellas !== a.estrellas) return b.estrellas - a.estrellas;
    return b.monedas - a.monedas;
  });

  const isCurrentlyMyTurn = isMyTurn();
  const { isRollingDice, diceResult } = useMarioPartyStore.getState();
  const canEndTurn = isCurrentlyMyTurn && !isRollingDice && diceResult !== null;

  return (
    <div className="space-y-4">
      {/* Información de la Ronda */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Ronda {gameState.round} de {gameState.max_rounds}
            </div>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              Turno {gameState.round}
            </Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Mi Estado */}
      {myPlayer && (
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Mi Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-4xl">{myPlayer.avatar}</div>
              <div className="flex-1">
                <p className="font-bold text-lg">{myPlayer.nickname}</p>
                <div className="flex gap-3 mt-1">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="font-bold">{myPlayer.estrellas}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Coins className="w-4 h-4 text-amber-500" />
                    <span className="font-bold">{myPlayer.monedas}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Estado del turno */}
            {isMyTurn() ? (
              <div className="mt-3 p-2 bg-green-100 rounded-lg text-center">
                <p className="text-green-700 font-bold">¡Es tu turno!</p>
              </div>
            ) : currentPlayer && (
              <div className="mt-3 p-2 bg-gray-100 rounded-lg text-center">
                <p className="text-gray-600">
                  Turno de <strong>{currentPlayer.nickname}</strong>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Control de Dado - SIMPLIFICADO Y SIN DUPLICACIÓN */}
      {isCurrentlyMyTurn && (
        <div className="space-y-4">
          {/* Cronómetro de Turno */}
          <TurnTimer 
            isMyTurn={isCurrentlyMyTurn}
            onTimeUp={() => {
              // Auto terminar turno si se acaba el tiempo
              if (canEndTurn) {
                nextTurn();
              }
            }}
            maxTime={25} // 25 segundos por turno
          />

          {/* Control del Dado */}
          <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300">
            <CardContent className="pt-6">
              <DiceRoller />
              
              {/* Botón de terminar turno */}
              {canEndTurn && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4"
                >
                  <Button
                    onClick={nextTurn}
                    className="w-full bg-green-500 hover:bg-green-600 text-white"
                    size="lg"
                  >
                    <ChevronRight className="w-5 h-5 mr-2" />
                    Terminar Turno
                  </Button>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Clasificación en Tiempo Real */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Clasificación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {sortedPlayers.map((player, index) => {
            const isMe = player.player_id === myPlayer?.player_id;
            const isCurrent = player.player_id === currentPlayer?.player_id;
            
            return (
              <motion.div
                key={player.player_id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg",
                  "border transition-all duration-300",
                  isMe && "bg-purple-50 border-purple-300",
                  isCurrent && "ring-2 ring-yellow-400",
                  !isMe && !isCurrent && "bg-gray-50 border-gray-200"
                )}
              >
                {/* Posición */}
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center font-bold",
                  index === 0 && "bg-yellow-400 text-black",
                  index === 1 && "bg-gray-300 text-black",
                  index === 2 && "bg-orange-400 text-white",
                  index > 2 && "bg-gray-200 text-gray-600"
                )}>
                  {index + 1}
                </div>

                {/* Avatar */}
                <div className="text-2xl">{player.avatar}</div>

                {/* Nombre */}
                <div className="flex-1">
                  <p className={cn(
                    "font-semibold",
                    isMe && "text-purple-700"
                  )}>
                    {player.nickname}
                    {isMe && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        TÚ
                      </Badge>
                    )}
                  </p>
                </div>

                {/* Stats */}
                <div className="flex gap-2">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="font-bold">{player.estrellas}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Coins className="w-4 h-4 text-amber-500" />
                    <span className="font-bold">{player.monedas}</span>
                  </div>
                </div>

                {/* Indicador de turno actual */}
                {isCurrent && (
                  <motion.div
                    animate={{ 
                      scale: [1, 1.2, 1],
                      rotate: [0, 10, -10, 0]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity 
                    }}
                  >
                    <RotateCw className="w-4 h-4 text-yellow-500" />
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
