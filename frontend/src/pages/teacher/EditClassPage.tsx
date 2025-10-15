import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import EditClassModal from '@/components/modals/EditClassModal';
import { classesApi } from '@/lib/api/classes';
import { toast } from 'sonner';

export default function EditClassPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [classData, setClassData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    if (id) {
      loadClass();
    }
  }, [id]);

  const loadClass = async () => {
    try {
      setLoading(true);
      const response = await classesApi.getClassById(id!);
      setClassData(response.data);
      // Abrir el modal automáticamente cuando se carguen los datos
      setShowEditModal(true);
    } catch (error: any) {
      console.error('Error loading class:', error);
      toast.error('Error al cargar la clase');
      navigate('/clases');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    toast.success('Clase actualizada exitosamente');
    navigate('/clases');
  };

  const handleClose = () => {
    navigate('/clases');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando clase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/clases')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Mis Clases
        </Button>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Editar Clase</CardTitle>
          <CardDescription>
            Estás editando la clase: <strong>{classData?.nombre}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Modifica la información de tu clase en el formulario que aparece.
          </p>
        </CardContent>
      </Card>

      {/* Modal */}
      {classData && (
        <EditClassModal
          open={showEditModal}
          onClose={handleClose}
          onSuccess={handleSuccess}
          classData={{
            id: classData.id,
            nombre: classData.nombre,
            descripcion: classData.descripcion || '',
            grado_id: classData.grado_id,
            materia_id: classData.materia_id,
            anio_escolar: classData.anio_escolar,
          }}
        />
      )}
    </div>
  );
}
