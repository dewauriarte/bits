import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { User, BookOpen, Users, Trophy, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { classesApi } from '@/lib/api/classes';
import { useNavigate } from 'react-router-dom';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalClases: 0,
    totalEstudiantes: 0,
    clasesRecientes: [] as any[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await classesApi.getClasses({ limit: 5 });
      
      // Calcular total de estudiantes
      const totalEstudiantes = response.data.clases.reduce(
        (acc: number, clase: any) => acc + (clase.estudiantes_count || 0),
        0
      );

      setStats({
        totalClases: response.data.total || 0,
        totalEstudiantes,
        clasesRecientes: response.data.clases || [],
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = () => {
    if (!user) return 'U';
    return `${user.nombre[0]}${user.apellido[0]}`.toUpperCase();
  };

  const getRoleBadge = (rol: string) => {
    const badges = {
      admin: 'bg-red-100 text-red-800 border-red-200',
      profesor: 'bg-blue-100 text-blue-800 border-blue-200',
      estudiante: 'bg-green-100 text-green-800 border-green-200',
    };
    return badges[rol as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-6xl animate-bounce mb-4">📊</div>
          <p className="text-gray-600">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clases</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClases}</div>
            <p className="text-xs text-muted-foreground">Clases activas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Estudiantes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEstudiantes}</div>
            <p className="text-xs text-muted-foreground">En todas tus clases</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quizzes Creados</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Próximamente</p>
          </CardContent>
        </Card>
      </div>

      {/* Acciones Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>Gestiona tus clases y quizzes</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button onClick={() => navigate('/clases')} className="h-24">
            <div className="flex flex-col items-center gap-2">
              <Plus className="h-6 w-6" />
              <span>Nueva Clase</span>
            </div>
          </Button>
          <Button variant="outline" onClick={() => navigate('/clases')} className="h-24">
            <div className="flex flex-col items-center gap-2">
              <BookOpen className="h-6 w-6" />
              <span>Ver Mis Clases</span>
            </div>
          </Button>
        </CardContent>
      </Card>

      {/* Clases Recientes */}
      <Card>
        <CardHeader>
          <CardTitle>Clases Recientes</CardTitle>
          <CardDescription>Últimas clases creadas</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.clasesRecientes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No tienes clases aún</p>
              <Button onClick={() => navigate('/clases')} className="mt-4">
                Crear Primera Clase
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {stats.clasesRecientes.map((clase: any) => (
                <div
                  key={clase.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/clases/${clase.id}`)}
                >
                  <div>
                    <h3 className="font-semibold">{clase.nombre}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                      <span>📚 {clase.materias?.nombre || 'Sin materia'}</span>
                      <span>🎓 {clase.grados?.nombre || 'Sin grado'}</span>
                      <span>👥 {clase.estudiantes_count || 0} estudiantes</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono bg-gray-100 px-3 py-1 rounded">
                      {clase.codigo}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Perfil del Usuario */}
      <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="shadow-xl border-0">
            <CardHeader className="text-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="mx-auto"
              >
                <Avatar className="w-24 h-24 border-4 border-indigo-100">
                  <AvatarFallback className="text-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
              </motion.div>
              <div>
                <CardTitle className="text-3xl">
                  ¡Bienvenido, {user?.nombre}! 👋
                </CardTitle>
                <CardDescription className="text-lg mt-2">
                  Has iniciado sesión exitosamente
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* User Info */}
              <div className="bg-gray-50 rounded-lg p-6 space-y-3">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-indigo-600" />
                  Información de Usuario
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Nombre Completo</p>
                    <p className="font-medium text-gray-900">
                      {user?.nombre} {user?.apellido}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Username</p>
                    <p className="font-medium text-gray-900">@{user?.username}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-gray-900">{user?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Rol</p>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getRoleBadge(
                        user?.rol || ''
                      )}`}
                    >
                      {user?.rol?.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Perfil Gamer */}
              {user?.perfil_gamer && (
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-6 space-y-3">
                  <h3 className="font-semibold text-gray-900 mb-4">🎮 Perfil Gamer</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Nivel</p>
                      <p className="text-2xl font-bold text-indigo-600">
                        {user.perfil_gamer.nivel}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Puntos Totales</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {user.perfil_gamer.puntos_totales}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Racha Actual</p>
                      <p className="text-xl font-bold text-orange-600">
                        🔥 {user.perfil_gamer.racha_actual}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Monedas</p>
                      <p className="text-xl font-bold text-yellow-600">
                        💰 {user.perfil_gamer.monedas}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Status Message */}
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  🚀 <strong>¡Todo listo!</strong> El sistema de autenticación está funcionando correctamente.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
    </div>
  );
}
