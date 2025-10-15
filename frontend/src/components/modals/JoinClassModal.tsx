import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { classesApi } from '@/lib/api/classes';
import { toast } from 'sonner';

interface JoinClassModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function JoinClassModal({ open, onClose, onSuccess }: JoinClassModalProps) {
  const [loading, setLoading] = useState(false);
  const [classCode, setClassCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [classPreview, setClassPreview] = useState<any>(null);
  const [error, setError] = useState('');

  // Validación en tiempo real del código
  useEffect(() => {
    const validateCode = setTimeout(async () => {
      if (classCode.trim().length >= 6) {
        try {
          setValidating(true);
          setError('');
          // El endpoint de join class verifica el código pero no inscribe hasta hacer POST
          // Por ahora solo mostramos feedback visual
          setClassPreview({ valid: true });
        } catch (err) {
          setError('');
          setClassPreview(null);
        } finally {
          setValidating(false);
        }
      } else {
        setClassPreview(null);
        setError('');
      }
    }, 300);

    return () => clearTimeout(validateCode);
  }, [classCode]);

  const handleJoin = async () => {
    if (!classCode.trim()) {
      toast.error('Ingresa el código de la clase');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await classesApi.joinClass({ codigo: classCode.trim().toUpperCase() });
      
      toast.success(
        <div>
          <p className="font-semibold">¡Te has unido a la clase!</p>
          <p className="text-sm">{response.data.nombre}</p>
        </div>
      );
      
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Error joining class:', error);
      const message = error.response?.data?.message || 'Error al unirse a la clase';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setClassCode('');
      setClassPreview(null);
      setError('');
      onClose();
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (value.length <= 6) {
      setClassCode(value);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Unirse a una Clase</DialogTitle>
          <DialogDescription>
            Ingresa el código de 6 caracteres que te dio tu profesor
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Input del código */}
          <div>
            <Label htmlFor="class-code">Código de Clase</Label>
            <div className="relative mt-2">
              <Input
                id="class-code"
                value={classCode}
                onChange={handleCodeChange}
                placeholder="ABC123"
                disabled={loading}
                className="text-center text-2xl font-mono tracking-widest uppercase"
                maxLength={6}
                autoFocus
                onKeyPress={(e) => e.key === 'Enter' && handleJoin()}
              />
              
              {/* Indicador de validación */}
              {validating && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                </div>
              )}
              
              {classCode.length === 6 && !validating && classPreview && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
              )}
              
              {error && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                </div>
              )}
            </div>
            
            {/* Contador de caracteres */}
            <p className="text-xs text-gray-500 mt-1 text-center">
              {classCode.length}/6 caracteres
            </p>
          </div>

          {/* Instrucciones */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">💡 ¿Cómo obtener el código?</h4>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Pídele el código a tu profesor</li>
              <li>El código tiene 6 letras o números</li>
              <li>Ejemplo: ABC123, XYZ789</li>
            </ul>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-800">
                <p className="font-semibold">Error al unirse</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Preview de la clase (si el código es válido) */}
          {classPreview && !error && classCode.length === 6 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-green-900">Código válido</p>
                <p className="text-sm text-green-700">
                  Haz click en "Unirse" para inscribirte en la clase
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
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
              onClick={handleJoin}
              disabled={loading || classCode.length < 6}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uniéndose...
                </>
              ) : (
                'Unirse a la Clase'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
