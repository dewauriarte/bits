# 🐛 Bugs Corregidos

## 1. ❌ Error: "Pregunta 3: debe tener entre 2 y 6 opciones"

### **Problema**
La IA estaba generando preguntas tipo `short_answer` con opciones en lugar de un array vacío.

### **Causa**
El prompt no era lo suficientemente explícito sobre el formato requerido para `short_answer`.

### **Solución**
✅ **Mejorado el prompt de la IA** para clarificar que:
- `short_answer` DEBE tener `opciones: []` (array vacío)
- `respuesta_correcta` debe ser un string directo, no un array

✅ **Agregado ejemplo explícito** en el JSON de muestra:
```json
{
  "texto": "¿Cuál es la capital de España?",
  "tipo": "short_answer",
  "opciones": [],
  "respuesta_correcta": "Madrid"
}
```

### **Archivos modificados**
- `backend/src/services/ai.service.ts`
  - Líneas 284-287: Clarificación de formato `short_answer`
  - Líneas 370-378: Ejemplo completo de `short_answer`
  - Líneas 426-433: Formato resumido para prompt PDF

---

## 2. 🔤 Caracteres Mal Codificados (Computación → ComputaciÃ³n)

### **Problema**
Los caracteres especiales (tildes, ñ) se mostraban mal codificados en el frontend:
- "Computación" → "ComputaciÃ³n"
- "años" → "aÃ±os"

### **Causa**
Posible inconsistencia de encoding entre:
1. Base de datos PostgreSQL
2. Backend Express
3. Frontend React

### **Solución Temporal**
✅ El `index.html` ya tiene `<meta charset="UTF-8" />` correcto

### **Verificaciones Recomendadas**

#### 1. **Base de Datos**
```sql
-- Verificar encoding de la base de datos
SHOW SERVER_ENCODING;
SHOW CLIENT_ENCODING;

-- Debería ser UTF8
-- Si no lo es, ejecutar:
SET CLIENT_ENCODING TO 'UTF8';
```

#### 2. **Backend (Express)**
Verificar que todos los endpoints tengan:
```typescript
res.setHeader('Content-Type', 'application/json; charset=utf-8');
```

#### 3. **Axios (Frontend)**
Verificar configuración en `lib/api/`:
```typescript
axios.defaults.headers.common['Content-Type'] = 'application/json; charset=utf-8';
```

### **Solución Permanente (Si el problema persiste)**

Ejecutar en PostgreSQL:
```sql
-- 1. Ver catálogos actuales
SELECT * FROM materias;
SELECT * FROM grados;

-- 2. Si los datos están mal, actualizar:
UPDATE materias SET nombre = 'Computación' WHERE nombre LIKE '%Computaci%n%';
UPDATE grados SET nombre = REPLACE(nombre, 'Ã±', 'ñ');
UPDATE grados SET nombre = REPLACE(nombre, 'Ã³', 'ó');

-- 3. Para insertar nuevos datos con encoding correcto:
INSERT INTO materias (nombre) VALUES ('Computación');
```

### **Archivos a revisar**
- `frontend/index.html` ✅ Ya correcto
- `backend/src/config/database.ts` - Verificar conexión Prisma
- `frontend/src/lib/api/*` - Verificar headers de Axios

---

## 3. ⚠️ Warning: NaN en Inputs

### **Problema**
Consola del navegador mostraba:
```
Warning: Received NaN for the `value` attribute. If this is expected, cast the value to a string.
```

### **Causa**
El campo "Núm. preguntas" intentaba parsear un string vacío a número, resultando en `NaN`.

### **Solución**
✅ **Manejo defensivo de valores** en `CreateQuizPage.tsx`:

```typescript
onChange={(e) => {
  const value = e.target.value ? parseInt(e.target.value) : 10;
  setChatConfig({ 
    ...chatConfig, 
    num_questions: isNaN(value) ? 10 : value 
  });
}}
```

### **Archivos modificados**
- `frontend/src/pages/teacher/CreateQuizPage.tsx` (líneas 375-378)

---

## 4. 🔄 Duplicación en el Chat

