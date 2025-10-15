import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import apiClient from '@/lib/api';

const AVAILABLE_AVATARS = [
  '😀', '😎', '🤓', '🥳', '😺', '🐶', '🐼', '🐯', 
  '🦁', '🐸', '🐙', '🦄', '🦊', '🐨', '🐮', '🐷',
  '🚀', '⚡', '🌟', '🔥', '💎', '🏆', '🎮', '🎨'
];

export const JoinCustomizePage = () => {
  const navigate = useNavigate();
  const { code } = useParams<{ code: string }>();
  const [nickname, setNickname] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVAILABLE_AVATARS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [usedAvatars, setUsedAvatars] = useState<string[]>([]);

  useEffect(() => {
    if (!code) {
      navigate('/student/join');
      return;
    }
    loadUsedAvatars();
  }, [code, navigate]);

  // Ajustar avatar seleccionado si ya no está disponible
  useEffect(() => {
    if (usedAvatars.length > 0 && usedAvatars.includes(selectedAvatar)) {
      const availableAvatars = AVAILABLE_AVATARS.filter(a => !usedAvatars.includes(a));
      if (availableAvatars.length > 0) {
        setSelectedAvatar(availableAvatars[0]);
      }
    }
  }, [usedAvatars, selectedAvatar]);

  const loadUsedAvatars = async () => {
    try {
      const response = await apiClient.get(`/api/rooms/${code}`);
      const usedAvatars = response.data.data.usedAvatars || [];
      setUsedAvatars(usedAvatars);
    } catch (error) {
      console.error('Error loading used avatars:', error);
      setUsedAvatars([]);
    }
  };

  const handleJoin = async () => {
    if (!nickname.trim()) {
      toast.error('Por favor escribe tu nombre');
      return;
    }

    if (!selectedAvatar) {
      toast.error('Por favor selecciona un avatar');
      return;
    }

    setIsLoading(true);

    try {
      // Crear token temporal anónimo (simple)
      const tempToken = `temp_${code}_${Date.now()}_${Math.random().toString(36)}`;
      localStorage.setItem('auth_token', tempToken);
      localStorage.setItem('session_type', 'anonymous');
      
      // Guardar datos temporales para usarlos en el lobby
      sessionStorage.setItem('pending_join', JSON.stringify({
        roomCode: code,
        nickname: nickname.trim(),
        avatar: selectedAvatar,
      }));

      // Navegar al lobby
      navigate(`/game/${code}/lobby`);
    } catch (error: any) {
      toast.error(error.message || 'Error al unirse');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-8">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">{selectedAvatar}</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ¡Personaliza tu Avatar! 🎨
          </h1>
          <p className="text-gray-600">
            Código de sala: <span className="font-mono font-bold text-indigo-600">{code}</span>
          </p>
        </div>

        <div className="space-y-6">
          {/* Nickname Input */}
          <div>
            <Label htmlFor="nickname" className="text-lg font-semibold mb-2 block">
              ¿Cómo te llamas?
            </Label>
            <Input
              id="nickname"
              type="text"
              placeholder="Tu nombre o apodo"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
              className="text-lg py-6"
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1">
              Máximo 20 caracteres
            </p>
          </div>

          {/* Avatar Selector */}
          <div>
            <Label className="text-lg font-semibold mb-3 block">
              Elige tu Avatar
            </Label>
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-3">
              {AVAILABLE_AVATARS
                .filter(avatar => !usedAvatars.includes(avatar)) // Filtrar avatares ya usados
                .map((avatar, index) => (
                  <motion.button
                    key={avatar}
                    type="button"
                    onClick={() => setSelectedAvatar(avatar)}
                    className={`
                      text-4xl p-3 rounded-lg transition-all
                      ${selectedAvatar === avatar
                        ? 'bg-indigo-100 ring-4 ring-indigo-500 scale-110'
                        : 'bg-gray-50 hover:bg-gray-100 hover:scale-105'
                      }
                    `}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.02 }}
                    whileHover={{ scale: selectedAvatar === avatar ? 1.1 : 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {avatar}
                  </motion.button>
                ))}
            </div>
          </div>

          {/* Preview */}
          <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6">
            <p className="text-sm text-gray-600 mb-2 text-center">Vista Previa</p>
            <div className="flex items-center justify-center space-x-4">
              <div className="text-6xl">{selectedAvatar}</div>
              <div className="text-2xl font-bold text-gray-900">
                {nickname || 'Tu nombre'}
              </div>
            </div>
          </Card>

          {/* Buttons */}
          <div className="space-y-3 pt-4">
            <Button
              onClick={handleJoin}
              className="w-full"
              size="lg"
              disabled={isLoading || !nickname.trim()}
            >
              {isLoading ? 'Uniéndose...' : '¡Entrar a la Sala! 🚀'}
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/student/join')}
              className="w-full"
              disabled={isLoading}
            >
              ← Cancelar
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
