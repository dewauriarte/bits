import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ViewCodeModalProps {
  open: boolean;
  onClose: () => void;
  classCode: string;
  className: string;
}

export default function ViewCodeModal({ open, onClose, classCode, className }: ViewCodeModalProps) {
  const [copied, setCopied] = useState(false);

  const joinUrl = `${window.location.origin}/student/join?code=${classCode}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(classCode);
    setCopied(true);
    toast.success('Código copiado al portapapeles');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(joinUrl);
    toast.success('URL copiada al portapapeles');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Código de Clase</DialogTitle>
          <DialogDescription>{className}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Código Grande */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-8 rounded-lg text-center">
            <p className="text-sm text-gray-600 mb-2">Comparte este código con tus estudiantes</p>
            <div className="text-5xl font-bold font-mono text-indigo-600 tracking-wider mb-4">
              {classCode}
            </div>
            <Button
              onClick={handleCopyCode}
              variant="outline"
              className="w-full"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  ¡Copiado!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar Código
                </>
              )}
            </Button>
          </div>

          {/* QR Code */}
          <div className="bg-white p-6 rounded-lg border text-center">
            <p className="text-sm text-gray-600 mb-4">O escanea el código QR</p>
            <div className="flex justify-center">
              <div className="p-4 bg-white rounded-lg border-2 border-gray-200">
                <QRCodeSVG
                  value={joinUrl}
                  size={200}
                  level="H"
                  includeMargin
                />
              </div>
            </div>
          </div>

          {/* URL para compartir */}
          <div>
            <p className="text-sm text-gray-600 mb-2">URL para compartir:</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={joinUrl}
                readOnly
                className="flex-1 px-3 py-2 text-sm bg-gray-50 border rounded-md"
              />
              <Button onClick={handleCopyUrl} variant="outline" size="sm">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Info adicional */}
          <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-900">
            <p className="font-semibold mb-1">💡 Tip</p>
            <p>
              Los estudiantes pueden ingresar el código en{' '}
              <strong>{window.location.origin}/student/join</strong> o escanear el QR.
            </p>
          </div>

          <Button onClick={onClose} className="w-full" variant="outline">
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
