import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const { isAuthenticated, token, fetchMe, isLoading } = useAuthStore();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      // Si hay token pero no está autenticado, intentar obtener usuario
      if (token && !isAuthenticated) {
        try {
          await fetchMe();
        } catch (error) {
          console.error('Failed to verify authentication:', error);
        }
      }
      setIsVerifying(false);
    };

    verifyAuth();
  }, [token, isAuthenticated, fetchMe]);

  // Mostrar loading mientras verifica
  if (isVerifying || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Verificando autenticación...</p>
        </motion.div>
      </div>
    );
  }

  // Si no está autenticado, redirigir a login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Usuario autenticado, mostrar contenido
  return <>{children}</>;
}
