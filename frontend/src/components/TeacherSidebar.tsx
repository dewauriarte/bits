import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  Trophy, 
  Settings,
  GraduationCap
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

interface TeacherSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TeacherSidebar = ({ isOpen, onClose }: TeacherSidebarProps) => {
  const location = useLocation();
  const { user } = useAuthStore();

  const menuItems = [
    {
      icon: LayoutDashboard,
      label: 'Dashboard',
      path: '/dashboard',
    },
    {
      icon: BookOpen,
      label: 'Mis Quizzes',
      path: '/teacher/quizzes',
    },
    {
      icon: Users,
      label: 'Mis Clases',
      path: '/clases',
    },
    {
      icon: Trophy,
      label: 'Resultados',
      path: '/resultados',
    },
    {
      icon: Settings,
      label: 'Configuración',
      path: '/configuracion',
    },
  ];

  return (
    <>
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-screen bg-white border-r border-gray-200',
          'transition-[width] duration-300 ease-in-out overflow-hidden',
          isOpen ? 'w-64' : 'w-16'
        )}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className={cn(
            'border-b border-gray-200 transition-[padding] duration-300 ease-in-out',
            isOpen ? 'p-6' : 'p-3'
          )}>
            <Link to="/dashboard" className="flex items-center gap-2 justify-center">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div className={cn(
                'transition-opacity duration-300 ease-in-out',
                isOpen ? 'opacity-100 delay-150' : 'opacity-0 w-0 overflow-hidden'
              )}>
                <h1 className="text-xl font-bold text-gray-900 whitespace-nowrap">QuizBit</h1>
                <p className="text-xs text-gray-500 whitespace-nowrap">Panel Docente</p>
              </div>
            </Link>
          </div>

          {/* User Info */}
          {user && isOpen && (
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-indigo-600 font-semibold text-sm">
                    {user.nombre.charAt(0)}
                    {user.apellido?.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.nombre} {user.apellido}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">{user.rol}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  title={!isOpen ? item.label : undefined}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                    !isOpen && 'justify-center px-0',
                    isActive
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className={cn(
                    'font-medium transition-opacity duration-300 ease-in-out whitespace-nowrap',
                    isOpen ? 'opacity-100 delay-150' : 'opacity-0 w-0 overflow-hidden'
                  )}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={onClose}
        />
      )}
    </>
  );
};
