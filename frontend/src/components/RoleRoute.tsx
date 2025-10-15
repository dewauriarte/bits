import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldAlert } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { UserRole } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface RoleRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  redirectTo?: string;
}

export default function RoleRoute({ children, allowedRoles, redirectTo }: RoleRouteProps) {
  const { role, isAuthenticated } = useAuthStore();

  // Si no está autenticado, redirigir a login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si el rol no está en los permitidos
  if (role && !allowedRoles.includes(role)) {
    // Si hay redirect personalizado, usarlo
    if (redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }

    // Mostrar página 403
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="max-w-md shadow-xl border-0">
            <CardHeader className="text-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="mx-auto w-20 h-20 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl flex items-center justify-center"
              >
                <ShieldAlert className="w-10 h-10 text-white" />
              </motion.div>
              <div>
                <CardTitle className="text-4xl font-bold text-gray-900">403</CardTitle>
                <CardDescription className="text-lg mt-2">Acceso No Autorizado</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-600">
                No tienes los permisos necesarios para acceder a esta página.
              </p>
              <p className="text-sm text-gray-500">
                Tu rol actual es: <span className="font-semibold text-gray-700">{role}</span>
              </p>
              <div className="flex gap-3 justify-center pt-4">
                <Button
                  onClick={() => window.history.back()}
                  variant="outline"
                  className="border-gray-300"
                >
                  Volver Atrás
                </Button>
                <Button
                  onClick={() => (window.location.href = '/dashboard')}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                >
                  Ir al Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Usuario tiene el rol correcto
  return <>{children}</>;
}
