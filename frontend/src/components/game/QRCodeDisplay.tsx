import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface QRCodeDisplayProps {
  url: string;
  roomCode: string;
  size?: number;
}

export default function QRCodeDisplay({ url, roomCode, size = 200 }: QRCodeDisplayProps) {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado`, {
      description: text,
    });
  };

  const openInNewTab = () => {
    window.open(url, '_blank');
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Código */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Código de sala</p>
            <div className="flex items-center justify-center gap-2">
              <h2 className="text-5xl font-bold tracking-widest font-mono">{roomCode}</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => copyToClipboard(roomCode, 'Código')}
                className="h-8 w-8"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex justify-center">
            <div className="bg-white p-4 rounded-lg">
              <QRCodeSVG value={url} size={size} level="M" includeMargin />
            </div>
          </div>

          {/* URL */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground text-center">URL de invitación</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono truncate">
                {url}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(url, 'URL')}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={openInNewTab}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Instrucciones */}
          <div className="bg-muted/50 p-4 rounded-lg text-sm space-y-2">
            <p className="font-medium">Para unirse:</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Escanea el código QR con tu móvil</li>
              <li>O ingresa el código en la página de unirse</li>
              <li>Elige un nickname y avatar</li>
            </ol>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
