# 🚨 FIX RÁPIDO: Error "Model is Overloaded"

## ⚡ Solución Inmediata (2 minutos)

### Opción 1: Usar OpenAI como Fallback (Recomendado)

Si tienes una API key de OpenAI:

```sql
-- Conecta a tu base de datos y ejecuta:
INSERT INTO configuracion_sistema (clave, valor, descripcion)
VALUES (
  'openai_fallback_key',
  '{"api_key": "sk-proj-TU_KEY_DE_OPENAI", "model": "gpt-4o-mini"}',
  'API key de OpenAI para fallback automático'
)
ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor;
```

**Cómo obtener API key de OpenAI (gratis con $5 de crédito):**
1. Ve a https://platform.openai.com/signup
2. Crea cuenta
3. Ve a https://platform.openai.com/api-keys
4. Click "Create new secret key"
5. Copia la key (empieza con `sk-proj-`)
6. Pégala en el SQL de arriba

---

### Opción 2: Reintentar con Delay

El sistema ya reintenta 3 veces automáticamente. Si falla:

1. **Espera 30 segundos**
2. **Intenta de nuevo** - Gemini suele recuperarse rápido

---

### Opción 3: Cambiar Proveedor Manualmente

En la interfaz de usuario:
1. Ve a **Configuración de Usuario**
2. Click en **IA Settings**
3. Cambia de **Gemini** a **OpenAI** o **Claude**
4. Guarda y vuelve a generar el quiz

---

## 🔧 Para Administradores

### Configurar Fallback Completo (3 proveedores)

Ejecuta este script en PostgreSQL:

```sql
-- OpenAI (estable, económico)
INSERT INTO configuracion_sistema (clave, valor, descripcion)
VALUES (
  'openai_fallback_key',
  '{"api_key": "sk-proj-YOUR_KEY", "model": "gpt-4o-mini"}',
  'Fallback 1'
)
ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor;

-- Gemini (gratis)
INSERT INTO configuracion_sistema (clave, valor, descripcion)
VALUES (
  'gemini_fallback_key',
  '{"api_key": "YOUR_GEMINI_KEY", "model": "gemini-1.5-flash"}',
  'Fallback 2'
)
ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor;

-- Claude (opcional)
INSERT INTO configuracion_sistema (clave, valor, descripcion)
VALUES (
  'claude_fallback_key',
  '{"api_key": "YOUR_CLAUDE_KEY", "model": "claude-3-haiku-20240307"}',
  'Fallback 3'
)
ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor;
```

---

## ✅ Verificar que Funciona

Después de configurar, verás en los logs del backend:

```bash
⚠️ gemini sobrecargado, intentando fallback automático...
🔄 Intentando con openai...
✅ Éxito con openai (fallback)
```

---

## 💰 Costos Estimados

Con GPT-4o-mini como fallback:
- **Quiz de 5 preguntas:** ~$0.0007 USD
- **Quiz de 10 preguntas:** ~$0.0015 USD
- **100 quizzes al mes:** ~$0.15 USD

**Muy barato y vale la pena por la estabilidad.**

---

## 📚 Más Información

Lee `backend/bd/FALLBACK_SETUP_README.md` para detalles completos.
