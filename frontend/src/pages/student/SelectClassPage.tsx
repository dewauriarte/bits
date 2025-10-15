import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export const SelectClassPage = () => {
  const navigate = useNavigate();
  const [classCode, setClassCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!classCode.trim()) {
      toast.error('Por favor ingresa el código de tu clase');
      return;
    }

    // Navegar a la página de avatares con el código de clase
    navigate(`/student/avatars/${classCode}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="p-8 shadow-xl">
          <div className="text-center mb-6">
            <div className="text-7xl mb-4">🎨</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Login con Avatares
            </h1>
            <p className="text-gray-600">
              Ingresa el código que te dio tu profesora
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="classCode" className="text-lg">
                Código de la Clase
              </Label>
              <Input
                id="classCode"
                type="text"
                placeholder="ABC123"
                value={classCode}
                onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                className="text-center text-2xl font-bold uppercase tracking-wider"
                maxLength={10}
                autoFocus
              />
              <p className="text-xs text-gray-500 text-center">
                Pregúntale a tu profesor(a) por el código
              </p>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-lg"
            >
              Ver mis avatares →
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Button
              variant="ghost"
              onClick={() => navigate('/student/join')}
            >
              ← Volver
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
