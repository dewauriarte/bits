# 🚀 ROADMAP DE SPRINTS - Sistema de Quizzes Gamificado

## 📋 Metodología y Estructura

Este documento define el plan de desarrollo sprint por sprint. Cada sprint tiene una duración de **2 semanas** y sigue la metodología **Agile/Scrum**.

### 🎯 Principios de Desarrollo

1. **Backend First**: APIs sólidas antes que UI
2. **Testing Continuo**: TDD cuando sea posible
3. **Deploy Incremental**: Cada sprint termina con deploy funcional
4. **Documentación Viva**: Actualizar docs con cada feature

### 📊 Timeline General

- **FASE 1: FUNDACIÓN** (Sprints 1-3) → 6 semanas
- **FASE 2: CORE GAMEPLAY** (Sprints 4-6) → 6 semanas  
- **FASE 3: GAMIFICACIÓN** (Sprints 7-9) → 6 semanas
- **FASE 4: MODOS AVANZADOS** (Sprints 10-12) → 6 semanas
- **TOTAL**: ~6 meses hasta MVP completo

---

# 📅 FASE 1: FUNDACIÓN

## 🔷 SPRINT 1: Setup y Autenticación (Semanas 1-2)

### 🎯 Objetivos
- ✅ Infraestructura base configurada
- ✅ Sistema de autenticación RBAC funcional
- ✅ Base de datos PostgreSQL operativa
- ✅ Deploy inicial a staging

### 📦 BACKEND

#### **Setup Inicial**
* [x] Inicializar proyecto Node.js + TypeScript
* [x] Configurar Express/Fastify
* [x] Setup Prisma + PostgreSQL connection
* [x] Configurar variables de entorno (.env)
* [x] Setup ESLint + Prettier
* [x] Configurar estructura de carpetas MVC

#### Base de Datos
- [x] Seed data básico
  - 1 admin
  - 2 profesores
  - 10 estudiantes
  - 14 grados (Inicial + Primaria + Secundaria)
  - 10 materias

#### Autenticación RBAC

**⚠️ IMPORTANTE: Estudiantes NO requieren correo electrónico**

##### Autenticación Admin/Profesor (Tradicional)
- [x] POST `/api/auth/register`
  - Validación con Zod
  - Hash passwords (bcrypt)
  - Crear usuario + perfil_gamer
  - Return JWT token
- [x] POST `/api/auth/login`
  - Verificar credenciales
  - Generar JWT + refresh token
  - Guardar refresh token en Redis
  - Return user data + tokens
- [x] POST `/api/auth/refresh`
  - Validar refresh token
  - Generar nuevo access token
- [x] POST `/api/auth/logout`
  - Invalidar refresh token en Redis
- [x] GET `/api/auth/me`
  - Obtener usuario actual
  - Include perfil_gamer data

##### Autenticación Estudiantes (5 Métodos)

**1. Login por Código PIN**
- [ ] POST `/api/auth/student/join-by-code`
  - Input: `{ game_code: "ABC123", student_name: "Juan" }`
  - Validar que game_code exista y esté activo
  - Crear sesión temporal o asignar estudiante existente
  - Return token temporal + game_id

**2. Login por QR Code**
- [ ] POST `/api/auth/student/join-by-qr`
  - Input: `{ qr_token: "encrypted_game_data" }`
  - Decodificar QR token (JWT con game_id)
  - Validar juego activo
  - Return datos del juego + lista de estudiantes

**3. Login por Link Directo**
- [ ] GET `/api/games/:game_code/join`
  - Validar game_code en URL
  - Return información del juego
  - Lista de estudiantes disponibles
  - No requiere credenciales previas

**4. Login Clase Permanente (Usuario/Contraseña)**
- [ ] POST `/api/auth/student/register-permanent`
  - Input: `{ username: "juan.perez", password: "1234", age: 10, grade_id: 5 }`
  - NO requiere email
  - Username único en la clase
  - Password simple (cambiar después)
  - Crear perfil gamer permanente
- [ ] POST `/api/auth/student/login-permanent`
  - Input: `{ username: "juan.perez", password: "1234" }`
  - Verificar credenciales
  - Return JWT + perfil completo

**5. Login con Avatares (Niños 3-6 años)**
- [ ] GET `/api/classes/:class_id/avatars`
  - Return lista de avatares asignados
  - Include: avatar_id, emoji/icon, student_name
- [ ] POST `/api/auth/student/login-by-avatar`
  - Input: `{ avatar_id: 5, class_id: 10 }`
  - Sin contraseña
  - Validar avatar pertenece a clase
  - Return token + student data

##### Middleware de Autenticación
- [x] Middleware `authenticate()`
  - Verificar JWT
  - Attach user a req.user
- [x] Middleware `authorize(...roles)`
  - Verificar rol del usuario
  - Return 403 si no autorizado
