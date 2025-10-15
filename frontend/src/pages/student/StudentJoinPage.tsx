import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';

export const StudentJoinPage = () => {
  const navigate = useNavigate();

  const options = [
    {
      id: 'code',
      icon: '🔢',
      title: 'Ingresar Código',
      description: 'Escribe el código del juego',
      path: '/student/join/code',
    },
    {
      id: 'qr',
      icon: '📷',
      title: 'Escanear QR',
      description: 'Usa la cámara para escanear',
      path: '/student/join/qr',
    },
    {
      id: 'login',
      icon: '👤',
      title: 'Tengo Usuario',
      description: 'Iniciar sesión',
      path: '/student/login-permanent',
    },
    {
      id: 'avatar',
      icon: '🎨',
      title: 'Soy de Inicial',
      description: 'Login con avatares',
      path: '/student/avatars',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            ¡Bienvenido Estudiante! 🎮
          </h1>
          <p className="text-lg text-gray-600">
            Selecciona cómo quieres unirte
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {options.slice(0, 3).map((option) => (
            <Card
              key={option.id}
              onClick={() => navigate(option.path)}
              className="p-6 hover:shadow-lg transition-all cursor-pointer hover:scale-105 bg-white"
            >
              <div className="text-center">
                <div className="text-6xl mb-3">{option.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {option.title}
                </h3>
                <p className="text-sm text-gray-600">{option.description}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Opción especial para Inicial - Más grande */}
        <Card
          onClick={() => navigate(options[3].path)}
          className="mt-4 p-8 hover:shadow-lg transition-all cursor-pointer hover:scale-105 bg-gradient-to-r from-pink-100 to-purple-100"
        >
          <div className="text-center">
            <div className="text-8xl mb-4">{options[3].icon}</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {options[3].title}
            </h3>
            <p className="text-lg text-gray-700">{options[3].description}</p>
          </div>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            ¿Primera vez?{' '}
            <a
              href="/student/register-permanent"
              className="text-blue-600 hover:underline font-medium"
            >
              Crea tu cuenta aquí
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
