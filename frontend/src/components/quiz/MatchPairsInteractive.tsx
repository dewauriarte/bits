import { useState, useEffect } from 'react';

interface Option {
  texto: string;
  imagen_url?: string;
}

interface Question {
  opciones: Option[];
}

interface MatchPairsInteractiveProps {
  question: Question;
  showCorrectAnswer?: boolean;
  onAnswerChange?: (pairs: { [key: number]: number }) => void;
}

// Colores sólidos tipo Kahoot para los pares
const PAIR_COLORS = [
  { bg: '#8B5CF6', text: '#FFFFFF' },    // Morado
  { bg: '#EC4899', text: '#FFFFFF' },    // Rosa
  { bg: '#F59E0B', text: '#FFFFFF' },    // Ámbar
  { bg: '#06B6D4', text: '#FFFFFF' },    // Cyan
  { bg: '#84CC16', text: '#FFFFFF' },    // Lima
  { bg: '#EF4444', text: '#FFFFFF' },    // Rojo
];

export default function MatchPairsInteractive({ 
  question, 
  showCorrectAnswer = false,
  onAnswerChange 
}: MatchPairsInteractiveProps) {
  const [pairs, setPairs] = useState<{ [key: number]: number }>({});
  const [draggedItem, setDraggedItem] = useState<{ type: 'A' | 'B', index: number } | null>(null);
  const [dragOverItem, setDragOverItem] = useState<{ type: 'A' | 'B', index: number } | null>(null);

  // Parsear opciones
  const parsedOptions = question.opciones.map(opt => {
    const parts = opt.texto.includes('→') 
      ? opt.texto.split('→').map(s => s.trim())
      : opt.texto.includes('->') 
      ? opt.texto.split('->').map(s => s.trim())
      : [opt.texto || '', ''];
    return { a: parts[0] || '', b: parts[1] || '' };
  });

  // Mezclar ambas columnas para hacerlo más desafiante
  const [shuffledA] = useState(() => {
    const indices = parsedOptions.map((_, i) => i);
    return indices.sort(() => Math.random() - 0.5);
  });

  const [shuffledB] = useState(() => {
    const indices = parsedOptions.map((_, i) => i);
    return indices.sort(() => Math.random() - 0.5);
  });

  useEffect(() => {
    if (onAnswerChange) {
      onAnswerChange(pairs);
    }
  }, [pairs, onAnswerChange]);

  // Drag handlers estilo Kahoot
  const handleDragStart = (e: React.DragEvent, type: 'A' | 'B', index: number) => {
    if (showCorrectAnswer) return;
    setDraggedItem({ type, index });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, type: 'A' | 'B', index: number) => {
    e.preventDefault();
    if (showCorrectAnswer) return;
    e.dataTransfer.dropEffect = 'move';
    setDragOverItem({ type, index });
  };

  const handleDragLeave = () => {
    setDragOverItem(null);
  };

  const handleDrop = (e: React.DragEvent, targetType: 'A' | 'B', targetIndex: number) => {
    e.preventDefault();
    if (showCorrectAnswer || !draggedItem) return;

    // Solo permitir emparejar A con B o B con A
    if (draggedItem.type === targetType) {
      setDraggedItem(null);
      setDragOverItem(null);
      return;
    }

    const newPairs = { ...pairs };
    
    if (draggedItem.type === 'A') {
      // Limpiar emparejamientos previos
      Object.keys(newPairs).forEach(key => {
        if (newPairs[parseInt(key)] === targetIndex) {
          delete newPairs[parseInt(key)];
        }
      });
      if (newPairs[draggedItem.index] !== undefined) {
        delete newPairs[draggedItem.index];
      }
      newPairs[draggedItem.index] = targetIndex;
    } else {
      Object.keys(newPairs).forEach(key => {
        if (newPairs[parseInt(key)] === draggedItem.index) {
          delete newPairs[parseInt(key)];
        }
      });
      if (newPairs[targetIndex] !== undefined) {
        delete newPairs[targetIndex];
      }
      newPairs[targetIndex] = draggedItem.index;
    }

    setPairs(newPairs);
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
  };

  // Click para desemparejar
  const handleCardClick = (type: 'A' | 'B', index: number) => {
    if (showCorrectAnswer) return;

    const newPairs = { ...pairs };
    
    if (type === 'A' && pairs[index] !== undefined) {
      delete newPairs[index];
      setPairs(newPairs);
    } else if (type === 'B') {
      const pairedA = Object.keys(pairs).find(key => pairs[parseInt(key)] === index);
      if (pairedA !== undefined) {
        delete newPairs[parseInt(pairedA)];
        setPairs(newPairs);
      }
    }
  };

  // Obtener índice del color del par
  const getPairColorIndex = (indexA: number, indexB?: number): number | null => {
    if (pairs[indexA] !== undefined) {
      const sortedKeys = Object.keys(pairs).map(k => parseInt(k)).sort((a, b) => a - b);
      return sortedKeys.indexOf(indexA);
    }
    
    if (indexB !== undefined) {
      const pairedA = Object.keys(pairs).find(key => pairs[parseInt(key)] === indexB);
      if (pairedA !== undefined) {
        const sortedKeys = Object.keys(pairs).map(k => parseInt(k)).sort((a, b) => a - b);
        return sortedKeys.indexOf(parseInt(pairedA));
      }
    }
    
    return null;
  };

  if (showCorrectAnswer) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-600 mb-3 font-semibold">✅ Pares correctos:</p>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="text-center font-bold text-white bg-gradient-to-r from-blue-500 to-blue-600 px-3 py-2 rounded-lg text-sm">
              📋 Columna A
            </div>
            {parsedOptions.map((opt, index) => {
              const color = PAIR_COLORS[index % PAIR_COLORS.length];
              return (
                <div
                  key={`correct-a-${index}`}
                  className="p-4 rounded-xl shadow-lg transform transition-all min-h-[70px] flex items-center"
                  style={{ 
                    backgroundColor: color.bg,
                    color: color.text
                  }}
                >
                  <div className="flex items-center gap-3 w-full">
                    <span 
                      className="flex-shrink-0 w-8 h-8 rounded-full bg-white flex items-center justify-center text-sm font-bold shadow-md"
                      style={{ color: color.bg }}
                    >
                      {index + 1}
                    </span>
                    <span className="font-bold text-base flex-1">{opt.a}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="space-y-3">
            <div className="text-center font-bold text-white bg-gradient-to-r from-green-500 to-green-600 px-3 py-2 rounded-lg text-sm">
              📋 Columna B
            </div>
            {parsedOptions.map((opt, index) => {
              const color = PAIR_COLORS[index % PAIR_COLORS.length];
              return (
                <div
                  key={`correct-b-${index}`}
                  className="p-4 rounded-xl shadow-lg transform transition-all min-h-[70px] flex items-center"
                  style={{ 
                    backgroundColor: color.bg,
                    color: color.text
                  }}
                >
                  <span className="font-bold text-base">{opt.b}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-4">
        <p className="text-center text-sm font-bold text-indigo-900">
          🎮 Arrastra las tarjetas para relacionarlas • Click para desemparejar
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Columna A */}
        <div className="space-y-3">
          <div className="text-center font-bold text-white bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3 rounded-xl text-base shadow-md">
            📋 Columna A
          </div>
          {shuffledA.map((originalIndex) => {
            const opt = parsedOptions[originalIndex];
            const colorIndex = getPairColorIndex(originalIndex);
            const isPaired = pairs[originalIndex] !== undefined;
            const isDragging = draggedItem?.type === 'A' && draggedItem.index === originalIndex;
            const isDragOver = dragOverItem?.type === 'A' && dragOverItem.index === originalIndex;
            const color = colorIndex !== null ? PAIR_COLORS[colorIndex % PAIR_COLORS.length] : null;

            return (
              <div
                key={`a-${originalIndex}`}
                draggable={!showCorrectAnswer}
                onDragStart={(e) => handleDragStart(e, 'A', originalIndex)}
                onDragOver={(e) => handleDragOver(e, 'A', originalIndex)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, 'A', originalIndex)}
                onDragEnd={handleDragEnd}
                onClick={() => handleCardClick('A', originalIndex)}
                className={`p-4 rounded-xl cursor-move transition-all transform hover:scale-105 min-h-[70px] flex items-center ${
                  isDragging ? 'opacity-50 scale-95' : ''
                } ${
                  isDragOver ? 'ring-4 ring-blue-400' : ''
                }`}
                style={{
                  backgroundColor: isPaired && color ? color.bg : '#E5E7EB',
                  color: isPaired && color ? color.text : '#374151',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)',
                }}
              >
                <div className="flex items-center gap-3 w-full">
                  <span 
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-md"
                    style={{
                      backgroundColor: isPaired && color ? '#FFFFFF' : '#1F2937',
                      color: isPaired && color ? color.bg : '#FFFFFF'
                    }}
                  >
                    {originalIndex + 1}
                  </span>
                  <span className="flex-1 font-bold text-base">{opt.a}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Columna B (mezclada) */}
        <div className="space-y-3">
          <div className="text-center font-bold text-white bg-gradient-to-r from-green-500 to-green-600 px-4 py-3 rounded-xl text-base shadow-md">
            📋 Columna B
          </div>
          {shuffledB.map((originalIndex) => {
            const opt = parsedOptions[originalIndex];
            const colorIndex = getPairColorIndex(-1, originalIndex);
            const isPaired = Object.values(pairs).includes(originalIndex);
            const isDragging = draggedItem?.type === 'B' && draggedItem.index === originalIndex;
            const isDragOver = dragOverItem?.type === 'B' && dragOverItem.index === originalIndex;
            const color = colorIndex !== null ? PAIR_COLORS[colorIndex % PAIR_COLORS.length] : null;

            return (
              <div
                key={`b-${originalIndex}`}
                draggable={!showCorrectAnswer}
                onDragStart={(e) => handleDragStart(e, 'B', originalIndex)}
                onDragOver={(e) => handleDragOver(e, 'B', originalIndex)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, 'B', originalIndex)}
                onDragEnd={handleDragEnd}
                onClick={() => handleCardClick('B', originalIndex)}
                className={`p-4 rounded-xl cursor-move transition-all transform hover:scale-105 min-h-[70px] flex items-center ${
                  isDragging ? 'opacity-50 scale-95' : ''
                } ${
                  isDragOver ? 'ring-4 ring-green-400' : ''
                }`}
                style={{
                  backgroundColor: isPaired && color ? color.bg : '#E5E7EB',
                  color: isPaired && color ? color.text : '#374151',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)',
                }}
              >
                <span className="font-bold text-base">{opt.b}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Indicador de progreso */}
      <div className="text-center">
        <div className="inline-block bg-white border-2 border-gray-300 rounded-lg px-6 py-3 shadow-sm">
          <p className="text-sm font-semibold text-gray-700">
            Progreso: <span className="text-indigo-600 text-lg">{Object.keys(pairs).length}</span> / {parsedOptions.length} pares
          </p>
        </div>
      </div>
    </div>
  );
}
