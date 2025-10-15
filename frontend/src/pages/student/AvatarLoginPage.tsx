import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { studentAuthApi } from '@/lib/api/studentAuth';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface Avatar {
  id: string;
  emoji: string;
  color: string;
  nombre_avatar: string;
  estudiante_nombre: string | null;
  estudiante_id: string | null;
  asignado: boolean;
}

export const AvatarLoginPage = () => {
  const navigate = useNavigate();
  const { class_id } = useParams<{ class_id: string }>();
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);

  useEffect(() => {
    loadAvatars();
  }, [class_id]);

  const loadAvatars = async () => {
    if (!class_id) {
      toast.error('Clase no encontrada');
      navigate('/student/join');
      return;
    }

    try {
      const result = await studentAuthApi.getClassAvatars(class_id);
      
      if (result.success) {
        setAvatars(result.data.avatars);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al cargar avatares');
      navigate('/student/join');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarClick = async (avatar: Avatar) => {
    if (!avatar.asignado || !avatar.estudiante_id) {
      toast.error('Este avatar no está asignado');
      return;
    }

    setSelectedAvatar(avatar.id);

    try {
      const result = await studentAuthApi.loginByAvatar({
        avatar_id: avatar.id,
        class_id: class_id!,
      });

      if (result.success) {
        // Guardar token
        localStorage.setItem('auth_token', result.data.accessToken);
        localStorage.setItem('refresh_token', result.data.refreshToken);
        localStorage.setItem('session_type', result.data.session_type);
        localStorage.setItem('user', JSON.stringify(result.data.user));

        toast.success(result.message || `¡Hola ${result.data.user.nombre}! 👋`);
        
        // Redirigir al dashboard
        navigate('/dashboard/student');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al iniciar sesión');
      setSelectedAvatar(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl animate-bounce mb-4">🎨</div>
          <p className="text-xl text-gray-700">Cargando avatares...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-100 p-4">
      <div className="max-w-6xl mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            ¿Quién eres? 🎨
          </h1>
          <p className="text-xl text-gray-600">
            Toca tu animal favorito
          </p>
        </div>

        <div className="grid grid-cols-4 md:grid-cols-5 gap-4 mb-8">
          {avatars.map((avatar, index) => (
            <motion.div
              key={avatar.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                onClick={() => handleAvatarClick(avatar)}
                className={`
                  relative p-6 cursor-pointer transition-all
                  ${avatar.asignado 
                    ? 'hover:scale-110 hover:shadow-2xl bg-white' 
                    : 'opacity-30 cursor-not-allowed bg-gray-100'
                  }
                  ${selectedAvatar === avatar.id ? 'ring-4 ring-green-500 scale-110' : ''}
                `}
                style={{
                  borderColor: avatar.asignado ? avatar.color : '#ccc',
                  borderWidth: '3px',
                }}
              >
                <div className="text-center">
                  <div className="text-7xl mb-2">
                    {avatar.emoji}
                  </div>
                  {avatar.asignado && avatar.estudiante_nombre && (
                    <div className="text-sm font-bold text-gray-900 mt-2">
                      {avatar.estudiante_nombre}
                    </div>
                  )}
                </div>

                {selectedAvatar === avatar.id && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 rounded-lg">
                    <div className="text-4xl animate-spin">⏳</div>
                  </div>
                )}
              </Card>
            </motion.div>
          ))}
        </div>

        {avatars.filter(a => a.asignado).length === 0 && (
          <div className="text-center">
            <Card className="p-8 bg-yellow-50">
              <div className="text-5xl mb-4">⚠️</div>
              <p className="text-lg text-gray-700">
                No hay avatares asignados en esta clase.
                <br />
                Pídele a tu profesor que te asigne uno.
              </p>
            </Card>
          </div>
        )}

        <div className="text-center mt-6">
          <Button
            variant="ghost"
            size="lg"
            onClick={() => navigate('/student/join')}
            className="text-lg"
          >
            ← Ver otras opciones
          </Button>
        </div>

        {/* Leyenda */}
        <div className="mt-8 text-center">
          <div className="inline-block bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">
              💡 <strong>Para profesores:</strong> Los avatares transparentes no están asignados
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
