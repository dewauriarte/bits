import { motion } from 'framer-motion';
import Confetti from 'react-confetti';
import { CheckCircle2, XCircle, Zap, Flame, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useWindowSize } from '@/hooks/useWindowSize';

interface AnswerFeedbackScreenProps {
  isCorrect: boolean;
  points: number;
  breakdown: {
    basePoints: number;
    speedBonus: number;
    comboMultiplier: number;
  };
  comboStreak: number;
  correctAnswer: any;
  question: {
    texto: string;
    tipo: string;
    opciones: Array<{ id: string; texto: string }>;
    explicacion?: string;
  };
}

export default function AnswerFeedbackScreen({
  isCorrect,
  points,
  breakdown,
  comboStreak,
  correctAnswer,
  question,
}: AnswerFeedbackScreenProps) {
  const { width, height } = useWindowSize();

  // Obtener texto de respuesta correcta según tipo de pregunta
  const getCorrectAnswerText = () => {
    if (!correctAnswer) return null;

    switch (question.tipo) {
      case 'multiple_choice':
      case 'true_false':
        return question.opciones.find((opt) => opt.id === correctAnswer)?.texto;
      
      case 'multiple_select':
        if (Array.isArray(correctAnswer)) {
          return correctAnswer
            .map((id) => question.opciones.find((opt) => opt.id === id)?.texto)
            .filter(Boolean)
            .join(', ');
        }
        return null;
      
      case 'fill_blanks':
        if (Array.isArray(correctAnswer)) {
          return correctAnswer.join(', ');
        }
        return String(correctAnswer);
      
      case 'short_answer':
        return String(correctAnswer);
      
      case 'order_sequence':
        if (Array.isArray(correctAnswer)) {
          return correctAnswer
            .map((id) => question.opciones.find((opt) => opt.id === id)?.texto)
            .filter(Boolean)
            .join(' → ');
        }
        return null;
      
      case 'match_pairs':
        // Para match pairs, mostrar las parejas correctas
        if (typeof correctAnswer === 'object') {
          return Object.entries(correctAnswer)
            .map(([left, right]) => `${left} - ${right}`)
            .join(', ');
        }
        return null;
      
      default:
        return null;
    }
  };

  const correctAnswerText = getCorrectAnswerText();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="w-full max-w-4xl mx-auto"
    >
      {/* Confetti si es correcta */}
      {isCorrect && <Confetti width={width} height={height} recycle={false} numberOfPieces={500} />}

      <div className="bg-white rounded-3xl p-12 shadow-2xl text-center">
        {/* Icon principal */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 10, stiffness: 100 }}
          className="mb-6 flex justify-center"
        >
          {isCorrect ? (
            <div className="w-40 h-40 bg-green-500 rounded-full flex items-center justify-center shadow-xl">
              <CheckCircle2 className="w-24 h-24 text-white" strokeWidth={3} />
            </div>
          ) : (
            <motion.div
              animate={{ x: [-10, 10, -10, 10, 0] }}
              transition={{ duration: 0.5 }}
              className="w-40 h-40 bg-red-500 rounded-full flex items-center justify-center shadow-xl"
            >
              <XCircle className="w-24 h-24 text-white" strokeWidth={3} />
            </motion.div>
          )}
        </motion.div>

        {/* Mensaje */}
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`text-6xl font-black mb-4 ${
            isCorrect ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {isCorrect ? '¡CORRECTO!' : '¡INCORRECTO!'}
        </motion.h1>

        {/* Puntos ganados */}
        {isCorrect && points > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-8 space-y-4"
          >
            {/* Total */}
            <div className="text-7xl font-black text-purple-600">
              +{points.toLocaleString()}
            </div>

            {/* Breakdown */}
            <div className="flex items-center justify-center gap-6 text-lg font-semibold text-gray-600">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                <span>{breakdown.basePoints}</span>
                <span className="text-gray-400">(base)</span>
              </div>
              
              {breakdown.speedBonus > 0 && (
                <>
                  <span className="text-gray-300">+</span>
                  <div className="flex items-center gap-2 text-yellow-600">
                    <Zap className="w-5 h-5" />
                    <span>{breakdown.speedBonus}</span>
                    <span className="text-gray-400">(velocidad)</span>
                  </div>
                </>
              )}
              
              {breakdown.comboMultiplier > 1 && (
                <>
                  <span className="text-gray-300">×</span>
                  <div className="flex items-center gap-2 text-orange-600">
                    <Flame className="w-5 h-5" />
                    <span>{breakdown.comboMultiplier.toFixed(1)}x</span>
                    <span className="text-gray-400">(combo)</span>
                  </div>
                </>
              )}
            </div>

            {/* Combo Badge */}
            {comboStreak >= 3 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: 'spring' }}
              >
                <Badge className="text-2xl px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white">
                  <Flame className="w-6 h-6 mr-2" />
                  {comboStreak}x Racha
                </Badge>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Respuesta correcta si falló */}
        {!isCorrect && correctAnswerText && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 p-6 bg-green-50 border-4 border-green-500 rounded-2xl"
          >
            <p className="text-gray-600 font-semibold mb-2">Respuesta correcta:</p>
            <p className="text-2xl font-bold text-green-700">{correctAnswerText}</p>
          </motion.div>
        )}

        {/* Explicación de la pregunta (siempre mostrar si existe) */}
        {question.explicacion && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 p-6 bg-blue-50 border-2 border-blue-300 rounded-2xl"
          >
            <p className="text-blue-800 font-semibold mb-2 flex items-center gap-2">
              <span className="text-2xl">💡</span>
              Explicación:
            </p>
            <p className="text-lg text-blue-900">{question.explicacion}</p>
          </motion.div>
        )}

        {/* Combo perdido */}
        {!isCorrect && comboStreak === 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-6"
          >
            <Badge variant="destructive" className="text-lg px-6 py-3">
              Racha perdida
            </Badge>
          </motion.div>
        )}

        {/* Siguiente pregunta */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 text-gray-500 text-lg"
        >
          Siguiente pregunta en breve...
        </motion.p>
      </div>
    </motion.div>
  );
}
