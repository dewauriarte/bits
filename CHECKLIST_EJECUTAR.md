# ✅ CHECKLIST - Ejecutar Login de Estudiantes

## 🎯 Sigue estos pasos en orden

---

## PARTE 1: FRONTEND

### ☐ 1. Instalar dependencias
```bash
cd c:\bits\frontend
npm install
```

**Espera a que termine.** Esto instalará:
- sonner
- react-qr-reader
- qrcode.react
- framer-motion

**Tiempo:** ~2 minutos

---

## PARTE 2: BACKEND & DATABASE

### ☐ 2. Aplicar migración SQL
```bash
cd c:\bits\backend
psql -U postgres -d appquiz -f bd\schema_login_estudiantes.sql
```

**Esto creará 4 tablas nuevas:**
- avatares_clase
- game_sessions
- participantes_temporales
- login_history

**Tiempo:** ~10 segundos

### ☐ 3. Regenerar Prisma Client
```bash
npx prisma generate
```

**Esto actualiza los tipos de TypeScript.**

**Tiempo:** ~30 segundos

---

## PARTE 3: INICIAR SERVIDORES

### ☐ 4. Terminal 1 - Iniciar Backend
```bash
cd c:\bits\backend
npm run dev
```

**Deberías ver:**
```
🚀 Server running on http://localhost:3001
Environment: development
```

**Deja esta terminal abierta.**

### ☐ 5. Terminal 2 - Iniciar Frontend
```bash
cd c:\bits\frontend
npm run dev
```

**Deberías ver:**
```
VITE v5.x.x ready in XXX ms
➜ Local:   http://localhost:5173/
```

**Deja esta terminal abierta.**

---

## PARTE 4: PROBAR

### ☐ 6. Abrir navegador
```
http://localhost:5173/student/join
```

**Deberías ver:**
Una página con 5 opciones grandes:
1. 🔢 Ingresar Código
2. 📷 Escanear QR
3. 🔗 Usar Link
4. 👤 Tengo Usuario
5. 🎨 Soy de Inicial

---

## ✅ PRUEBAS RÁPIDAS

### Test 1: Página Principal ✅
- [ ] Navega a `/student/join`
- [ ] Ves 5 cards grandes con emojis
- [ ] Cards tienen hover effect
- [ ] Link "Primera vez? Regístrate" funciona

### Test 2: Registro Permanente ✅
- [ ] Click en "Primera vez? Regístrate"
- [ ] Navega a `/student/register-permanent`
- [ ] Completa el formulario:
  - Nombre: Juan
  - Apellido: Pérez
  - Username: juan.perez (auto-genera)
  - Edad: 10
  - Grado: Selecciona uno
  - Password: 1234
  - Confirmar: 1234
- [ ] Click "Crear Cuenta"
- [ ] Deberías ver toast de éxito
- [ ] Redirige a `/dashboard/student` (404 por ahora, está ok)

### Test 3: Login Permanente ✅
- [ ] Navega a `/student/login-permanent`
- [ ] Ingresa:
  - Usuario: juan.perez
  - Password: 1234
- [ ] Click "Entrar"
- [ ] Toast de bienvenida
- [ ] Redirige a dashboard

### Test 4: Código PIN ⏳
**Requiere backend con juego activo**
- [ ] Navega a `/student/join/code`
- [ ] Ingresa código: ABC123
- [ ] Escribe nombre: María
- [ ] Click "Unirse al Juego"
- [ ] Si no hay juego: "Código inválido" ✅ (esperado)

### Test 5: Avatares ⏳
**Requiere clase con avatares asignados**
- [ ] Navega a `/student/avatars/[class_id]`
- [ ] Ver grid de avatares
- [ ] Click en avatar asignado
- [ ] Login automático

---

## 🔍 VERIFICAR BACKEND

### ☐ Health Check
```bash
curl http://localhost:3001/health
```

**Deberías ver:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-14T..."
}
```

### ☐ Endpoints Disponibles
```bash
curl http://localhost:3001/
```

**Deberías ver:**
```json
{
  "message": "AppQuiz API v1.0",
  "endpoints": {
    "health": "/health",
    "auth": "/api/auth"
  }
}
```

---

## ❌ TROUBLESHOOTING

### Error: "Cannot find module 'sonner'"
**Solución:**
```bash
cd c:\bits\frontend
npm install
```

### Error: "Table 'game_sessions' does not exist"
**Solución:**
```bash
cd c:\bits\backend
psql -U postgres -d appquiz -f bd\schema_login_estudiantes.sql
```

### Error: TypeScript - "Property 'game_sessions' does not exist"
**Solución:**
```bash
cd c:\bits\backend
npx prisma generate
```

### Error: "EADDRINUSE: address already in use"
**Solución:**
- Backend ya está corriendo en otro proceso
- Cierra el proceso anterior
- O cambia el puerto en `.env`

### Error: Frontend no carga estilos
**Solución:**
```bash
cd c:\bits\frontend
npm run dev
```
Ctrl+C y reiniciar

---

## 📊 ESTADO ESPERADO

### Backend ✅
```
✅ Servidor corriendo en :3001
✅ Conectado a PostgreSQL
✅ Conectado a Redis
✅ 9 endpoints estudiantes disponibles
✅ Middleware de autenticación activo
```

### Frontend ✅
```
✅ Servidor corriendo en :5173
✅ 7 rutas estudiantes configuradas
✅ Toaster sonner funcionando
✅ QR scanner importado
✅ Animaciones cargadas
✅ Sin errores de compilación
```

### Database ✅
```
✅ 4 tablas nuevas creadas
✅ Campo tipo_auth agregado
✅ Función generar_codigo_juego() creada
✅ Índices optimizados
```

---

## 🎯 CHECKLIST FINAL

- [ ] Frontend: `npm install` completado
- [ ] Backend: SQL migración aplicada
- [ ] Backend: Prisma regenerado
- [ ] Backend corriendo en :3001
- [ ] Frontend corriendo en :5173
- [ ] Página `/student/join` carga correctamente
- [ ] Registro permanente funciona
- [ ] Login permanente funciona
- [ ] Toasts/notificaciones aparecen
- [ ] Animaciones funcionan

---

## ✅ SI TODO FUNCIONA

¡Felicidades! El sistema de login de estudiantes está funcionando.

**Siguiente:**
1. Crear juegos activos en el sistema
2. Asignar avatares a estudiantes
3. Generar códigos QR
4. Probar métodos 1, 2, 3 y 5

---

## 📚 DOCUMENTACIÓN

Si necesitas más info:
- `README_STUDENT_LOGIN.md` - Resumen ejecutivo
- `COMPLETADO_LOGIN_ESTUDIANTES.md` - Detalles completos
- `QUICK_START_STUDENT_LOGIN.md` - Guía rápida
- `frontend/INSTALL_STUDENT_LOGIN.md` - Info frontend
- `backend/STUDENT_LOGIN_IMPLEMENTATION.md` - Info backend

---

## 🎉 ¡ÉXITO!

Si llegaste aquí y todo funcionó:
- ✅ Backend 100%
- ✅ Frontend 100%
- ✅ Database 100%
- ✅ Sistema funcionando

**Próximo paso:** Testing 🧪
