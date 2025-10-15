import { useState } from 'react';
import { AlertTriangle, UserX } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { classesApi } from '@/lib/api/classes';
import { toast } from 'sonner';

interface RemoveStudentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  classId: string;
  className: string;
  student: {
    id: string;
    nombre: string;
    apellido: string;
    username?: string;
  };
}

export default function RemoveStudentModal({
  open,
  onClose,
  onSuccess,
  classId,
  className,
  student,
}: RemoveStudentModalProps) {
  const [loading, setLoading] = useState(false);

  const handleRemove = async () => {
    try {
      setLoading(true);
      await classesApi.removeStudent(classId, student.id);
      toast.success(`${student.nombre} ha sido removido de la clase`);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error removing student:', error);
      toast.error(error.response?.data?.message || 'Error al remover estudiante');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
              <UserX className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <DialogTitle className="text-xl">Remover Estudiante</DialogTitle>
            </div>
          </div>
          <DialogDescription className="text-base">
            ¿Estás seguro de remover a este estudiante de la clase?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Información del estudiante */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div>
              <p className="text-sm text-gray-600">Estudiante:</p>
              <p className="font-semibold text-gray-900">
                {student.nombre} {student.apellido}
              </p>
              {student.username && (
                <p className="text-sm text-gray-600">@{student.username}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-600">Clase:</p>
              <p className="font-semibold text-gray-900">{className}</p>
            </div>
          </div>

          {/* Advertencia */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">Nota importante:</p>
                <p>
                  El estudiante será removido solo de esta clase. Su cuenta y progreso 
                  en otras clases se mantendrán intactos.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleRemove}
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Removiendo...' : 'Remover de la Clase'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
