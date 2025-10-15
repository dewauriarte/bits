import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MultipleChoiceProps {
  opciones: Array<{ id: string; texto: string }>;
  selectedAnswer: string | null;
  isAnswered: boolean;
  onAnswerSelect: (answerId: string) => void;
}

const OPTION_COLORS = [
  { bg: 'bg-red-500', hover: 'hover:bg-red-600', border: 'border-red-400' },
  { bg: 'bg-blue-500', hover: 'hover:bg-blue-600', border: 'border-blue-400' },
  { bg: 'bg-yellow-500', hover: 'hover:bg-yellow-600', border: 'border-yellow-400' },
  { bg: 'bg-green-500', hover: 'hover:bg-green-600', border: 'border-green-400' },
];

export default function MultipleChoice({
  opciones,
  selectedAnswer,
  isAnswered,
  onAnswerSelect,
}: MultipleChoiceProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {opciones.map((opcion, index) => {
        const colors = OPTION_COLORS[index % OPTION_COLORS.length];
        const isSelected = selectedAnswer === opcion.id;

        return (
          <motion.button
            key={opcion.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: isAnswered ? 1 : 1.05 }}
            whileTap={{ scale: isAnswered ? 1 : 0.95 }}
            onClick={() => !isAnswered && onAnswerSelect(opcion.id)}
            disabled={isAnswered}
            className={cn(
              "relative p-6 rounded-2xl font-semibold text-white text-xl transition-all duration-200",
              "border-4 shadow-lg",
              colors.bg,
              !isAnswered && colors.hover,
              colors.border,
              isSelected && "ring-8 ring-white/50",
              isAnswered && "opacity-60 cursor-not-allowed"
            )}
          >
            <div className="flex items-center justify-between gap-4">
              <span className="flex-1 text-left">{opcion.texto}</span>
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  <CheckCircle2 className="w-8 h-8" />
                </motion.div>
              )}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
