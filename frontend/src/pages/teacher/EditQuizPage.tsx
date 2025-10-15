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

  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Auto-ajustar tamaño del texto según longitud
  const getTextSizeClass = (texto: string) => {
    const length = texto.length;
    if (length <= 40) return 'text-3xl'; // Pregunta corta: grande
    if (length <= 70) return 'text-2xl'; // Pregunta media: mediano
    if (length <= 100) return 'text-xl'; // Pregunta larga: normal
    return 'text-lg'; // Pregunta muy larga: más pequeño
  };

  useEffect(() => {
    loadData();
  }, [id]);

  // Guardar índice de pregunta actual en localStorage
  useEffect(() => {
    if (id) {
      localStorage.setItem(`quiz_${id}_question_index`, currentQuestionIndex.toString());
    }
  }, [currentQuestionIndex, id]);

  // Actualizar preview cuando cambia la URL de imagen
  useEffect(() => {
    if (questionForm.imagen_url) {
      setImagePreview(questionForm.imagen_url);
    } else {
      setImagePreview(null);
    }
  }, [questionForm.imagen_url]);

  // Auto-resize textarea cuando carga el contenido
  useEffect(() => {
    const textarea = document.getElementById('question-text') as HTMLTextAreaElement;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.max(textarea.scrollHeight, 80)}px`;
    }
  }, [questionForm.texto]);

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

      // Load first question or last edited question if exists
      if (quizData.preguntas && quizData.preguntas.length > 0) {
        // Restaurar la última pregunta editada desde localStorage
        const savedIndex = localStorage.getItem(`quiz_${id}_question_index`);
        const index = savedIndex ? Math.min(parseInt(savedIndex), quizData.preguntas.length - 1) : 0;
        setCurrentQuestionIndex(index);
        loadQuestion(index, quizData.preguntas);
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

    // Validar opciones según el tipo de pregunta
    if (questionForm.tipo === 'short_answer') {
      // short_answer no necesita opciones
      questionForm.opciones = [];
    } else if (questionForm.tipo === 'fill_blanks') {
      // fill_blanks: validar que haya opciones y respuestas correctas
      if (questionForm.opciones.length < 3) {
        toast.error('Debe haber al menos 3 opciones disponibles');
        return;
      }
      const respuestas = questionForm.respuesta_correcta as string[];
      const blanksCount = (questionForm.texto.match(/_____/g) || []).length;
      
      if (blanksCount === 0) {
        toast.error('Debes usar _____ en el texto para indicar espacios en blanco');
        return;
      }
      
      if (!respuestas || respuestas.length !== blanksCount) {
        toast.error(`Debes seleccionar exactamente ${blanksCount} respuesta(s) correcta(s) según los espacios en blanco`);
        return;
      }
    } else if (questionForm.tipo === 'true_false') {
      // true_false necesita exactamente 2 opciones
      if (questionForm.opciones.length !== 2) {
        toast.error('Verdadero/Falso debe tener exactamente 2 opciones');
        return;
      }
    } else {
      // Otros tipos necesitan al menos 2 opciones
      if (questionForm.opciones.length < 2) {
        toast.error('Debe haber al menos 2 opciones');
        return;
      }
    }

    // Validar que las opciones no estén vacías (excepto para tipos que no usan opciones)
    if (!['short_answer', 'fill_blanks'].includes(questionForm.tipo || '')) {
      const hasEmptyOption = questionForm.opciones.some(opt => !opt.texto.trim());
      if (hasEmptyOption) {
        toast.error('Todas las opciones deben tener texto');
        return;
      }
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

      // Add optional fields (use null to explicitly remove)
      payload.imagen_url = questionForm.imagen_url?.trim() ? questionForm.imagen_url : null;
      payload.explicacion = questionForm.explicacion?.trim() ? questionForm.explicacion : undefined;

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La imagen no debe superar 5MB');
        return;
      }

      // Comprimir imagen antes de cargar
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Redimensionar si es muy grande (mantener max 1200px)
          const maxSize = 1200;
          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = (height / width) * maxSize;
              width = maxSize;
            } else {
              width = (width / height) * maxSize;
              height = maxSize;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Comprimir con calidad 0.8
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
          setQuestionForm({ ...questionForm, imagen_url: compressedBase64 });
          setImagePreview(compressedBase64);
          toast.success('Imagen cargada y optimizada');
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setQuestionForm({ ...questionForm, imagen_url: '' });
    setImagePreview(null);
  };

  const handleTextAreaResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.max(textarea.scrollHeight, 80)}px`;
    setQuestionForm({ ...questionForm, texto: e.target.value });
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
    setImagePreview(null);
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
    // Validar según el tipo
    const minOptions = questionForm.tipo === 'fill_blanks' ? 1 : 2;
    if (questionForm.opciones.length <= minOptions) {
      toast.error(`Debe haber al menos ${minOptions} opción(es)`);
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
              {/* Question Text + Image Preview Side by Side */}
              <div className={imagePreview ? 'grid grid-cols-2 gap-8 items-center' : ''}>
                <div>
                  <Label htmlFor="question-text" className="text-lg font-bold mb-3 block">Pregunta *</Label>
                  <Textarea
                    id="question-text"
                    placeholder="Escribe tu pregunta aquí..."
                    value={questionForm.texto}
                    onChange={handleTextAreaResize}
                    className={`resize-none overflow-hidden font-bold leading-tight transition-all ${getTextSizeClass(questionForm.texto)}`}
                    style={{
                      minHeight: '180px',
                      height: 'auto',
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-2">💡 Escribe una pregunta clara con buen tamaño</p>
                </div>
                {imagePreview && (
                  <div className="relative">
                    <Label className="block mb-3 text-lg font-bold">Preview Imagen</Label>
                    <div className="relative border-4 border-amber-400 rounded-2xl p-5 bg-white flex items-center justify-center" style={{minHeight: '240px', maxHeight: '320px'}}>
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="max-h-full max-w-full object-contain"
                        style={{maxHeight: '280px'}}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 bg-red-500 text-white hover:bg-red-600 h-8 w-8 p-0 rounded-full shadow-lg"
                        onClick={handleRemoveImage}
                        title="Eliminar imagen"
                      >
                        ✕
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Question Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tipo">Tipo de Pregunta</Label>
                  <Select
                    value={questionForm.tipo}
                    onValueChange={(value: any) => {
                      // Resetear opciones según el tipo
                      if (value === 'true_false') {
                        setQuestionForm({
                          ...questionForm,
                          tipo: value,
                          opciones: [
                            { texto: 'Verdadero' },
                            { texto: 'Falso' },
                          ],
                          respuesta_correcta: '0',
                        });
                      } else if (value === 'short_answer') {
                        setQuestionForm({
                          ...questionForm,
                          tipo: value,
                          opciones: [],
                          respuesta_correcta: '',
                        });
                      } else if (value === 'fill_blanks') {
                        // fill_blanks: opciones disponibles y respuesta_correcta (palabras correctas)
                        setQuestionForm({
                          ...questionForm,
                          tipo: value,
                          opciones: [{ texto: '' }, { texto: '' }, { texto: '' }],
                          respuesta_correcta: [],
                        });
                      } else if (value === 'order_sequence') {
                        setQuestionForm({
                          ...questionForm,
                          tipo: value,
                          opciones: [
                            { texto: '' },
                            { texto: '' },
                            { texto: '' },
                          ],
                          respuesta_correcta: ['0', '1', '2'],
                        });
                      } else if (value === 'match_pairs') {
                        setQuestionForm({
                          ...questionForm,
                          tipo: value,
                          opciones: [
                            { texto: '' },
                            { texto: '' },
                          ],
                          respuesta_correcta: ['0', '1'],
                        });
                      } else if (value === 'multiple_select') {
                        setQuestionForm({
                          ...questionForm,
                          tipo: value,
                          opciones: [
                            { texto: '' },
                            { texto: '' },
                            { texto: '' },
                          ],
                          respuesta_correcta: [],
                        });
                      } else {
                        // multiple_choice
                        setQuestionForm({
                          ...questionForm,
                          tipo: value,
                          opciones: [
                            { texto: '' },
                            { texto: '' },
                          ],
                          respuesta_correcta: ['0'],
                        });
                      }
                    }}
                  >
                    <SelectTrigger id="tipo">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="multiple_choice">⚫ Opción Múltiple (una correcta)</SelectItem>
                      <SelectItem value="multiple_select">⚪ Selección Múltiple (varias correctas)</SelectItem>
                      <SelectItem value="true_false">⚪ Verdadero/Falso</SelectItem>
                      <SelectItem value="short_answer">⚪ Respuesta Corta</SelectItem>
                      <SelectItem value="fill_blanks">⚪ Completar Espacios</SelectItem>
                      <SelectItem value="order_sequence">⚪ Ordenar Secuencia</SelectItem>
                      <SelectItem value="match_pairs">⚪ Relacionar Columnas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Imagen Upload/URL */}
                <div className="space-y-2">
                  <Label>📷 Imagen (opcional)</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="imagen-url" className="text-xs text-gray-600 font-medium">🔗 Pegar URL</Label>
                      <Input
                        id="imagen-url"
                        placeholder="https://..."
                        value={questionForm.imagen_url?.startsWith('data:') ? '' : questionForm.imagen_url || ''}
                        onChange={(e) => {
                          setQuestionForm({ ...questionForm, imagen_url: e.target.value });
                        }}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600 font-medium block mb-2">📁 Subir archivo</Label>
                      <input
                        id="imagen-file"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('imagen-file')?.click()}
                        className="w-full"
                      >
                        Subir archivo
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Options - Different UI based on question type */}
              <div>
                {/* Short Answer */}
                {questionForm.tipo === 'short_answer' && (
                  <div>
                    <Label htmlFor="short-answer">Respuesta Correcta *</Label>
                    <Input
                      id="short-answer"
                      placeholder="Escribe la respuesta esperada (1-2 palabras)"
                      value={typeof questionForm.respuesta_correcta === 'string' ? questionForm.respuesta_correcta : ''}
                      onChange={(e) =>
                        setQuestionForm({ ...questionForm, respuesta_correcta: e.target.value })
                      }
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      💡 La respuesta del estudiante se comparará (sin mayúsculas/minúsculas)
                    </p>
                  </div>
                )}

                {/* Fill Blanks */}
                {questionForm.tipo === 'fill_blanks' && (
                  <div className="space-y-3">
                    {(() => {
                      const blanksCount = (questionForm.texto.match(/_____/g) || []).length;
                      const selectedCount = (questionForm.respuesta_correcta as string[])?.length || 0;
                      const needMore = blanksCount - selectedCount;
                      
                      return (
                        <>
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <Label className="text-blue-900">📝 Instrucciones</Label>
                            <p className="text-sm text-blue-800 mt-1">
                              1. En el texto de la pregunta, usa <span className="font-mono bg-white px-1 border">_____</span> para cada espacio en blanco
                            </p>
                            <p className="text-sm text-blue-800 mt-1">
                              2. Agrega mínimo 3 opciones de palabras disponibles (incluye distractoras)
                            </p>
                            <p className="text-sm text-blue-800 mt-1">
                              3. Marca las respuestas correctas en orden (limitado a cantidad de espacios)
                            </p>
                            <p className="text-xs text-blue-600 mt-2 font-mono">
                              Ejemplo: "La capital de _____ es París" → Opciones: Francia, España, Italia → Correcta: Francia
                            </p>
                          </div>

                          {/* Contador de espacios */}
                          {blanksCount > 0 && (
                            <div className={`p-3 rounded-lg border-2 ${
                              selectedCount === blanksCount 
                                ? 'bg-green-50 border-green-500' 
                                : 'bg-amber-50 border-amber-500'
                            }`}>
                              <p className="text-sm font-semibold">
                                📊 Espacios en blanco detectados: <span className="text-lg">{blanksCount}</span>
                              </p>
                              <p className="text-sm mt-1">
                                {selectedCount === blanksCount ? (
                                  <span className="text-green-700">✅ ¡Perfecto! Todas las respuestas marcadas</span>
                                ) : selectedCount > blanksCount ? (
                                  <span className="text-red-700">⚠️ Tienes {selectedCount - blanksCount} respuestas de más</span>
                                ) : (
                                  <span className="text-amber-700">⏳ Te faltan {needMore} respuesta(s) correcta(s)</span>
                                )}
                              </p>
                            </div>
                          )}

                          {/* Opciones disponibles */}
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <Label>Opciones Disponibles (mínimo 3) *</Label>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleAddOption}
                                disabled={questionForm.opciones.length >= 6}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Agregar Opción
                              </Button>
                            </div>
                            <div className="space-y-2">
                              {questionForm.opciones?.map((opcion, index) => {
                                const respuestas = questionForm.respuesta_correcta as string[];
                                const isCorrect = respuestas?.includes(opcion.texto);
                                const orderNumber = isCorrect ? respuestas.indexOf(opcion.texto) + 1 : null;
                                const canSelect = !isCorrect && blanksCount > 0 && selectedCount < blanksCount;
                                
                                return (
                                  <div key={index} className="flex items-center gap-3">
                                    <div
                                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold transition-all ${
                                        isCorrect
                                          ? 'bg-green-500 text-white cursor-pointer'
                                          : canSelect
                                          ? 'bg-gray-200 text-gray-700 hover:bg-gray-300 cursor-pointer'
                                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                      }`}
                                      onClick={() => {
                                        if (!opcion.texto.trim()) {
                                          toast.error('Escribe el texto de la opción primero');
                                          return;
                                        }
                                        
                                        const current = (questionForm.respuesta_correcta as string[]) || [];
                                        if (current.includes(opcion.texto)) {
                                          // Quitar de respuestas correctas
                                          setQuestionForm({
                                            ...questionForm,
                                            respuesta_correcta: current.filter(r => r !== opcion.texto),
                                          });
                                        } else if (canSelect) {
                                          // Agregar a respuestas correctas solo si no se excede el límite
                                          setQuestionForm({
                                            ...questionForm,
                                            respuesta_correcta: [...current, opcion.texto],
                                          });
                                        } else if (!canSelect && !isCorrect) {
                                          toast.error(`Ya tienes ${blanksCount} respuesta(s) marcada(s). Desmarca alguna primero.`);
                                        }
                                      }}
                                      title={
                                        isCorrect 
                                          ? `Orden: ${orderNumber} (click para desmarcar)` 
                                          : canSelect
                                          ? 'Click para marcar como correcta'
                                          : 'Límite alcanzado'
                                      }
                                    >
                                      {isCorrect ? orderNumber : String.fromCharCode(65 + index)}
                                    </div>
                                    <Input
                                      placeholder={`Opción ${String.fromCharCode(65 + index)}`}
                                      value={opcion.texto}
                                      onChange={(e) => {
                                        const newOpciones = [...questionForm.opciones];
                                        const oldTexto = newOpciones[index].texto;
                                        newOpciones[index] = { ...newOpciones[index], texto: e.target.value };
                                        
                                        // Actualizar respuestas correctas si esta opción estaba seleccionada
                                        const respuestas = questionForm.respuesta_correcta as string[];
                                        if (respuestas?.includes(oldTexto)) {
                                          const newRespuestas = respuestas.map(r => r === oldTexto ? e.target.value : r);
                                          setQuestionForm({ 
                                            ...questionForm, 
                                            opciones: newOpciones,
                                            respuesta_correcta: newRespuestas
                                          });
                                        } else {
                                          setQuestionForm({ ...questionForm, opciones: newOpciones });
                                        }
                                      }}
                                      className={isCorrect ? 'border-green-500 bg-green-50' : ''}
                                    />
                                    {questionForm.opciones.length > 3 && (
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
                              💡 Solo puedes seleccionar {blanksCount > 0 ? blanksCount : '...'} respuesta(s) correcta(s) según los espacios en blanco
                            </p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}

                {/* Multiple Choice, Multiple Select, True/False */}
                {['multiple_choice', 'multiple_select', 'true_false'].includes(questionForm.tipo || '') && (
                  <>
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
                        const respuestaArray = Array.isArray(questionForm.respuesta_correcta) 
                          ? questionForm.respuesta_correcta 
                          : [questionForm.respuesta_correcta];
                        const isCorrect = respuestaArray.includes(index.toString());

                        return (
                          <div key={index} className="flex items-center gap-3">
                            <div
                              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold cursor-pointer transition-all ${
                                isCorrect
                                  ? 'bg-green-500 text-white'
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                              onClick={() => {
                                if (questionForm.tipo === 'multiple_select') {
                                  // Multiple select: toggle
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
                                      respuesta_correcta: [...current, indexStr],
                                    });
                                  }
                                } else if (questionForm.tipo === 'true_false') {
                                  // True/false: set as string
                                  setQuestionForm({
                                    ...questionForm,
                                    respuesta_correcta: index.toString(),
                                  });
                                } else {
                                  // Multiple choice: only one
                                  handleToggleCorrectAnswer(index);
                                }
                              }}
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
                      💡 {questionForm.tipo === 'multiple_select' 
                        ? 'Click en las letras para marcar TODAS las respuestas correctas' 
                        : 'Click en la letra para marcar LA respuesta correcta'}
                    </p>
                  </>
                )}

                {/* Order Sequence */}
                {questionForm.tipo === 'order_sequence' && (
                  <div className="space-y-3">
                    <Label>Elementos a Ordenar (en orden correcto) *</Label>
                    <p className="text-sm text-gray-600 mb-2">
                      🔀 Arrastra las tarjetas para reordenar. Se mostrarán desordenados al estudiante.
                    </p>
                    <DragDropContext
                      onDragEnd={(result) => {
                        if (!result.destination) return;
                        const newOpciones = Array.from(questionForm.opciones);
                        const [removed] = newOpciones.splice(result.source.index, 1);
                        newOpciones.splice(result.destination.index, 0, removed);
                        setQuestionForm({ ...questionForm, opciones: newOpciones });
                      }}
                    >
                      <Droppable droppableId="order-sequence-options">
                        {(provided) => (
                          <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                            {questionForm.opciones?.map((opcion, index) => (
                              <Draggable key={`option-${index}`} draggableId={`option-${index}`} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                                      snapshot.isDragging
                                        ? 'border-indigo-500 bg-indigo-50 shadow-lg'
                                        : 'border-gray-200 bg-white hover:border-gray-300'
                                    }`}
                                  >
                                    <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                                      <GripVertical className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-semibold">
                                      {index + 1}
                                    </span>
                                    <Input
                                      placeholder={`Paso ${index + 1}`}
                                      value={opcion.texto}
                                      onChange={(e) => {
                                        const newOpciones = [...questionForm.opciones];
                                        newOpciones[index] = { ...newOpciones[index], texto: e.target.value };
                                        setQuestionForm({ ...questionForm, opciones: newOpciones });
                                      }}
                                    />
                                    {questionForm.opciones.length > 3 && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRemoveOption(index)}
                                      >
                                        <Trash2 className="h-4 w-4 text-red-600" />
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddOption}
                      disabled={questionForm.opciones.length >= 6}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Elemento
                    </Button>
                  </div>
                )}

                {/* Match Pairs */}
                {questionForm.tipo === 'match_pairs' && (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300 rounded-xl p-4">
                      <Label className="text-purple-900 font-bold text-base">🎮 Relacionar Columnas (Drag & Drop)</Label>
                      <p className="text-sm text-purple-800 mt-1">
                        • Arrastra los pares para reordenarlos<br/>
                        • Los estudiantes verán tarjetas mezcladas<br/>
                        • Deberán relacionarlas con colores tipo Kahoot
                      </p>
                    </div>

                    <DragDropContext
                      onDragEnd={(result) => {
                        if (!result.destination) return;
                        const items = Array.from(questionForm.opciones);
                        const [reorderedItem] = items.splice(result.source.index, 1);
                        items.splice(result.destination.index, 0, reorderedItem);
                        setQuestionForm({ ...questionForm, opciones: items });
                      }}
                    >
                      <Droppable droppableId="match-pairs">
                        {(provided) => (
                          <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                            {questionForm.opciones?.map((opcion, index) => {
                              const parts = opcion.texto.includes('→') 
                                ? opcion.texto.split('→').map(s => s.trim())
                                : opcion.texto.includes('->') 
                                ? opcion.texto.split('->').map(s => s.trim())
                                : [opcion.texto || '', ''];
                              const columnA = parts[0] || '';
                              const columnB = parts[1] || '';
                              
                              // Colores para cada par
                              const pairColors = [
                                { bg: 'bg-purple-100', border: 'border-purple-400', icon: 'bg-purple-500' },
                                { bg: 'bg-pink-100', border: 'border-pink-400', icon: 'bg-pink-500' },
                                { bg: 'bg-amber-100', border: 'border-amber-400', icon: 'bg-amber-500' },
                                { bg: 'bg-cyan-100', border: 'border-cyan-400', icon: 'bg-cyan-500' },
                                { bg: 'bg-lime-100', border: 'border-lime-400', icon: 'bg-lime-500' },
                                { bg: 'bg-rose-100', border: 'border-rose-400', icon: 'bg-rose-500' },
                              ];
                              const colors = pairColors[index % pairColors.length];

                              return (
                                <Draggable key={`pair-${index}`} draggableId={`pair-${index}`} index={index}>
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      className={`border-4 rounded-xl p-4 transition-all ${
                                        snapshot.isDragging ? 'shadow-2xl scale-105' : 'shadow-sm'
                                      } ${colors.bg} ${colors.border}`}
                                    >
                                      <div className="flex items-start gap-4">
                                        <div {...provided.dragHandleProps} className="cursor-move mt-2">
                                          <GripVertical className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                        </div>
                                        <div className="flex-1 grid grid-cols-2 gap-4">
                                          {/* Columna A */}
                                          <div>
                                            <div className="flex items-center gap-2 mb-2">
                                              <span className={`w-6 h-6 rounded-full ${colors.icon} text-white flex items-center justify-center text-xs font-bold shadow-sm`}>
                                                {index + 1}
                                              </span>
                                              <Label className="text-xs font-bold text-gray-700">📋 Concepto</Label>
                                            </div>
                                            <Input
                                              placeholder="Ej: Luz solar"
                                              value={columnA}
                                              onChange={(e) => {
                                                const newOpciones = [...questionForm.opciones];
                                                newOpciones[index] = { 
                                                  ...newOpciones[index], 
                                                  texto: `${e.target.value} → ${columnB}`
                                                };
                                                setQuestionForm({ ...questionForm, opciones: newOpciones });
                                              }}
                                              className="bg-white border-2 border-blue-300 focus:border-blue-500 font-medium"
                                            />
                                          </div>
                                          {/* Columna B */}
                                          <div>
                                            <div className="flex items-center gap-2 mb-2">
                                              <span className="text-lg font-bold text-gray-400">→</span>
                                              <Label className="text-xs font-bold text-gray-700">🎯 Relacionado</Label>
                                            </div>
                                            <Input
                                              placeholder="Ej: Proporciona energía"
                                              value={columnB}
                                              onChange={(e) => {
                                                const newOpciones = [...questionForm.opciones];
                                                newOpciones[index] = { 
                                                  ...newOpciones[index], 
                                                  texto: `${columnA} → ${e.target.value}`
                                                };
                                                setQuestionForm({ ...questionForm, opciones: newOpciones });
                                              }}
                                              className="bg-white border-2 border-green-300 focus:border-green-500 font-medium"
                                            />
                                          </div>
                                        </div>
                                        {questionForm.opciones.length > 2 && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="mt-8 h-8 w-8 p-0 hover:bg-red-100"
                                            onClick={() => handleRemoveOption(index)}
                                          >
                                            <Trash2 className="h-4 w-4 text-red-600" />
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              );
                            })}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddOption}
                      disabled={questionForm.opciones.length >= 6}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Par de Conceptos
                    </Button>
                    <p className="text-xs text-center text-gray-600">
                      ⚡ Para los estudiantes: Las tarjetas se mezclarán y deberán relacionar con colores.
                    </p>
                  </div>
                )}
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

          {/* Preview - Actualización en tiempo real */}
          <div className="mt-6">
            <h3 className="font-semibold text-gray-900 mb-3">Vista Previa</h3>
            <QuestionCard 
              question={{
                ...questionForm,
                id: currentQuestion?.id || '',
                quiz_id: quiz?.id || '',
                orden: currentQuestion?.orden || (currentQuestionIndex + 1),
                fecha_creacion: currentQuestion?.fecha_creacion || new Date().toISOString(),
              } as Question} 
              showCorrectAnswer 
            />
          </div>
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
