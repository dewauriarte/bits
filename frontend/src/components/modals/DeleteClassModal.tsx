import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
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

interface DeleteClassModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  classData: {
    id: string;
    nombre: string;
    estudiantes_count?: number;
  };
}

export default function DeleteClassModal({ open, onClose, onSuccess, classData }: DeleteClassModalProps) {
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleDelete = async () => {
    try {
      setLoading(true);
      await classesApi.deleteClass(classData.id);
      toast.success('Clase archivada exitosamente');
      onSuccess();
      onClose();
      setConfirmText('');
    } catch (error: any) {
      console.error('Error deleting class:', error);
      toast.error(error.response?.data?.message || 'Error al archivar la clase');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setConfirmText('');
      onClose();
    }
  };

  const isConfirmed = confirmText.toLowerCase() === 'archivar';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <DialogTitle className="text-2xl">Archivar Clase</DialogTitle>
            </div>
          </div>
          <DialogDescription className="text-base">
            ¿Estás seguro de que deseas archivar esta clase?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Información de la clase */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div>
              <p className="text-sm text-gray-600">Clase:</p>
              <p className="font-semibold text-gray-900">{classData.nombre}</p>
            </div>
            {classData.estudiantes_count !== undefined && (
              <div>
                <p className="text-sm text-gray-600">Estudiantes inscritos:</p>
                <p className="font-semibold text-gray-900">{classData.estudiantes_count}</p>
              </div>
            )}
          </div>

          {/* Advertencia */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-900">
              <strong>Nota:</strong> Esta acción archivará la clase. Los estudiantes ya no podrán
              acceder a ella, pero los datos se conservarán en el sistema.
            </p>
          </div>

          {/* Confirmación */}
          <div>
            <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-2">
              Escribe <strong>ARCHIVAR</strong> para confirmar:
            </label>
            <input
              id="confirm"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Escribe ARCHIVAR"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              disabled={loading}
            />
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
              onClick={handleDelete}
              disabled={loading || !isConfirmed}
              className="flex-1"
            >
              {loading ? 'Archivando...' : 'Archivar Clase'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
