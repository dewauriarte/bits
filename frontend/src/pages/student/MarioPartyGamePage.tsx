import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useMarioPartyStore } from '@/stores/marioPartyStore';
import GameBoard from '@/components/mario-party/GameBoard';
import GameControlPanel from '@/components/mario-party/GameControlPanel';
import CasillaEventModal from '@/components/mario-party/CasillaEventModal';
import { Button } from '@/components/ui/button';
import { Loader2, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import gameSocket from '@/lib/socket';
import { getAuthHeaders } from '@/lib/auth-helpers';

export default function MarioPartyGamePage() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [playerInfo, setPlayerInfo] = useState<any>(null);

  const {
    gameState,
    board,
    setGameState,
    setBoard,
    setMyPlayerId,
    initializeSocketListeners,
    cleanupSocketListeners,
    reset
  } = useMarioPartyStore();

  useEffect(() => {
    if (!roomCode) {
      navigate('/student/join');
      return;
    }

    // Guardar room code
    localStorage.setItem('currentRoomCode', roomCode);

    // Obtener información del jugador - usar la clave correcta
    const storedPlayerInfo = localStorage.getItem(`player_${roomCode}`);
    if (storedPlayerInfo) {
      const info = JSON.parse(storedPlayerInfo);
      setPlayerInfo(info);
      setMyPlayerId(info.playerId); // Establecer el ID del jugador para el store
      console.log('🎮 Player ID set:', info.playerId);
    } else {
      console.error('❌ No player info found for room:', roomCode);
      // Si no hay información del jugador, regresar al lobby
      toast.error('Sesión no encontrada. Por favor únete de nuevo.');
      navigate('/student/join');
      return;
    }

    // Inicializar listeners
    initializeSocketListeners();

    // Solicitar estado actual del juego
    requestGameState();

    return () => {
      cleanupSocketListeners();
      reset();
      localStorage.removeItem('currentRoomCode');
    };
  }, [roomCode]);

  const requestGameState = () => {
    const socket = gameSocket.getSocket();
    if (!socket) {
      setLoading(false);
      return;
    }
    
    socket.emit('mario:get_state', { roomCode }, (response: any) => {
      if (response.success && response.gameState) {
        setGameState(response.gameState);
        
        // Cargar información del tablero
        loadBoardInfo(response.gameState.board_id);
      } else {
        // Si no hay juego activo, mostrar sala de espera
        setLoading(false);
      }
    });
  };

  const loadBoardInfo = async (boardId: string) => {
    try {
      console.log('Loading board:', boardId);
      const headers = getAuthHeaders();
      console.log('Headers:', headers);
      
      const response = await fetch(`/api/boards/${boardId}`, {
        headers: headers
      });

      console.log('Board response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Board loaded:', data.data);
        setBoard(data.data);
      } else {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        toast.error(`Error al cargar el tablero: ${errorData.message || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error loading board:', error);
      toast.error('Error de conexión al cargar el tablero');
    } finally {
      setLoading(false);
    }
  };

  const handleExitGame = () => {
    gameSocket.disconnect();
    navigate('/student/join');
  };

  // Pantalla de carga
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl p-8 shadow-2xl"
        >
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-700 font-semibold">Cargando Mario Party...</p>
        </motion.div>
      </div>
    );
  }

  // Pantalla de espera si no hay juego
  if (!gameState || !gameState.game_started) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full"
        >
          <div className="text-center">
            <div className="text-6xl mb-4">🎲</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Esperando al profesor
            </h2>
            <p className="text-gray-600 mb-6">
              El juego Mario Party comenzará cuando el profesor lo inicie.
            </p>
            
            {playerInfo && (
              <div className="bg-purple-50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center gap-3">
                  <span className="text-3xl">{playerInfo.avatar}</span>
                  <div className="text-left">
                    <p className="font-semibold">{playerInfo.nickname}</p>
                    <p className="text-sm text-gray-500">Código: {roomCode}</p>
                  </div>
                </div>
              </div>
            )}

            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity 
              }}
              className="inline-block mb-6"
            >
              <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">⏳</span>
              </div>
            </motion.div>

            <Button
              onClick={handleExitGame}
              variant="outline"
              className="w-full"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Salir de la sala
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Pantalla del juego
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100">
      {/* Header */}
      <div className="bg-white shadow-md border-b-2 border-purple-200">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-purple-700 flex items-center gap-2">
                <span className="text-3xl">🎲</span>
                Mario Party Mode
              </h1>
              {board && (
                <div className="flex items-center gap-2 text-gray-600">
                  <span className="text-xl">{board.tema === 'jungle' ? '🌴' : 
                                            board.tema === 'space' ? '🚀' :
                                            board.tema === 'underwater' ? '🐠' :
                                            board.tema === 'castle' ? '🏰' : '🏜️'}</span>
                  <span className="font-semibold">{board.nombre}</span>
                </div>
              )}
            </div>

            <Button
              onClick={handleExitGame}
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Salir
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Tablero (3 columnas) */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-2xl shadow-xl p-4"
            >
              <GameBoard />
            </motion.div>
          </div>

          {/* Panel de Control (1 columna) */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <GameControlPanel />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Modales de eventos */}
      <CasillaEventModal />

      {/* Indicador de estado en tiempo real */}
      <AnimatePresence>
        {gameState && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 left-4 bg-white rounded-full shadow-lg px-4 py-2 flex items-center gap-2"
          >
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600 font-semibold">
              Conectado • Sala {roomCode}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
