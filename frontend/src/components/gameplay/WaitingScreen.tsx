import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface WaitingScreenProps {
  message?: string;
  countdown?: number;
}

export default function WaitingScreen({ message, countdown }: WaitingScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="flex flex-col items-center justify-center gap-8 text-white"
    >
      {countdown !== undefined && countdown > 0 ? (
        <>
          <motion.div
            key={countdown}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1.5, opacity: 1 }}
            exit={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="text-[200px] font-black"
          >
            {countdown}
          </motion.div>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-3xl font-bold"
          >
            ¡Prepárate!
          </motion.p>
        </>
      ) : (
        <>
          <Loader2 className="w-20 h-20 animate-spin" />
          <p className="text-2xl font-semibold text-center max-w-md">
            {message || 'Esperando...'}
          </p>
        </>
      )}
    </motion.div>
  );
}
