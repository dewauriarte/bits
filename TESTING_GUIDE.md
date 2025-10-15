# 🧪 Guía de Testing - AppQuiz

## ✅ Estado de los Servidores

### Verificar que están corriendo:
```powershell
# Backend - puerto 3001
netstat -ano | findstr :3001

# Frontend - puerto 5173  
netstat -ano | findstr :5173
```

**URLs:**
- Backend API: http://localhost:3001
- Frontend App: http://localhost:5173

---

## 🚀 Iniciar los Servidores

### Terminal 1 - Backend
```bash
cd backend
npm run dev
```

Deberías ver:
```
🚀 Server running on http://localhost:3001
Environment: development
```

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

Deberías ver:
```
VITE v5.x.x ready in XXX ms
➜ Local: http://localhost:5173/
```

---

## 🧪 Testing Backend

### 1. Health Check (GET)
```bash
curl http://localhost:3001/health
```

**Respuesta esperada:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-14T13:00:00.000Z"
}
```

### 2. Root Endpoint (GET)
```bash
curl http://localhost:3001/
```

**Respuesta esperada:**
```json
{
  "message": "AppQuiz API v1.0",
  "endpoints": {
    "health": "/health",
    "auth": "/api/auth"
  },
  "docs": "Use POST requests para /api/auth endpoints"
}
```

### 3. Registro de Usuario (POST)
```bash
curl -X POST http://localhost:3001/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"test_user\",\"email\":\"test@example.com\",\"password\":\"Test123!\",\"nombre\":\"Test\",\"apellido\":\"User\",\"rol\":\"estudiante\"}"
```

**Respuesta esperada (éxito):**
```json
{
  "success": true,
  "data": {
    "usuario": {
      "id_usuario": 123,
      "username": "test_user",
      "email": "test@example.com",
      "nombre": "Test",
      "apellido": "User",
      "rol": "estudiante",
      ...
    },
    "token": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  },
  "message": "Usuario registrado exitosamente"
}
```

### 4. Login (POST)
```bash
curl -X POST http://localhost:3001/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"emailOrUsername\":\"admin\",\"password\":\"Admin123!\"}"
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "usuario": {
      "id_usuario": 1,
      "username": "admin",
      "rol": "admin",
      ...
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  },
  "message": "Login exitoso"
}
```

### 5. Get Me (GET - Requiere Token)
```bash
curl http://localhost:3001/api/auth/me ^
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

---

## 🌐 Testing Frontend

### 1. Abrir el Navegador
Ve a: **http://localhost:5173**

**Deberías ver:**
- La página de login con diseño moderno
- Gradientes morado/índigo
- Logo de AppQuiz
- Formulario con email/username y password

### 2. Probar Login con Usuario Existente

**Credenciales de prueba (del seed):**

**Admin:**
- Username/Email: `admin`
- Password: `Admin123!`

**Profesor:**
- Username/Email: `prof_maria`
- Password: `Prof123!`

**Estudiante:**
- Username/Email: `est_juan`
- Password: `Est123!`

**Pasos:**
1. Ingresa username: `admin`
2. Ingresa password: `Admin123!`
3. Click en "Iniciar Sesión"
4. Deberías ser redirigido a `/dashboard`

### 3. Probar Registro de Nuevo Usuario

**Pasos:**
1. En login, click en "Crear cuenta nueva"
2. Deberías ir a `/register`
3. Selecciona tab "Estudiante" o "Profesor"

**Para Estudiante:**
- Nombre: `Juan`
- Apellido: `Pérez`
- Username: `juan_perez` (único)
- Email: `juan@example.com`
- Grado: Selecciona uno de la lista (ej: "1er Grado Primaria")
- Fecha Nacimiento: Opcional
- Password: `JuanPerez123!` (mínimo 8 chars, mayúscula, minúscula, número, especial)
- Confirmar Password: `JuanPerez123!`
- Aceptar términos: ✓

**Para Profesor:**
- Similar a estudiante
- En lugar de grado: seleccionar 1-5 materias

4. Click en "Crear Cuenta"
5. Deberías ser redirigido a `/dashboard`

### 4. Verificar Dashboard

**Deberías ver:**
- Header con "Dashboard" y botón "Cerrar Sesión"
- Card con tu información:
  - Avatar con iniciales
  - Nombre completo
  - Username
  - Email
  - Rol (badge de color)
- Perfil Gamer:
  - Nivel
  - Puntos totales
  - Racha actual
  - Monedas

### 5. Probar Rutas Protegidas

