import { motion, AnimatePresence } from 'framer-motion';
import { PlayerInfo } from '@/types/socket.types';
import { Badge } from '@/components/ui/badge';
import { Check, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlayerGridProps {
  players: PlayerInfo[];
  className?: string;
}

export default function PlayerGrid({ players, className }: PlayerGridProps) {
  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4', className)}>
      <AnimatePresence mode="popLayout">
        {players.map((player) => (
          <motion.div
            key={player.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            layout
          >
            <PlayerCard player={player} />
          </motion.div>
        ))}
      </AnimatePresence>

      {players.length === 0 && (
        <div className="col-span-full text-center py-12 text-muted-foreground">
          <p>Esperando jugadores...</p>
          <p className="text-sm mt-2">Los jugadores aparecerán aquí cuando se unan</p>
        </div>
      )}
    </div>
  );
}

interface PlayerCardProps {
  player: PlayerInfo;
}

function PlayerCard({ player }: PlayerCardProps) {
  return (
    <div
      className={cn(
        'relative p-4 rounded-lg border-2 transition-all',
        player.isConnected
          ? 'bg-card border-border hover:border-primary/50'
          : 'bg-muted/50 border-muted opacity-60'
      )}
    >
      {/* Status Badges */}
      <div className="absolute top-2 right-2 flex gap-1">
        {player.isReady && (
          <Badge variant="default" className="bg-green-500 hover:bg-green-600">
            <Check className="h-3 w-3 mr-1" />
            Listo
          </Badge>
        )}
        {!player.isConnected && (
          <Badge variant="secondary">
            <WifiOff className="h-3 w-3" />
          </Badge>
        )}
      </div>

      {/* Avatar */}
      <div className="flex flex-col items-center gap-3">
        <div
          className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center text-3xl',
            'bg-gradient-to-br from-primary/20 to-primary/10 border-2',
            player.isConnected ? 'border-primary' : 'border-muted'
          )}
        >
          {player.avatar}
        </div>

        {/* Nickname */}
        <div className="text-center w-full">
          <p className="font-semibold truncate">{player.nickname}</p>
          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mt-1">
            {player.isConnected ? (
              <>
                <Wifi className="h-3 w-3 text-green-500" />
                <span>Conectado</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 text-red-500" />
                <span>Desconectado</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
