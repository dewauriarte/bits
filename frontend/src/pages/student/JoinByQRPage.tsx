import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import QrScanner from 'react-qr-scanner';

export const JoinByQRPage = () => {
  const navigate = useNavigate();
  const [isScanning, setIsScanning] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleScan = async (data: any) => {
    if (!data || isLoading) return;

    const scannedText = data.text;
    
    if (!scannedText) return;

    setIsLoading(true);
    setIsScanning(false);

    try {
      // El QR contiene una URL como: http://localhost:5173/join/XU3U46
      // Extraer el código de sala de la URL
      const urlMatch = scannedText.match(/\/join\/([A-Z0-9]{6})/i);
      
      if (!urlMatch || !urlMatch[1]) {
        throw new Error('Código de sala no válido');
      }

      const roomCode = urlMatch[1].toUpperCase();
      
      toast.success('¡QR escaneado correctamente!');
      
      // Redirigir a página intermedia que detecta tipo de sala
      navigate(`/join/${roomCode}`);
    } catch (error: any) {
      toast.error('QR inválido. Por favor intenta de nuevo.');
      setIsScanning(true);
      setIsLoading(false);
    }
  };

  const handleError = (error: any) => {
    console.error('QR Scanner error:', error);
    toast.error('Error al acceder a la cámara');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">📷</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Escanea el QR
          </h1>
          <p className="text-gray-600">
            Apunta tu cámara al código QR en la pantalla
          </p>
        </div>

        {isScanning ? (
          <div className="space-y-4">
            <div className="relative aspect-square bg-gray-900 rounded-lg overflow-hidden">
              <QrScanner
                delay={300}
                onError={handleError}
                onScan={handleScan}
                style={{ width: '100%', height: '100%' }}
                constraints={{ video: { facingMode: 'environment' } }}
              />
              
              {/* Marco de ayuda */}
              <div className="absolute inset-8 border-4 border-white border-dashed rounded-xl pointer-events-none" />
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800 text-center">
                💡 Asegúrate de tener buena iluminación
              </p>
            </div>

            <Button
              variant="ghost"
              onClick={() => navigate('/student/join')}
              className="w-full"
            >
              ← Volver
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <div className="animate-spin text-4xl mb-4">⏳</div>
            <p className="text-gray-600">Procesando código QR...</p>
          </div>
        )}
      </Card>
    </div>
  );
};
