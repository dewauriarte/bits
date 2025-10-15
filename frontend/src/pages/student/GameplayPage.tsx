import { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import gameSocket from '@/lib/socket';
import { toast } from 'sonner';
import { useGameplayStore } from '@/stores/gameplayStore';
import WaitingScreen from '@/components/gameplay/WaitingScreen';
import QuestionScreen from '@/components/gameplay/QuestionScreen';
import AnswerFeedbackScreen from '@/components/gameplay/AnswerFeedbackScreen';
import LeaderboardScreen from '@/components/gameplay/LeaderboardScreen';
import FinalResultsScreen from '@/components/gameplay/FinalResultsScreen';

export default function GameplayPage() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const initializedRef = useRef(false);

  // Zustand store
  const {
    gameState,
    currentQuestion,
    timeRemaining,
    myAnswer,
    answerResult,
    leaderboard,
    finalResults,
    myScore,
    myCombo,
    countdown,
    setRoomCode,
    setMyAnswer,
    setGameState,
    initializeSocketListeners,
    cleanupSocketListeners,
  } = useGameplayStore();

  useEffect(() => {
    // Prevent double initialization
    if (initializedRef.current) {
      console.log('⚠️ Skipping duplicate initialization');
      return;
    }
    
    initializedRef.current = true;
    
    // Set room code
    if (roomCode) {
      setRoomCode(roomCode);
      console.log('🎮 GameplayPage mounted with roomCode:', roomCode);
    }

    // Initialize socket listeners
    initializeSocketListeners();

    // Cleanup on unmount
    return () => {
      initializedRef.current = false;
      cleanupSocketListeners();
    };
  }, [roomCode, setRoomCode, initializeSocketListeners, cleanupSocketListeners]);

  // Debug: Log gameState changes
  useEffect(() => {
    console.log('🔄 GameState changed to:', gameState);
  }, [gameState]);

  const handleAnswerSubmit = (answer: string | string[] | Record<string, string>) => {
    if (!currentQuestion || myAnswer) return;

    setMyAnswer(answer);

    const timeTaken = currentQuestion.timeLimit - timeRemaining;
    
    console.log('📤 Submitting answer:', {
      questionType: currentQuestion.tipo,
      answer,
      questionId: currentQuestion.questionId,
      timeTaken,
    });

    const socket = gameSocket.getSocket();
    if (!socket) {
      toast.error('No hay conexión con el servidor');
      return;
    }

    socket.emit(
      'answer:submit',
      {
        roomCode,
        questionId: currentQuestion.questionId,
        answer,
        timeTaken,
      },
      (response: any) => {
        console.log('📥 Answer response:', response);
        if (response.success) {
          const result = response.data;
          useGameplayStore.getState().setAnswerResult(result);
          setGameState('feedback');
        } else {
          toast.error(response.message || 'Error al enviar respuesta');
        }
      }
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-600 to-red-600 flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        {gameState === 'waiting' && (
          <WaitingScreen key="waiting" message="Prepárate para la siguiente pregunta..." />
        )}

        {gameState === 'countdown' && (
          <WaitingScreen key="countdown" countdown={countdown} />
        )}

        {gameState === 'question' && currentQuestion && (
          <QuestionScreen
            key="question"
            question={currentQuestion}
            timeRemaining={timeRemaining}
            selectedAnswer={myAnswer}
            onAnswerSelect={handleAnswerSubmit}
            myScore={myScore}
            myCombo={myCombo}
          />
        )}

        {gameState === 'feedback' && answerResult && currentQuestion && (
          <AnswerFeedbackScreen
            key="feedback"
            isCorrect={answerResult.isCorrect}
            points={answerResult.points}
            breakdown={answerResult.breakdown}
            comboStreak={answerResult.comboStreak}
            correctAnswer={answerResult.correctAnswer}
            question={{
              texto: currentQuestion.texto,
              tipo: currentQuestion.tipo,
              opciones: currentQuestion.opciones,
              explicacion: currentQuestion.explicacion || undefined,
            }}
          />
        )}

        {gameState === 'leaderboard' && leaderboard.length > 0 && (
          <LeaderboardScreen
            key="leaderboard"
            leaderboardData={{
              leaderboard,
              answersCount: leaderboard.length,
              totalPlayers: leaderboard.length,
            }}
            myScore={myScore}
          />
        )}

        {gameState === 'finished' && finalResults && (
          <FinalResultsScreen
            key="finished"
            finalResults={finalResults}
            onContinue={() => navigate('/student/dashboard')}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
