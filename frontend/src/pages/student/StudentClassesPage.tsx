import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, BookOpen } from 'lucide-react';
import { classesApi } from '@/lib/api/classes';
import { toast } from 'sonner';
import JoinClassModal from '@/components/modals/JoinClassModal';

export default function StudentClassesPage() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showJoinModal, setShowJoinModal] = useState(false);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const response = await classesApi.getMyClasses();
      setClasses(response.data || []);
    } catch (error: any) {
      console.error('Error loading classes:', error);
      toast.error('Error al cargar tus clases');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSuccess = () => {
    loadClasses();
    setShowJoinModal(false);
    toast.success('¡Te has unido a la clase exitosamente!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl animate-bounce mb-4">📚</div>
          <p className="text-xl text-gray-700">Cargando clases...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard/student')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Mis Clases</h1>
                <p className="text-sm text-gray-600">
                  Clases en las que estás inscrito
                </p>
              </div>
            </div>
            <Button onClick={() => setShowJoinModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Unirse a Clase
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {classes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <BookOpen className="h-24 w-24 text-gray-400 mb-4" />
              <h3 className="text-2xl font-semibold mb-2">No estás en ninguna clase aún</h3>
              <p className="text-gray-600 mb-6 text-center max-w-md">
                Únete a una clase usando el código que te dio tu profesor para empezar a jugar y aprender
              </p>
              <Button onClick={() => setShowJoinModal(true)} size="lg">
                <Plus className="h-5 w-5 mr-2" />
                Unirse a una Clase
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((inscripcion: any) => (
              <Card
                key={inscripcion.id}
                className="hover:shadow-xl transition-all cursor-pointer hover:scale-105"
                onClick={() => navigate(`/student/classes/${inscripcion.clase?.id}`)}
              >
                <CardHeader className="bg-gradient-to-br from-blue-50 to-purple-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-1">
                        {inscripcion.clase?.nombre}
                      </CardTitle>
                      <CardDescription>
                        {inscripcion.clase?.grados?.nombre} • {inscripcion.clase?.anio_escolar}
                      </CardDescription>
                    </div>
                    <div className="text-4xl">
                      {inscripcion.clase?.materias?.icono || '📚'}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {/* Profesor */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                        {inscripcion.clase?.usuarios?.nombre?.charAt(0)}
                        {inscripcion.clase?.usuarios?.apellido?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {inscripcion.clase?.usuarios?.nombre} {inscripcion.clase?.usuarios?.apellido}
                        </p>
                        <p className="text-xs text-gray-600">Profesor</p>
                      </div>
                    </div>

                    {/* Materia */}
                    <div className="flex items-center gap-2 text-gray-700">
                      <span className="text-xl">{inscripcion.clase?.materias?.icono}</span>
                      <div>
                        <p className="text-sm font-medium">{inscripcion.clase?.materias?.nombre}</p>
                        <p className="text-xs text-gray-600">Materia</p>
                      </div>
                    </div>

                    {/* Descripción */}
                    {inscripcion.clase?.descripcion && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {inscripcion.clase.descripcion}
                      </p>
                    )}

                    {/* Código de clase */}
                    <div className="bg-gray-50 rounded-lg p-3 mt-4">
                      <p className="text-xs text-gray-600 mb-1">Código de clase</p>
                      <p className="text-lg font-mono font-bold text-indigo-600">
                        {inscripcion.clase?.codigo}
                      </p>
                    </div>

                    {/* Estado y fecha */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✓ Inscrito
                      </span>
                      <p className="text-xs text-gray-500">
                        Desde {new Date(inscripcion.fecha_inscripcion).toLocaleDateString('es-ES', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Próximos Juegos - Sección para el futuro */}
        {classes.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Próximos Juegos</CardTitle>
              <CardDescription>
                Juegos programados por tus profesores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <div className="text-5xl mb-2">🎮</div>
                <p>No hay juegos programados</p>
                <p className="text-sm mt-1">
                  Tus profesores programarán juegos pronto
                </p>
              </div>
            </CardContent>
          </Card>
        )}
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
}