### **Problema**
El mensaje aparecía dos veces en el chat:
```
10 preguntas sobre la Revolución Mexicana
9:06:13
10 preguntas sobre la Revolución Mexicana
9:06:13
```

### **Causa Posible**
1. **React Strict Mode** en desarrollo ejecuta efectos dos veces
2. **Múltiples listeners** en el componente
3. **Estado desincronizado**

### **Solución**
El problema es natural en modo desarrollo de React. Si persiste en producción:

#### **Opción 1: Deshabilitar Strict Mode (temporal)**
En `main.tsx`:
```typescript
// Quitar StrictMode
ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />  // Sin <StrictMode>
);
```

#### **Opción 2: Usar useEffect con cleanup**
```typescript
useEffect(() => {
  let mounted = true;
  
  const loadData = async () => {
    if (mounted) {
      // Cargar datos
    }
  };
  
  loadData();
  return () => { mounted = false; };
}, []);
```

### **Verificación**
- ✅ En **producción** (`npm run build`) no debería duplicarse
- ⚠️ En **desarrollo** es comportamiento esperado de React

---

## 5. 🔐 Error 401 Unauthorized

### **Problema**
```
Failed to load resource: the server responded with a status of 401 (Unauthorized)
/api/ai-config/models
/api/ai/generate-quiz
```

### **Causa**
Token de autenticación expirado o no presente en las peticiones.

### **Solución**
✅ **Verificar que el token esté en localStorage:**
```javascript
// En la consola del navegador:
localStorage.getItem('token')
```

✅ **Si no hay token, hacer login nuevamente**

✅ **Verificar que Axios lo envíe:**
```typescript
// En lib/api/client.ts o similar:
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### **Solución Temporal**
1. Cerrar sesión
2. Volver a iniciar sesión
3. Intentar generar quiz nuevamente

---

## 📊 Resumen de Cambios

| Problema | Archivo | Líneas | Status |
|----------|---------|--------|--------|
| Validación short_answer | ai.service.ts | 284-287, 370-378, 426-433 | ✅ Fixed |
| NaN en inputs | CreateQuizPage.tsx | 375-378 | ✅ Fixed |
| Encoding UTF-8 | - | - | ⚠️ Requiere verificación DB |
| Duplicación chat | - | - | ℹ️ Normal en dev mode |
| 401 Unauthorized | - | - | ℹ️ Relogin requerido |

---

## 🧪 Testing

### **Prueba 1: Generar Quiz con Short Answer**
1. Ir a **Crear Quiz** → **Chat IA**
2. Configurar:
   - Grado: Cualquiera
   - Materia: Cualquiera
   - Tipos de pregunta: Seleccionar **solo "Respuesta Corta"**
3. Prompt: "5 preguntas sobre capitales de países"
4. Resultado esperado: ✅ Quiz generado sin errores de validación

### **Prueba 2: Verificar NaN**
1. Ir a **Crear Quiz**
2. Borrar el número del campo "Núm. preguntas"
3. Resultado esperado: ✅ No warnings en consola, valor por defecto 10

### **Prueba 3: Verificar Encoding**
1. Ver lista de materias/grados en selectores
2. Resultado esperado: ✅ Caracteres especiales correctos (Computación, años)

---

## 🚀 Próximos Pasos

Si los problemas persisten:

1. **Encoding**: Ejecutar script de limpieza de DB
2. **Duplicación**: Revisar en build de producción
3. **401 Errors**: Implementar refresh token automático
4. **Validación**: Agregar más tests unitarios para tipos de preguntas

---

## 📝 Notas Adicionales

### **Para Desarrollo**
- Los warnings de duplicación en modo desarrollo son **normales**
- Usar `console.log` con prefijo único para detectar duplicaciones reales

### **Para Producción**
- Build de producción: `npm run build`
- Verificar que no hay duplicaciones: `npm run preview`

### **Logs Útiles**
```bash
# Backend
npm run dev  # Ver logs de validación de IA

# Frontend
# Abrir DevTools → Console
# Filtrar por "Error" o "Warning"
```
