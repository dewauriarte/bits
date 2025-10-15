import { useEffect, useState } from 'react';
import { Search, Plus, Filter, Edit, Trash2, Users, Eye, QrCode, MoreVertical } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { classesApi } from '@/lib/api/classes';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import CreateClassModal from '@/components/modals/CreateClassModal';
import ViewCodeModal from '@/components/modals/ViewCodeModal';
import DeleteClassModal from '@/components/modals/DeleteClassModal';

export default function ClassesPage() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    grado_id: '',
    materia_id: '',
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewCodeClass, setViewCodeClass] = useState<any>(null);
  const [deleteClass, setDeleteClass] = useState<any>(null);

  useEffect(() => {
    loadClasses();
  }, [filters, search]);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const response = await classesApi.getClasses({
        search: search || undefined,
        grado_id: filters.grado_id || undefined,
        materia_id: filters.materia_id || undefined,
      });
      setClasses(response.data.clases || []);
    } catch (error: any) {
      console.error('Error loading classes:', error);
      toast.error('Error al cargar las clases');
    } finally {
      setLoading(false);
    }
  };

  const handleArchiveClick = (clase: any) => {
    setDeleteClass(clase);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mis Clases</h1>
          <p className="text-gray-600 mt-1">Gestiona todas tus clases y estudiantes</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} size="lg">
          <Plus className="h-5 w-5 mr-2" />
          Nueva Clase
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar clases por nombre, código..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Classes List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-6xl animate-bounce mb-4">📚</div>
            <p className="text-gray-600">Cargando clases...</p>
          </div>
        </div>
      ) : classes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold mb-2">No hay clases aún</h3>
            <p className="text-gray-600 mb-4">Crea tu primera clase para empezar</p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-5 w-5 mr-2" />
              Crear Primera Clase
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((clase) => (
            <Card key={clase.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{clase.nombre}</CardTitle>
                    <CardDescription className="mt-1">
                      {clase.descripcion || 'Sin descripción'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Código de clase */}
                  <div 
                    className="bg-indigo-50 p-3 rounded-lg text-center cursor-pointer hover:bg-indigo-100 transition-colors"
                    onClick={() => setViewCodeClass(clase)}
                  >
                    <p className="text-xs text-gray-600 mb-1">Código de clase (click para ver)</p>
                    <p className="text-xl font-mono font-bold text-indigo-600">
                      {clase.codigo}
                    </p>
                    <p className="text-xs text-indigo-600 mt-1">👆 Click para QR</p>
                  </div>

                  {/* Info */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">📚 Materia:</span>
                      <span className="font-medium">
                        {clase.materias?.nombre || 'Sin materia'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">🎓 Grado:</span>
                      <span className="font-medium">
                        {clase.grados?.nombre || 'Sin grado'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">📅 Año:</span>
                      <span className="font-medium">
                        {clase.anio_escolar || 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-600" />
                      <span className="font-medium">
                        {clase.estudiantes_count || 0} estudiantes
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/clases/${clase.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver Detalle
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setViewCodeClass(clase)}>
                          <QrCode className="h-4 w-4 mr-2" />
                          Ver Código QR
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/clases/${clase.id}/editar`)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar Clase
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleArchiveClick(clase)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Archivar Clase
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modales */}
      <CreateClassModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadClasses}
      />

      {viewCodeClass && (
        <ViewCodeModal
          open={!!viewCodeClass}
          onClose={() => setViewCodeClass(null)}
          classCode={viewCodeClass.codigo}
          className={viewCodeClass.nombre}
        />
      )}

      {deleteClass && (
        <DeleteClassModal
          open={!!deleteClass}
          onClose={() => setDeleteClass(null)}
          onSuccess={() => {
            setDeleteClass(null);
            loadClasses();
          }}
          classData={{
            id: deleteClass.id,
            nombre: deleteClass.nombre,
            estudiantes_count: deleteClass.estudiantes_count || 0,
          }}
        />
      )}
    </div>
  );
}
