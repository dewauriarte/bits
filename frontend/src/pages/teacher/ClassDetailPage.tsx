import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, QrCode, Share2, Trash2, Edit2, MoreVertical, Upload, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { classesApi } from '@/lib/api/classes';
import { toast } from 'sonner';
import ViewCodeModal from '@/components/modals/ViewCodeModal';
import EditClassModal from '@/components/modals/EditClassModal';
import DeleteClassModal from '@/components/modals/DeleteClassModal';
import ImportStudentsModal from '@/components/modals/ImportStudentsModal';
import AddStudentModal from '@/components/modals/AddStudentModal';
import RemoveStudentModal from '@/components/modals/RemoveStudentModal';

export default function ClassDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [clase, setClase] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [studentToRemove, setStudentToRemove] = useState<any>(null);

  useEffect(() => {
    if (id) {
      loadClassDetail();
      loadStudents();
    }
  }, [id]);

  const loadClassDetail = async () => {
    try {
      setLoading(true);
      const response = await classesApi.getClassById(id!);
      setClase(response.data);
    } catch (error: any) {
      console.error('Error loading class:', error);
      toast.error('Error al cargar la clase');
      navigate('/clases');
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      const response = await classesApi.getClassStudents(id!);
      setStudents(response.data || []);
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  const handleRemoveClick = (student: any) => {
    setStudentToRemove(student);
  };

  const handleRemoveSuccess = () => {
    loadStudents();
    setStudentToRemove(null);
  };

  const handleEditSuccess = () => {
    loadClassDetail();
  };

  const handleDeleteSuccess = () => {
    navigate('/clases');
  };

  const handleImportSuccess = () => {
    loadStudents();
    setShowImportModal(false);
  };

  const handleAddSuccess = () => {
    loadStudents();
    setShowAddModal(false);
  };

  if (loading || !clase) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-6xl animate-bounce mb-4">📚</div>
          <p className="text-gray-600">Cargando clase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/clases')}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Mis Clases
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">{clase.nombre}</h1>
          <p className="text-gray-600 mt-1">
            {clase.descripcion || 'Sin descripción'}
          </p>
          <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
            <span>📚 {clase.materias?.nombre}</span>
            <span>🎓 {clase.grados?.nombre}</span>
            <span>📅 {clase.anio_escolar}</span>
            <span className="font-mono bg-gray-100 px-2 py-1 rounded">{clase.codigo}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowCodeModal(true)} variant="outline">
            <QrCode className="h-4 w-4 mr-2" />
            Compartir Código
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowEditModal(true)}>
                <Edit2 className="h-4 w-4 mr-2" />
                Editar Clase
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowDeleteModal(true)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Archivar Clase
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="estudiantes" className="w-full">
        <TabsList>
          <TabsTrigger value="estudiantes">
            <Users className="h-4 w-4 mr-2" />
            Estudiantes ({students.length})
          </TabsTrigger>
          <TabsTrigger value="quizzes">
            Quizzes (0)
          </TabsTrigger>
          <TabsTrigger value="estadisticas">
            Estadísticas
          </TabsTrigger>
        </TabsList>

        {/* Tab Estudiantes */}
        <TabsContent value="estudiantes" className="space-y-4">
          {students.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-64">
                <Users className="h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No hay estudiantes aún</h3>
                <p className="text-gray-600 mb-4 text-center">
                  Comparte el código de clase para que los estudiantes se unan<br/>
                  o importa una lista desde Excel
                </p>
                <div className="flex flex-wrap items-center gap-3 justify-center">
                  <Button onClick={() => setShowCodeModal(true)} variant="outline" size="sm">
                    <Share2 className="h-4 w-4 mr-2" />
                    Código
                  </Button>
                  <Button onClick={() => setShowAddModal(true)} size="sm">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Agregar Manual
                  </Button>
                  <Button onClick={() => setShowImportModal(true)} variant="secondary" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Importar Excel
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Lista de Estudiantes</CardTitle>
                    <CardDescription>
                      {students.length} estudiante{students.length !== 1 ? 's' : ''} inscrito{students.length !== 1 ? 's' : ''}
                    </CardDescription>
                  </div>
  <div className="flex items-center gap-2">
                    <Button onClick={() => setShowAddModal(true)} size="sm" variant="outline">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Agregar
                    </Button>
                    <Button onClick={() => setShowImportModal(true)} size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Importar Excel
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {students.map((enrollment: any) => (
                    <div
                      key={enrollment.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                          <span className="text-lg font-semibold text-indigo-600">
                            {enrollment.estudiante?.nombre?.charAt(0)}
                            {enrollment.estudiante?.apellido?.charAt(0)}
                          </span>
                        </div>
                        
                        {/* Info */}
                        <div>
                          <p className="font-semibold">
                            {enrollment.estudiante?.nombre} {enrollment.estudiante?.apellido}
                          </p>
                          <p className="text-sm text-gray-600">
                            @{enrollment.estudiante?.username}
                          </p>
                        </div>

                        {/* Stats */}
                        {enrollment.estudiante?.perfiles_gamer && (
                          <div className="flex items-center gap-4 text-sm text-gray-600 ml-8">
                            <div>
                              <span className="text-xs">Nivel</span>
                              <p className="font-semibold text-indigo-600">
                                {enrollment.estudiante.perfiles_gamer.nivel}
                              </p>
                            </div>
                            <div>
                              <span className="text-xs">XP</span>
                              <p className="font-semibold text-purple-600">
                                {enrollment.estudiante.perfiles_gamer.experiencia}
                              </p>
                            </div>
                            <div>
                              <span className="text-xs">Puntos</span>
                              <p className="font-semibold text-yellow-600">
                                {enrollment.estudiante.perfiles_gamer.puntos_totales}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleRemoveClick({
                          id: enrollment.estudiante?.id,
                          nombre: enrollment.estudiante?.nombre,
                          apellido: enrollment.estudiante?.apellido,
                          username: enrollment.estudiante?.username,
                        })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab Quizzes */}
        <TabsContent value="quizzes">
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-64">
              <p className="text-gray-600">Quizzes disponibles próximamente</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Estadísticas */}
        <TabsContent value="estadisticas">
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-64">
              <p className="text-gray-600">Estadísticas disponibles próximamente</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modales */}
      {showCodeModal && (
        <ViewCodeModal
          open={showCodeModal}
          onClose={() => setShowCodeModal(false)}
          classCode={clase.codigo}
          className={clase.nombre}
        />
      )}

      {showEditModal && clase && (
        <EditClassModal
          open={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleEditSuccess}
          classData={{
            id: clase.id,
            nombre: clase.nombre,
            descripcion: clase.descripcion || '',
            grado_id: clase.grado_id,
            materia_id: clase.materia_id,
            anio_escolar: clase.anio_escolar,
          }}
        />
      )}

      {showDeleteModal && clase && (
        <DeleteClassModal
          open={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onSuccess={handleDeleteSuccess}
          classData={{
            id: clase.id,
            nombre: clase.nombre,
            estudiantes_count: students.length,
          }}
        />
      )}

      {showImportModal && clase && (
        <ImportStudentsModal
          open={showImportModal}
          onClose={() => setShowImportModal(false)}
          onSuccess={handleImportSuccess}
          classId={clase.id}
          className={clase.nombre}
        />
      )}

      {showAddModal && clase && (
        <AddStudentModal
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAddSuccess}
          classId={clase.id}
          className={clase.nombre}
        />
      )}

      {studentToRemove && clase && (
        <RemoveStudentModal
          open={!!studentToRemove}
          onClose={() => setStudentToRemove(null)}
          onSuccess={handleRemoveSuccess}
          classId={clase.id}
          className={clase.nombre}
          student={studentToRemove}
        />
      )}
    </div>
  );
}
