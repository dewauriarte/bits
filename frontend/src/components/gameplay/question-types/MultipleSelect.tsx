import { motion } from 'framer-motion';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface MultipleSelectProps {
  opciones: Array<{ id: string; texto: string }>;
  selectedAnswer: string[] | null;
  isAnswered: boolean;
  onAnswerSelect: (answers: string[]) => void;
}

const OPTION_COLORS = [
  { bg: 'bg-red-500', border: 'border-red-600', text: 'text-white', hover: 'hover:bg-red-600' },
  { bg: 'bg-blue-500', border: 'border-blue-600', text: 'text-white', hover: 'hover:bg-blue-600' },
  { bg: 'bg-yellow-500', border: 'border-yellow-600', text: 'text-white', hover: 'hover:bg-yellow-600' },
  { bg: 'bg-green-500', border: 'border-green-600', text: 'text-white', hover: 'hover:bg-green-600' },
];

export default function MultipleSelect({
  opciones,
  selectedAnswer,
  isAnswered,
  onAnswerSelect,
}: MultipleSelectProps) {
  const [selected, setSelected] = useState<string[]>(selectedAnswer || []);

  const toggleOption = (optionId: string) => {
    if (isAnswered) return;
    
    setSelected(prev => {
      if (prev.includes(optionId)) {
        return prev.filter(id => id !== optionId);
      } else {
        return [...prev, optionId];
      }
    });
  };

  const handleSubmit = () => {
    if (selected.length > 0 && !isAnswered) {
      onAnswerSelect(selected);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-center text-gray-600 font-semibold mb-4">
        Selecciona todas las respuestas correctas
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {opciones.map((opcion, index) => {
          const colors = OPTION_COLORS[index % OPTION_COLORS.length];
          const isSelected = selected.includes(opcion.id);

          return (
            <motion.div
              key={opcion.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => toggleOption(opcion.id)}
              className={cn(
                "relative p-6 rounded-2xl border-4 transition-all cursor-pointer shadow-lg",
                colors.bg,
                colors.border,
                colors.text,
                colors.hover,
                "font-semibold text-lg",
                isSelected && "ring-8 ring-white scale-105",
                isAnswered && "opacity-60 cursor-not-allowed"
              )}
            >
              <div className="flex items-center gap-4">
                <Checkbox
                  checked={isSelected}
                  disabled={isAnswered}
                  className="w-6 h-6"
                />
                <span className="flex-1">{opcion.texto}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {!isAnswered && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center mt-6"
        >
          <Button
            onClick={handleSubmit}
            disabled={selected.length === 0}
            size="lg"
            className="bg-purple-600 hover:bg-purple-700 text-white px-12 py-6 text-xl rounded-full"
          >
            Enviar Respuestas ({selected.length})
          </Button>
        </motion.div>
      )}
    </div>
  );
}
