import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export const JoinByCodePage = () => {
  const navigate = useNavigate();
  const [gameCode, setGameCode] = useState('');

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (gameCode.length !== 6) {
      toast.error('El código debe tener 6 caracteres');
      return;
    }

    // Redirigir a página intermedia que detecta el tipo de sala
    navigate(`/join/${gameCode.toUpperCase()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">🔢</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Ingresa el Código
          </h1>
          <p className="text-gray-600">
            Escribe el código que te dio tu profesor
          </p>
        </div>

        <form onSubmit={handleCodeSubmit} className="space-y-4">
          <div>
            <Input
              type="text"
              placeholder="ABC123"
              value={gameCode}
              onChange={(e) => setGameCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="text-center text-2xl font-bold tracking-widest uppercase"
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-2 text-center">
              6 caracteres
            </p>
          </div>

          <Button type="submit" className="w-full" size="lg">
            Continuar →
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/student/join')}
            className="w-full"
          >
            ← Volver
          </Button>
        </form>
      </Card>
    </div>
  );
};
