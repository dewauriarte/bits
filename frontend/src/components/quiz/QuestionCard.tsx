import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, Star } from 'lucide-react';
import { Question } from '@/lib/api/quizzes';

interface QuestionCardProps {
  question: Question;
  showCorrectAnswer?: boolean;
  compact?: boolean;
}

export default function QuestionCard({ question, showCorrectAnswer = false, compact = false }: QuestionCardProps) {
  const correctAnswers = Array.isArray(question.respuesta_correcta)
    ? question.respuesta_correcta
    : [question.respuesta_correcta];

  return (
    <Card className={compact ? 'hover:shadow-md transition-shadow' : ''}>
      <CardHeader className={compact ? 'pb-3' : ''}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">
                {question.tipo === 'multiple_choice' && '📝 Opción múltiple'}
                {question.tipo === 'true_false' && '✓/✗ Verdadero/Falso'}
                {question.tipo === 'texto_libre' && '📄 Texto libre'}
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
            <h4 className={`font-semibold ${compact ? 'text-sm' : 'text-base'}`}>
              {question.orden}. {question.texto}
            </h4>
          </div>
        </div>
      </CardHeader>

      {!compact && (
        <CardContent>
          {question.imagen_url && (
            <div className="mb-4">
              <img
                src={question.imagen_url}
                alt="Pregunta"
                className="rounded-lg max-h-48 object-cover w-full"
              />
            </div>
          )}

          <div className="space-y-2">
            {question.opciones.map((opcion, index) => {
              const isCorrect = correctAnswers.includes(index.toString());
              
              return (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                    showCorrectAnswer && isCorrect
                      ? 'bg-green-50 border-green-500'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                      showCorrectAnswer && isCorrect
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-300 text-gray-700'
                    }`}
                  >
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span className="flex-1">{opcion.texto}</span>
                  {showCorrectAnswer && isCorrect && (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  )}
                </div>
              );
            })}
          </div>

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
