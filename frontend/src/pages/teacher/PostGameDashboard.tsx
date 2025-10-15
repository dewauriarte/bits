import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Trophy,
  Download,
  TrendingDown,
  TrendingUp,
  Clock,
  Target,
  Brain,
  Mail,
  Copy,
  Play,
  FileText,
  Award,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Player {
  playerId: string;
  nickname: string;
  avatar: string;
  score: number;
  rank: number;
  correctAnswers: number;
  totalAnswered: number;
  accuracy: number;
  avgResponseTime: number;
}

interface QuestionAnalysis {
  questionId: string;
  questionText: string;
  correctAnswers: number;
  totalAnswers: number;
  accuracy: number;
  avgResponseTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface ClassStats {
  totalPlayers: number;
  avgAccuracy: number;
  avgScore: number;
  avgResponseTime: number;
  completionRate: number;
  weakTopics: string[];
  strongTopics: string[];
}

export default function PostGameDashboard() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();

  const [leaderboard, setLeaderboard] = useState<Player[]>([]);
  const [questionsAnalysis, setQuestionsAnalysis] = useState<QuestionAnalysis[]>([]);
  const [classStats, setClassStats] = useState<ClassStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGameResults();
  }, [roomCode]);

  const loadGameResults = async () => {
    try {
      const response = await fetch(`/api/game-results/${roomCode}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Error al cargar resultados');
      }

      const { leaderboard, questionsAnalysis, classStats } = result.data;

      setLeaderboard(leaderboard);
      setQuestionsAnalysis(questionsAnalysis);
      setClassStats(classStats);
      setLoading(false);
    } catch (error: any) {
      console.error('Error al cargar resultados:', error);
      toast.error(error.message || 'Error al cargar resultados');
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const csv = [
      ['Posición', 'Nombre', 'Puntos', 'Correctas', 'Total', 'Accuracy', 'Tiempo Promedio'],
      ...leaderboard.map(p => [
        p.rank,
        p.nickname,
        p.score,
        p.correctAnswers,
        p.totalAnswered,
        `${p.accuracy}%`,
        `${p.avgResponseTime}s`,
      ]),
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resultados-${roomCode}.csv`;
    a.click();
    toast.success('CSV exportado correctamente');
  };

  const handleSendResults = () => {
    toast.info('Enviando resultados a los padres...');
    // TODO: Implementar envío de emails
  };

  const handleCreateReviewQuiz = () => {
    toast.info('Creando quiz de repaso...');
    // TODO: Implementar creación de quiz
  };

  const handlePlayAgain = () => {
    navigate(`/teacher/room/${roomCode}/setup`);
  };

  const handleCopyToClass = () => {
    toast.info('Copiando a otra clase...');
    // TODO: Implementar copia
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600 font-semibold">Cargando resultados...</p>
        </div>
      </div>
    );
  }

  const hardestQuestion = questionsAnalysis.reduce((prev, curr) => 
    curr.accuracy < prev.accuracy ? curr : prev
  );

  const easiestQuestion = questionsAnalysis.reduce((prev, curr) => 
    curr.accuracy > prev.accuracy ? curr : prev
  );

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-gray-800 mb-2">
              Resultados del Juego
            </h1>
            <p className="text-gray-600">
              Sala: <span className="font-semibold">{roomCode}</span>
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleExportCSV}
              variant="outline"
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar CSV
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        {classStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <Trophy className="w-8 h-8 mb-2" />
              <p className="text-3xl font-black">{classStats.totalPlayers}</p>
              <p className="text-white/80">Jugadores</p>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white">
              <Target className="w-8 h-8 mb-2" />
              <p className="text-3xl font-black">{classStats.avgAccuracy}%</p>
              <p className="text-white/80">Accuracy Promedio</p>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <BarChart3 className="w-8 h-8 mb-2" />
              <p className="text-3xl font-black">{classStats.avgScore.toLocaleString()}</p>
              <p className="text-white/80">Puntos Promedio</p>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
              <Clock className="w-8 h-8 mb-2" />
              <p className="text-3xl font-black">{classStats.avgResponseTime}s</p>
              <p className="text-white/80">Tiempo Promedio</p>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="leaderboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto">
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            <TabsTrigger value="questions">Análisis de Preguntas</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-500" />
                Clasificación Final
              </h2>

              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {leaderboard.map((player, index) => (
                  <motion.div
                    key={player.playerId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-lg transition-all",
                      index === 0 && "bg-gradient-to-r from-yellow-100 to-yellow-200 border-2 border-yellow-400",
                      index === 1 && "bg-gradient-to-r from-gray-100 to-gray-200 border-2 border-gray-400",
                      index === 2 && "bg-gradient-to-r from-orange-100 to-orange-200 border-2 border-orange-400",
                      index > 2 && "bg-gray-50 hover:bg-gray-100"
                    )}
                  >
                    <div
                      className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center font-black text-xl",
                        index === 0 && "bg-yellow-400 text-yellow-900",
                        index === 1 && "bg-gray-400 text-gray-900",
                        index === 2 && "bg-orange-400 text-orange-900",
                        index > 2 && "bg-gray-300 text-gray-700"
                      )}
                    >
                      {player.rank}
                    </div>

                    <div className="w-12 h-12 text-3xl">{player.avatar}</div>

                    <div className="flex-1">
                      <p className="font-bold text-lg">{player.nickname}</p>
                      <p className="text-sm text-gray-600">
                        {player.correctAnswers}/{player.totalAnswered} correctas • {player.accuracy}%
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-black text-purple-600">
                        {player.score.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {player.avgResponseTime}s promedio
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Questions Analysis Tab */}
          <TabsContent value="questions">
            <div className="space-y-6">
              {/* Destacados */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-6 border-2 border-red-300 bg-red-50">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <TrendingDown className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-red-900 mb-1">Pregunta Más Difícil</p>
                      <p className="text-sm text-gray-700 mb-2">{hardestQuestion.questionText}</p>
                      <Badge variant="destructive">{hardestQuestion.accuracy}% de aciertos</Badge>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 border-2 border-green-300 bg-green-50">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-green-900 mb-1">Pregunta Más Fácil</p>
                      <p className="text-sm text-gray-700 mb-2">{easiestQuestion.questionText}</p>
                      <Badge className="bg-green-600">{easiestQuestion.accuracy}% de aciertos</Badge>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Lista de preguntas */}
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4">Todas las Preguntas</h3>
                <div className="space-y-3">
                  {questionsAnalysis.map((question, index) => (
                    <div
                      key={question.questionId}
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="w-10 h-10 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">
                        {index + 1}
                      </div>

                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">{question.questionText}</p>
                        <p className="text-sm text-gray-600">
                          {question.correctAnswers}/{question.totalAnswers} correctas • {question.avgResponseTime}s promedio
                        </p>
                      </div>

                      <Badge
                        variant={
                          question.difficulty === 'easy' ? 'secondary' :
                          question.difficulty === 'medium' ? 'default' :
                          'destructive'
                        }
                      >
                        {question.accuracy}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights">
            <div className="space-y-6">
              {/* Temas */}
              {classStats && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="p-6">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-red-600">
                      <TrendingDown className="w-5 h-5" />
                      Temas a Reforzar
                    </h3>
                    <ul className="space-y-2">
                      {classStats.weakTopics.map((topic, index) => (
                        <li
                          key={index}
                          className="flex items-center gap-3 p-3 bg-red-50 rounded-lg"
                        >
                          <div className="w-2 h-2 bg-red-500 rounded-full" />
                          <span className="font-medium text-gray-800">{topic}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-green-600">
                      <TrendingUp className="w-5 h-5" />
                      Temas Dominados
                    </h3>
                    <ul className="space-y-2">
                      {classStats.strongTopics.map((topic, index) => (
                        <li
                          key={index}
                          className="flex items-center gap-3 p-3 bg-green-50 rounded-lg"
                        >
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          <span className="font-medium text-gray-800">{topic}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                </div>
              )}

              {/* Recomendaciones */}
              <Card className="p-6 bg-blue-50 border-2 border-blue-300">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-900">
                  <Brain className="w-6 h-6" />
                  Recomendaciones Automáticas
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Award className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-blue-900">Reforzar Biología Celular</p>
                      <p className="text-sm text-blue-800">
                        El 60% de los estudiantes tuvieron dificultades. Considera dedicar más tiempo a este tema.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Award className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-blue-900">Felicitar desempeño en Geografía</p>
                      <p className="text-sm text-blue-800">
                        93% de aciertos. Los estudiantes dominan este tema.
                      </p>
                    </div>
                  </li>
                </ul>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4">Acciones</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              onClick={handleSendResults}
              variant="outline"
              className="gap-2 h-auto py-4 flex-col"
            >
              <Mail className="w-6 h-6" />
              <span>Enviar a Padres</span>
            </Button>

            <Button
              onClick={handleCreateReviewQuiz}
              variant="outline"
              className="gap-2 h-auto py-4 flex-col"
            >
              <FileText className="w-6 h-6" />
              <span>Quiz de Repaso</span>
            </Button>

            <Button
              onClick={handlePlayAgain}
              variant="outline"
              className="gap-2 h-auto py-4 flex-col"
            >
              <Play className="w-6 h-6" />
              <span>Jugar de Nuevo</span>
            </Button>

            <Button
              onClick={handleCopyToClass}
              variant="outline"
              className="gap-2 h-auto py-4 flex-col"
            >
              <Copy className="w-6 h-6" />
              <span>Copiar a Clase</span>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
