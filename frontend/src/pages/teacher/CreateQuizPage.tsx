import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageCircle, FileUp, Edit3, Send, Paperclip, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { aiApi, quizzesApi } from '@/lib/api/quizzes';
import { catalogApi } from '@/lib/api/catalog';
import AILoadingState from '@/components/quiz/AILoadingState';
import UploadPDFModal from '@/components/modals/UploadPDFModal';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function CreateQuizPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('chat');
  const [loading, setLoading] = useState(false);
  
  // Catalogs
  const [grados, setGrados] = useState<any[]>([]);
  const [materias, setMaterias] = useState<any[]>([]);

  // Chat IA state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: '¡Hola! 👋 Soy tu asistente de IA. Puedo ayudarte a crear un quiz de varias formas:\n\n📝 Cuéntame sobre qué tema quieres crear el quiz\n📎 Sube un PDF y generaré preguntas automáticamente\n\n¿Cómo te gustaría empezar?',
      timestamp: new Date(),
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatConfig, setChatConfig] = useState({
    grado_id: '',
    materia_id: '',
    num_questions: 10,
    dificultad: 'medio' as 'facil' | 'medio' | 'dificil',
    tiempo_por_pregunta: 20,
  });

  // Manual state
  const [manualForm, setManualForm] = useState({
    titulo: '',
    descripcion: '',
    materia_id: '',
    grado_id: '',
    dificultad: 'medio' as 'facil' | 'medio' | 'dificil',
    tipo_quiz: 'kahoot' as 'kahoot' | 'mario_party' | 'duelo',
  });

  // PDF Modal
  const [showPDFModal, setShowPDFModal] = useState(false);

  useEffect(() => {
    loadCatalogs();
  }, []);

  const loadCatalogs = async () => {
    try {
      const [gradosRes, materiasRes] = await Promise.all([
        catalogApi.getGrados(),
        catalogApi.getMaterias(),
      ]);
      setGrados(gradosRes.data);
      setMaterias(materiasRes.data);
    } catch (error) {
      console.error('Error loading catalogs:', error);
      toast.error('Error al cargar catálogos');
    }
  };

  const handleChatSend = async () => {
    if (!chatInput.trim()) return;

    if (!chatConfig.grado_id || !chatConfig.materia_id) {
      toast.error('Por favor selecciona grado y materia primero');
      return;
    }

    // Agregar mensaje del usuario
    const userMessage: ChatMessage = {
      role: 'user',
      content: chatInput,
      timestamp: new Date(),
    };
    setMessages([...messages, userMessage]);
    setLoading(true);

    try {
      const response = await aiApi.generateQuiz({
        prompt: chatInput,
        num_questions: chatConfig.num_questions,
        grado_id: chatConfig.grado_id,
        materia_id: chatConfig.materia_id,
        dificultad: chatConfig.dificultad,
        tiempo_por_pregunta: chatConfig.tiempo_por_pregunta,
      });

      // Agregar respuesta del asistente
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: `✅ ¡Perfecto! He generado un quiz con ${chatConfig.num_questions} preguntas sobre "${chatInput}".\n\n¿Quieres revisarlo y editarlo ahora?`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Redirigir al editor después de un momento
      setTimeout(() => {
        navigate(`/teacher/quizzes/${response.data.data.quiz_id}/edit`);
      }, 1500);
    } catch (error: any) {
      console.error('Error generating quiz:', error);
      console.error('Error details:', error.response?.data);
      const errorMsg = error.response?.data?.message || error.message || 'Error al generar el quiz';
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `❌ Lo siento, hubo un error: ${errorMsg}. ¿Quieres intentar de nuevo?`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
      setChatInput('');
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setChatInput(prompt);
  };

  const handleManualCreate = async () => {
    if (!manualForm.titulo || !manualForm.grado_id || !manualForm.materia_id) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      setLoading(true);
      const response = await quizzesApi.createQuiz(manualForm);
      toast.success('Quiz creado exitosamente');
      navigate(`/teacher/quizzes/${response.data.data.id}/edit`);
    } catch (error: any) {
      console.error('Error creating quiz:', error);
      toast.error('Error al crear quiz');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Crear Nuevo Quiz</h1>
        <p className="text-gray-600 mt-1">Elige cómo quieres crear tu quiz</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Chat IA
          </TabsTrigger>
          <TabsTrigger value="pdf" className="flex items-center gap-2">
            <FileUp className="h-4 w-4" />
            Desde PDF
          </TabsTrigger>
          <TabsTrigger value="manual" className="flex items-center gap-2">
            <Edit3 className="h-4 w-4" />
            Manual
          </TabsTrigger>
        </TabsList>

        {/* Chat IA Tab */}
        <TabsContent value="chat" className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {/* Chat Area */}
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-indigo-600" />
                  Asistente IA
                </CardTitle>
                <CardDescription>
                  Cuéntame qué tipo de quiz quieres crear
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Messages */}
                <div className="h-[400px] overflow-y-auto mb-4 space-y-4 p-4 bg-gray-50 rounded-lg">
                  {messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          msg.role === 'user'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white border border-gray-200'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            msg.role === 'user' ? 'text-indigo-100' : 'text-gray-500'
                          }`}
                        >
                          {msg.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}

                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-gray-200 p-4 rounded-lg">
                        <AILoadingState />
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickPrompt('10 preguntas sobre la Revolución Mexicana')}
                  >
                    📚 Historia
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickPrompt('15 preguntas de matemáticas sobre fracciones')}
                  >
                    🔢 Matemáticas
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickPrompt('8 preguntas sobre el sistema solar')}
                  >
                    🌎 Ciencias
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPDFModal(true)}
                  >
                    📎 Subir PDF
                  </Button>
                </div>

                {/* Input */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Escribe tu mensaje..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleChatSend()}
                    disabled={loading}
                  />
                  <Button onClick={handleChatSend} disabled={loading || !chatInput.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Configuration Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Configuración</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="chat-grado">Grado *</Label>
                  <Select
                    value={chatConfig.grado_id}
                    onValueChange={(value) => setChatConfig({ ...chatConfig, grado_id: value })}
                  >
                    <SelectTrigger id="chat-grado">
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                    <SelectContent>
                      {grados?.map((grado) => (
                        <SelectItem key={grado.id} value={grado.id}>
                          {grado.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="chat-materia">Materia *</Label>
                  <Select
                    value={chatConfig.materia_id}
                    onValueChange={(value) => setChatConfig({ ...chatConfig, materia_id: value })}
                  >
                    <SelectTrigger id="chat-materia">
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                    <SelectContent>
                      {materias?.map((materia) => (
                        <SelectItem key={materia.id} value={materia.id}>
                          {materia.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="chat-num">Núm. preguntas</Label>
                  <Input
                    id="chat-num"
                    type="number"
                    min={5}
                    max={50}
                    value={chatConfig.num_questions}
                    onChange={(e) =>
                      setChatConfig({ ...chatConfig, num_questions: parseInt(e.target.value) })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="chat-dif">Dificultad</Label>
                  <Select
                    value={chatConfig.dificultad}
                    onValueChange={(value: any) =>
                      setChatConfig({ ...chatConfig, dificultad: value })
                    }
                  >
                    <SelectTrigger id="chat-dif">
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
        </TabsContent>

        {/* PDF Tab */}
        <TabsContent value="pdf">
          <Card>
            <CardContent className="py-12 text-center">
              <FileUp className="h-16 w-16 mx-auto text-indigo-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Genera Quiz desde un PDF
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Sube un documento PDF y la IA extraerá el contenido para generar preguntas automáticamente
              </p>
              <Button size="lg" onClick={() => setShowPDFModal(true)}>
                <Paperclip className="h-5 w-5 mr-2" />
                Seleccionar PDF
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manual Tab */}
        <TabsContent value="manual">
          <Card>
            <CardHeader>
              <CardTitle>Crear Quiz Manualmente</CardTitle>
              <CardDescription>
                Crea un quiz vacío y agrega preguntas una por una
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="titulo">Título del Quiz *</Label>
                  <Input
                    id="titulo"
                    placeholder="Ej: Quiz de Historia - Revolución Mexicana"
                    value={manualForm.titulo}
                    onChange={(e) => setManualForm({ ...manualForm, titulo: e.target.value })}
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Textarea
                    id="descripcion"
                    placeholder="Describe brevemente el contenido del quiz..."
                    value={manualForm.descripcion}
                    onChange={(e) => setManualForm({ ...manualForm, descripcion: e.target.value })}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="manual-grado">Grado *</Label>
                  <Select
                    value={manualForm.grado_id}
                    onValueChange={(value) => setManualForm({ ...manualForm, grado_id: value })}
                  >
                    <SelectTrigger id="manual-grado">
                      <SelectValue placeholder="Selecciona grado" />
                    </SelectTrigger>
                    <SelectContent>
                      {grados?.map((grado) => (
                        <SelectItem key={grado.id} value={grado.id}>
                          {grado.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="manual-materia">Materia *</Label>
                  <Select
                    value={manualForm.materia_id}
                    onValueChange={(value) => setManualForm({ ...manualForm, materia_id: value })}
                  >
                    <SelectTrigger id="manual-materia">
                      <SelectValue placeholder="Selecciona materia" />
                    </SelectTrigger>
                    <SelectContent>
                      {materias?.map((materia) => (
                        <SelectItem key={materia.id} value={materia.id}>
                          {materia.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="manual-dif">Dificultad</Label>
                  <Select
                    value={manualForm.dificultad}
                    onValueChange={(value: any) => setManualForm({ ...manualForm, dificultad: value })}
                  >
                    <SelectTrigger id="manual-dif">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="facil">😊 Fácil</SelectItem>
                      <SelectItem value="medio">🤔 Medio</SelectItem>
                      <SelectItem value="dificil">🔥 Difícil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="manual-tipo">Tipo de Quiz</Label>
                  <Select
                    value={manualForm.tipo_quiz}
                    onValueChange={(value: any) => setManualForm({ ...manualForm, tipo_quiz: value })}
                  >
                    <SelectTrigger id="manual-tipo">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kahoot">🎯 Kahoot</SelectItem>
                      <SelectItem value="mario_party">🎮 Mario Party</SelectItem>
                      <SelectItem value="duelo">⚔️ Duelo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => navigate('/teacher/quizzes')}>
                  Cancelar
                </Button>
                <Button onClick={handleManualCreate} disabled={loading}>
                  {loading ? 'Creando...' : 'Crear y Agregar Preguntas'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* PDF Upload Modal */}
      <UploadPDFModal
        open={showPDFModal}
        onClose={() => setShowPDFModal(false)}
        grados={grados}
        materias={materias}
      />
    </div>
  );
}
