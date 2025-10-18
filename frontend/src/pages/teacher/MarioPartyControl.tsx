import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Trophy, 
  Star, 
  Coins, 
  RotateCw, 
  X,
  Gamepad2,
  ChevronRight,
  Monitor
} from 'lucide-react';
import { toast } from 'sonner';
import gameSocket from '@/lib/socket';
import { cn } from '@/lib/utils';

interface PlayerState {
  player_id: string;
  nickname: string;
  avatar: string;
  position: number;
  estrellas: number;
  monedas: number;
  turno_perdido: boolean;
}

interface GameState {
  room_id: string;
  board_id: string;
  players: PlayerState[];
  current_turn: string;
  round: number;
  max_rounds: number;
  game_started: boolean;
}

export default function MarioPartyControl() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentTurnPlayer, setCurrentTurnPlayer] = useState<PlayerState | null>(null);
  const [showEndGameDialog, setShowEndGameDialog] = useState(false);

  useEffect(() => {
    if (!roomCode) {
      navigate('/teacher/quizzes');
      return;
    }

    // Request game state
    requestGameState();

    // Setup socket listeners
    setupSocketListeners();

    return () => {
      cleanupSocketListeners();
    };
  }, [roomCode]);

  const requestGameState = () => {
    const socket = gameSocket.getSocket();
    if (!socket) return;
    
    socket.emit('mario:get_state', { roomCode }, (response: any) => {
      if (response.success && response.gameState) {
        setGameState(response.gameState);
        updateCurrentTurnPlayer(response.gameState);
      }
    });
  };

  const updateCurrentTurnPlayer = (state: GameState) => {
    const player = state.players.find(p => p.player_id === state.current_turn);
    setCurrentTurnPlayer(player || null);
  };

  const setupSocketListeners = () => {
    const socket = gameSocket.getSocket();
    if (!socket) return;

    socket.on('mario:dice_rolled', (data: any) => {
      console.log('Dice rolled:', data);
      toast.info(`${data.player} lanzó el dado: ${data.result}`);
    });

    socket.on('mario:player_moved', (data: any) => {
      console.log('Player moved:', data);
      requestGameState(); // Update state
    });

    socket.on('mario:turn_changed', (data: any) => {
      console.log('Turn changed:', data);
      setGameState(prev => prev ? { ...prev, current_turn: data.nextPlayer } : null);
      if (gameState) {
        updateCurrentTurnPlayer({ ...gameState, current_turn: data.nextPlayer });
      }
    });

    socket.on('mario:game_finished', (data: any) => {
      console.log('Game finished:', data);
      toast.success('¡Juego terminado!');
      // Navigate to results
      setTimeout(() => {
        navigate(`/teacher/rooms/${roomCode}/results`);
      }, 2000);
    });
  };

  const cleanupSocketListeners = () => {
    const socket = gameSocket.getSocket();
    if (!socket) return;

    socket.off('mario:dice_rolled');
    socket.off('mario:player_moved');
    socket.off('mario:turn_changed');
    socket.off('mario:game_finished');
  };

  const handleEndGame = () => {
    const socket = gameSocket.getSocket();
    if (socket && roomCode) {
      socket.emit('mario:end_game', { roomCode }, (response: any) => {
        if (response?.success) {
          toast.success('¡Juego finalizado correctamente!');
          setShowEndGameDialog(false);
        } else {
          toast.error(response?.message || 'Error al finalizar el juego');
        }
      });
    }
  };

  const handleNextTurn = () => {
    const socket = gameSocket.getSocket();
    if (socket && roomCode) {
      socket.emit('mario:force_next_turn', { roomCode });
    }
  };

  if (!gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
        <div className="text-white text-xl">Cargando estado del juego...</div>
      </div>
    );
  }

  const sortedPlayers = [...gameState.players].sort((a, b) => {
    if (b.estrellas !== a.estrellas) return b.estrellas - a.estrellas;
    return b.monedas - a.monedas;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100">
      {/* Header */}
      <div className="bg-white shadow-md border-b-2 border-purple-200">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Gamepad2 className="h-8 w-8 text-purple-600" />
              <div>
                <h1 className="text-2xl font-bold text-purple-700">
                  Control Mario Party
                </h1>
                <p className="text-sm text-gray-600">Sala: {roomCode}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="text-lg px-3 py-1">
                Ronda {gameState.round} / {gameState.max_rounds}
              </Badge>
              <Button
                onClick={() => setShowEndGameDialog(true)}
                variant="destructive"
                size="sm"
              >
                <X className="w-4 h-4 mr-2" />
                Terminar Juego
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Turno Actual */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RotateCw className="h-5 w-5" />
                Turno Actual
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentTurnPlayer ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="text-4xl">{currentTurnPlayer.avatar}</div>
                    <div>
                      <p className="font-bold text-lg">{currentTurnPlayer.nickname}</p>
                      <p className="text-sm text-gray-500">Posición: {currentTurnPlayer.position}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="font-bold">{currentTurnPlayer.estrellas}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Coins className="w-4 h-4 text-amber-500" />
                      <span className="font-bold">{currentTurnPlayer.monedas}</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleNextTurn}
                    variant="outline"
                    className="w-full"
                  >
                    <ChevronRight className="w-4 h-4 mr-2" />
                    Forzar Siguiente Turno
                  </Button>
                </div>
              ) : (
                <p className="text-gray-500">No hay turno activo</p>
              )}
            </CardContent>
          </Card>

          {/* Clasificación */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Clasificación en Vivo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sortedPlayers.map((player, index) => (
                  <motion.div
                    key={player.player_id}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border",
                      player.player_id === currentTurnPlayer?.player_id && "ring-2 ring-purple-400",
                      "bg-white"
                    )}
                  >
                    {/* Posición */}
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg",
                      index === 0 && "bg-yellow-400 text-black",
                      index === 1 && "bg-gray-300 text-black",
                      index === 2 && "bg-orange-400 text-white",
                      index > 2 && "bg-gray-200 text-gray-600"
                    )}>
                      {index + 1}
                    </div>

                    {/* Avatar y nombre */}
                    <div className="text-3xl">{player.avatar}</div>
                    <div className="flex-1">
                      <p className="font-semibold text-lg">{player.nickname}</p>
                      <p className="text-sm text-gray-500">Casilla {player.position}</p>
                    </div>

                    {/* Stats */}
                    <div className="flex gap-4">
                      <div className="text-center">
                        <Star className="w-6 h-6 text-yellow-500 mx-auto" />
                        <span className="font-bold text-xl">{player.estrellas}</span>
                      </div>
                      <div className="text-center">
                        <Coins className="w-6 h-6 text-amber-500 mx-auto" />
                        <span className="font-bold text-xl">{player.monedas}</span>
                      </div>
                    </div>

                    {player.player_id === currentTurnPlayer?.player_id && (
                      <Badge className="bg-purple-600">TURNO</Badge>
                    )}
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monitor View Info */}
        <Card className="mt-6 bg-blue-50 border-blue-300">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <Monitor className="h-6 w-6 text-blue-600" />
              <div>
                <p className="font-semibold text-blue-900">Vista del Profesor</p>
                <p className="text-sm text-blue-700">
                  Los estudiantes están jugando Mario Party en sus dispositivos. 
                  Aquí puedes monitorear el progreso y controlar el juego.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Confirmación para Terminar Juego */}
      <Dialog open={showEndGameDialog} onOpenChange={setShowEndGameDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <X className="h-6 w-6 text-red-600" />
              Terminar Juego
            </DialogTitle>
            <DialogDescription className="text-base pt-2">
              ¿Estás seguro de que deseas finalizar el juego de Mario Party?
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-800">
                ⚠️ Esta acción no se puede deshacer. Se calcularán los puntajes finales y se mostrará el ganador.
              </p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-700">Estado actual del juego:</p>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• Ronda actual: {gameState.round} de {gameState.max_rounds}</li>
                <li>• Jugadores activos: {gameState.players.length}</li>
                <li>• Sala: {roomCode}</li>
              </ul>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowEndGameDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleEndGame}
              className="bg-red-600 hover:bg-red-700"
            >
              <X className="w-4 h-4 mr-2" />
              Sí, Terminar Juego
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
