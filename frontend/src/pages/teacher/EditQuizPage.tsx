import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Save,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Eye,
  GripVertical,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { quizzesApi, Quiz, Question, CreateQuestionInput } from '@/lib/api/quizzes';
import { catalogApi } from '@/lib/api/catalog';
import QuestionCard from '@/components/quiz/QuestionCard';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

export default function EditQuizPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  const [grados, setGrados] = useState<any[]>([]);
  const [materias, setMaterias] = useState<any[]>([]);

  // Form states
  const [quizForm, setQuizForm] = useState({
    titulo: '',
    descripcion: '',
    materia_id: '',
    grado_id: '',
    dificultad: 'medio' as 'facil' | 'medio' | 'dificil',
    tipo_quiz: 'kahoot' as 'kahoot' | 'mario_party' | 'duelo',
    tiempo_por_pregunta: 20,
    puntos_base: 1000,
  });

  const [questionForm, setQuestionForm] = useState<CreateQuestionInput>({
    texto: '',
    tipo: 'multiple_choice',
    opciones: [
      { texto: '' },
      { texto: '' },
    ],
    respuesta_correcta: ['0'],
    puntos: 1000,
    tiempo_limite: 20,
    explicacion: '',
  });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      console.log('Loading quiz with ID:', id);
      
      const [quizRes, gradosRes, materiasRes] = await Promise.all([
        quizzesApi.getQuiz(id!).catch(err => {
          console.error('Error loading quiz:', err);
          console.error('Quiz error response:', err.response?.data);
          throw err;
        }),
        catalogApi.getGrados().catch(err => {
          console.error('Error loading grados:', err);
          throw err;
        }),
        catalogApi.getMaterias().catch(err => {
          console.error('Error loading materias:', err);
          throw err;
        }),
      ]);

      const quizData = quizRes.data.data;
      console.log('Quiz loaded successfully:', quizData.titulo);
      
      setQuiz(quizData);
      setQuestions(quizData.preguntas || []);
      setGrados(gradosRes.data);
      setMaterias(materiasRes.data);

      // Populate quiz form
      setQuizForm({
        titulo: quizData.titulo,
        descripcion: quizData.descripcion || '',
        materia_id: quizData.materia_id,
        grado_id: quizData.grado_id,
        dificultad: quizData.dificultad || 'medio',
        tipo_quiz: quizData.tipo_quiz,
        tiempo_por_pregunta: quizData.tiempo_por_pregunta,
        puntos_base: quizData.puntos_base,
      });

      // Load first question if exists
      if (quizData.preguntas && quizData.preguntas.length > 0) {
        loadQuestion(0, quizData.preguntas);
      }
    } catch (error: any) {
      console.error('Error loading quiz:', error);
      const errorMsg = error.response?.data?.message || 'Error al cargar el quiz';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const loadQuestion = (index: number, questionsList: Question[] = questions) => {
    if (questionsList[index]) {
      const q = questionsList[index];
      setQuestionForm({
        texto: q.texto,
        imagen_url: q.imagen_url,
        tipo: q.tipo,
        opciones: q.opciones,
        respuesta_correcta: Array.isArray(q.respuesta_correcta)
          ? q.respuesta_correcta
          : [q.respuesta_correcta],
        puntos: q.puntos,
        tiempo_limite: q.tiempo_limite,
        explicacion: q.explicacion || '',
      });
      setCurrentQuestionIndex(index);
    }
  };

  const handleSaveQuiz = async () => {
    try {
      setSaving(true);
      console.log('Saving quiz metadata:', quizForm);
      await quizzesApi.updateQuiz(id!, quizForm);
      toast.success('Quiz actualizado');
    } catch (error: any) {
      console.error('Error saving quiz:', error);
      console.error('Error response:', error.response?.data);
      const errorMsg = error.response?.data?.message || 'Error al guardar quiz';
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveQuestion = async () => {
    if (!questionForm.texto.trim()) {
      toast.error('El texto de la pregunta es requerido');
      return;
    }

    if (questionForm.opciones.length < 2) {
      toast.error('Debe haber al menos 2 opciones');
      return;
    }

    // Validar que las opciones no estén vacías
    const hasEmptyOption = questionForm.opciones.some(opt => !opt.texto.trim());
    if (hasEmptyOption) {
      toast.error('Todas las opciones deben tener texto');
      return;
    }

    // Validar que haya al menos una respuesta correcta
    if (!questionForm.respuesta_correcta || questionForm.respuesta_correcta.length === 0) {
      toast.error('Debes marcar al menos una respuesta correcta');
      return;
    }

    try {
      setSaving(true);
      const currentQuestion = questions[currentQuestionIndex];

      // Clean the payload - remove undefined/null values
      const tipo = questionForm.tipo ?? 'multiple_choice';
      
      // Para true_false, respuesta_correcta debe ser un string, no un array
      let respuestaCorrecta: string | string[];
      if (tipo === 'true_false') {
        respuestaCorrecta = Array.isArray(questionForm.respuesta_correcta) 
          ? questionForm.respuesta_correcta[0] 
          : questionForm.respuesta_correcta;
      } else {
        respuestaCorrecta = Array.isArray(questionForm.respuesta_correcta)
          ? questionForm.respuesta_correcta
          : [questionForm.respuesta_correcta];
      }
      
      const payload: CreateQuestionInput = {
        texto: questionForm.texto,
        tipo: tipo,
        opciones: questionForm.opciones,
        respuesta_correcta: respuestaCorrecta,
        puntos: questionForm.puntos ?? 1000,
        tiempo_limite: questionForm.tiempo_limite ?? 20,
      };

      // Only add optional fields if they have values
      if (questionForm.imagen_url?.trim()) {
        payload.imagen_url = questionForm.imagen_url;
      }
      if (questionForm.explicacion?.trim()) {
        payload.explicacion = questionForm.explicacion;
      }

      console.log('Sending payload:', JSON.stringify(payload, null, 2));

      if (currentQuestion) {
        // Update existing question
        await quizzesApi.updateQuestion(id!, currentQuestion.id, payload);
        toast.success('Pregunta actualizada');
      } else {
        // Create new question
        await quizzesApi.createQuestion(id!, payload);
        toast.success('Pregunta creada');
      }

      loadData();
    } catch (error: any) {
      console.error('Error saving question:', error);
      console.error('Error response:', error.response?.data);
      const errorMsg = error.response?.data?.message || 'Error al guardar pregunta';
      const errors = error.response?.data?.errors;
      if (errors && errors.length > 0) {
        console.error('Validation errors:', errors);
        toast.error(`${errorMsg}: ${errors.map((e: any) => e.message).join(', ')}`);
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAddQuestion = () => {
    setQuestionForm({
      texto: '',
      tipo: 'multiple_choice',
      opciones: [{ texto: '' }, { texto: '' }],
      respuesta_correcta: ['0'],
      puntos: 1000,
      tiempo_limite: 20,
      explicacion: '',
    });
    setCurrentQuestionIndex(questions.length);
  };

  const handleDeleteQuestion = async () => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;

    try {
      await quizzesApi.deleteQuestion(id!, currentQuestion.id);
      toast.success('Pregunta eliminada');
      setShowDeleteModal(false);
      loadData();
      if (currentQuestionIndex > 0) {
        setCurrentQuestionIndex(currentQuestionIndex - 1);
      }
    } catch (error) {
      toast.error('Error al eliminar pregunta');
    }
  };

  const handlePublish = async () => {
    if (questions.length < 5) {
      toast.error('Necesitas al menos 5 preguntas para publicar');
      return;
    }

    try {
      await quizzesApi.publishQuiz(id!);
      toast.success('¡Quiz publicado exitosamente!');
      navigate('/teacher/quizzes');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al publicar');
    }
  };

  const handleAddOption = () => {
    setQuestionForm({
      ...questionForm,
      opciones: [...questionForm.opciones, { texto: '' }],
    });
  };

  const handleRemoveOption = (index: number) => {
    if (questionForm.opciones.length <= 2) {
      toast.error('Debe haber al menos 2 opciones');
      return;
    }
    const newOptions = questionForm.opciones.filter((_, i) => i !== index);
    setQuestionForm({ ...questionForm, opciones: newOptions });
  };

  const handleToggleCorrectAnswer = (index: number) => {
    const indexStr = index.toString();
    const current = questionForm.respuesta_correcta as string[];
    
    if (current.includes(indexStr)) {
      setQuestionForm({
        ...questionForm,
        respuesta_correcta: current.filter((i) => i !== indexStr),
      });
    } else {
      setQuestionForm({
        ...questionForm,
        respuesta_correcta: [indexStr], // Solo una respuesta correcta
      });
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(questions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setQuestions(items);

    try {
      await quizzesApi.reorderQuestions(
        id!,
        items.map((q) => q.id)
      );
      toast.success('Orden actualizado');
    } catch (error) {
      toast.error('Error al reordenar');
      loadData(); // Revert
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-6xl animate-bounce mb-4">📝</div>
          <p className="text-gray-600">Cargando quiz...</p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Quiz no encontrado</p>
        <Button onClick={() => navigate('/teacher/quizzes')} className="mt-4">
          Volver a Quizzes
        </Button>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/teacher/quizzes')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{quiz.titulo}</h1>
              <Badge variant={quiz.estado === 'publicado' ? 'default' : 'secondary'}>
                {quiz.estado}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {questions.length} pregunta{questions.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSaveQuiz} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            Guardar
          </Button>
          {quiz.estado === 'borrador' && (
            <Button onClick={handlePublish} disabled={questions.length < 5}>
              <Eye className="h-4 w-4 mr-2" />
              Publicar
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar - Questions List */}
        <div className="col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Preguntas</CardTitle>
              <Button onClick={handleAddQuestion} size="sm" className="w-full mt-2">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Pregunta
              </Button>
            </CardHeader>
            <CardContent className="p-2">
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="questions">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                      {questions.map((question, index) => (
                        <Draggable key={question.id} draggableId={question.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                                currentQuestionIndex === index
                                  ? 'border-indigo-500 bg-indigo-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              } ${snapshot.isDragging ? 'shadow-lg' : ''}`}
                              onClick={() => loadQuestion(index)}
                            >
                              <div className="flex items-start gap-2">
                                <div {...provided.dragHandleProps}>
                                  <GripVertical className="h-4 w-4 text-gray-400 mt-1" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {index + 1}. {question.texto}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {question.opciones.length} opciones
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>

              {questions.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500">Sin preguntas aún</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quiz Config Mini */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-sm">Configuración</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs">Materia</Label>
                <Select
                  value={quizForm.materia_id}
                  onValueChange={(value) => setQuizForm({ ...quizForm, materia_id: value })}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {materias?.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Grado</Label>
                <Select
                  value={quizForm.grado_id}
                  onValueChange={(value) => setQuizForm({ ...quizForm, grado_id: value })}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {grados?.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Dificultad</Label>
                <Select
                  value={quizForm.dificultad}
                  onValueChange={(value: any) => setQuizForm({ ...quizForm, dificultad: value })}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="facil">😊 Fácil</SelectItem>
                    <SelectItem value="medio">🤔 Medio</SelectItem>
                    <SelectItem value="dificil">🔥 Difícil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Editor */}
        <div className="col-span-9">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {currentQuestion
                    ? `Pregunta ${currentQuestionIndex + 1}`
                    : 'Nueva Pregunta'}
                </CardTitle>
                <div className="flex gap-2">
                  {currentQuestion && (
                    <Button variant="destructive" size="sm" onClick={() => setShowDeleteModal(true)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Question Text */}
              <div>
                <Label htmlFor="question-text">Texto de la Pregunta *</Label>
                <Textarea
                  id="question-text"
                  placeholder="Escribe tu pregunta aquí..."
                  value={questionForm.texto}
                  onChange={(e) => setQuestionForm({ ...questionForm, texto: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Question Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tipo">Tipo de Pregunta</Label>
                  <Select
                    value={questionForm.tipo}
                    onValueChange={(value: any) => {
                      // Si cambia a true_false, resetear opciones
                      if (value === 'true_false') {
                        setQuestionForm({
                          ...questionForm,
                          tipo: value,
                          opciones: [
                            { texto: 'Verdadero' },
                            { texto: 'Falso' },
                          ],
                          respuesta_correcta: ['0'],
                        });
                      } else {
                        setQuestionForm({ ...questionForm, tipo: value });
                      }
                    }}
                  >
                    <SelectTrigger id="tipo">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="multiple_choice">📝 Opción Múltiple</SelectItem>
                      <SelectItem value="true_false">✓/✗ Verdadero/Falso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="imagen">Imagen (URL)</Label>
                  <Input
                    id="imagen"
                    placeholder="https://..."
                    value={questionForm.imagen_url || ''}
                    onChange={(e) =>
                      setQuestionForm({ ...questionForm, imagen_url: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Options */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label>Opciones de Respuesta *</Label>
                  {questionForm.tipo !== 'true_false' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddOption}
                      disabled={questionForm.opciones.length >= 6}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Opción
                    </Button>
                  )}
                </div>

                <div className="space-y-3">
                  {questionForm.opciones?.map((opcion, index) => {
                    const isCorrect = (questionForm.respuesta_correcta as string[]).includes(
                      index.toString()
                    );

                    return (
                      <div key={index} className="flex items-center gap-3">
                        <div
                          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold cursor-pointer transition-all ${
                            isCorrect
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                          onClick={() => handleToggleCorrectAnswer(index)}
                          title="Click para marcar como correcta"
                        >
                          {isCorrect ? (
                            <CheckCircle className="h-5 w-5" />
                          ) : (
                            String.fromCharCode(65 + index)
                          )}
                        </div>
                        <Input
                          placeholder={`Opción ${String.fromCharCode(65 + index)}`}
                          value={opcion.texto}
                          onChange={(e) => {
                            const newOpciones = [...questionForm.opciones];
                            newOpciones[index] = { ...newOpciones[index], texto: e.target.value };
                            setQuestionForm({ ...questionForm, opciones: newOpciones });
                          }}
                          className={isCorrect ? 'border-green-500 bg-green-50' : ''}
                          disabled={questionForm.tipo === 'true_false'}
                        />
                        {questionForm.opciones.length > 2 && questionForm.tipo !== 'true_false' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveOption(index)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  💡 Click en la letra para marcar la respuesta correcta
                </p>
              </div>

              {/* Time and Points */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tiempo Límite (segundos)</Label>
                  <div className="flex items-center gap-4 mt-2">
                    <Slider
                      value={[questionForm.tiempo_limite ?? 20]}
                      onValueChange={(value) =>
                        setQuestionForm({ ...questionForm, tiempo_limite: value[0] })
                      }
                      min={5}
                      max={120}
                      step={5}
                      className="flex-1"
                    />
                    <span className="w-12 text-center font-semibold">
                      {questionForm.tiempo_limite ?? 20}s
                    </span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="puntos">Puntos</Label>
                  <Input
                    id="puntos"
                    type="number"
                    value={questionForm.puntos ?? 1000}
                    onChange={(e) =>
                      setQuestionForm({ ...questionForm, puntos: parseInt(e.target.value) || 1000 })
                    }
                    min={100}
                    max={10000}
                    step={100}
                  />
                </div>
              </div>

              {/* Explanation */}
              <div>
                <Label htmlFor="explicacion">Explicación (opcional)</Label>
                <Textarea
                  id="explicacion"
                  placeholder="Explica por qué esta es la respuesta correcta..."
                  value={questionForm.explicacion || ''}
                  onChange={(e) =>
                    setQuestionForm({ ...questionForm, explicacion: e.target.value })
                  }
                  rows={2}
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => loadQuestion(Math.max(0, currentQuestionIndex - 1))}
                    disabled={currentQuestionIndex === 0}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      loadQuestion(Math.min(questions.length - 1, currentQuestionIndex + 1))
                    }
                    disabled={currentQuestionIndex >= questions.length - 1}
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>

                <Button onClick={handleSaveQuestion} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Guardando...' : currentQuestion ? 'Actualizar' : 'Crear'} Pregunta
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          {currentQuestion && (
            <div className="mt-6">
              <h3 className="font-semibold text-gray-900 mb-3">Vista Previa</h3>
              <QuestionCard question={currentQuestion} showCorrectAnswer />
            </div>
          )}
        </div>
      </div>

      {/* Delete Question Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar pregunta?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. La pregunta será eliminada permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteQuestion}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
