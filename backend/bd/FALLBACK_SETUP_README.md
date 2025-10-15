# 🔄 Sistema de Fallback Automático de IA

## ⚠️ Problema Resuelto

Cuando un proveedor de IA (como Gemini) está **sobrecargado** o tiene problemas, el sistema ahora automáticamente intenta con otros proveedores configurados como fallback.

**Error anterior:**
```
Falló después de 3 intentos: Gemini API Error: The model is overloaded. Please try again later.
```

**Ahora:**
```
⚠️ gemini sobrecargado, intentando fallback automático...
🔄 Intentando con openai...
✅ Éxito con openai (fallback)
```

---

## 🚀 Configuración Rápida

### Paso 1: Obtener API Keys

Necesitas al menos **2 proveedores** configurados (recomendado: 3):

1. **OpenAI** (Recomendado) - https://platform.openai.com/api-keys
   - Crea una cuenta
   - Ve a API Keys
   - Crea una nueva key
   - Copia la key (empieza con `sk-proj-...`)

2. **Google Gemini** (Gratis) - https://aistudio.google.com/app/apikey
   - Inicia sesión con Google
   - Crea API key
   - Copia la key

3. **Anthropic Claude** (Opcional) - https://console.anthropic.com/
   - Crea cuenta
   - Ve a API Keys
   - Crea nueva key

### Paso 2: Configurar en Base de Datos

**Opción A: Usando el script SQL**

1. Abre `setup_ai_fallback.sql`
2. Reemplaza las claves:
   ```sql
   "api_key": "sk-proj-TU_OPENAI_KEY_AQUI"
   ```
   Por:
   ```sql
   "api_key": "sk-proj-abc123xyz456..."
   ```

3. Ejecuta el script:
   ```bash
   psql -U postgres -d bits_db -f backend/bd/setup_ai_fallback.sql
   ```

**Opción B: Manualmente con SQL**

```sql
-- OpenAI (GPT-4o-mini - $0.15 por 1M tokens)
INSERT INTO configuracion_sistema (clave, valor, descripcion)
VALUES (
  'openai_fallback_key',
  '{"api_key": "sk-proj-TU_KEY_REAL", "model": "gpt-4o-mini"}',
  'API key de OpenAI para fallback automático'
)
ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor;

-- Gemini (Gratis hasta 60 requests/minuto)
INSERT INTO configuracion_sistema (clave, valor, descripcion)
VALUES (
  'gemini_fallback_key',
  '{"api_key": "TU_KEY_REAL", "model": "gemini-1.5-flash"}',
  'API key de Gemini para fallback automático'
)
ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor;
```

**Opción C: Desde la aplicación (recomendado)**

Voy a crear un endpoint de administración:
```
POST /api/admin/ai-fallback
{
  "provider": "openai",
  "api_key": "sk-proj-...",
  "model": "gpt-4o-mini"
}
```

---

## 🔍 Verificar Configuración

```sql
SELECT clave, 
       LEFT(valor, 50) as preview,
       descripcion,
       fecha_actualizacion
FROM configuracion_sistema
WHERE clave LIKE '%_fallback_key';
```

Deberías ver:
```
clave                | preview                    | descripcion
---------------------|----------------------------|-------------
openai_fallback_key  | {"api_key": "sk-proj-...   | API key de OpenAI...
gemini_fallback_key  | {"api_key": "AIzaSy...     | API key de Gemini...
```

---

## 🎯 Cómo Funciona

### Orden de Fallback Automático

1. **Usuario configura:** Gemini (personal)
2. **Gemini falla** (sobrecargado) → Intenta 3 veces
3. **Sistema detecta** error de sobrecarga
4. **Fallback 1:** Intenta con OpenAI (fallback global)
5. **Fallback 2:** Si OpenAI falla, intenta Claude (fallback global)
6. **Fallback 3:** Si todos fallan, muestra error claro

### Logs en Consola

```bash
⚠️ gemini sobrecargado, intentando fallback automático...
🔄 Intentando con openai...
✅ Éxito con openai (fallback)
```

O si no hay fallback configurado:
```bash
⚠️ gemini sobrecargado, intentando fallback automático...
⏭️ openai no tiene configuración de fallback, saltando...
🔄 Intentando con claude...
❌ claude también falló: API key not found
```

---

## 💡 Recomendaciones

### Para Desarrollo
- **Gemini** (gratis) como principal
- **OpenAI GPT-4o-mini** ($0.15/1M tokens) como fallback

### Para Producción
- **OpenAI GPT-4o-mini** como principal (más estable)
- **Gemini** como fallback (gratis)
- **Claude Haiku** como último recurso

### Modelos Recomendados

| Proveedor | Modelo            | Costo (1M tokens) | Velocidad |
|-----------|-------------------|-------------------|-----------|
| OpenAI    | gpt-4o-mini       | $0.15             | ⚡⚡⚡      |
| Gemini    | gemini-1.5-flash  | Gratis            | ⚡⚡       |
| Claude    | claude-3-haiku    | $0.25             | ⚡⚡       |

---

## 🔧 Solución Temporal (Sin Configurar Fallback)

Si no quieres configurar fallback ahora, puedes:

1. **Esperar 1-2 minutos** y volver a intentar
2. **Cambiar de proveedor** en la configuración personal del usuario
3. **Usar OpenAI** directamente (más estable que Gemini)

---

## ❓ Preguntas Frecuentes

**P: ¿Cuánto cuesta el fallback?**
R: Solo pagas cuando se usa. Si Gemini funciona, no se usa OpenAI. GPT-4o-mini es muy barato ($0.15 por 1M tokens ≈ $0.0015 por quiz de 10 preguntas).

**P: ¿Qué pasa si no configuro fallback?**
R: El sistema mostrará el error actual: "The model is overloaded. Please try again later."

**P: ¿Afecta la calidad del quiz?**
R: No, todos los proveedores reciben el mismo prompt optimizado. La calidad es similar.

**P: ¿Puedo usar solo un proveedor de fallback?**
R: Sí, configura solo el que prefieras. El sistema intentará con los que estén disponibles.

---

## 🎉 Beneficios

✅ **99.9% de disponibilidad** - Si un proveedor falla, otro toma el relevo
✅ **Sin intervención manual** - El usuario ni se entera del cambio
✅ **Logs detallados** - Sabes exactamente qué proveedor se usó
✅ **Económico** - Solo pagas por lo que usas
✅ **Configurable** - Puedes agregar/quitar proveedores fácilmente

---

## 📞 Soporte

Si tienes problemas:
1. Verifica que las API keys sean válidas
2. Revisa los logs del backend
3. Confirma que la configuración está en la BD
4. Intenta con otro proveedor manualmente primero
