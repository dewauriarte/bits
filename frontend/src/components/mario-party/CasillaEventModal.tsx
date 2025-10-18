import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMarioPartyStore } from '@/stores/marioPartyStore';
import { CasillaType } from '@/types/mario-party.types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  HelpCircle, 
  Star, 
  Gift, 
  Skull, 
  Swords,
  CheckCircle,
  XCircle 
} from 'lucide-react';

export default function CasillaEventModal() {
  const { 
    showCasillaEvent, 
    currentEvent, 
    setShowCasillaEvent,
    answerQuestion,
    selectDuelOpponent,
    nextTurn,
    gameState
  } = useMarioPartyStore();

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [questionAnswered, setQuestionAnswered] = useState(false);
  const [eventSpinning, setEventSpinning] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (showCasillaEvent) {
      setSelectedAnswer(null);
      setQuestionAnswered(false);
      setEventSpinning(false);
    }
  }, [showCasillaEvent]);

  if (!currentEvent || !showCasillaEvent) return null;

  const handleClose = () => {
    setShowCasillaEvent(false);
    // Si el evento está completo, pasar turno
    if (questionAnswered || currentEvent.tipo === CasillaType.NORMAL) {
      nextTurn();
    }
  };

  const renderEventContent = () => {
    switch (currentEvent.tipo) {
      case CasillaType.NORMAL:
        return (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">😌</div>
            <p className="text-lg text-gray-600">
              Has caído en una casilla normal.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Descansa un momento antes de continuar.
            </p>
            <Button onClick={handleClose} className="mt-6">
              Continuar
            </Button>
          </div>
        );

      case CasillaType.PREGUNTA:
        return (
          <div className="space-y-4">
            <div className="text-center">
              <HelpCircle className="w-12 h-12 text-blue-500 mx-auto mb-2" />
              <p className="text-gray-600">
                Responde correctamente para avanzar 2 casillas extra!
              </p>
            </div>

            {!questionAnswered ? (
              <>
                {/* Aquí iría la pregunta real del quiz */}
                <Card className="p-4 bg-blue-50">
                  <p className="font-semibold mb-4">
                    ¿Cuál es la capital de Francia?
                  </p>
                  <div className="space-y-2">
                    {['París', 'Londres', 'Madrid', 'Berlín'].map((option, index) => (
                      <Button
                        key={index}
                        variant={selectedAnswer === option ? "default" : "outline"}
                        className="w-full justify-start"
                        onClick={() => {
                          setSelectedAnswer(option);
                          setQuestionAnswered(true);
                          // Simular respuesta correcta
                          answerQuestion('question-id', option);
                        }}
                        disabled={questionAnswered}
                      >
                        {option}
                        {questionAnswered && option === 'París' && (
                          <CheckCircle className="w-4 h-4 ml-auto text-green-500" />
                        )}
                        {questionAnswered && selectedAnswer === option && option !== 'París' && (
                          <XCircle className="w-4 h-4 ml-auto text-red-500" />
                        )}
                      </Button>
                    ))}
                  </div>
                </Card>
              </>
            ) : (
              <div className="text-center py-4">
                {selectedAnswer === 'París' ? (
                  <>
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-2" />
                    <p className="text-lg font-bold text-green-600">
                      ¡Correcto! Avanzarás 2 casillas extra.
                    </p>
                  </>
                ) : (
                  <>
                    <XCircle className="w-16 h-16 text-red-500 mx-auto mb-2" />
                    <p className="text-lg font-bold text-red-600">
                      Incorrecto. La respuesta era París.
                    </p>
                  </>
                )}
                <Button onClick={handleClose} className="mt-4">
                  Continuar
                </Button>
              </div>
            )}
          </div>
        );

      case CasillaType.ESTRELLA:
        return (
          <div className="text-center space-y-4">
            <Star className="w-16 h-16 text-yellow-500 mx-auto animate-pulse" />
            <div>
              <p className="text-xl font-bold text-yellow-600">
                ¡Mini-juego de Estrella!
              </p>
              <p className="text-gray-600 mt-2">
                Responde 3 preguntas correctamente para ganar una estrella.
              </p>
            </div>
            
            {/* Aquí iría el mini-juego de 3 preguntas */}
            <div className="flex justify-center gap-2 my-4">
              {[1, 2, 3].map((num) => (
                <div
                  key={num}
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center",
                    "border-2 font-bold",
                    num === 1 
                      ? "bg-green-100 border-green-500 text-green-700" 
                      : "bg-gray-100 border-gray-300 text-gray-400"
                  )}
                >
                  {num === 1 ? '✓' : num}
                </div>
              ))}
            </div>

            <Button onClick={handleClose} className="mt-4">
              Comenzar Mini-juego
            </Button>
          </div>
        );

      case CasillaType.EVENTO:
        return (
          <div className="text-center space-y-4">
            <Gift className="w-16 h-16 text-purple-500 mx-auto" />
            <div>
              <p className="text-xl font-bold text-purple-600">
                ¡Evento Sorpresa!
              </p>
            </div>

            {!eventSpinning ? (
              <Button
                onClick={() => setEventSpinning(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Girar Ruleta
              </Button>
            ) : (
              <motion.div
                className="space-y-4"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring" }}
              >
                {/* Resultado del evento */}
                {currentEvent.evento && (
                  <Card className="p-4 bg-purple-50">
                    <p className="text-lg font-semibold text-purple-700">
                      {currentEvent.evento.descripcion}
                    </p>
                    {currentEvent.evento.tipo === 'ganar_monedas' && (
                      <div className="mt-2">
                        <Badge className="bg-amber-400 text-black">
                          +{currentEvent.evento.cantidad} 🪙
                        </Badge>
                      </div>
                    )}
                  </Card>
                )}
                <Button onClick={handleClose}>
                  Aceptar
                </Button>
              </motion.div>
            )}
          </div>
        );

      case CasillaType.TRAMPA:
        return (
          <div className="text-center space-y-4">
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 0.5,
                repeat: 3
              }}
            >
              <Skull className="w-16 h-16 text-red-600 mx-auto" />
            </motion.div>
            <div>
              <p className="text-xl font-bold text-red-600">
                ¡Caíste en una trampa!
              </p>
              <p className="text-gray-600 mt-2">
                Pierdes tu próximo turno.
              </p>
            </div>
            <Button onClick={handleClose} variant="destructive">
              Aceptar castigo
            </Button>
          </div>
        );

      case CasillaType.DUELO:
        const opponents = gameState?.players.filter(
          p => p.player_id !== currentEvent.jugador
        ) || [];

        return (
          <div className="space-y-4">
            <div className="text-center">
              <Swords className="w-16 h-16 text-red-500 mx-auto mb-2" />
              <p className="text-xl font-bold text-red-600">
                ¡Duelo!
              </p>
              <p className="text-gray-600 mt-2">
                Elige un oponente para el duelo.
              </p>
              <p className="text-sm text-gray-500">
                El ganador robará una estrella al perdedor.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {opponents.map((player) => (
                <Button
                  key={player.player_id}
                  variant="outline"
                  className="p-4"
                  onClick={() => {
                    selectDuelOpponent(player.player_id);
                    handleClose();
                  }}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-2xl mb-1">{player.avatar}</span>
                    <span className="text-sm font-semibold">{player.nickname}</span>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        ⭐ {player.estrellas}
                      </Badge>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      <Dialog open={showCasillaEvent} onOpenChange={setShowCasillaEvent}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">
              {getCasillaTitle(currentEvent.tipo)}
            </DialogTitle>
            {currentEvent.descripcion && (
              <DialogDescription className="text-center">
                {currentEvent.descripcion}
              </DialogDescription>
            )}
          </DialogHeader>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {renderEventContent()}
          </motion.div>
        </DialogContent>
      </Dialog>
    </AnimatePresence>
  );
}

function getCasillaTitle(tipo: CasillaType): string {
  const titles = {
    [CasillaType.NORMAL]: 'Casilla Normal',
    [CasillaType.PREGUNTA]: 'Casilla de Pregunta',
    [CasillaType.ESTRELLA]: 'Casilla de Estrella',
    [CasillaType.EVENTO]: 'Casilla de Evento',
    [CasillaType.TRAMPA]: 'Casilla de Trampa',
    [CasillaType.DUELO]: 'Casilla de Duelo'
  };
  return titles[tipo] || 'Evento';
}
