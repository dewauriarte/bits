import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import gameSocket from '@/lib/socket';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  Clock,
  Users,
  SkipForward,
  Pause,
  Trophy,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuestionData {
  questionNumber: number;
  totalQuestions: number;
  questionId: string;
  texto: string;
  timeLimit: number;
}

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

interface GameEvent {
  id: string;
  type: 'correct' | 'incorrect' | 'combo_lost' | 'answer';
  playerName: string;
  timestamp: number;
  message: string;
}

export default function TeacherGameControl() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();

  const [currentQuestion, setCurrentQuestion] = useState<QuestionData | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  const [gameEvents, setGameEvents] = useState<GameEvent[]>([]);
  const [responsesDistribution, setResponsesDistribution] = useState<Record<string, number>>({});
  const [accuracy, setAccuracy] = useState<number>(0);

  useEffect(() => {
    const socket = gameSocket.getSocket();
    if (!socket || !socket.connected) {
      console.warn('Socket not connected in TeacherGameControl');
    }

    // Listen to game events
    if (socket) {
      socket.on('question:new', handleNewQuestion);
      socket.on('timer:tick', handleTimerTick);
      socket.on('leaderboard:update', handleLeaderboardUpdate);
      socket.on('question:results', handleQuestionResults);
      socket.on('game:finished', handleGameFinished);
    }

    return () => {
      if (socket) {
        socket.off('question:new', handleNewQuestion);
        socket.off('timer:tick', handleTimerTick);
        socket.off('leaderboard:update', handleLeaderboardUpdate);
        socket.off('question:results', handleQuestionResults);
        socket.off('game:finished', handleGameFinished);
      }
    };
  }, []);

  const handleNewQuestion = (question: QuestionData) => {
    setCurrentQuestion(question);
    setTimeRemaining(question.timeLimit);
    setResponsesDistribution({});
    setAccuracy(0);
  };

  const handleTimerTick = (data: { timeRemaining: number }) => {
    setTimeRemaining(data.timeRemaining);
  };

  const handleLeaderboardUpdate = (data: LeaderboardData) => {
    setLeaderboardData(data);
    
    // Agregar evento al feed
    if (data.answersCount > 0) {
      const lastPlayer = data.leaderboard[0];
      addGameEvent({
        type: 'answer',
        playerName: lastPlayer.nickname,
        message: `${lastPlayer.nickname} respondió`,
      });
    }
  };

  const handleQuestionResults = (data: any) => {
    setAccuracy(data.accuracy || 0);
    setResponsesDistribution(data.distribution || {});
  };

  const handleGameFinished = () => {
    toast.success('Juego finalizado');
    navigate(`/teacher/room/${roomCode}/results`);
  };

  const addGameEvent = (event: Omit<GameEvent, 'id' | 'timestamp'>) => {
    const newEvent: GameEvent = {
      ...event,
      id: Math.random().toString(36),
      timestamp: Date.now(),
    };
    setGameEvents((prev) => [newEvent, ...prev].slice(0, 10));
  };

  const handleSkipQuestion = () => {
    // TODO: Implementar lógica de skip
    toast.info('Saltando pregunta...');
  };

  const handlePauseGame = () => {
    // TODO: Implementar lógica de pausa
    toast.info('Pausando juego...');
  };

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
        <div className="text-white text-center">
          <Activity className="w-16 h-16 mx-auto mb-4 animate-pulse" />
          <p className="text-2xl font-semibold">Esperando siguiente pregunta...</p>
        </div>
      </div>
    );
  }

  const timeProgress = (timeRemaining / currentQuestion.timeLimit) * 100;
  const questionsProgress = (currentQuestion.questionNumber / currentQuestion.totalQuestions) * 100;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card className="p-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <div className="space-y-4">
            {/* Progress */}
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="text-lg px-4 py-2 bg-white/20">
                Pregunta {currentQuestion.questionNumber}/{currentQuestion.totalQuestions}
              </Badge>
              <div className="flex items-center gap-4">
                <Button
                  onClick={handleSkipQuestion}
                  variant="secondary"
                  size="sm"
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  <SkipForward className="w-4 h-4 mr-2" />
                  Saltar
                </Button>
                <Button
                  onClick={handlePauseGame}
                  variant="secondary"
                  size="sm"
                  className="bg-yellow-500 hover:bg-yellow-600 text-white"
                >
                  <Pause className="w-4 h-4 mr-2" />
                  Pausar
                </Button>
              </div>
            </div>

            <Progress value={questionsProgress} className="h-2 bg-white/20" />

            {/* Pregunta */}
            <div className="mt-4">
              <h2 className="text-2xl font-bold mb-2">
                {currentQuestion.texto}
              </h2>
            </div>

            {/* Timer */}
            <div className="flex items-center gap-4">
              <Clock className="w-6 h-6" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold">Tiempo restante</span>
                  <span className="text-3xl font-black tabular-nums">{timeRemaining}s</span>
                </div>
                <Progress
                  value={timeProgress}
                  className={cn(
                    "h-3",
                    timeRemaining <= 5 && "animate-pulse"
                  )}
                />
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Stats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Response Stats */}
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Estadísticas de Respuestas
              </h3>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <p className="text-sm text-gray-600 mb-1">Respondieron</p>
                  <p className="text-3xl font-black text-blue-600">
                    {leaderboardData?.answersCount || 0}/{leaderboardData?.totalPlayers || 0}
                  </p>
                </div>

                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <p className="text-sm text-gray-600 mb-1">Accuracy</p>
                  <p className="text-3xl font-black text-green-600">
                    {accuracy}%
                  </p>
                </div>

                <div className="bg-purple-50 rounded-xl p-4 text-center">
                  <p className="text-sm text-gray-600 mb-1">Promedio</p>
                  <p className="text-3xl font-black text-purple-600">
                    {leaderboardData 
                      ? Math.round(leaderboardData.leaderboard.reduce((acc, p) => acc + p.score, 0) / leaderboardData.leaderboard.length)
                      : 0}
                  </p>
                </div>
              </div>

              {/* Distribution Chart (simple bars) */}
              {Object.keys(responsesDistribution).length > 0 && (
                <div className="space-y-2">
                  <p className="font-semibold text-gray-700 mb-3">Distribución de respuestas</p>
                  {Object.entries(responsesDistribution).map(([option, count]) => (
                    <div key={option} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">Opción {option}</span>
                        <span className="text-gray-600">{count} votos</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-blue-600 h-3 rounded-full transition-all"
                          style={{ width: `${(count / (leaderboardData?.answersCount || 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Events Feed */}
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Feed de Eventos
              </h3>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {gameEvents.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    Los eventos aparecerán aquí...
                  </p>
                ) : (
                  gameEvents.map((event) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        "p-3 rounded-lg text-sm",
                        event.type === 'correct' && "bg-green-50 text-green-900",
                        event.type === 'incorrect' && "bg-red-50 text-red-900",
                        event.type === 'answer' && "bg-blue-50 text-blue-900"
                      )}
                    >
                      <span className="font-medium">{event.message}</span>
                      <span className="text-xs ml-2 opacity-70">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </motion.div>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Right Column - Leaderboard */}
          <div className="lg:col-span-1">
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Top 10
              </h3>

              <div className="space-y-2">
                {leaderboardData?.leaderboard.slice(0, 10).map((player, index) => (
                  <motion.div
                    key={player.playerId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg transition-all",
                      index === 0 && "bg-gradient-to-r from-yellow-100 to-yellow-200 border-2 border-yellow-400",
                      index === 1 && "bg-gradient-to-r from-gray-100 to-gray-200 border-2 border-gray-400",
                      index === 2 && "bg-gradient-to-r from-orange-100 to-orange-200 border-2 border-orange-400",
                      index > 2 && "bg-gray-50"
                    )}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                        index === 0 && "bg-yellow-400 text-yellow-900",
                        index === 1 && "bg-gray-400 text-gray-900",
                        index === 2 && "bg-orange-400 text-orange-900",
                        index > 2 && "bg-gray-300 text-gray-700"
                      )}
                    >
                      {player.rank}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{player.nickname}</p>
                      {player.comboStreak >= 3 && (
                        <Badge variant="secondary" className="text-xs">
                          🔥 {player.comboStreak}x
                        </Badge>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="font-black text-purple-600">
                        {player.score.toLocaleString()}
                      </p>
                    </div>
                  </motion.div>
                ))}

                {!leaderboardData && (
                  <p className="text-gray-500 text-center py-8">
                    Esperando jugadores...
                  </p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
