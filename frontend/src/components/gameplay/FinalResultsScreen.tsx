import { motion } from 'framer-motion';
import Confetti from 'react-confetti';
import { Trophy, Star, Target, TrendingUp, Award, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWindowSize } from '@/hooks/useWindowSize';

interface FinalResults {
  leaderboard: Array<{
    playerId: string;
    nickname: string;
    avatar: string;
    score: number;
    rank: number;
    correctAnswers: number;
    totalAnswered: number;
    accuracy: number;
    rewards: {
      xp: number;
      coins: number;
      gems: number;
      trophies: number;
    };
  }>;
  totalQuestions: number;
}

interface FinalResultsScreenProps {
  finalResults: FinalResults;
  onContinue: () => void;
}

export default function FinalResultsScreen({
  finalResults,
  onContinue,
}: FinalResultsScreenProps) {
  const { width, height } = useWindowSize();
  const { leaderboard, totalQuestions } = finalResults;

  // Obtener top 3 para el podio
  const topThree = leaderboard.slice(0, 3);

  // Encontrar mis resultados (simular que soy el jugador, aquí deberías usar el userId real)
  const myResults = leaderboard[0]; // Por ahora tomamos el primero como ejemplo
  const isWinner = myResults?.rank === 1;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full max-w-6xl mx-auto"
    >
      {/* Confetti si ganó */}
      {isWinner && (
        <Confetti
          width={width}
          height={height}
          recycle={true}
          numberOfPieces={200}
        />
      )}

      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-8 text-white text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 10 }}
            className="inline-flex items-center justify-center w-24 h-24 bg-white/20 rounded-full mb-4"
          >
            <Trophy className="w-12 h-12" />
          </motion.div>
          <h1 className="text-5xl font-black mb-2">¡Juego Terminado!</h1>
          <p className="text-xl text-white/90">
            {totalQuestions} preguntas completadas
          </p>
        </div>

        <div className="p-8">
          {/* Podio - Top 3 */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-center mb-8 text-gray-800">
              🏆 Podio
            </h2>
            <div className="flex items-end justify-center gap-4">
              {/* 2nd Place */}
              {topThree[1] && (
                <motion.div
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex flex-col items-center"
                >
                  <div className="w-20 h-20 bg-gray-400 rounded-full flex items-center justify-center text-3xl mb-2 border-4 border-white shadow-lg">
                    {topThree[1].avatar}
                  </div>
                  <Badge className="mb-2 bg-gray-400 text-white">2nd</Badge>
                  <p className="font-bold text-gray-800 mb-1">{topThree[1].nickname}</p>
                  <p className="text-sm text-gray-600">{topThree[1].score.toLocaleString()} pts</p>
                  <div className="w-32 h-24 bg-gradient-to-t from-gray-400 to-gray-500 rounded-t-lg mt-4"></div>
                </motion.div>
              )}

              {/* 1st Place */}
              {topThree[0] && (
                <motion.div
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="flex flex-col items-center"
                >
                  <motion.div
                    animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="w-24 h-24 bg-yellow-400 rounded-full flex items-center justify-center text-4xl mb-2 border-4 border-white shadow-xl relative"
                  >
                    {topThree[0].avatar}
                    <div className="absolute -top-2 -right-2">
                      <Award className="w-8 h-8 text-yellow-600" />
                    </div>
                  </motion.div>
                  <Badge className="mb-2 bg-yellow-400 text-yellow-900 text-lg px-4 py-1">1st</Badge>
                  <p className="font-black text-gray-800 text-lg mb-1">{topThree[0].nickname}</p>
                  <p className="text-gray-600 font-bold">{topThree[0].score.toLocaleString()} pts</p>
                  <div className="w-32 h-32 bg-gradient-to-t from-yellow-400 to-yellow-500 rounded-t-lg mt-4 shadow-lg"></div>
                </motion.div>
              )}

              {/* 3rd Place */}
              {topThree[2] && (
                <motion.div
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-col items-center"
                >
                  <div className="w-20 h-20 bg-orange-400 rounded-full flex items-center justify-center text-3xl mb-2 border-4 border-white shadow-lg">
                    {topThree[2].avatar}
                  </div>
                  <Badge className="mb-2 bg-orange-400 text-orange-900">3rd</Badge>
                  <p className="font-bold text-gray-800 mb-1">{topThree[2].nickname}</p>
                  <p className="text-sm text-gray-600">{topThree[2].score.toLocaleString()} pts</p>
                  <div className="w-32 h-20 bg-gradient-to-t from-orange-400 to-orange-500 rounded-t-lg mt-4"></div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Tus estadísticas */}
          {myResults && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 mb-8"
            >
              <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                Tus Estadísticas
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                  <Trophy className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                  <p className="text-3xl font-black text-purple-600">{myResults.rank}°</p>
                  <p className="text-sm text-gray-600">Posición</p>
                </div>

                <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                  <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                  <p className="text-3xl font-black text-yellow-600">{myResults.score.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Puntos</p>
                </div>

                <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                  <Target className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-3xl font-black text-green-600">{myResults.accuracy}%</p>
                  <p className="text-sm text-gray-600">Precisión</p>
                </div>

                <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                  <TrendingUp className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-3xl font-black text-blue-600">{myResults.correctAnswers}/{myResults.totalAnswered}</p>
                  <p className="text-sm text-gray-600">Correctas</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Recompensas */}
          {myResults?.rewards && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 mb-8"
            >
              <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">
                🎁 Recompensas Ganadas
              </h3>
              
              <div className="flex items-center justify-center gap-6">
                {myResults.rewards.xp > 0 && (
                  <div className="text-center">
                    <div className="text-4xl font-black text-blue-600">+{myResults.rewards.xp}</div>
                    <p className="text-sm text-gray-600">XP</p>
                  </div>
                )}
                
                {myResults.rewards.trophies > 0 && (
                  <div className="text-center">
                    <div className="text-4xl font-black text-yellow-600">+{myResults.rewards.trophies}</div>
                    <p className="text-sm text-gray-600">Copas</p>
                  </div>
                )}
                
                {myResults.rewards.gems > 0 && (
                  <div className="text-center">
                    <div className="text-4xl font-black text-purple-600">+{myResults.rewards.gems}</div>
                    <p className="text-sm text-gray-600">Gemas</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Botón continuar */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="text-center"
          >
            <Button
              onClick={onContinue}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-12 py-6 text-xl rounded-full shadow-xl"
            >
              <Home className="w-6 h-6 mr-2" />
              Volver al Inicio
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
