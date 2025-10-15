import { useEffect, useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';

const loadingMessages = [
  '🤖 Consultando con la IA...',
  '📚 Analizando contenido educativo...',
  '✨ Generando preguntas creativas...',
  '🎯 Optimizando dificultad...',
  '💡 Creando opciones de respuesta...',
  '🔍 Revisando coherencia...',
  '📝 Añadiendo explicaciones...',
  '🎨 Puliendo detalles finales...',
];

interface AILoadingStateProps {
  message?: string;
}

export default function AILoadingState({ message }: AILoadingStateProps) {
  const [currentMessage, setCurrentMessage] = useState(loadingMessages[0]);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setCurrentMessage(loadingMessages[messageIndex]);
  }, [messageIndex]);

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="relative">
        {/* Animated circles */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-24 h-24 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin animation-delay-150" />
        </div>
        
        {/* Center icon */}
        <div className="relative flex items-center justify-center w-24 h-24">
          <Sparkles className="w-10 h-10 text-indigo-600 animate-pulse" />
        </div>
      </div>

      <div className="mt-8 text-center space-y-2">
        <h3 className="text-xl font-semibold text-gray-900 flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          Generando tu quiz
        </h3>
        <p className="text-gray-600 animate-pulse">
          {message || currentMessage}
        </p>
        <p className="text-sm text-gray-500 mt-4">
          Esto puede tomar unos segundos...
        </p>
      </div>

      {/* Progress indicator */}
      <div className="mt-8 w-64">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 animate-progress" />
        </div>
      </div>
    </div>
  );
}
