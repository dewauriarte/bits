import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { GripVertical, ArrowUp, ArrowDown } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface OrderSequenceProps {
  opciones: Array<{ id: string; texto: string }>;
  selectedAnswer: string[] | null;
  isAnswered: boolean;
  onAnswerSelect: (order: string[]) => void;
}

export default function OrderSequence({
  opciones,
  selectedAnswer,
  isAnswered,
  onAnswerSelect,
}: OrderSequenceProps) {
  const [orderedItems, setOrderedItems] = useState<Array<{ id: string; texto: string }>>(
    selectedAnswer 
      ? selectedAnswer.map(id => opciones.find(o => o.id === id)!).filter(Boolean)
      : [...opciones].sort(() => Math.random() - 0.5) // Shuffle inicial
  );

  const moveUp = (index: number) => {
    if (isAnswered || index === 0) return;
    const newItems = [...orderedItems];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    setOrderedItems(newItems);
  };

  const moveDown = (index: number) => {
    if (isAnswered || index === orderedItems.length - 1) return;
    const newItems = [...orderedItems];
    [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    setOrderedItems(newItems);
  };

  const handleSubmit = () => {
    if (!isAnswered) {
      onAnswerSelect(orderedItems.map(item => item.id));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto space-y-6"
    >
      <p className="text-center text-gray-600 font-semibold mb-6">
        Ordena los elementos en el orden correcto
      </p>

      <div className="space-y-3">
        {orderedItems.map((item, index) => (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
              "flex items-center gap-4 p-4 bg-white rounded-xl border-2 shadow-sm",
              isAnswered ? "border-gray-300" : "border-purple-300"
            )}
          >
            <div className="flex flex-col gap-1">
              <button
                onClick={() => moveUp(index)}
                disabled={isAnswered || index === 0}
                className={cn(
                  "p-1 rounded hover:bg-gray-100 transition-colors",
                  (isAnswered || index === 0) && "opacity-30 cursor-not-allowed"
                )}
              >
                <ArrowUp className="w-5 h-5" />
              </button>
              <button
                onClick={() => moveDown(index)}
                disabled={isAnswered || index === orderedItems.length - 1}
                className={cn(
                  "p-1 rounded hover:bg-gray-100 transition-colors",
                  (isAnswered || index === orderedItems.length - 1) && "opacity-30 cursor-not-allowed"
                )}
              >
                <ArrowDown className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-4 flex-1">
              <div className="w-10 h-10 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold text-lg">
                {index + 1}
              </div>
              <GripVertical className="w-5 h-5 text-gray-400" />
              <span className="text-lg font-semibold text-gray-800 flex-1">
                {item.texto}
              </span>
            </div>
          </motion.div>
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
            size="lg"
            className="bg-purple-600 hover:bg-purple-700 text-white px-12 py-6 text-xl rounded-full"
          >
            Confirmar Orden
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
