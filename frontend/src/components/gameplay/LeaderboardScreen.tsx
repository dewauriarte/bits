import { motion } from 'framer-motion';
import { Trophy, TrendingUp, TrendingDown, Minus, Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface LeaderboardData {
  leaderboard: Array<{
    playerId: string;
    nickname: string;
    avatar: string;
    score: number;
    rank: number;
    comboStreak: number;
  }>;
  answersCount: number;
  totalPlayers: number;
}

interface LeaderboardScreenProps {
  leaderboardData: LeaderboardData;
  myScore: number;
}

// Función para obtener rango aproximado como Kahoot
function getApproximateRank(rank: number, totalPlayers: number): string {
  const percentage = (rank / totalPlayers) * 100;
  
  if (rank === 1) return '1st';
  if (rank === 2) return '2nd';
  if (rank === 3) return '3rd';
  if (rank <= 5) return 'Top 5';
  if (rank <= 10) return 'Top 10';
  if (percentage <= 25) return 'Top 25%';
  if (percentage <= 50) return 'Top 50%';
  if (percentage <= 75) return 'Top 75%';
  return 'Keep Going!';
}

export default function LeaderboardScreen({
  leaderboardData,
  myScore,
}: LeaderboardScreenProps) {
  const { leaderboard, totalPlayers } = leaderboardData;
  
  // Encontrar mi ranking (simulado, el backend debería enviarlo)
  const myPlayer = leaderboard.find(p => p.score === myScore);
  const myRank = myPlayer?.rank || Math.floor(totalPlayers / 2);
  const approximateRank = getApproximateRank(myRank, totalPlayers);

  // Top 10 para mostrar (o todos si son menos)
  const topPlayers = leaderboard.slice(0, 10);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-4xl mx-auto"
    >
      <div className="bg-white rounded-3xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 10 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-yellow-400 rounded-full mb-4"
          >
            <Trophy className="w-10 h-10 text-yellow-900" />
          </motion.div>
          <h2 className="text-4xl font-black text-gray-800 mb-2">🏆 Clasificaciones</h2>
          <p className="text-gray-500 text-lg">
            {leaderboardData.answersCount} de {totalPlayers} han respondido
          </p>
        </div>

        {/* Tu posición aproximada */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8 p-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 font-semibold mb-1">Tu posición</p>
              <p className="text-4xl font-black">{approximateRank}</p>
            </div>
            <div className="text-right">
              <p className="text-white/80 font-semibold mb-1">Puntos</p>
              <p className="text-3xl font-bold">{myScore.toLocaleString()}</p>
            </div>
          </div>

          {/* Indicador de tendencia (simulado) */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-4 flex items-center gap-2"
          >
            {myRank <= 3 ? (
              <>
                <TrendingUp className="w-5 h-5" />
                <span className="font-semibold">¡Sigue así!</span>
              </>
            ) : myRank <= totalPlayers / 2 ? (
              <>
                <Minus className="w-5 h-5" />
                <span className="font-semibold">Mantén tu ritmo</span>
              </>
            ) : (
              <>
                <TrendingDown className="w-5 h-5" />
                <span className="font-semibold">¡Puedes mejorar!</span>
              </>
            )}
          </motion.div>
        </motion.div>

        {/* Top 10 */}
        <div className="space-y-3">
          <h3 className="text-xl font-bold text-gray-700 mb-4">Top 10 Jugadores</h3>
          {topPlayers.map((player, index) => (
            <motion.div
              key={player.playerId}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className={cn(
                "flex items-center gap-4 p-4 rounded-xl transition-all",
                index === 0 && "bg-gradient-to-r from-yellow-100 to-yellow-200 border-2 border-yellow-400",
                index === 1 && "bg-gradient-to-r from-gray-100 to-gray-200 border-2 border-gray-400",
                index === 2 && "bg-gradient-to-r from-orange-100 to-orange-200 border-2 border-orange-400",
                index > 2 && "bg-gray-50 border-2 border-gray-200"
              )}
            >
              {/* Rank Badge */}
              <div className="relative">
                <div
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center font-black text-xl",
                    index === 0 && "bg-yellow-400 text-yellow-900",
                    index === 1 && "bg-gray-400 text-gray-900",
                    index === 2 && "bg-orange-400 text-orange-900",
                    index > 2 && "bg-gray-300 text-gray-700"
                  )}
                >
                  {index === 0 ? <Crown className="w-6 h-6" /> : player.rank}
                </div>
              </div>

              {/* Avatar */}
              <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center text-2xl">
                {player.avatar}
              </div>

              {/* Nombre */}
              <div className="flex-1">
                <p className="font-bold text-gray-800 truncate">{player.nickname}</p>
                {player.comboStreak >= 3 && (
                  <Badge variant="secondary" className="text-xs mt-1">
                    🔥 {player.comboStreak}x
                  </Badge>
                )}
              </div>

              {/* Score */}
              <div className="text-right">
                <p className="text-2xl font-black text-purple-600">
                  {player.score.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">puntos</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mensaje motivacional */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-6 text-center text-gray-500"
        >
          Siguiente pregunta en breve...
        </motion.p>
      </div>
    </motion.div>
  );
}