- [ ] Middleware `authenticateStudent()`
  - Soportar tokens temporales y permanentes
  - Validar contexto de juego si es temporal

#### Testing Backend
- [ ] Setup Jest + Supertest
- [ ] Tests de registro (Admin/Profesor)
  - Registro exitoso
  - Email duplicado
  - Validación de campos
- [ ] Tests de login (Admin/Profesor)
  - Login exitoso
  - Credenciales inválidas
- [ ] Tests de login estudiantes
  - Join por código PIN (válido/inválido)
  - Join por QR (token válido/expirado)
  - Join por link (game_code válido/inválido)
  - Login permanente (username/password)
  - Registro permanente (sin email)
  - Login por avatar (avatar asignado/no asignado)
- [ ] Tests de middleware auth
  - Token válido
  - Token expirado
  - Sin token
  - Token temporal vs permanente
- [ ] Tests de RBAC
  - Admin puede todo
  - Profesor solo sus recursos
  - Estudiante solo lectura
- [ ] Coverage: 75%+

### 🎨 FRONTEND

#### Setup Inicial
- [x] Vite + React + TypeScript
- [x] Tailwind CSS + configuración
- [x] shadcn/ui instalación
  - Button, Input, Form, Card
  - Dialog, Select, Avatar
- [x] React Router v6
  - Definir rutas principales
- [x] Zustand stores
  - authStore
  - configStore
- [x] TanStack Query
  - Configurar QueryClient
  - Configurar devtools
- [x] Librerías adicionales (estudiantes)
  - react-qr-reader (scanner QR)
  - qrcode.react (generar QR - profesor)
  - react-hook-form + zod (validación)
  - framer-motion (animaciones avatares)

#### API Client
- [x] Axios instance configurada
  - Base URL desde env
  - Interceptor para token
  - Interceptor para refresh
  - Error handling global
- [x] Auth API functions (Admin/Profesor)
  ```typescript
  authApi.register(data)
  authApi.login(credentials)
  authApi.logout()
  authApi.getMe()
  authApi.refreshToken()
  ```
- [x] Auth API functions (Estudiantes - 5 métodos)
  ```typescript
  authApi.student.joinByCode(code, name)
  authApi.student.joinByQR(qrToken)
  authApi.student.joinByLink(gameCode, name)
  authApi.student.loginPermanent(username, password)
  authApi.student.registerPermanent(data)
  authApi.student.loginByAvatar(avatarId, classId)
  authApi.student.getAvatars(classId)
  ```

#### Páginas de Autenticación

##### Login Admin/Profesor
- [x] `/login` - Página de Login
  - Form con React Hook Form + Zod
  - Email + password
  - "Recordarme" checkbox
  - Link a "Olvidé contraseña"
  - Manejo de errores
- [x] `/register` - Página de Registro Profesor
  - Formulario completo con validación
  - Email + password
  - Selector de materias
  - Terms & conditions checkbox

##### Login Estudiantes (Sin Email)

- [x] `/student/join` - Página Principal Estudiante
  - 5 opciones visuales grandes:
    1. 🔢 "Ingresar Código"
    2. 📷 "Escanear QR"
    3. 🔗 "Usar Link"
    4. 👤 "Tengo Usuario"
    5. 🎨 "Soy de Inicial" (avatares)

- [x] `/student/join/code` - Join por Código PIN
  - Input grande para código (6 caracteres)
  - Auto-mayúsculas
  - Validación en vivo
  - Si válido: selector de nombre
  - Puede escribir nuevo nombre o seleccionar de lista

- [x] `/student/join/qr` - Scanner QR
  - Activar cámara
  - Componente react-qr-reader
  - Detectar código automáticamente
  - Redirect a selección de nombre

- [ ] `/student/join/:game_code` - Link Directo
  - Auto-detectar game_code desde URL
  - Mostrar info del juego (nombre, materia, profesor)
  - Selector de nombre
  - Botón "Unirse al juego"

- [x] `/student/login-permanent` - Login Permanente
  - Username input (sin @)
  - Password simple
  - "Recordarme" checkbox
  - Link "Primera vez? Regístrate"

- [x] `/student/register-permanent` - Registro Permanente
  - Username: nombre.apellido (sugerencias)
  - Password simple (min 4 caracteres)
  - Confirmar password
  - Edad
  - Selector de grado
  - NO requiere email
  - Avatar opcional

- [x] `/student/avatars/:class_id` - Login por Avatares (Inicial)
  - Grid de 20 avatares grandes
  - Emojis coloridos: 🐱🦁🐼🐨🦊🐸🐰🐯🐵🐶
  - Nombre debajo de cada avatar
  - Un toque = login automático
  - Sin texto, solo visual

- [x] Layout público
  - Header simple con logo
  - Footer con links

