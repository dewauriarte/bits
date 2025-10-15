import { motion, AnimatePresence } from 'framer-motion';
import { CountdownEvent } from '@/types/socket.types';

interface CountdownAnimationProps {
  countdown: CountdownEvent | null;
  isVisible: boolean;
}

export default function CountdownAnimation({ countdown, isVisible }: CountdownAnimationProps) {
  if (!isVisible || !countdown) return null;

  const isGo = countdown.count === 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      >
        <motion.div
          key={countdown.count}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0, rotate: 180 }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 20,
          }}
          className="relative"
        >
          {/* Glow effect */}
          <motion.div
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className={cn(
              'absolute inset-0 rounded-full blur-3xl',
              isGo
                ? 'bg-green-500'
                : countdown.count === 1
                ? 'bg-red-500'
                : countdown.count === 2
                ? 'bg-yellow-500'
                : 'bg-blue-500'
            )}
          />

          {/* Number/Text */}
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 0.5,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
            className={cn(
              'relative text-9xl font-black tracking-tighter',
              isGo
                ? 'text-green-400'
                : countdown.count === 1
                ? 'text-red-400'
                : countdown.count === 2
                ? 'text-yellow-400'
                : 'text-blue-400'
            )}
            style={{
              textShadow: '0 0 40px currentColor',
            }}
          >
            {countdown.message}
          </motion.div>
        </motion.div>

        {/* Particles */}
        {isGo && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  x: '50vw',
                  y: '50vh',
                  scale: 0,
                  opacity: 1,
                }}
                animate={{
                  x: `${Math.random() * 100}vw`,
                  y: `${Math.random() * 100}vh`,
                  scale: [0, 1, 0],
                  opacity: [1, 1, 0],
                }}
                transition={{
                  duration: 2,
                  ease: 'easeOut',
                  delay: Math.random() * 0.3,
                }}
                className="absolute w-4 h-4 bg-green-400 rounded-full"
              />
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
