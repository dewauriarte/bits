import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TurnTimerProps {
  isMyTurn: boolean;
  onTimeUp?: () => void;
  maxTime?: number; // en segundos
}

export default function TurnTimer({ isMyTurn, onTimeUp, maxTime = 30 }: TurnTimerProps) {
  const [timeLeft, setTimeLeft] = useState(maxTime);

  useEffect(() => {
    if (!isMyTurn) {
      setTimeLeft(maxTime);
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (onTimeUp) onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isMyTurn, maxTime, onTimeUp]);

  if (!isMyTurn) return null;

  const percentage = (timeLeft / maxTime) * 100;
  const isLowTime = timeLeft <= 10;

  return (
    <div className="bg-white rounded-lg p-3 shadow-md">
      <div className="flex items-center gap-2 mb-2">
        <Clock className={cn(
          "w-4 h-4",
          isLowTime ? "text-red-500" : "text-gray-600"
        )} />
        <span className="text-sm font-semibold text-gray-700">
          Tiempo de turno
        </span>
      </div>
      
      <div className="relative">
        {/* Barra de progreso */}
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className={cn(
              "h-full rounded-full",
              isLowTime ? "bg-red-500" : "bg-green-500"
            )}
            initial={{ width: '100%' }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        
        {/* Número de segundos */}
        <div className={cn(
          "text-center mt-2 text-2xl font-bold",
          isLowTime && "text-red-500 animate-pulse"
        )}>
          {timeLeft}s
        </div>
      </div>

      {isLowTime && (
        <motion.p
          className="text-center text-xs text-red-500 mt-1"
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          ¡Apúrate!
        </motion.p>
      )}
    </div>
  );
}
