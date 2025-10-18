import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useMarioPartyStore } from '@/stores/marioPartyStore';
import { cn } from '@/lib/utils';

export default function DiceRoller() {
  const [localDiceValue, setLocalDiceValue] = useState(1);
  
  const { 
    isRollingDice, 
    diceResult, 
    isMyTurn, 
    rollDice,
    setDiceResult 
  } = useMarioPartyStore();

  // Animación de dado rodando
  useEffect(() => {
    if (isRollingDice) {
      const interval = setInterval(() => {
        setLocalDiceValue(Math.floor(Math.random() * 6) + 1);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isRollingDice]);

  // Actualizar valor final
  useEffect(() => {
    if (diceResult !== null) {
      setLocalDiceValue(diceResult);
      
      // Limpiar resultado después de mostrar
      setTimeout(() => {
        setDiceResult(null);
      }, 3000);
    }
  }, [diceResult, setDiceResult]);

  const canRoll = isMyTurn() && !isRollingDice && diceResult === null;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Dado 3D */}
      <div className="relative">
        <motion.div
          className={cn(
            "w-24 h-24 bg-white rounded-2xl shadow-2xl",
            "flex items-center justify-center relative",
            "border-4 border-gray-800"
          )}
          animate={isRollingDice ? {
            rotateX: [0, 360, 720],
            rotateY: [0, 360, 720],
            rotateZ: [0, 180, 360],
          } : {
            rotateX: 0,
            rotateY: 0,
            rotateZ: 0,
          }}
          transition={isRollingDice ? {
            duration: 0.5,
            repeat: Infinity,
            ease: "linear"
          } : {
            duration: 0.5,
            ease: "easeOut"
          }}
        >
          {/* Puntos del dado */}
          <DiceFace value={localDiceValue} />
          
          {/* Efecto de brillo */}
          {isRollingDice && (
            <motion.div
              className="absolute inset-0 rounded-2xl"
              animate={{
                boxShadow: [
                  "0 0 20px rgba(147, 51, 234, 0.5)",
                  "0 0 40px rgba(236, 72, 153, 0.5)",
                  "0 0 20px rgba(147, 51, 234, 0.5)"
                ]
              }}
              transition={{
                duration: 0.5,
                repeat: Infinity
              }}
            />
          )}
        </motion.div>

        {/* Resultado final con animación */}
        <AnimatePresence>
          {diceResult !== null && (
            <motion.div
              className="absolute -top-12 left-1/2 transform -translate-x-1/2"
              initial={{ scale: 0, y: 20 }}
              animate={{ scale: 1.5, y: 0 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full font-bold text-xl shadow-xl">
                ¡{diceResult}!
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Botón de lanzar */}
      <Button
        onClick={rollDice}
        disabled={!canRoll}
        size="lg"
        className={cn(
          "px-8 py-6 text-xl font-bold rounded-full shadow-xl",
          "bg-gradient-to-r from-purple-600 to-pink-600",
          "hover:from-purple-700 hover:to-pink-700",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "transition-all duration-300"
        )}
      >
        {isRollingDice ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            🎲
          </motion.div>
        ) : (
          <>🎲 Lanzar Dado</>
        )}
      </Button>

      {/* Mensaje de estado */}
      <div className="text-center">
        {isRollingDice && (
          <motion.p
            className="text-lg font-semibold text-purple-600"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            Lanzando dado...
          </motion.p>
        )}
        {diceResult !== null && (
          <motion.p
            className="text-lg font-semibold text-green-600"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring" }}
          >
            ¡Avanza {diceResult} casillas!
          </motion.p>
        )}
        {!isMyTurn() && !isRollingDice && (
          <p className="text-gray-500">
            Esperando tu turno...
          </p>
        )}
      </div>
    </div>
  );
}

// Componente para mostrar los puntos del dado
function DiceFace({ value }: { value: number }) {
  const dots = {
    1: [[50, 50]],
    2: [[30, 30], [70, 70]],
    3: [[30, 30], [50, 50], [70, 70]],
    4: [[30, 30], [70, 30], [30, 70], [70, 70]],
    5: [[30, 30], [70, 30], [50, 50], [30, 70], [70, 70]],
    6: [[30, 30], [70, 30], [30, 50], [70, 50], [30, 70], [70, 70]]
  };

  const positions = dots[value as keyof typeof dots] || dots[1];

  return (
    <div className="relative w-full h-full">
      {positions.map((pos, index) => (
        <motion.div
          key={index}
          className="absolute w-4 h-4 bg-black rounded-full"
          style={{
            left: `${pos[0]}%`,
            top: `${pos[1]}%`,
            transform: 'translate(-50%, -50%)'
          }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: index * 0.05 }}
        />
      ))}
    </div>
  );
}
