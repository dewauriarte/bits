import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Play, X, Users, Settings, Clock, Trophy, Zap,
  Loader2, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useRoomStore } from '@/stores/roomStore';
import gameSocket from '@/lib/socket';
import { roomsApi } from '@/lib/api/rooms';
import QRCodeDisplay from '@/components/game/QRCodeDisplay';
import PlayerGrid from '@/components/game/PlayerGrid';
import CountdownAnimation from '@/components/game/CountdownAnimation';
import { CountdownEvent } from '@/types/socket.types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function TeacherLobbyPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { room, setRoom, myPlayer, setMyPlayer, isConnected, setConnected } = useRoomStore();
  
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [countdown, setCountdown] = useState<CountdownEvent | null>(null);
  const [showCountdown, setShowCountdown] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [recentEvents, setRecentEvents] = useState<string[]>([]);
  const [isTeacher, setIsTeacher] = useState(false);
  const initializingRef = useRef(false);

  useEffect(() => {
    if (!code) {
      // Redirigir según tipo de sesión
      const sessionType = localStorage.getItem('session_type');
      if (sessionType === 'anonymous' || !localStorage.getItem('token')) {
        navigate('/student/join');
      } else {
        navigate('/teacher/quizzes');
      }
      return;
    }

    // Evitar múltiples inicializaciones
    if (initializingRef.current) return;
    initializingRef.current = true;

    // Limpiar listeners anteriores antes de inicializar
    cleanup();
    
    initializeRoom();

    return () => {
      cleanup();
      initializingRef.current = false;
    };
  }, [code]);

  const initializeRoom = async () => {
    try {
      setLoading(true);

      // Obtener token (puede ser de profesor o estudiante)
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      if (!token) {
        toast.error('No autenticado');
        navigate('/student/join');
        return;
      }

      // Detectar tipo de sesión ANTES de intentar APIs
      const sessionType = localStorage.getItem('session_type');
      const isAnonymousStudent = sessionType === 'anonymous' || token.startsWith('temp_');
      
      // Conectar socket
      const socket = gameSocket.connect(token);
      setConnected(socket.connected);

      let roomData: any;
      let playerData: any = null;
      let userIsTeacher = false;
      
      if (!isAnonymousStudent) {
        // Intentar obtener estado completo (solo profesores pueden)
        try {
          roomData = await roomsApi.getRoomFullState(code!);
          userIsTeacher = true;
          setIsTeacher(true);
          setRoom(roomData.room);
        } catch (error) {
          // Error al obtener como profesor
          toast.error('No tienes permiso para acceder a esta sala');
          navigate('/student/join');
          return;
        }
      } else {
        // Es estudiante - obtener datos guardados
        userIsTeacher = false;
        setIsTeacher(false);
        
        // PRIORIZAR sessionStorage (datos frescos) sobre localStorage (datos viejos)
        const savedPlayerStr = sessionStorage.getItem('pending_join') || localStorage.getItem(`player_${code}`);
        if (!savedPlayerStr) {
          toast.error('Sesión no encontrada');
          navigate('/student/join');
          return;
        }
        playerData = JSON.parse(savedPlayerStr);
        // No setear room aún - se obtendrá del WebSocket al unirse
      }

      // Unirse según rol
      if (userIsTeacher) {
        gameSocket.joinRoom(
          {
            roomCode: code!,
            nickname: roomData.room.teacherName,
            avatar: '👨‍🏫',
          },
          (response) => {
            if (!response.success) {
              toast.error('Error al unirse', {
                description: response.message,
              });
            }
          }
        );
      } else {
        // Unirse como estudiante
        gameSocket.joinRoom(
          {
            roomCode: code!,
            nickname: playerData.nickname,
            avatar: playerData.avatar,
            participantId: playerData.participantId, // ID de participante pre-cargado (si existe)
          },
          (response) => {
            if (response.success) {
              // Setear el room state desde la respuesta del socket
              setRoom(response.data.room);
              
              const me = response.data.room.players.find((p: any) => p.id === response.data.playerId);
              setMyPlayer(me || null);
              
              localStorage.setItem(`player_${code}`, JSON.stringify({
                roomCode: code,
                nickname: playerData.nickname,
                avatar: playerData.avatar,
                playerId: response.data.playerId,
                participantId: playerData.participantId,
              }));
              
              sessionStorage.removeItem('pending_join');
              setLoading(false); // Terminar loading después de unirse exitosamente
            } else {
              toast.error('Error al unirse', {
                description: response.message
              });
              setLoading(false);
              navigate('/student/join');
            }
          }
        );
      }

      // Setup event listeners
      setupSocketListeners();
      
      // Solo terminar loading para profesores (para estudiantes se hace en el callback)
      if (userIsTeacher) {
        setLoading(false);
      }
    } catch (error: any) {
      console.error('Error initializing room:', error);
      toast.error('Error al cargar sala', {
        description: error.response?.data?.message || 'Intenta de nuevo',
      });
      setLoading(false);
      // Redirigir según tipo de usuario
      const sessionType = localStorage.getItem('session_type');
      if (sessionType === 'anonymous' || !localStorage.getItem('token')) {
        navigate('/student/join');
      } else {
        navigate('/teacher/quizzes');
      }
    }
  };

  const setupSocketListeners = () => {
    // Player joined
    gameSocket.onPlayerJoined((data) => {
      console.log('Player joined:', data);
      addEvent(`${data.player.nickname} se unió`);
      toast.success(`${data.player.nickname} se unió a la sala`);
    });

    // Player left
    gameSocket.onPlayerLeft((data) => {
      console.log('Player left:', data);
      addEvent(`Un jugador salió`);
    });

    // Player disconnected
    gameSocket.onPlayerDisconnected((data) => {
      console.log('Player disconnected:', data);
      addEvent(`Un jugador se desconectó`);
    });

    // Player ready
    gameSocket.onPlayerReady((data) => {
      console.log('Player ready:', data);
      addEvent(`Un jugador está ${data.isReady ? 'listo' : 'no listo'}`);
    });

    // Room updated
    gameSocket.onRoomUpdated((data) => {
      console.log('Room updated:', data);
      setRoom(data.room);
    });

    // Game starting
    gameSocket.onGameStarting((data) => {
      console.log('Game starting:', data);
      setShowCountdown(true);
    });

    // Countdown
    gameSocket.onGameCountdown((data: CountdownEvent) => {
      console.log('Countdown:', data);
      setCountdown(data);
    });

    // Game started
    gameSocket.onGameStarted((data) => {
      console.log('Game started:', data);
      toast.success('¡El juego ha comenzado!');
      setTimeout(() => {
        // TODO: Navigate to game play
        toast.info('Gameplay pendiente de implementar (Sprint 5)');
      }, 1000);
    });

    // Game cancelled
    gameSocket.onGameCancelled((data) => {
      console.log('Game cancelled:', data);
      if (code) localStorage.removeItem(`player_${code}`);
      toast.error('Juego cancelado', {
        description: data.message,
      });
      setTimeout(() => {
        navigate(isTeacher ? '/teacher/quizzes' : '/student/join');
      }, 2000);
    });

    // Game closed
    gameSocket.onGameClosed((data) => {
      console.log('Game closed:', data);
      if (code) localStorage.removeItem(`player_${code}`);
      toast.error('La sala ha sido cerrada');
      setTimeout(() => {
        navigate(isTeacher ? '/teacher/quizzes' : '/student/join');
      }, 2000);
    });
  };

  const cleanup = () => {
    gameSocket.offPlayerJoined();
    gameSocket.offPlayerLeft();
    gameSocket.offPlayerDisconnected();
    gameSocket.offPlayerReady();
    gameSocket.offRoomUpdated();
    gameSocket.offGameStarting();
    gameSocket.offGameCountdown();
    gameSocket.offGameStarted();
    gameSocket.offGameCancelled();
    gameSocket.offGameClosed();
  };

  const addEvent = (message: string) => {
    setRecentEvents((prev) => [
      `${new Date().toLocaleTimeString()}: ${message}`,
      ...prev.slice(0, 9), // Keep last 10
    ]);
  };

  const handleStartGame = () => {
    if (!room || !code) return;

    if (room.players.length < 1) {
      toast.error('Se necesita al menos 1 jugador para iniciar');
      return;
    }

    setStarting(true);

    gameSocket.startGame(
      { roomCode: code },
      (response) => {
        if (!response.success) {
          toast.error('Error al iniciar', {
            description: response.message,
          });
          setStarting(false);
        }
      }
    );
  };

  const handleCloseRoom = () => {
    if (!code) return;

    gameSocket.closeRoom(
      { roomCode: code },
      (response) => {
        if (response.success) {
          toast.success('Sala cerrada');
          navigate('/teacher/quizzes');
        } else {
          toast.error('Error al cerrar sala');
        }
      }
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!room || !room.players) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Sala no encontrada</h2>
          <Button onClick={() => {
            const sessionType = localStorage.getItem('session_type');
            if (sessionType === 'anonymous') {
              navigate('/student/join');
            } else {
              navigate('/teacher/quizzes');
            }
          }}>
            Volver
          </Button>
        </div>
      </div>
    );
  }

  const connectedPlayers = room.players.filter((p) => p.isConnected);
  const readyPlayers = connectedPlayers.filter((p) => p.isReady);
  const canStart = connectedPlayers.length >= 1;
  const progressPercentage = connectedPlayers.length > 0 
    ? (readyPlayers.length / connectedPlayers.length) * 100 
    : 0;

  const joinUrl = `${window.location.origin}/join/${code}`;

  // Vista para estudiantes
  if (!isTeacher && myPlayer) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4">
          <div className="container mx-auto max-w-4xl py-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{room.quizTitle}</h1>
              <Badge variant="outline" className="gap-1 text-lg px-4 py-2">
                <Users className="h-4 w-4" />
                {connectedPlayers.length} jugador{connectedPlayers.length !== 1 ? 'es' : ''}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Card className="bg-gradient-to-br from-indigo-100 to-purple-100 border-4 border-indigo-300">
                <CardHeader>
                  <CardTitle className="text-center">¡Eres Tú!</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-9xl mb-4 animate-bounce">{myPlayer.avatar}</div>
                    <h3 className="text-3xl font-bold text-gray-900">{myPlayer.nickname}</h3>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Información</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Código de Sala</p>
                    <p className="text-2xl font-mono font-bold text-indigo-600">{code}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Profesor</p>
                    <p className="text-lg font-semibold">{room.teacherName}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Otros Jugadores</CardTitle>
              </CardHeader>
              <CardContent>
                <PlayerGrid players={connectedPlayers.filter(p => p.id !== myPlayer.id)} />
              </CardContent>
            </Card>

            <div className="mt-8 text-center">
              <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="py-6">
                  <div className="text-5xl mb-3 animate-pulse">⏰</div>
                  <p className="text-lg font-semibold text-gray-900 mb-2">Esperando al profesor...</p>
                  <p className="text-sm text-gray-600">El juego comenzará cuando el profesor presione "Iniciar"</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        <CountdownAnimation countdown={countdown} isVisible={showCountdown} />
      </>
    );
  }

  // Vista para profesores
  return (
    <>
      <div className="container mx-auto py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{room.quizTitle}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Badge variant="outline" className="gap-1">
                <Users className="h-3 w-3" />
                {connectedPlayers.length} jugador{connectedPlayers.length !== 1 ? 'es' : ''}
              </Badge>
              <Badge 
                variant={isConnected ? 'default' : 'destructive'}
                className="gap-1"
              >
                {isConnected ? '🟢 Conectado' : '🔴 Desconectado'}
              </Badge>
            </div>
          </div>

          <Button
            variant="destructive"
            onClick={() => setShowCloseDialog(true)}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Cerrar Sala
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Players Grid */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Jugadores ({connectedPlayers.length}/{room.config.maxPlayers})
                  </span>
                  <Badge variant={canStart ? 'default' : 'secondary'}>
                    {readyPlayers.length}/{connectedPlayers.length} listos
                  </Badge>
                </CardTitle>
                {connectedPlayers.length > 0 && (
                  <Progress value={progressPercentage} className="mt-4" />
                )}
              </CardHeader>
              <CardContent>
                <PlayerGrid players={room.players} />
              </CardContent>
            </Card>

            {/* Recent Events */}
            <Card>
              <CardHeader>
                <CardTitle>Actividad Reciente</CardTitle>
                <CardDescription>Eventos en tiempo real</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {recentEvents.length > 0 ? (
                    recentEvents.map((event, i) => (
                      <div
                        key={i}
                        className="text-sm p-2 bg-muted rounded flex items-center gap-2"
                      >
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        {event}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No hay eventos aún
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* QR Code */}
            <QRCodeDisplay url={joinUrl} roomCode={code!} size={180} />

            {/* Game Config */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configuración
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Tiempo por pregunta
                  </span>
                  <span className="font-medium">{room.config.timePerQuestion}s</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Máximo jugadores
                  </span>
                  <span className="font-medium">{room.config.maxPlayers}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    Leaderboard
                  </span>
                  <span className="font-medium">
                    {room.config.showLeaderboard ? 'Sí' : 'No'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Unirse tarde
                  </span>
                  <span className="font-medium">
                    {room.config.allowLateJoin ? 'Permitido' : 'No permitido'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Start Button */}
            <Button
              onClick={handleStartGame}
              disabled={!canStart || starting}
              size="lg"
              className="w-full gap-2"
            >
              {starting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Iniciando...
                </>
              ) : (
                <>
                  <Play className="h-5 w-5" />
                  Iniciar Juego
                </>
              )}
            </Button>

            {!canStart && (
              <p className="text-sm text-center text-muted-foreground">
                Se necesita al menos 1 jugador
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Countdown Overlay */}
      <CountdownAnimation countdown={countdown} isVisible={showCountdown} />

      {/* Close Dialog */}
      <AlertDialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cerrar sala?</AlertDialogTitle>
            <AlertDialogDescription>
              Se desconectarán todos los jugadores y no podrás recuperar esta sala.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCloseRoom}>
              Cerrar Sala
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
