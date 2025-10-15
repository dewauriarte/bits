import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface FillBlanksProps {
  texto: string; // Texto con ___ para los espacios
  blanksCount: number;
  selectedAnswer: string[] | null;
  isAnswered: boolean;
  onAnswerSelect: (answers: string[]) => void;
}

export default function FillBlanks({
  texto,
  blanksCount,
  selectedAnswer,
  isAnswered,
  onAnswerSelect,
}: FillBlanksProps) {
  const [answers, setAnswers] = useState<string[]>(
    selectedAnswer || Array(blanksCount).fill('')
  );

  const handleAnswerChange = (index: number, value: string) => {
    if (isAnswered) return;
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const handleSubmit = () => {
    if (answers.every(a => a.trim()) && !isAnswered) {
      onAnswerSelect(answers.map(a => a.trim()));
    }
  };

  // Dividir el texto en partes usando ___
  const parts = texto.split('___');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      <p className="text-center text-gray-600 font-semibold mb-6">
        Completa los espacios en blanco
      </p>

      <div className="text-2xl leading-relaxed text-gray-800 space-y-4">
        {parts.map((part, index) => (
          <span key={index} className="inline-flex items-center flex-wrap gap-2">
            <span>{part}</span>
            {index < blanksCount && (
              <Input
                type="text"
                value={answers[index]}
                onChange={(e) => handleAnswerChange(index, e.target.value)}
                disabled={isAnswered}
                placeholder={`Blank ${index + 1}`}
                className="inline-block w-48 text-xl p-4 font-semibold border-2 border-purple-300 rounded-lg focus:border-purple-500"
              />
            )}
          </span>
        ))}
      </div>

      {!isAnswered && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center mt-8"
        >
          <Button
            onClick={handleSubmit}
            disabled={!answers.every(a => a.trim())}
            size="lg"
            className="bg-purple-600 hover:bg-purple-700 text-white px-12 py-6 text-xl rounded-full"
          >
            Enviar Respuestas
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