**Sin estar logueado:**
1. Abre incógnito o borra localStorage
2. Ve a http://localhost:5173/dashboard
3. Deberías ser redirigido a `/login`

**Con rol estudiante:**
1. Login como estudiante
2. Ve a http://localhost:5173/admin
3. Deberías ver página 403 "Acceso No Autorizado"

### 6. Probar Logout

1. En dashboard, click en "Cerrar Sesión"
2. Deberías ser redirigido a `/login`
3. Intenta ir a `/dashboard` → deberías ser redirigido a `/login`

---

## 🐛 Errores Comunes

### "Cannot GET /api/auth/register"

❌ **Incorrecto:** Abrir http://localhost:3001/api/auth/register en el navegador
✅ **Correcto:** Usar POST request desde el frontend o curl/Postman

**Explicación:** Las rutas de auth son POST, no GET. El navegador hace GET por defecto.

### "Cannot GET /"

**Si ves esto en localhost:3001** → ✅ Normal, ahora hay una respuesta JSON
**Si ves esto en localhost:5173** → ❌ Frontend no está cargando:
1. Verifica que el servidor de Vite esté corriendo
2. Revisa la consola de terminal para errores
3. Limpia caché del navegador
4. Verifica `.env` existe y tiene `VITE_API_URL=http://localhost:3001`

### "Network Error" o "Failed to fetch"

**Posibles causas:**
1. Backend no está corriendo → Inicia con `npm run dev` en `backend/`
2. CORS bloqueando → Backend ya tiene CORS habilitado
3. URL incorrecta en `.env` → Verifica `VITE_API_URL`

### Errores de Validación en Registro

**Password débil:**
- Debe tener mínimo 8 caracteres
- Al menos una mayúscula
- Al menos una minúscula
- Al menos un número
- Al menos un carácter especial (!@#$%^&*)

**Ejemplo válido:** `MiPassword123!`
**Ejemplo inválido:** `password` (muy simple)

### "Username ya está en uso"

- Username debe ser único
- Intenta con otro username
- Verificar BD con: `psql -U postgres -d appquiz` → `SELECT username FROM usuarios;`

---

## 📊 Verificar Base de Datos

```bash
# Conectar a PostgreSQL
psql -U postgres -d appquiz

# Ver usuarios
SELECT id_usuario, username, email, rol FROM usuarios;

# Ver perfiles gamer
SELECT u.username, pg.nivel, pg.puntos_totales 
FROM usuarios u 
JOIN perfiles_gamer pg ON u.id_usuario = pg.usuario_id;

# Salir
\q
```

---

## 🔄 Reiniciar Todo

Si algo no funciona, reinicia limpiamente:

### 1. Parar todos los procesos Node
```powershell
Get-Process -Name node | Stop-Process -Force
```

### 2. Reiniciar Backend
```bash
cd backend
npm run dev
```

### 3. Reiniciar Frontend
```bash
cd frontend  
npm run dev
```

### 4. Limpiar caché del navegador
- Chrome: Ctrl + Shift + Delete
- O usar modo incógnito

---

## ✅ Checklist de Testing Completo

**Backend:**
- [ ] `/health` responde OK
- [ ] `/` muestra información de API
- [ ] POST `/api/auth/register` crea usuario
- [ ] POST `/api/auth/login` retorna tokens
- [ ] GET `/api/auth/me` con token válido funciona

**Frontend:**
- [ ] http://localhost:5173 carga página de login
- [ ] Login con usuario existente funciona
- [ ] Registro de nuevo estudiante funciona
- [ ] Registro de nuevo profesor funciona
- [ ] Dashboard muestra información correcta
- [ ] Logout funciona y redirige a login
- [ ] Rutas protegidas redirigen a login
- [ ] RoleRoute muestra 403 para roles no autorizados

**Integración:**
- [ ] Login desde frontend llama al backend correctamente
- [ ] Tokens se guardan en localStorage
- [ ] Headers de Authorization se envían automáticamente
- [ ] Refresh token funciona cuando expira access token
- [ ] Errores del backend se muestran en frontend

---

## 📝 Notas Importantes

1. **Puerto 3001 = Backend API** (solo acepta requests HTTP, no interfaz visual)
2. **Puerto 5173 = Frontend Web** (aquí abres el navegador)
3. Las rutas de autenticación son **POST**, no GET
4. Los grados actualizados incluyen: Inicial (3, 4, 5 años), Primaria (1° a 6°), Media (1° a 5°)
5. El sistema usa JWT con refresh tokens para autenticación

---

**¡Happy Testing! 🚀**
