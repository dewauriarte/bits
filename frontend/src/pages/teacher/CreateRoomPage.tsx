import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Loader2, Play, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { quizzesApi, Quiz } from '@/lib/api/quizzes';
import { roomsApi } from '@/lib/api/rooms';
import { classesApi } from '@/lib/api/classes';

export default function CreateRoomPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<string>('');
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  // Configuración de la sala
  const [config, setConfig] = useState<{
    tipo_sala: string;
    modo_acceso: 'abierto' | 'cerrado';
    maxPlayers: number;
    timePerQuestion: number;
    allowLateJoin: boolean;
    showLeaderboard: boolean;
    bonificacion_velocidad: boolean;
    bonificacion_combo: boolean;
  }>({
    tipo_sala: 'clasico',
    modo_acceso: 'abierto',
    maxPlayers: 50,
    timePerQuestion: 20,
    allowLateJoin: true,
    showLeaderboard: true,
    bonificacion_velocidad: true,
    bonificacion_combo: true,
  });

  useEffect(() => {
    loadQuizzes();
    loadClasses();
  }, []);

  useEffect(() => {
    // Pre-seleccionar quiz si viene desde QuizzesPage
    const state = location.state as { selectedQuizId?: string } | null;
    if (state?.selectedQuizId && quizzes.length > 0) {
      setSelectedQuizId(state.selectedQuizId);
    }
  }, [location.state, quizzes]);

  useEffect(() => {
    if (selectedQuizId) {
      const quiz = quizzes.find((q: Quiz) => q.id === selectedQuizId);
      setSelectedQuiz(quiz || null);
      if (quiz) {
        setConfig((prev) => ({
          ...prev,
          timePerQuestion: quiz.tiempo_por_pregunta || 20,
          bonificacion_velocidad: quiz.bonificacion_velocidad ?? true,
          bonificacion_combo: quiz.bonificacion_combo ?? true,
        }));
      }
    }
  }, [selectedQuizId, quizzes]);

  const loadQuizzes = async () => {
    try {
      setLoadingQuizzes(true);
      const response = await quizzesApi.getQuizzes({ estado: 'publicado' });
      const publishedQuizzes = response.data.data.quizzes || [];
      setQuizzes(publishedQuizzes);
    } catch (error: any) {
      toast.error('Error al cargar quizzes', {
        description: error.response?.data?.message || 'Intenta de nuevo',
      });
    } finally {
      setLoadingQuizzes(false);
    }
  };

  const loadClasses = async () => {
    try {
      const response = await classesApi.getClasses();
      // La API retorna { data: { clases: [...] } }
      const clasesData = response.data?.clases || response.data || [];
      setClasses(Array.isArray(clasesData) ? clasesData : []);
    } catch (error: any) {
      console.error('Error loading classes:', error);
      setClasses([]); // Asegurar que siempre sea un array
    }
  };

  const handleCreateRoom = async () => {
    if (!selectedQuizId) {
      toast.error('Selecciona un quiz');
      return;
    }

    if (config.modo_acceso === 'cerrado' && !selectedClassId) {
      toast.error('Selecciona una clase para el modo cerrado');
      return;
    }

    try {
      setLoading(true);
      const response = await roomsApi.createRoom({
        quiz_id: selectedQuizId,
        modo_acceso: config.modo_acceso,
        clase_id: config.modo_acceso === 'cerrado' ? selectedClassId : undefined,
        config_juego: {
          maxPlayers: config.maxPlayers,
          timePerQuestion: config.timePerQuestion,
          allowLateJoin: config.allowLateJoin,
          showLeaderboard: config.showLeaderboard,
        },
      });

      toast.success('Sala creada exitosamente', {
        description: `Código: ${response.room.roomCode}`,
      });

      // Redirect al lobby del profesor
      navigate(`/teacher/rooms/${response.room.roomCode}/lobby`);
    } catch (error: any) {
      console.error('Error creating room:', error);
      toast.error('Error al crear sala', {
        description: error.response?.data?.message || 'Intenta de nuevo',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingQuizzes) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/teacher/quizzes')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Crear Sala de Juego</h1>
          <p className="text-muted-foreground">Configura tu sala y comienza a jugar</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuración */}
        <div className="lg:col-span-2 space-y-6">
          {/* Selector de Quiz */}
          <Card>
            <CardHeader>
              <CardTitle>Seleccionar Quiz</CardTitle>
              <CardDescription>Elige el quiz que quieres jugar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Quiz</Label>
                <Select value={selectedQuizId} onValueChange={setSelectedQuizId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un quiz..." />
                  </SelectTrigger>
                  <SelectContent>
                    {quizzes.map((quiz) => (
                      <SelectItem key={quiz.id} value={quiz.id}>
                        {quiz.titulo} ({quiz.num_preguntas || 0} preguntas)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {quizzes.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No tienes quizzes publicados.</p>
                  <Button
                    variant="link"
                    onClick={() => navigate('/teacher/quizzes/create')}
                    className="mt-2"
                  >
                    Crear un quiz
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Configuración de Juego */}
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Juego</CardTitle>
              <CardDescription>Personaliza la experiencia de juego</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Tipo de Sala */}
              <div className="space-y-2">
                <Label>Tipo de Sala</Label>
                <Select value={config.tipo_sala} onValueChange={(v) => setConfig({ ...config, tipo_sala: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clasico">🎯 Clásico (Estilo Kahoot)</SelectItem>
                    <SelectItem value="mario_party">🎲 Tablero (Estilo Mario Party)</SelectItem>
                    <SelectItem value="duelo">⚔️ Duelo 1v1</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Modo de Acceso */}
              <div className="space-y-2">
                <Label>Modo de Acceso</Label>
                <Select value={config.modo_acceso} onValueChange={(v: 'abierto' | 'cerrado') => setConfig({ ...config, modo_acceso: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="abierto">🌐 Abierto (Nombre propio)</SelectItem>
                    <SelectItem value="cerrado">🔒 Cerrado (Solo estudiantes de la clase)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Selector de Clase (solo para modo privado) */}
              {config.modo_acceso === 'cerrado' && (
                <div className="space-y-2">
                  <Label>Clase *</Label>
                  <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una clase..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(classes) && classes.length > 0 ? (
                        classes.map((clase: any) => (
                          <SelectItem key={clase.id} value={clase.id}>
                            {clase.nombre_clase || clase.nombre} - {clase.grado_nombre || ''}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-sm text-gray-500">
                          No hay clases disponibles
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Los estudiantes de esta clase serán pre-cargados en la sala
                  </p>
                </div>
              )}

              {/* Máximo de Jugadores */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>Máximo de Jugadores</Label>
                  <span className="text-sm font-medium">{config.maxPlayers}</span>
                </div>
                <Slider
                  value={[config.maxPlayers]}
                  onValueChange={([v]) => setConfig({ ...config, maxPlayers: v })}
                  min={2}
                  max={100}
                  step={1}
                />
              </div>

              {/* Tiempo por Pregunta */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>Tiempo por Pregunta</Label>
                  <span className="text-sm font-medium">{config.timePerQuestion}s</span>
                </div>
                <Slider
                  value={[config.timePerQuestion]}
                  onValueChange={([v]) => setConfig({ ...config, timePerQuestion: v })}
                  min={5}
                  max={60}
                  step={5}
                />
              </div>

              {/* Opciones */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Permitir unirse tarde</Label>
                    <p className="text-sm text-muted-foreground">
                      Jugadores pueden unirse después de iniciar
                    </p>
                  </div>
                  <Switch
                    checked={config.allowLateJoin}
                    onCheckedChange={(v) => setConfig({ ...config, allowLateJoin: v })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Mostrar tabla de posiciones</Label>
                    <p className="text-sm text-muted-foreground">
                      Mostrar ranking en tiempo real
                    </p>
                  </div>
                  <Switch
                    checked={config.showLeaderboard}
                    onCheckedChange={(v) => setConfig({ ...config, showLeaderboard: v })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Bonificación de velocidad</Label>
                    <p className="text-sm text-muted-foreground">
                      Más puntos por responder rápido
                    </p>
                  </div>
                  <Switch
                    checked={config.bonificacion_velocidad}
                    onCheckedChange={(v) => setConfig({ ...config, bonificacion_velocidad: v })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Bonificación de combo</Label>
                    <p className="text-sm text-muted-foreground">
                      Racha de respuestas correctas
                    </p>
                  </div>
                  <Switch
                    checked={config.bonificacion_combo}
                    onCheckedChange={(v) => setConfig({ ...config, bonificacion_combo: v })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview del Quiz */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>Vista previa del quiz seleccionado</CardDescription>
            </CardHeader>
            <CardContent>
              {selectedQuiz ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{selectedQuiz.titulo}</h3>
                    {selectedQuiz.descripcion && (
                      <p className="text-sm text-muted-foreground mb-4">{selectedQuiz.descripcion}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-muted-foreground mb-1">Preguntas</p>
                      <p className="font-semibold">{selectedQuiz.num_preguntas || 0}</p>
                    </div>
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-muted-foreground mb-1">Dificultad</p>
                      <p className="font-semibold capitalize">{selectedQuiz.dificultad || 'Media'}</p>
                    </div>
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-muted-foreground mb-1">Materia</p>
                      <p className="font-semibold">{selectedQuiz.materias?.nombre || 'N/A'}</p>
                    </div>
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-muted-foreground mb-1">Grado</p>
                      <p className="font-semibold">{selectedQuiz.grados?.nombre || 'N/A'}</p>
                    </div>
                  </div>

                  {selectedQuiz.tags && selectedQuiz.tags.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Etiquetas</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedQuiz.tags.map((tag, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleCreateRoom}
                    disabled={loading}
                    className="w-full"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creando sala...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Crear Sala
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="text-sm">Selecciona un quiz para ver el preview</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
