import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Brain, Save, Trash2, TestTube2, ExternalLink, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/lib/api';

export default function AIConfigPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  
  const [config, setConfig] = useState<any>(null);
  const [providers, setProviders] = useState<any>({});
  const [models, setModels] = useState<any>({});
  
  const [formData, setFormData] = useState({
    provider: '',
    api_key: '',
    is_active: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Cargar modelos disponibles
      const modelsRes = await apiClient.get('/api/ai-config/models');
      setModels(modelsRes.data.data.models);
      setProviders(modelsRes.data.data.providers);

      // Cargar configuración actual
      const configRes = await apiClient.get('/api/ai-config');

      if (configRes.data.data) {
        setConfig(configRes.data.data);
        setFormData({
          provider: configRes.data.data.provider || '',
          api_key: '', // No mostramos la key por seguridad
          is_active: configRes.data.data.is_active ?? true,
        });
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        toast.error('Tu sesión ha expirado. Por favor inicia sesión de nuevo.');
        // Redirigir al login después de 2 segundos
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else if (error.response?.status !== 404) {
        console.error('Error loading data:', error);
        toast.error('Error al cargar la configuración');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.provider) {
      toast.error('Selecciona un proveedor');
      return;
    }

    // Si ya tiene configuración y no ingresó nueva API key, no validar
    if (!formData.api_key && !config) {
      toast.error('Ingresa tu API Key');
      return;
    }

    try {
      setSaving(true);

      const dataToSend: any = {
        provider: formData.provider,
        is_active: formData.is_active,
      };

      // Solo enviar API key si se ingresó una nueva
      if (formData.api_key) {
        dataToSend.api_key = formData.api_key;
      }

      await apiClient.post('/api/ai-config', dataToSend);

      toast.success('Configuración guardada exitosamente');
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!formData.provider || !formData.api_key) {
      toast.error('Completa el proveedor y API key para probar');
      return;
    }

    try {
      setTesting(true);

      await apiClient.post('/api/ai-config/test', formData);

      toast.success('✅ Conexión exitosa! La API key funciona correctamente');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al probar conexión');
    } finally {
      setTesting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de eliminar tu configuración de IA?')) {
      return;
    }

    try {
      await apiClient.delete('/api/ai-config');

      toast.success('Configuración eliminada');
      setConfig(null);
      setFormData({
        provider: '',
        api_key: '',
        is_active: true,
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al eliminar');
    }
  };

  const selectedProviderModels = formData.provider ? models[formData.provider] || [] : [];
  const selectedProviderInfo = formData.provider ? providers[formData.provider] : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-6xl animate-bounce mb-4">🤖</div>
          <p className="text-gray-600">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Brain className="h-8 w-8 text-indigo-600" />
          Configuración de IA
        </h1>
        <p className="text-gray-600 mt-2">
          Configura tu proveedor de IA preferido para generar quizzes automáticamente
        </p>
      </div>

      {/* Status Card */}
      {config && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <p className="font-semibold text-gray-900">Configuración Activa</p>
                  <p className="text-sm text-gray-600">
                    {providers[config.provider]?.name} - {config.model}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    API Key: {config.api_key_masked}
                  </p>
                </div>
              </div>
              <Badge variant={config.is_active ? 'default' : 'secondary'}>
                {config.is_active ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="configure" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="configure">Configurar</TabsTrigger>
          <TabsTrigger value="info">Información</TabsTrigger>
        </TabsList>

        {/* Tab Configurar */}
        <TabsContent value="configure" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Proveedor de IA</CardTitle>
              <CardDescription>
                Selecciona el proveedor y modelo que deseas usar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Selección de Proveedor */}
              <div>
                <Label>Proveedor de IA</Label>
                <Select
                  value={formData.provider}
                  onValueChange={(value) => {
                    setFormData({ ...formData, provider: value });
                  }}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Selecciona un proveedor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">🤖 OpenAI (ChatGPT)</SelectItem>
                    <SelectItem value="gemini">✨ Google Gemini</SelectItem>
                    <SelectItem value="claude">🧠 Anthropic Claude</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Usaremos automáticamente el mejor modelo disponible del proveedor
                </p>
              </div>

              {/* Info del proveedor seleccionado */}
              {selectedProviderInfo && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">
                    {selectedProviderInfo.name}
                  </h4>
                  <p className="text-sm text-blue-800 mb-3">
                    {selectedProviderInfo.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(selectedProviderInfo.api_key_url, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Obtener API Key
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(selectedProviderInfo.pricing_url, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Ver Precios
                    </Button>
                  </div>
                  <p className="text-xs text-blue-700 mt-3">
                    📝 {selectedProviderInfo.setup_guide}
                  </p>
                </div>
              )}

              {/* API Key */}
              <div>
                <Label>API Key</Label>
                <div className="relative mt-2">
                  <Input
                    type={showApiKey ? 'text' : 'password'}
                    value={formData.api_key}
                    onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                    placeholder={config ? 'Dejar vacío para mantener la actual' : 'sk-...'}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Tu API key se guarda de forma segura y nunca se comparte
                </p>
              </div>

              {/* Info del modelo que se usará */}
              {formData.provider && selectedProviderModels.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Modelo Seleccionado Automáticamente
                  </h4>
                  {selectedProviderModels
                    .filter((m: any) => m.recommended)
                    .map((model: any) => (
                      <div key={model.id}>
                        <p className="text-sm font-medium text-green-900">{model.name}</p>
                        <p className="text-xs text-green-700 mt-1">{model.description}</p>
                        <p className="text-xs text-green-600 mt-1">
                          Contexto: {model.context}
                        </p>
                      </div>
                    ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4">
                <Button
                  onClick={handleTest}
                  variant="outline"
                  disabled={testing || !formData.provider || !formData.api_key}
                >
                  <TestTube2 className="h-4 w-4 mr-2" />
                  {testing ? 'Probando...' : 'Probar Conexión'}
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Guardando...' : 'Guardar Configuración'}
                </Button>
                {config && (
                  <Button
                    onClick={handleDelete}
                    variant="destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Información */}
        <TabsContent value="info" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>¿Cómo funciona?</CardTitle>
              <CardDescription>
                Información sobre los proveedores de IA
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">🔐 Seguridad</h4>
                <p className="text-sm text-gray-600">
                  Tu API key se guarda encriptada en la base de datos y nunca se expone en el frontend.
                  Solo tú puedes usarla para generar quizzes.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">💰 Costos</h4>
                <p className="text-sm text-gray-600">
                  Los costos de uso de la API son responsabilidad tuya. Cada proveedor tiene sus propios
                  precios. Revisa los enlaces de precios para más información.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">🎯 Recomendaciones</h4>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li><strong>OpenAI GPT-4o</strong>: Excelente balance, muy confiable</li>
                  <li><strong>Google Gemini 2.5 Pro</strong>: Mejor para contextos largos (PDFs)</li>
                  <li><strong>Claude Sonnet 4.5</strong>: Ideal para contenido educativo</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">📝 Límites</h4>
                <p className="text-sm text-gray-600">
                  Cada proveedor tiene límites de requests por minuto/día. Asegúrate de revisar
                  los límites de tu plan.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
