import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import apiClient from '@/lib/api';

/**
 * Página intermedia para links directos de juego
 * Detecta si es sala privada o libre y redirige apropiadamente
 */
export const JoinByLinkPage = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    const checkRoomType = async () => {
      if (!code) {
        navigate('/student/join', { replace: true });
        return;
      }

      try {
        const uppercaseCode = code.toUpperCase();
        
        // Verificar si es sala cerrada consultando estudiantes pre-cargados
        try {
          const response = await apiClient.get(`/api/rooms/${uppercaseCode}/students`);
          // Si responde con success y hay estudiantes, es sala cerrada
          if (response.data.success && response.data.data.students) {
            navigate(`/join/${uppercaseCode}/select-student`, { replace: true });
            return;
          }
        } catch (error: any) {
          // Error 400: No es sala cerrada
          // Error 404: Sala no encontrada
          console.log('Not a closed room or room not found:', error.response?.status);
        }
        
        // Si llegamos aquí, es sala abierta -> ir a personalización
        navigate(`/join/${uppercaseCode}/customize`, { replace: true });
      } catch (error) {
        console.error('Error checking room type:', error);
        navigate('/student/join', { replace: true });
      }
    };

    checkRoomType();
  }, [code, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
        <p className="text-gray-700 font-medium">Redirigiendo...</p>
      </div>
    </div>
  );
};
