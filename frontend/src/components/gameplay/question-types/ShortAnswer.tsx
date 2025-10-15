import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface ShortAnswerProps {
  selectedAnswer: string | null;
  isAnswered: boolean;
  onAnswerSelect: (answer: string) => void;
}

export default function ShortAnswer({
  selectedAnswer,
  isAnswered,
  onAnswerSelect,
}: ShortAnswerProps) {
  const [answer, setAnswer] = useState(selectedAnswer || '');

  const handleSubmit = () => {
    if (answer.trim() && !isAnswered) {
      onAnswerSelect(answer.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && answer.trim() && !isAnswered) {
      handleSubmit();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto space-y-6"
    >
      <p className="text-center text-gray-600 font-semibold mb-6">
        Escribe tu respuesta
      </p>

      <Input
        type="text"
        value={answer}
        onChange={(e) => !isAnswered && setAnswer(e.target.value)}
        onKeyPress={handleKeyPress}
        disabled={isAnswered}
        placeholder="Tu respuesta..."
        className="text-2xl p-8 text-center font-semibold rounded-2xl border-4 border-purple-300 focus:border-purple-500"
        autoFocus
      />

      {!isAnswered && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Button
            onClick={handleSubmit}
            disabled={!answer.trim()}
            size="lg"
            className="bg-purple-600 hover:bg-purple-700 text-white px-12 py-6 text-xl rounded-full"
          >
            Enviar Respuesta
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
