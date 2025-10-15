import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import MultipleChoice from './question-types/MultipleChoice';
import MultipleSelect from './question-types/MultipleSelect';
import TrueFalse from './question-types/TrueFalse';
import ShortAnswer from './question-types/ShortAnswer';
import FillBlanks from './question-types/FillBlanks';
import OrderSequence from './question-types/OrderSequence';
import MatchPairs from './question-types/MatchPairs';

interface Question {
  questionNumber: number;
  totalQuestions: number;
  questionId: string;
  texto: string;
  tipo: string;
  media_url?: string;
  opciones: Array<{
    id: string;
    texto: string;
  }>;
  timeLimit: number;
}

interface QuestionScreenProps {
  question: Question;
  timeRemaining: number;
  selectedAnswer: string | string[] | Record<string, string> | null;
  onAnswerSelect: (answer: any) => void;
  myScore: number;
  myCombo: number;
}

export default function QuestionScreen({
  question,
  timeRemaining,
  selectedAnswer,
  onAnswerSelect,
  myScore,
  myCombo,
}: QuestionScreenProps) {
  const timeProgress = (timeRemaining / question.timeLimit) * 100;
  const isAnswered = selectedAnswer !== null;

  // Renderizar componente según tipo de pregunta
  const renderQuestionType = () => {
    switch (question.tipo) {
      case 'multiple_choice':
        return (
          <MultipleChoice
            opciones={question.opciones}
            selectedAnswer={selectedAnswer as string | null}
            isAnswered={isAnswered}
            onAnswerSelect={onAnswerSelect}
          />
        );

      case 'multiple_select':
        return (
          <MultipleSelect
            opciones={question.opciones}
            selectedAnswer={selectedAnswer as string[] | null}
            isAnswered={isAnswered}
            onAnswerSelect={onAnswerSelect}
          />
        );

      case 'true_false':
        return (
          <TrueFalse
            selectedAnswer={selectedAnswer as string | null}
            isAnswered={isAnswered}
            onAnswerSelect={onAnswerSelect}
          />
        );

      case 'short_answer':
        return (
          <ShortAnswer
            selectedAnswer={selectedAnswer as string | null}
            isAnswered={isAnswered}
            onAnswerSelect={onAnswerSelect}
          />
        );

      case 'fill_blanks':
        const blanksCount = (question.texto.match(/___/g) || []).length;
        return (
          <FillBlanks
            texto={question.texto}
            blanksCount={blanksCount}
            selectedAnswer={selectedAnswer as string[] | null}
            isAnswered={isAnswered}
            onAnswerSelect={onAnswerSelect}
          />
        );

      case 'order_sequence':
        return (
          <OrderSequence
            opciones={question.opciones}
            selectedAnswer={selectedAnswer as string[] | null}
            isAnswered={isAnswered}
            onAnswerSelect={onAnswerSelect}
          />
        );

      case 'match_pairs':
        // Verificar si opciones tiene estructura left/right
        console.log('🔗 Match pairs opciones:', question.opciones);
        let leftColumn: any[] = [];
        let rightColumn: any[] = [];
        
        if (question.opciones && typeof question.opciones === 'object') {
          if ('left' in question.opciones && 'right' in question.opciones) {
            // Formato estructurado { left: [...], right: [...] }
            leftColumn = Array.isArray(question.opciones.left) ? question.opciones.left : [];
            rightColumn = Array.isArray(question.opciones.right) ? question.opciones.right : [];
          } else if (Array.isArray(question.opciones)) {
            // Formato array simple - dividir por mitad
            const half = Math.ceil(question.opciones.length / 2);
            leftColumn = question.opciones.slice(0, half);
            rightColumn = question.opciones.slice(half);
          }
        }
        
        console.log('🔗 Left column:', leftColumn);
        console.log('🔗 Right column:', rightColumn);
        
        return (
          <MatchPairs
            leftColumn={leftColumn}
            rightColumn={rightColumn}
            selectedAnswer={selectedAnswer as Record<string, string> | null}
            isAnswered={isAnswered}
            onAnswerSelect={onAnswerSelect}
          />
        );

      default:
        return (
          <MultipleChoice
            opciones={question.opciones}
            selectedAnswer={selectedAnswer as string | null}
            isAnswered={isAnswered}
            onAnswerSelect={onAnswerSelect}
          />
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-6xl mx-auto"
    >
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-lg rounded-t-3xl p-6 border-b border-white/20">
        <div className="flex items-center justify-between mb-4">
          <Badge variant="secondary" className="text-lg px-4 py-2 bg-white/90 text-purple-700">
            Pregunta {question.questionNumber}/{question.totalQuestions}
          </Badge>
          
          <div className="flex items-center gap-4">
            {myCombo >= 3 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-full font-bold"
              >
                <Flame className="w-5 h-5" />
                {myCombo}x Combo
              </motion.div>
            )}
            
            <Badge variant="secondary" className="text-lg px-4 py-2 bg-white/90 text-purple-700">
              {myScore.toLocaleString()} pts
            </Badge>
          </div>
        </div>

        {/* Timer */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-white font-semibold">
            <span>Tiempo restante</span>
            <span className="text-2xl tabular-nums">{timeRemaining}s</span>
          </div>
          <Progress 
            value={timeProgress} 
            className={cn(
              "h-3 transition-all",
              timeRemaining <= 5 && "animate-pulse"
            )}
          />
        </div>
      </div>

      {/* Question Content */}
      <div className="bg-white rounded-b-3xl p-8 shadow-2xl">
        {/* Question Text */}
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          className="mb-8"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 text-center leading-tight">
            {question.texto}
          </h2>
        </motion.div>

        {/* Media */}
        {question.media_url && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-8 flex justify-center"
          >
            <img
              src={question.media_url}
              alt="Question media"
              className="max-w-md max-h-64 object-contain rounded-lg shadow-md"
            />
          </motion.div>
        )}

        {/* Render question type */}
        {renderQuestionType()}

        {/* Answered Badge */}
        {isAnswered && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 text-center"
          >
            <Badge className="text-lg px-6 py-3 bg-green-500 text-white">
              ✓ Respuesta enviada
            </Badge>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
