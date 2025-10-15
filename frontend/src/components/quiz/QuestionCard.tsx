import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, Star } from 'lucide-react';
import { Question } from '@/lib/api/quizzes';
import MatchPairsInteractive from './MatchPairsInteractive';
import OrderSequenceInteractive from './OrderSequenceInteractive';

interface QuestionCardProps {
  question: Question;
  showCorrectAnswer?: boolean;
  compact?: boolean;
}

const questionTypeLabels: Record<string, string> = {
  multiple_choice: '⚫ Opción múltiple',
  multiple_select: '⚪ Selección múltiple',
  true_false: '⚪ Verdadero/Falso',
  short_answer: '⚪ Respuesta corta',
  fill_blanks: '⚪ Completar espacios',
  order_sequence: '⚪ Ordenar secuencia',
  match_pairs: '⚪ Relacionar columnas',
};

export default function QuestionCard({ question, showCorrectAnswer = false, compact = false }: QuestionCardProps) {
  const correctAnswers = Array.isArray(question.respuesta_correcta)
    ? question.respuesta_correcta
    : [question.respuesta_correcta];

  // Auto-ajustar tamaño del texto según longitud
  const getTextSize = (texto: string, hasImage: boolean) => {
    if (compact) return 'text-sm';
    if (!hasImage) return 'text-lg';
    
    const length = texto.length;
    if (length <= 40) return 'text-4xl'; // Pregunta corta: extra grande
    if (length <= 70) return 'text-3xl'; // Pregunta media: grande
    if (length <= 100) return 'text-2xl'; // Pregunta larga: mediano
    return 'text-xl'; // Pregunta muy larga: más pequeño
  };

  return (
    <Card className={compact ? 'hover:shadow-md transition-shadow' : ''}>
      <CardHeader className={compact ? 'pb-3' : ''}>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="text-xs">
            {questionTypeLabels[question.tipo] || question.tipo}
          </Badge>
          {!compact && (
            <>
              <Badge variant="secondary" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {question.tiempo_limite}s
              </Badge>
              <Badge variant="secondary" className="text-xs">
                <Star className="h-3 w-3 mr-1" />
                {question.puntos}
              </Badge>
            </>
          )}
        </div>
        {/* Layout: Question + Image Side by Side */}
        <div className={question.imagen_url && !compact ? 'grid grid-cols-12 gap-8 items-center' : ''}>
          <div className={question.imagen_url && !compact ? 'col-span-6' : ''}>
            <h4 className={`font-bold leading-tight ${getTextSize(question.texto, !!question.imagen_url)}`}>
              {question.orden}. {question.texto}
            </h4>
          </div>
          {question.imagen_url && !compact && (
            <div className="col-span-6">
              <div className="border-4 border-amber-400 rounded-2xl p-4 bg-white flex items-center justify-center" style={{minHeight: '220px', maxHeight: '280px'}}>
                <img
                  src={question.imagen_url}
                  alt="Pregunta"
                  className="max-h-full max-w-full object-contain"
                  style={{maxHeight: '240px'}}
                />
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      {!compact && (
        <CardContent>

          {/* Short Answer */}
          {question.tipo === 'short_answer' && (
            <div className="space-y-4">
              {showCorrectAnswer ? (
                <div>
                  <p className="text-sm text-gray-600 font-semibold mb-3">✅ Respuesta correcta:</p>
                  <div className="rounded-2xl shadow-lg p-6 text-center" style={{ backgroundColor: '#10B981' }}>
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-md">
                        <span className="text-2xl font-bold" style={{ color: '#10B981' }}>✓</span>
                      </div>
                      <p className="font-bold text-white text-2xl">{question.respuesta_correcta}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 font-semibold">Escribe tu respuesta:</p>
                  <input
                    type="text"
                    placeholder="Escribe aquí tu respuesta..."
                    className="w-full px-4 py-3 border-2 border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                    disabled
                  />
                  <p className="text-xs text-gray-500 text-center">
                    ✏️ Campo de texto para que el estudiante escriba
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Fill Blanks */}
          {question.tipo === 'fill_blanks' && (
            <div className="space-y-4">
              {/* Opciones disponibles (correctas + distractoras) */}
              <div>
                <p className="text-sm text-gray-600 font-semibold mb-3">
                  {showCorrectAnswer ? '✅ Respuestas correctas marcadas:' : 'Palabras disponibles:'}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {question.opciones && question.opciones.map((opcion, index) => {
                    const isCorrect = Array.isArray(question.respuesta_correcta) && 
                                     question.respuesta_correcta.includes(opcion.texto);
                    
                    // Colores tipo Kahoot para cada palabra
                    const colors = [
                      '#E21B3C',  // Rojo
                      '#1368CE',  // Azul
                      '#D89E00',  // Amarillo
                      '#26890C',  // Verde
                      '#8B5CF6',  // Morado
                      '#EC4899',  // Rosa
                    ];
                    const color = colors[index % colors.length];
                    
                    return (
                      <div
                        key={index}
                        className={`rounded-xl shadow-lg p-4 min-h-[80px] flex items-center justify-center transition-all transform hover:scale-105 ${
                          showCorrectAnswer && isCorrect ? 'ring-4 ring-green-400' : ''
                        }`}
                        style={{
                          backgroundColor: color,
                        }}
                      >
                        <div className="flex items-center gap-3 text-center">
                          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-white flex items-center justify-center font-bold text-sm shadow-md" style={{ color }}>
                            {index + 1}
                          </span>
                          <span className="font-bold text-white text-lg">
                            {opcion.texto}
                          </span>
                          {showCorrectAnswer && isCorrect && (
                            <CheckCircle2 className="h-6 w-6 text-white ml-2" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Order Sequence */}
          {question.tipo === 'order_sequence' && (
            <OrderSequenceInteractive 
              question={question} 
              showCorrectAnswer={showCorrectAnswer}
            />
          )}

          {/* Match Pairs */}
          {question.tipo === 'match_pairs' && (
            <MatchPairsInteractive 
              question={question} 
              showCorrectAnswer={showCorrectAnswer}
            />
          )}

          {/* Multiple Choice, Multiple Select, True/False */}
          {['multiple_choice', 'multiple_select', 'true_false'].includes(question.tipo) && (
            <div className="grid grid-cols-2 gap-4">
              {question.opciones?.map((opcion, index) => {
                // Validación defensiva
                if (!opcion || !opcion.texto) {
                  return null;
                }
                
                const isCorrect = correctAnswers.includes(index.toString());
                
                // Colores tipo Kahoot
                const kahootColors = [
                  { bg: '#E21B3C', text: '#FFFFFF' },  // Rojo
                  { bg: '#1368CE', text: '#FFFFFF' },  // Azul
                  { bg: '#D89E00', text: '#FFFFFF' },  // Amarillo
                  { bg: '#26890C', text: '#FFFFFF' },  // Verde
                ];
                const color = kahootColors[index % kahootColors.length];
                
                // Auto-ajuste del tamaño del texto
                const getTextSize = () => {
                  const length = opcion.texto?.length || 0;
                  if (length <= 15) return 'text-xl';    // Corto: grande
                  if (length <= 30) return 'text-lg';    // Medio: normal
                  if (length <= 50) return 'text-base';  // Largo: pequeño
                  return 'text-sm';                       // Muy largo: más pequeño
                };
                
                return (
                  <div
                    key={index}
                    className="rounded-2xl shadow-lg transition-all transform hover:scale-105 cursor-pointer min-h-[120px] flex items-center justify-center p-4"
                    style={{
                      backgroundColor: color.bg,
                    }}
                  >
                    <div className="flex flex-col items-center gap-3 text-center w-full">
                      <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center shadow-md">
                        <span className="font-black text-3xl" style={{ color: color.bg }}>
                          {String.fromCharCode(65 + index)}
                        </span>
                      </div>
                      <span className={`font-bold leading-tight text-white ${getTextSize()}`}>
                        {opcion.texto}
                      </span>
                      {showCorrectAnswer && isCorrect && (
                        <CheckCircle2 className="h-6 w-6 text-white" />
                      )}
                    </div>
                  </div>
                );
              })}
              {question.tipo === 'multiple_select' && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-600 mt-2 text-center font-semibold">
                    💡 Múltiples respuestas correctas
                  </p>
                </div>
              )}
            </div>
          )}

          {showCorrectAnswer && question.explicacion && (
            <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
              <p className="text-sm font-semibold text-blue-900 mb-1">Explicación:</p>
              <p className="text-sm text-blue-800">{question.explicacion}</p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
