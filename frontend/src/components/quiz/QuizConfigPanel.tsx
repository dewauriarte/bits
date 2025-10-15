import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings2 } from 'lucide-react';

interface QuizConfigPanelProps {
  config: {
    tiempo_por_pregunta: number;
    puntos_base: number;
    bonificacion_velocidad: boolean;
    bonificacion_combo: boolean;
    configuracion?: {
      musica_fondo?: boolean;
      mostrar_ranking?: boolean;
      permitir_repetir?: boolean;
      mostrar_respuestas?: boolean;
      tiempo_congelamiento?: number;
    };
  };
  onChange: (config: any) => void;
}

export default function QuizConfigPanel({ config, onChange }: QuizConfigPanelProps) {
  const updateConfig = (key: string, value: any) => {
    onChange({ ...config, [key]: value });
  };

  const updateNestedConfig = (key: string, value: any) => {
    onChange({
      ...config,
      configuracion: {
        ...config.configuracion,
        [key]: value,
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="h-5 w-5" />
          Configuración del Quiz
        </CardTitle>
        <CardDescription>
          Personaliza el comportamiento y puntuación del juego
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tiempo por pregunta */}
        <div className="space-y-2">
          <Label>Tiempo por pregunta (segundos)</Label>
          <div className="flex items-center gap-4">
            <Slider
              value={[config.tiempo_por_pregunta]}
              onValueChange={(value) => updateConfig('tiempo_por_pregunta', value[0])}
              min={5}
              max={120}
              step={5}
              className="flex-1"
            />
            <span className="w-12 text-center font-semibold">
              {config.tiempo_por_pregunta}s
            </span>
          </div>
        </div>

        {/* Puntos base */}
        <div className="space-y-2">
          <Label htmlFor="puntos_base">Puntos base por pregunta</Label>
          <Input
            id="puntos_base"
            type="number"
            value={config.puntos_base}
            onChange={(e) => updateConfig('puntos_base', parseInt(e.target.value))}
            min={100}
            max={10000}
            step={100}
          />
          <p className="text-xs text-gray-500">
            Puntos que se otorgan por responder correctamente
          </p>
        </div>

        {/* Bonificaciones */}
        <div className="space-y-4 pt-4 border-t">
          <h4 className="font-semibold text-sm">Bonificaciones</h4>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="bonif-velocidad">Bonificación por velocidad</Label>
              <p className="text-xs text-gray-500">
                Más puntos al responder rápido
              </p>
            </div>
            <Switch
              id="bonif-velocidad"
              checked={config.bonificacion_velocidad}
              onCheckedChange={(checked) => updateConfig('bonificacion_velocidad', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="bonif-combo">Bonificación por combo</Label>
              <p className="text-xs text-gray-500">
                Puntos extra por racha de aciertos
              </p>
            </div>
            <Switch
              id="bonif-combo"
              checked={config.bonificacion_combo}
              onCheckedChange={(checked) => updateConfig('bonificacion_combo', checked)}
            />
          </div>
        </div>

        {/* Configuración adicional */}
        <div className="space-y-4 pt-4 border-t">
          <h4 className="font-semibold text-sm">Opciones de juego</h4>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="musica">Música de fondo</Label>
              <p className="text-xs text-gray-500">
                Reproducir música durante el juego
              </p>
            </div>
            <Switch
              id="musica"
              checked={config.configuracion?.musica_fondo ?? true}
              onCheckedChange={(checked) => updateNestedConfig('musica_fondo', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="ranking">Mostrar ranking en vivo</Label>
              <p className="text-xs text-gray-500">
                Ver posiciones mientras juegan
              </p>
            </div>
            <Switch
              id="ranking"
              checked={config.configuracion?.mostrar_ranking ?? true}
              onCheckedChange={(checked) => updateNestedConfig('mostrar_ranking', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="respuestas">Mostrar respuestas correctas</Label>
              <p className="text-xs text-gray-500">
                Enseñar la respuesta después de cada pregunta
              </p>
            </div>
            <Switch
              id="respuestas"
              checked={config.configuracion?.mostrar_respuestas ?? true}
              onCheckedChange={(checked) => updateNestedConfig('mostrar_respuestas', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="repetir">Permitir repetir</Label>
              <p className="text-xs text-gray-500">
                Los estudiantes pueden jugar múltiples veces
              </p>
            </div>
            <Switch
              id="repetir"
              checked={config.configuracion?.permitir_repetir ?? true}
              onCheckedChange={(checked) => updateNestedConfig('permitir_repetir', checked)}
            />
          </div>
        </div>

        {/* Tiempo de congelamiento */}
        <div className="space-y-2 pt-4 border-t">
          <Label>Tiempo de congelamiento (power-up)</Label>
          <div className="flex items-center gap-4">
            <Slider
              value={[config.configuracion?.tiempo_congelamiento ?? 5]}
              onValueChange={(value) => updateNestedConfig('tiempo_congelamiento', value[0])}
              min={3}
              max={15}
              step={1}
              className="flex-1"
            />
            <span className="w-12 text-center font-semibold">
              {config.configuracion?.tiempo_congelamiento ?? 5}s
            </span>
          </div>
          <p className="text-xs text-gray-500">
            Duración del congelamiento en Mario Party
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
