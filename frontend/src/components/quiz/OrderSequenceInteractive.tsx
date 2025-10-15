import { useState } from 'react';
import { GripVertical } from 'lucide-react';

interface Option {
  texto: string;
}

interface Question {
  opciones: Option[];
}

interface OrderSequenceInteractiveProps {
  question: Question;
  showCorrectAnswer?: boolean;
  onAnswerChange?: (order: number[]) => void;
}

export default function OrderSequenceInteractive({ 
  question, 
  showCorrectAnswer = false,
  onAnswerChange 
}: OrderSequenceInteractiveProps) {
  // Mezclar elementos para el juego
  const [shuffledOrder] = useState(() => {
    const indices = question.opciones.map((_, i) => i);
    return indices.sort(() => Math.random() - 0.5);
  });

  const [currentOrder, setCurrentOrder] = useState<number[]>(shuffledOrder);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (showCorrectAnswer) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (showCorrectAnswer || draggedIndex === null) return;
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (showCorrectAnswer || draggedIndex === null) return;

    const newOrder = [...currentOrder];
    const [draggedItem] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(dropIndex, 0, draggedItem);

    setCurrentOrder(newOrder);
    setDraggedIndex(null);
    setDragOverIndex(null);

    if (onAnswerChange) {
      onAnswerChange(newOrder);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  if (showCorrectAnswer) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-600 mb-3 font-semibold">✅ Orden correcto:</p>
        {question.opciones.map((opcion, index) => {
          const colors = ['#E21B3C', '#1368CE', '#D89E00', '#26890C', '#8B5CF6', '#EC4899'];
          const color = colors[index % colors.length];
          
          return (
            <div
              key={index}
              className="flex items-center gap-3 p-4 rounded-2xl shadow-lg"
              style={{ backgroundColor: color }}
            >
              <span className="flex-shrink-0 w-10 h-10 rounded-full bg-white flex items-center justify-center text-lg font-bold shadow-md" style={{ color }}>
                {index + 1}
              </span>
              <span className="flex-1 font-bold text-white text-lg">{opcion.texto}</span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-4">
        <p className="text-center text-sm font-bold text-indigo-900">
          🔢 Arrastra los elementos para ordenarlos correctamente
        </p>
      </div>

      <div className="space-y-3">
        {currentOrder.map((originalIndex, displayIndex) => {
          const opcion = question.opciones[originalIndex];
          const isDragging = draggedIndex === displayIndex;
          const isDragOver = dragOverIndex === displayIndex;

          // Colores que rotan
          const colors = ['#8B5CF6', '#EC4899', '#F59E0B', '#06B6D4', '#84CC16', '#EF4444'];
          const color = colors[displayIndex % colors.length];

          return (
            <div
              key={`${originalIndex}-${displayIndex}`}
              draggable={!showCorrectAnswer}
              onDragStart={(e) => handleDragStart(e, displayIndex)}
              onDragOver={(e) => handleDragOver(e, displayIndex)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, displayIndex)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-3 p-4 rounded-xl cursor-move transition-all transform shadow-lg ${
                isDragging ? 'opacity-50 scale-95' : 'hover:scale-102'
              } ${
                isDragOver ? 'ring-4 ring-indigo-400' : ''
              }`}
              style={{
                backgroundColor: color,
                color: '#FFFFFF',
              }}
            >
              <GripVertical className="h-5 w-5 opacity-70" />
              <span className="flex-shrink-0 w-10 h-10 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-lg font-bold shadow-md">
                {displayIndex + 1}
              </span>
              <span className="flex-1 font-bold text-lg">{opcion.texto}</span>
            </div>
          );
        })}
      </div>

      <div className="text-center">
        <div className="inline-block bg-white border-2 border-gray-300 rounded-lg px-6 py-3 shadow-sm">
          <p className="text-sm font-semibold text-gray-700">
            📊 Orden actual: {currentOrder.map(i => i + 1).join(' → ')}
          </p>
        </div>
      </div>
    </div>
  );
}
