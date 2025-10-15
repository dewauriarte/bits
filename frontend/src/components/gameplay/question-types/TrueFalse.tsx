import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrueFalseProps {
  selectedAnswer: string | null;
  isAnswered: boolean;
  onAnswerSelect: (answer: string) => void;
}

export default function TrueFalse({
  selectedAnswer,
  isAnswered,
  onAnswerSelect,
}: TrueFalseProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
      {/* True Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        whileHover={{ scale: isAnswered ? 1 : 1.05 }}
        whileTap={{ scale: isAnswered ? 1 : 0.95 }}
        onClick={() => !isAnswered && onAnswerSelect('0')}
        disabled={isAnswered}
        className={cn(
          "relative p-12 rounded-3xl font-bold text-white text-3xl transition-all duration-200",
          "border-4 shadow-xl",
          "bg-green-500 hover:bg-green-600 border-green-400",
          selectedAnswer === '0' && "ring-8 ring-white/50",
          isAnswered && "opacity-60 cursor-not-allowed"
        )}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
            <Check className="w-12 h-12" strokeWidth={4} />
          </div>
          <span>VERDADERO</span>
        </div>
      </motion.button>

      {/* False Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        whileHover={{ scale: isAnswered ? 1 : 1.05 }}
        whileTap={{ scale: isAnswered ? 1 : 0.95 }}
        onClick={() => !isAnswered && onAnswerSelect('1')}
        disabled={isAnswered}
        className={cn(
          "relative p-12 rounded-3xl font-bold text-white text-3xl transition-all duration-200",
          "border-4 shadow-xl",
          "bg-red-500 hover:bg-red-600 border-red-400",
          selectedAnswer === '1' && "ring-8 ring-white/50",
          isAnswered && "opacity-60 cursor-not-allowed"
        )}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
            <X className="w-12 h-12" strokeWidth={4} />
          </div>
          <span>FALSO</span>
        </div>
      </motion.button>
    </div>
  );
}
