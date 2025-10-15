-- Configuración de API keys de fallback para cuando un proveedor falla
-- Ejecutar este script para habilitar el sistema de fallback automático

-- INSTRUCCIONES:
-- 1. Reemplaza 'TU_API_KEY_AQUI' con tus claves reales
-- 2. Ejecuta este script en tu base de datos PostgreSQL
-- 3. El sistema usará estos proveedores automáticamente cuando uno falle

-- OpenAI como fallback (GPT-4o-mini es rápido y económico)
INSERT INTO configuracion_sistema (clave, valor, descripcion)
VALUES (
  'openai_fallback_key',
  '{"api_key": "sk-proj-TU_OPENAI_KEY_AQUI", "model": "gpt-4o-mini"}',
  'API key de OpenAI para fallback automático cuando otros proveedores fallen'
)
ON CONFLICT (clave) 
DO UPDATE SET 
  valor = EXCLUDED.valor,
  descripcion = EXCLUDED.descripcion,
  fecha_actualizacion = CURRENT_TIMESTAMP;

-- Gemini como fallback (gratuito y rápido)
INSERT INTO configuracion_sistema (clave, valor, descripcion)
VALUES (
  'gemini_fallback_key',
  '{"api_key": "TU_GEMINI_KEY_AQUI", "model": "gemini-1.5-flash"}',
  'API key de Gemini para fallback automático cuando otros proveedores fallen'
)
ON CONFLICT (clave) 
DO UPDATE SET 
  valor = EXCLUDED.valor,
  descripcion = EXCLUDED.descripcion,
  fecha_actualizacion = CURRENT_TIMESTAMP;

-- Claude como fallback (muy bueno para tareas educativas)
INSERT INTO configuracion_sistema (clave, valor, descripcion)
VALUES (
  'claude_fallback_key',
  '{"api_key": "TU_CLAUDE_KEY_AQUI", "model": "claude-3-haiku-20240307"}',
  'API key de Claude para fallback automático cuando otros proveedores fallen'
)
ON CONFLICT (clave) 
DO UPDATE SET 
  valor = EXCLUDED.valor,
  descripcion = EXCLUDED.descripcion,
  fecha_actualizacion = CURRENT_TIMESTAMP;

-- Verificar que se insertaron correctamente
SELECT clave, descripcion, fecha_actualizacion 
FROM configuracion_sistema 
WHERE clave LIKE '%_fallback_key'
ORDER BY clave;
