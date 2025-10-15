import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { TeacherSidebar } from '@/components/TeacherSidebar';
import { TeacherTopBar } from '@/components/TeacherTopBar';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

export const TeacherLayout = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, token } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Dar tiempo para que Zustand cargue del localStorage
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isLoading) return;

    // Si no está autenticado, redirigir al login
    if (!isAuthenticated || !token || !user) {
      navigate('/login');
      return;
    }

    // Si es estudiante, redirigir a su dashboard
    if (user.rol === 'estudiante') {
      navigate('/dashboard/student');
      return;
    }

    // Solo profesor y admin pueden acceder
    if (user.rol !== 'profesor' && user.rol !== 'admin') {
      navigate('/login');
      return;
    }
  }, [isLoading, isAuthenticated, token, user, navigate]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl animate-bounce mb-4">⏳</div>
          <p className="text-xl text-gray-700">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TeacherSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className={cn(
        'transition-[padding-left] duration-300 ease-in-out',
        sidebarOpen ? 'pl-64' : 'pl-16'
      )}>
        <TeacherTopBar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="min-h-screen p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
