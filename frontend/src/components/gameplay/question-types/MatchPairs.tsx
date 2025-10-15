import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface MatchPairsProps {
  leftColumn: Array<{ id: string; texto: string }>;
  rightColumn: Array<{ id: string; texto: string }>;
  selectedAnswer: Record<string, string> | null;
  isAnswered: boolean;
  onAnswerSelect: (pairs: Record<string, string>) => void;
}

export default function MatchPairs({
  leftColumn,
  rightColumn,
  selectedAnswer,
  isAnswered,
  onAnswerSelect,
}: MatchPairsProps) {
  const [matches, setMatches] = useState<Record<string, string>>(selectedAnswer || {});
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);

  const handleLeftClick = (leftId: string) => {
    if (isAnswered) return;
    
    // Si ya está emparejado, deseleccionar
    if (matches[leftId]) {
      const newMatches = { ...matches };
      delete newMatches[leftId];
      setMatches(newMatches);
      setSelectedLeft(null);
    } else {
      setSelectedLeft(leftId);
    }
  };

  const handleRightClick = (rightId: string) => {
    if (isAnswered || !selectedLeft) return;

    // Verificar si este rightId ya está usado
    const alreadyMatched = Object.values(matches).includes(rightId);
    if (alreadyMatched) {
      // Encontrar y eliminar el match anterior
      const previousLeftId = Object.keys(matches).find(key => matches[key] === rightId);
      if (previousLeftId) {
        const newMatches = { ...matches };
        delete newMatches[previousLeftId];
        setMatches(newMatches);
      }
    }

    // Crear nuevo match
    setMatches({
      ...matches,
      [selectedLeft]: rightId,
    });
    setSelectedLeft(null);
  };

  const handleSubmit = () => {
    if (Object.keys(matches).length === leftColumn.length && !isAnswered) {
      onAnswerSelect(matches);
    }
  };

  const getMatchedRight = (leftId: string): string | null => {
    return matches[leftId] || null;
  };

  const isRightMatched = (rightId: string): boolean => {
    return Object.values(matches).includes(rightId);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto space-y-6"
    >
      <p className="text-center text-gray-600 font-semibold mb-6">
        Relaciona los elementos de ambas columnas
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Columna Izquierda */}
        <div className="space-y-3">
          <h3 className="font-bold text-lg text-center text-purple-700 mb-4">
            Columna A
          </h3>
          {leftColumn.map((item, index) => {
            const matchedRightId = getMatchedRight(item.id);
            const isSelected = selectedLeft === item.id;

            return (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleLeftClick(item.id)}
                disabled={isAnswered}
                className={cn(
                  "w-full p-4 rounded-xl border-2 text-left font-semibold transition-all",
                  matchedRightId
                    ? "bg-green-100 border-green-500 text-green-900"
                    : isSelected
                    ? "bg-purple-200 border-purple-500 text-purple-900 ring-4 ring-purple-300"
                    : "bg-gray-50 border-gray-300 text-gray-800 hover:border-purple-400",
                  isAnswered && "cursor-not-allowed opacity-75"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    {index + 1}
                  </div>
                  <span className="flex-1">{item.texto}</span>
                  {matchedRightId && (
                    <span className="text-xs bg-green-500 text-white px-2 py-1 rounded">
                      ✓
                    </span>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Columna Derecha */}
        <div className="space-y-3">
          <h3 className="font-bold text-lg text-center text-blue-700 mb-4">
            Columna B
          </h3>
          {rightColumn.map((item, index) => {
            const matched = isRightMatched(item.id);

            return (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleRightClick(item.id)}
                disabled={isAnswered || !selectedLeft}
                className={cn(
                  "w-full p-4 rounded-xl border-2 text-left font-semibold transition-all",
                  matched
                    ? "bg-blue-100 border-blue-500 text-blue-900"
                    : selectedLeft
                    ? "bg-gray-50 border-gray-300 text-gray-800 hover:border-blue-400"
                    : "bg-gray-50 border-gray-200 text-gray-500",
                  (isAnswered || !selectedLeft) && "cursor-not-allowed opacity-75"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span className="flex-1">{item.texto}</span>
                  {matched && (
                    <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">
                      ✓
                    </span>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Progress */}
      <div className="text-center text-gray-600">
        <span className="font-semibold">
          {Object.keys(matches).length} de {leftColumn.length} emparejados
        </span>
      </div>

      {!isAnswered && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center mt-8"
        >
          <Button
            onClick={handleSubmit}
            disabled={Object.keys(matches).length !== leftColumn.length}
            size="lg"
            className="bg-purple-600 hover:bg-purple-700 text-white px-12 py-6 text-xl rounded-full"
          >
            Confirmar Relaciones
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
