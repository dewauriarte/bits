import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Star, Target, BookOpen, Plus, LogOut } from 'lucide-react';
import { classesApi } from '@/lib/api/classes';
import { toast } from 'sonner';
import JoinClassModal from '@/components/modals/JoinClassModal';

export const StudentDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showJoinModal, setShowJoinModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Cargar usuario del localStorage
      const storedUser = localStorage.getItem('user');
      const authToken = localStorage.getItem('auth_token');
      
      if (!storedUser || !authToken) {
        navigate('/student/login-permanent');
        return;
      }

      const userData = JSON.parse(storedUser);
      setUser(userData);

      // Cargar clases del estudiante
      const classesResponse = await classesApi.getMyClasses();
      setClasses(classesResponse.data || []);

      // TODO: Cargar stats del perfil gamer cuando el endpoint esté disponible
      setStats({
        nivel: 1,
        experiencia: 0,
        puntos_totales: 0,
        copas: 0,
        trofeos_oro: 0,
        trofeos_plata: 0,
        trofeos_bronce: 0,
      });

    } catch (error: any) {
      console.error('Error loading data:', error);
      if (error.response?.status === 401) {
        navigate('/student/login-permanent');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('session_type');
    localStorage.removeItem('user');
    navigate('/student/join');
  };

  const handleJoinSuccess = () => {
    loadData();
    setShowJoinModal(false);
    toast.success('¡Te has unido a la clase exitosamente!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl animate-bounce mb-4">📚</div>
          <p className="text-xl text-gray-700">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const totalTrofeos = (stats?.trofeos_oro || 0) + (stats?.trofeos_plata || 0) + (stats?.trofeos_bronce || 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
              {user.nombre?.charAt(0)}{user.apellido?.charAt(0)}
            </div>
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
            <LogOut className="h-4 w-4 mr-2" />
            Salir
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-100 to-blue-200 border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800">Nivel</p>
                  <h2 className="text-3xl font-bold text-blue-900">{stats?.nivel || 1}</h2>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
                  <Star className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-2">
                <div className="w-full bg-blue-300 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${((stats?.experiencia || 0) % 1000) / 10}%` }}
                  ></div>
                </div>
                <p className="text-xs text-blue-700 mt-1">{stats?.experiencia || 0} XP</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-100 to-yellow-200 border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-800">Puntos</p>
                  <h2 className="text-3xl font-bold text-yellow-900">
                    {Number(stats?.puntos_totales || 0).toLocaleString()}
                  </h2>
                </div>
                <div className="w-12 h-12 rounded-full bg-yellow-500 flex items-center justify-center">
                  <Target className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-100 to-purple-200 border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-800">Copas</p>
                  <h2 className="text-3xl font-bold text-purple-900">{stats?.copas || 0}</h2>
                </div>
                <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center text-2xl">
                  🏆
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-pink-100 to-pink-200 border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-pink-800">Trofeos</p>
                  <h2 className="text-3xl font-bold text-pink-900">{totalTrofeos}</h2>
                </div>
                <div className="w-12 h-12 rounded-full bg-pink-500 flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs">
                <span>🥇 {stats?.trofeos_oro || 0}</span>
                <span>🥈 {stats?.trofeos_plata || 0}</span>
                <span>🥉 {stats?.trofeos_bronce || 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mis Clases */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Mis Clases
                </CardTitle>
                <CardDescription>
                  Clases en las que estás inscrito
                </CardDescription>
              </div>
              <Button onClick={() => setShowJoinModal(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Unirse a Clase
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {classes.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-xl font-semibold mb-2">No estás en ninguna clase aún</h3>
                <p className="text-gray-600 mb-4">
                  Únete a una clase usando el código que te dio tu profesor
                </p>
                <Button onClick={() => setShowJoinModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Unirse a una Clase
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {classes.map((inscripcion: any) => (
                  <Card
                    key={inscripcion.id}
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => navigate(`/student/classes/${inscripcion.clase?.id}`)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">
                            {inscripcion.clase?.nombre}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {inscripcion.clase?.descripcion || 'Sin descripción'}
                          </CardDescription>
                        </div>
                        <div className="text-2xl">
                          {inscripcion.clase?.materias?.icono || '📚'}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <span>👨‍🏫</span>
                          <span>
                            {inscripcion.clase?.usuarios?.nombre} {inscripcion.clase?.usuarios?.apellido}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <span>📚</span>
                          <span>{inscripcion.clase?.materias?.nombre}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <span>🎓</span>
                          <span>{inscripcion.clase?.grados?.nombre}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Últimos Resultados - Próximamente */}
        <Card className="bg-gradient-to-r from-orange-50 to-pink-50">
          <CardHeader>
            <CardTitle>Últimos Resultados</CardTitle>
            <CardDescription>Tus partidas más recientes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <div className="text-5xl mb-2">🎮</div>
              <p>Aún no has jugado ninguna partida</p>
              <p className="text-sm mt-1">¡Únete a un juego para ver tus resultados aquí!</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal Unirse a Clase */}
      {showJoinModal && (
        <JoinClassModal
          open={showJoinModal}
          onClose={() => setShowJoinModal(false)}
          onSuccess={handleJoinSuccess}
        />
      )}
    </div>
  );
};
