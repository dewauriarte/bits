import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface StudentUser {
  nombre: string;
  apellido?: string;
  username: string;
}

export const StudentDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<StudentUser | null>(null);

  useEffect(() => {
    // Cargar usuario del localStorage
    const storedUser = localStorage.getItem('user');
    const authToken = localStorage.getItem('auth_token');
    
    if (storedUser && authToken) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing user:', error);
        navigate('/student/login-permanent');
      }
    } else {
      navigate('/student/login-permanent');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('session_type');
    localStorage.removeItem('user');
    navigate('/student/join');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl animate-bounce mb-4">⏳</div>
          <p className="text-xl text-gray-700">Cargando...</p>
        </div>
      </div>
    );
  }

  const menuOptions = [
    {
      id: 'jugar',
      icon: '🎮',
      title: 'Jugar Quiz',
      description: 'Únete a un juego',
      color: 'from-blue-400 to-blue-600',
      onClick: () => navigate('/student/join'),
    },
    {
      id: 'estadisticas',
      icon: '📊',
      title: 'Mis Estadísticas',
      description: 'Ver mi progreso',
      color: 'from-green-400 to-green-600',
      onClick: () => alert('Próximamente: Ver estadísticas'),
    },
    {
      id: 'logros',
      icon: '🏆',
      title: 'Mis Logros',
      description: 'Trofeos y medallas',
      color: 'from-yellow-400 to-yellow-600',
      onClick: () => alert('Próximamente: Ver logros'),
    },
    {
      id: 'perfil',
      icon: '👤',
      title: 'Mi Perfil',
      description: 'Editar información',
      color: 'from-purple-400 to-purple-600',
      onClick: () => alert('Próximamente: Editar perfil'),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-4xl">👋</div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                ¡Hola, {user.nombre}!
              </h1>
              <p className="text-sm text-gray-600">
                @{user.username}
              </p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="text-red-600 border-red-300 hover:bg-red-50"
          >
            Salir 👋
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6 bg-gradient-to-br from-blue-100 to-blue-200">
            <div className="text-center">
              <div className="text-5xl mb-2">⭐</div>
              <div className="text-3xl font-bold text-gray-900">0</div>
              <p className="text-sm text-gray-700">Puntos Totales</p>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-100 to-green-200">
            <div className="text-center">
              <div className="text-5xl mb-2">🎯</div>
              <div className="text-3xl font-bold text-gray-900">0</div>
              <p className="text-sm text-gray-700">Juegos Jugados</p>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-100 to-purple-200">
            <div className="text-center">
              <div className="text-5xl mb-2">🏅</div>
              <div className="text-3xl font-bold text-gray-900">0</div>
              <p className="text-sm text-gray-700">Trofeos</p>
            </div>
          </Card>
        </div>

        {/* Menu Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {menuOptions.map((option, index) => (
            <motion.div
              key={option.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                onClick={option.onClick}
                className={`p-8 cursor-pointer hover:scale-105 transition-all bg-gradient-to-br ${option.color} text-white shadow-lg hover:shadow-2xl`}
              >
                <div className="text-center">
                  <div className="text-7xl mb-4">{option.icon}</div>
                  <h3 className="text-2xl font-bold mb-2">
                    {option.title}
                  </h3>
                  <p className="text-lg opacity-90">
                    {option.description}
                  </p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <Card className="p-6 bg-gradient-to-r from-orange-100 to-pink-100">
            <div className="text-center">
              <div className="text-6xl mb-4">🚀</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                ¿Listo para jugar?
              </h2>
              <p className="text-gray-700 mb-4">
                Pídele a tu profesor el código del juego
              </p>
              <Button
                onClick={() => navigate('/student/join')}
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white text-xl px-8 py-6"
              >
                Ingresar Código 🎮
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