#### Componentes Reutilizables (Estudiantes)
- [x] `CodeInput` - Input código PIN
  - 6 caracteres alfanuméricos
  - Auto-mayúsculas
  - Validación en vivo
- [x] `QRScanner` - Escáner QR
  - react-qr-reader
  - Activar cámara
  - Feedback visual
- [ ] `StudentSelector` - Selector de nombres
  - Lista de estudiantes registrados
  - Opción "Escribir nuevo nombre"
  - Autocomplete
- [x] `AvatarGrid` - Grid de avatares
  - 20 avatares en grid 4x5
  - Emojis grandes (80px)
  - Solo clickeable si asignado
  - Animación al tocar
- [x] `UsernameGenerator` - Generador username
  - Sugerencia automática: nombre.apellido
  - Validación disponibilidad
  - Feedback en vivo

#### Rutas Protegidas
- [x] `ProtectedRoute` component
  - Verificar token en localStorage
  - Redirect a /login si no auth
  - Show loading mientras verifica
- [x] `RoleRoute` component
  - Verificar rol del usuario
  - Show 403 page si no autorizado

#### Estado Global - Auth Store
```typescript
interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  role: 'admin' | 'profesor' | 'estudiante' | null;
  sessionType: 'permanent' | 'temporary' | null; // Para estudiantes
  
  // Admin/Profesor
  login: (credentials) => Promise<void>;
  register: (data) => Promise<void>;
  
  // Estudiantes (5 métodos)
  joinByCode: (code: string, name: string) => Promise<void>;
  joinByQR: (qrToken: string) => Promise<void>;
  joinByLink: (gameCode: string, name: string) => Promise<void>;
  loginPermanent: (username: string, password: string) => Promise<void>;
  registerPermanent: (data: StudentRegister) => Promise<void>;
  loginByAvatar: (avatarId: number, classId: number) => Promise<void>;
  
  // Común
  logout: () => void;
  refreshToken: () => Promise<void>;
}
```

- [x] Implementar authStore con Zustand
- [x] Persistir token en localStorage
- [x] Auto-refresh token (interceptor en api.ts)
- [x] Soportar múltiples tipos de sesión (temporal vs permanente)

#### Testing Frontend
- [ ] Setup Vitest + RTL
- [ ] Tests de LoginForm (Admin/Profesor)
  - Submit exitoso
  - Validación de campos
  - Manejo de errores
- [ ] Tests de RegisterForm (Profesor)
- [ ] Tests componentes estudiantes
  - CodeInput: validación, auto-mayúsculas
  - QRScanner: mock cámara, detectar código
  - StudentSelector: selección, nuevo nombre
  - AvatarGrid: click solo asignados
  - UsernameGenerator: sugerencias, disponibilidad
- [ ] Tests páginas estudiantes
  - /student/join: 5 opciones
  - /student/join/code: flujo completo
  - /student/join/qr: flujo scan
  - /student/login-permanent: validación
  - /student/register-permanent: sin email
  - /student/avatars/:class_id: grid funcional
- [ ] Tests de ProtectedRoute
- [ ] Tests de authStore (todos los métodos)
- [ ] Coverage: 65%+

### 🚀 DEVOPS

- [ ] Setup Railway/Render (backend)
  - Configurar PostgreSQL
  - Configurar Redis
  - Variables de entorno
- [ ] Setup Vercel (frontend)
  - Configurar build
  - Variables de entorno
- [ ] SSL/HTTPS configurado
- [ ] Setup Sentry
  - Error tracking backend
  - Error tracking frontend

### ✅ Criterios de Aceptación

#### Admin/Profesor
- [ ] Profesor puede registrarse con email/password
- [ ] Profesor puede hacer login
- [ ] Token JWT se guarda correctamente
- [ ] Dashboard profesor funcional
- [ ] Logout limpia sesión

#### Estudiantes (Sin Email)
- [ ] Estudiante puede unirse por código PIN (ABC123)
- [ ] Estudiante puede unirse escaneando QR
- [ ] Estudiante puede unirse por link directo
- [ ] Estudiante puede registrarse con usuario/contraseña (sin email)
- [ ] Estudiante puede login con usuario/contraseña permanente
- [ ] Niños de inicial pueden login con avatares (sin escribir)
- [ ] Sesiones temporales vs permanentes funcionan correctamente
- [ ] Selector de nombre aparece en las opciones correctas

#### General
- [ ] Protected routes funcionan
- [ ] Dashboards diferentes según rol
- [ ] Refresh token funciona automáticamente
- [ ] Tests passing (75% backend, 65% frontend)
- [ ] Deploy a staging exitoso

### 📈 Métricas de Éxito

- 100% endpoints de auth funcionando
- 0 errores críticos en staging
- API response time < 200ms
- Frontend load time < 2s

---