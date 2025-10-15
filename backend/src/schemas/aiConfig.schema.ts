import { z } from 'zod';

// Schema para configurar API de IA
export const aiConfigSchema = z.object({
  provider: z.enum(['openai', 'gemini', 'claude'], {
    required_error: 'Selecciona un proveedor de IA',
  }),
  api_key: z.string().min(10, 'API Key debe tener al menos 10 caracteres'),
  is_active: z.boolean().optional().default(true),
});

// Schema para actualizar configuración
export const updateAIConfigSchema = z.object({
  provider: z.enum(['openai', 'gemini', 'claude']).optional(),
  api_key: z.string().min(10).optional(),
  is_active: z.boolean().optional(),
});

// Types
export type AIConfigInput = z.infer<typeof aiConfigSchema>;
export type UpdateAIConfigInput = z.infer<typeof updateAIConfigSchema>;

// Modelos disponibles por proveedor
export const AVAILABLE_MODELS = {
  openai: [
    {
      id: 'gpt-4o',
      name: 'GPT-4o',
      description: 'Modelo más capaz y multimodal. Excelente para tareas complejas.',
      context: '128K tokens',
      recommended: true,
    },
    {
      id: 'gpt-4o-mini',
      name: 'GPT-4o Mini',
      description: 'Versión más económica y rápida. Ideal para tareas simples.',
      context: '128K tokens',
      recommended: false,
    },
    {
      id: 'gpt-4-turbo',
      name: 'GPT-4 Turbo',
      description: 'Modelo anterior potente y confiable.',
      context: '128K tokens',
      recommended: false,
    },
  ],
  gemini: [
    {
      id: 'gemini-2.5-pro',
      name: 'Gemini 2.5 Pro',
      description: 'Modelo más avanzado para razonamiento complejo y análisis de datos.',
      context: '1M tokens',
      recommended: true,
    },
    {
      id: 'gemini-2.5-flash',
      name: 'Gemini 2.5 Flash',
      description: 'Mejor relación precio-rendimiento. Rápido y eficiente.',
      context: '1M tokens',
      recommended: false,
    },
    {
      id: 'gemini-1.5-pro',
      name: 'Gemini 1.5 Pro',
      description: 'Modelo anterior, muy confiable.',
      context: '2M tokens',
      recommended: false,
    },
  ],
  claude: [
    {
      id: 'claude-sonnet-4-20250514',
      name: 'Claude Sonnet 4.5',
      description: 'Modelo más reciente y capaz. Excelente para educación.',
      context: '200K tokens',
      recommended: true,
    },
    {
      id: 'claude-3-5-sonnet-20241022',
      name: 'Claude 3.5 Sonnet',
      description: 'Balance perfecto entre capacidad y velocidad.',
      context: '200K tokens',
      recommended: false,
    },
    {
      id: 'claude-3-opus-20240229',
      name: 'Claude 3 Opus',
      description: 'Modelo más potente de la versión 3.',
      context: '200K tokens',
      recommended: false,
    },
  ],
} as const;

// Información de proveedores
export const PROVIDER_INFO = {
  openai: {
    name: 'OpenAI (ChatGPT)',
    website: 'https://platform.openai.com',
    pricing_url: 'https://openai.com/api/pricing',
    api_key_url: 'https://platform.openai.com/api-keys',
    description: 'Líder en modelos de lenguaje. Creadores de ChatGPT.',
    setup_guide: 'Ve a platform.openai.com → API Keys → Create new secret key',
  },
  gemini: {
    name: 'Google Gemini',
    website: 'https://ai.google.dev',
    pricing_url: 'https://ai.google.dev/pricing',
    api_key_url: 'https://aistudio.google.com/apikey',
    description: 'Modelos de Google con contexto extenso y multimodalidad avanzada.',
    setup_guide: 'Ve a Google AI Studio → Get API Key → Create API key',
  },
  claude: {
    name: 'Anthropic Claude',
    website: 'https://www.anthropic.com',
    pricing_url: 'https://www.anthropic.com/pricing',
    api_key_url: 'https://console.anthropic.com/settings/keys',
    description: 'Modelos seguros y confiables. Excelentes para educación.',
    setup_guide: 'Ve a Anthropic Console → API Keys → Create Key',
  },
} as const;

// Función para obtener el mejor modelo de cada proveedor
export const getBestModel = (provider: 'openai' | 'gemini' | 'claude'): string => {
  const models = AVAILABLE_MODELS[provider];
  const recommended = models.find(m => m.recommended);
  return recommended ? recommended.id : models[0].id;
};
