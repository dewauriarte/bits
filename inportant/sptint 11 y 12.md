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

#### Setup Inicial
- [ ] Inicializar proyecto Node.js + TypeScript
  - Express.js + configuración básica
  - Estructura de carpetas MVC
  - ESLint + Prettier
  - dotenv para variables de entorno
- [ ] Configurar Prisma ORM
  - Conexión a PostgreSQL
  - Generar cliente Prisma
- [ ] Setup Redis
  - Conexión a Upstash/Redis local
  - Cliente IORedis configurado

#### Base de Datos
- [ ] Ejecutar schema SQL completo
  - Crear todas las tablas (sin rachas)
  - Ejecutar triggers y funciones
  - Crear índices
- [ ] Migrations con Prisma
  - Generar migración inicial
  - Aplicar migración
- [ ] Seed data básico
  - 1 admin
  - 2 profesores
  - 10 estudiantes
  - 3 grados
  - 5 materias

#### Autenticación RBAC
- [ ] POST `/api/auth/register`
  - Validación con Zod
  - Hash passwords (bcrypt)
  - Crear usuario + perfil_gamer
  - Return JWT token
- [ ] POST `/api/auth/login`
  - Verificar credenciales
  - Generar JWT + refresh token
  - Guardar refresh token en Redis
  - Return user data + tokens
- [ ] POST `/api/auth/refresh`
  - Validar refresh token
  - Generar nuevo access token
- [ ] POST `/api/auth/logout`
  - Invalidar refresh token en Redis
- [ ] GET `/api/auth/me`
  - Obtener usuario actual
  - Include perfil_gamer data
- [ ] Middleware `authenticate()`
  - Verificar JWT
  - Attach user a req.user
- [ ] Middleware `authorize(...roles)`
  - Verificar rol del usuario
  - Return 403 si no autorizado

#### Testing Backend
- [ ] Setup Jest + Supertest
- [ ] Tests de registro
  - Registro exitoso
  - Email duplicado
  - Validación de campos
- [ ] Tests de login
  - Login exitoso
  - Credenciales inválidas
- [ ] Tests de middleware auth
  - Token válido
  - Token expirado
  - Sin token
- [ ] Tests de RBAC
  - Admin puede todo
  - Profesor solo sus recursos
  - Estudiante solo lectura
- [ ] Coverage: 75%+

### 🎨 FRONTEND

#### Setup Inicial
- [ ] Vite + React + TypeScript
- [ ] Tailwind CSS + configuración
- [ ] shadcn/ui instalación
  - Button, Input, Form, Card
  - Dialog, Select, Avatar
- [ ] React Router v6
  - Definir rutas principales
- [ ] Zustand stores
  - authStore
  - configStore
- [ ] TanStack Query
  - Configurar QueryClient
  - Configurar devtools

#### API Client
- [ ] Axios instance configurada
  - Base URL desde env
  - Interceptor para token
  - Interceptor para refresh
  - Error handling global
- [ ] Auth API functions
  ```typescript
  authApi.register(data)
  authApi.login(credentials)
  authApi.logout()
  authApi.getMe()
  authApi.refreshToken()
  ```

#### Páginas de Autenticación
- [ ] `/login` - Página de Login
  - Form con React Hook Form + Zod
  - Email + password
  - "Recordarme" checkbox
  - Link a "Olvidé contraseña"
  - Manejo de errores
- [ ] `/register` - Página de Registro
  - Tabs: Profesor / Estudiante
  - Formulario completo con validación
  - Age verification
  - Selector de grado (estudiantes)
  - Selector de materias (profesores)
  - Terms & conditions checkbox
- [ ] Layout público
  - Header simple con logo
  - Footer con links

#### Rutas Protegidas
- [ ] `ProtectedRoute` component
  - Verificar token en localStorage
  - Redirect a /login si no auth
  - Show loading mientras verifica
- [ ] `RoleRoute` component
  - Verificar rol del usuario
  - Show 403 page si no autorizado

#### Estado Global - Auth Store
```typescript
interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  role: 'admin' | 'profesor' | 'estudiante' | null;
  login: (credentials) => Promise<void>;
  register: (data) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}
```

- [ ] Implementar authStore con Zustand
- [ ] Persistir token en localStorage
- [ ] Auto-refresh token antes de expirar

#### Testing Frontend
- [ ] Setup Vitest + RTL
- [ ] Tests de LoginForm
  - Submit exitoso
  - Validación de campos
  - Manejo de errores
- [ ] Tests de RegisterForm
- [ ] Tests de ProtectedRoute
- [ ] Tests de authStore
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

- [ ] Usuario puede registrarse (profesor/estudiante)
- [ ] Usuario puede hacer login
- [ ] Token JWT se guarda correctamente
- [ ] Protected routes funcionan
- [ ] Dashboards diferentes según rol
- [ ] Logout limpia sesión
- [ ] Refresh token funciona automáticamente
- [ ] Tests passing (75% backend, 65% frontend)
- [ ] Deploy a staging exitoso

### 📈 Métricas de Éxito

- 100% endpoints de auth funcionando
- 0 errores críticos en staging
- API response time < 200ms
- Frontend load time < 2s

---

## 🔷 SPRINT 2: Gestión de Clases y Estudiantes (Semanas 3-4)

### 🎯 Objetivos
- ✅ Profesores pueden crear y gestionar clases
- ✅ Sistema de códigos de clase
- ✅ Estudiantes pueden unirse a clases
- ✅ Dashboard profesor funcional

### 📦 BACKEND

#### Models y Controllers - Clases
- [ ] GET `/api/classes`
  - Listar clases del profesor (con filtros)
  - Include: grado, materia, count estudiantes
- [ ] POST `/api/classes`
  - Crear nueva clase
  - Generar código único (6 chars)
  - Validar profesor_id = current user
- [ ] GET `/api/classes/:id`
  - Detalle de clase
  - Include: estudiantes, quizzes
  - Solo profesor owner o estudiantes inscritos
- [ ] PUT `/api/classes/:id`
  - Actualizar clase
  - Solo profesor owner
- [ ] DELETE `/api/classes/:id`
  - Archivar clase (soft delete)
  - Solo profesor owner
- [ ] POST `/api/classes/join`
  - Body: { codigo }
  - Verificar código existe
  - Agregar estudiante a clase
  - Return clase data

#### Models y Controllers - Estudiantes
- [ ] GET `/api/classes/:id/students`
  - Listar estudiantes de la clase
  - Include: perfil_gamer stats básicas
  - Solo profesor owner
- [ ] DELETE `/api/classes/:id/students/:studentId`
  - Remover estudiante de clase
  - Solo profesor owner
- [ ] GET `/api/students/classes`
  - Listar clases del estudiante actual
  - Include: profesor, materia, próximos quizzes

#### Servicios
- [ ] `ClassService.generateUniqueCode()`
  - Generar código alfanumérico
  - Verificar que no existe
  - Retry si duplicado
- [ ] `ClassService.getClassStats(classId)`
  - Total estudiantes
  - Quizzes jugados
  - Promedio de rendimiento

#### Testing Backend
- [ ] Tests CRUD de clases
- [ ] Tests de código único
- [ ] Tests de join class
- [ ] Tests de permisos (solo owner)
- [ ] Coverage: 75%+

### 🎨 FRONTEND

#### Dashboard Profesor
- [ ] `/teacher/dashboard` - Vista principal
  - Sidebar con navegación
  - Stats cards:
    - Total clases
    - Total estudiantes
    - Quizzes creados
  - Lista de clases recientes
  - Acciones rápidas
- [ ] `/teacher/classes` - Gestión de Clases
  - Lista de todas las clases
  - Filtros: grado, materia, año
  - Search bar
  - Botón "Nueva Clase"
  - Cards de clase con:
    - Nombre + código
    - Grado + materia
    - # estudiantes
    - Último juego
    - Acciones: Ver, Editar, Archivar

#### Modales y Forms
- [ ] Modal "Crear Clase"
  - Form con validación
  - Campos:
    - Nombre (requerido)
    - Grado (select)
    - Materia (select)
    - Año escolar (select)
    - Descripción (opcional)
    - Color (picker)
  - Submit y actualizar lista
- [ ] Modal "Editar Clase"
  - Pre-cargar datos
  - Mismos campos que crear
- [ ] Modal "Ver Código de Clase"
  - Mostrar código grande
  - QR code
  - URL para compartir
  - Botón copiar

#### Detalle de Clase
- [ ] `/teacher/classes/:id` - Vista detallada
  - Header con info de clase
  - Tabs:
    - Estudiantes
    - Quizzes
    - Estadísticas
  - Tab Estudiantes:
    - Lista de estudiantes
    - Avatar + nombre
    - Stats básicas (nivel, XP)
    - Acción: Remover
  - Botón "Compartir Código"

#### Dashboard Estudiante
- [ ] `/student/dashboard` - Vista principal
  - Stats personales:
    - Nivel actual + XP
    - Copas totales
    - Insignias
  - Mis Clases (cards)
  - Últimos resultados
- [ ] `/student/classes` - Mis Clases
  - Lista de clases inscritas
  - Card por clase con:
    - Nombre + profesor
    - Materia
    - Próximos juegos
  - Botón "Unirse a Clase"

#### Modal Unirse a Clase
- [ ] Modal con input de código
  - Validación en tiempo real
  - Buscar clase por código
  - Preview de clase encontrada
  - Confirmar inscripción
  - Manejo de errores (código inválido)

#### Testing Frontend
- [ ] Tests de ClassList component
- [ ] Tests de CreateClassModal
- [ ] Tests de JoinClassModal
- [ ] Tests de StudentDashboard
- [ ] Coverage: 65%+

### ✅ Criterios de Aceptación

- [ ] Profesor puede crear clase con código único
- [ ] Código se muestra con QR
- [ ] Estudiante puede unirse con código
- [ ] Lista de estudiantes se actualiza en tiempo real
- [ ] Profesor puede remover estudiantes
- [ ] Filtros y búsqueda funcionan
- [ ] Dashboards muestran data correcta
- [ ] Tests passing

### 📈 Métricas de Éxito

- < 1s para crear clase
- 100% códigos únicos generados
- 0 errores en join class flow

---

## 🔷 SPRINT 3: Gestión de Quizzes con IA (Semanas 5-6)

### 🎯 Objetivos
- ✅ CRUD completo de quizzes
- ✅ Sistema de preguntas con opciones
- ✅ Generación de quizzes con Claude API
- ✅ Upload de PDFs y procesamiento

### 📦 BACKEND

#### CRUD Quizzes
- [ ] GET `/api/quizzes`
  - Listar quizzes del profesor
  - Filtros: estado, materia, grado
  - Pagination
- [ ] POST `/api/quizzes`
  - Crear quiz manual
  - Body: titulo, descripcion, config
  - Estado inicial: borrador
- [ ] GET `/api/quizzes/:id`
  - Detalle completo
  - Include: preguntas con opciones
- [ ] PUT `/api/quizzes/:id`
  - Actualizar quiz
  - Solo si estado = borrador
- [ ] DELETE `/api/quizzes/:id`
  - Soft delete (archivar)
- [ ] POST `/api/quizzes/:id/publish`
  - Cambiar estado a publicado
  - Validar que tenga mínimo 5 preguntas

#### CRUD Preguntas
- [ ] POST `/api/quizzes/:id/questions`
  - Crear pregunta
  - Body: texto, tipo, opciones, respuesta_correcta
  - Auto-incrementar orden
- [ ] PUT `/api/quizzes/:quizId/questions/:questionId`
  - Actualizar pregunta
- [ ] DELETE `/api/quizzes/:quizId/questions/:questionId`
  - Eliminar pregunta
  - Reordenar las restantes
- [ ] PUT `/api/quizzes/:id/questions/reorder`
  - Cambiar orden de preguntas
  - Body: array de IDs en nuevo orden

#### Generación con IA
- [ ] POST `/api/ai/generate-quiz`
  - Body: {
      prompt: string,
      num_questions: number,
      grade_id: UUID,
      subject_id: UUID,
      difficulty: string
    }
  - Llamar a Claude API con prompt estructurado
  - Parsear respuesta JSON
  - Crear quiz + preguntas en DB
  - Return quiz_id
- [ ] POST `/api/ai/generate-from-pdf`
  - Multipart form con PDF
  - Extraer texto con pdf-parse
  - Enviar a Claude con contexto
  - Generar preguntas basadas en contenido
  - Return quiz_id
- [ ] Service `AIService.generateQuiz(params)`
  - Construir prompt optimizado
  - Llamar a Anthropic API
  - Retry logic (3 intentos)
  - Validar estructura de respuesta
  - Guardar en logs_ia
- [ ] Service `AIService.extractPDFText(buffer)`
  - Usar pdf-parse
  - Limpiar texto
  - Limitar a 10k tokens

#### Validaciones
- [ ] Zod schemas para:
  - CreateQuizDTO
  - CreateQuestionDTO
  - AIGenerateDTO
- [ ] Validar opciones de pregunta:
  - Mínimo 2 opciones
  - Máximo 6 opciones
  - Una opción correcta marcada

#### Testing Backend
- [ ] Tests CRUD quizzes
- [ ] Tests CRUD preguntas
- [ ] Tests de reordenamiento
- [ ] Mock de Claude API
- [ ] Tests de generación IA
- [ ] Tests de procesamiento PDF
- [ ] Coverage: 75%+

### 🎨 FRONTEND

#### Chat IA para Crear Quiz
- [ ] `/teacher/quizzes/create` - Vista principal
  - Tabs: "Chat IA" | "Manual"
  - Tab Chat IA:
    - Interfaz de chat (tipo WhatsApp)
    - Input con botones:
      - 📎 Adjuntar PDF
      - 🎙️ Audio (futuro)
      - 📤 Enviar
    - Atajos rápidos:
      - "10 preguntas sobre..."
      - "Quiz desde PDF"
      - "Dificultad media"
  - Mostrar mensajes del chat:
    - User messages (derecha)
    - AI messages (izquierda)
    - Loading state mientras genera
  - Al generar quiz:
    - Mostrar preview
    - Botón "Revisar y Editar"

#### Editor de Quiz
- [ ] `/teacher/quizzes/:id/edit` - Editor completo
  - Header con:
    - Título editable
    - Materia + Grado (selects)
    - Dificultad (select)
    - Estado (badge)
  - Sidebar izquierda:
    - Mini preview de preguntas
    - Drag & drop para reordenar
    - Botón "+ Agregar Pregunta"
  - Panel central:
    - Edición de pregunta actual
    - Texto de pregunta (textarea)
    - Upload imagen (opcional)
    - Tipo de pregunta (select)
    - Opciones (inputs dinámicos)
    - Marcar respuesta correcta
    - Tiempo límite (slider)
    - Puntos (input)
    - Explicación (textarea)
  - Navegación:
    - Anterior / Siguiente pregunta
    - Guardar
    - Publicar
    - Vista previa

#### Lista de Quizzes
- [ ] `/teacher/quizzes` - Gestión de quizzes
  - Filtros: estado, materia, grado
  - Search bar
  - Vista de cards o tabla (toggle)
  - Card de quiz:
    - Thumbnail
    - Título + descripción
    - # preguntas
    - Estado (badge)
    - Veces jugado
    - Acciones: Editar, Duplicar, Archivar, Crear Sala

#### Modal Upload PDF
- [ ] Modal con drag & drop zone
  - Aceptar solo PDFs
  - Mostrar preview nombre + tamaño
  - Progress bar durante upload
  - Inputs adicionales:
    - # preguntas a generar
    - Dificultad
  - Submit y mostrar loading
  - Al completar: redirect a editor

#### Components Reutilizables
- [ ] `QuestionCard` component
  - Display pregunta con opciones
  - Resaltar respuesta correcta
  - Mostrar stats si aplica
- [ ] `QuizConfigPanel` component
  - Form para config de juego
  - Tiempo por pregunta
  - Bonificaciones (velocidad, combo)
  - Música de fondo
- [ ] `AILoadingState` component
  - Animación mientras IA genera
  - Mensajes aleatorios de espera

#### Testing Frontend
- [ ] Tests de AIChat component
- [ ] Tests de QuizEditor
- [ ] Tests de QuestionCard
- [ ] Tests de drag & drop reorder
- [ ] Tests de PDF upload
- [ ] Coverage: 65%+

### 🔌 INTEGRACIÓN IA

#### Anthropic API Setup
- [ ] Instalar @anthropic-ai/sdk
- [ ] Configurar API key en env
- [ ] Rate limiting (100 req/hora)
- [ ] Error handling robusto

#### Prompt Engineering
- [ ] Template para generar quiz:
  ```
  Eres un experto profesor de [MATERIA] para [GRADO].
  
  Genera un quiz de [N] preguntas sobre: [TEMA]
  
  Dificultad: [NIVEL]
  
  Formato JSON:
  {
    "title": "...",
    "description": "...",
    "questions": [
      {
        "text": "...",
        "type": "multiple_choice",
        "options": ["A", "B", "C", "D"],
        "correct_answer": "B",
        "explanation": "...",
        "points": 1000,
        "time_limit": 20
      }
    ]
  }
  
  IMPORTANTE:
  - Preguntas educativas y apropiadas para la edad
  - Opciones balanceadas en longitud
  - Explicaciones claras y pedagógicas
  ```

- [ ] Template para PDF:
  ```
  He extraído el siguiente contenido de un PDF:
  
  [CONTENIDO]
  
  Genera [N] preguntas tipo quiz sobre este contenido...
  ```

#### Logging y Analytics
- [ ] Guardar en logs_ia:
  - Prompt enviado
  - Respuesta recibida
  - Tokens usados
  - Tiempo de procesamiento
  - Éxito/error
- [ ] Dashboard de uso IA (admin)
  - Total requests
  - Tokens consumidos
  - Costo estimado
  - Prompts más usados

### ✅ Criterios de Aceptación

- [ ] Profesor puede crear quiz manualmente
- [ ] Profesor puede generar quiz con prompt de texto
- [ ] Profesor puede subir PDF y generar quiz
- [ ] Editor permite agregar/editar/eliminar preguntas
- [ ] Drag & drop reordenamiento funciona
- [ ] Quiz se puede publicar solo si válido
- [ ] IA genera preguntas coherentes y educativas
- [ ] Manejo de errores de IA es robusto
- [ ] Tests passing

### 📈 Métricas de Éxito

- 90%+ de quizzes generados por IA son usables
- < 30s para generar quiz de 10 preguntas
- < 60s para procesar PDF y generar quiz
- 0 errores no manejados en generación IA

---

# 📅 FASE 2: CORE GAMEPLAY

## 🔷 SPRINT 4: WebSockets y Salas de Juego (Semanas 7-8)

### 🎯 Objetivos
- ✅ Infraestructura WebSocket funcional
- ✅ Sistema de salas en tiempo real
- ✅ Lobby de espera para estudiantes
- ✅ Sincronización de estados

### 📦 BACKEND

#### WebSocket Setup
- [ ] Instalar Socket.IO
  - Configurar servidor Socket.IO
  - CORS configurado
  - Namespace `/game`
- [ ] Middleware de autenticación WS
  - Verificar token en handshake
  - Attach user_id a socket
  - Rechazar conexiones sin auth
- [ ] Room manager service
  ```typescript
  class RoomManager {
    createRoom(quizId, teacherId): Room
    joinRoom(roomCode, userId): void
    leaveRoom(roomCode, userId): void
    getRoomState(roomCode): RoomState
    broadcastToRoom(roomCode, event, data): void
  }
  ```

#### Gestión de Salas
- [ ] POST `/api/rooms`
  - Crear sala para quiz
  - Generar código 6 dígitos
  - Body: quiz_id, config_juego
  - Return: sala con código
- [ ] GET `/api/rooms/:code`
  - Info de sala pública
  - Include: quiz info, # participantes
  - No requiere auth (para join screen)
- [ ] POST `/api/rooms/:code/start`
  - Iniciar juego (solo profesor)
  - Cambiar estado a "en_curso"
  - Broadcast `game:starting`
- [ ] DELETE `/api/rooms/:code`
  - Cerrar sala (solo profesor)
  - Desconectar todos los sockets

#### WebSocket Events - Lobby
- [ ] `socket.on('room:join')`
  - Params: { roomCode, nickname, avatar }
  - Validar código existe
  - Crear entrada en sala_participantes
  - Join socket room
  - Broadcast `player:joined` a todos
  - Send `room:state` al nuevo jugador
- [ ] `socket.on('room:leave')`
  - Update estado a desconectado
  - Broadcast `player:left`
- [ ] `socket.on('player:ready')`
  - Update ready status
  - Broadcast `player:ready:changed`
- [ ] Broadcast automático:
  - `room:updated` cuando cambia algo
  - Include: lista participantes, config

#### Connection Management
- [ ] Heartbeat system
  - Ping/pong cada 5 segundos
  - Update ultimo_heartbeat en DB
  - Marcar desconectado si timeout
- [ ] Reconnection logic
  - Permitir reconexión con token
  - Restaurar estado del jugador
  - Emit `player:reconnected`
- [ ] Disconnect handling
  - Remover de sala en memoria
  - Broadcast `player:disconnected`
  - Mantener en DB por 5 minutos

#### Redis para Estado de Salas
- [ ] Guardar estado de sala en Redis
  ```typescript
  interface RoomState {
    code: string;
    quiz_id: string;
    teacher_id: string;
    status: 'waiting' | 'playing' | 'finished';
    participants: Participant[];
    config: GameConfig;
    current_question_index: number;
    started_at?: Date;
  }
  ```
- [ ] Set/Get con expiración (24 horas)
- [ ] Sincronizar con PostgreSQL

#### Testing Backend
- [ ] Tests de creación de sala
- [ ] Tests de join/leave room
- [ ] Tests de WebSocket events
- [ ] Tests de heartbeat
- [ ] Tests de reconnection
- [ ] Mock de Socket.IO
- [ ] Coverage: 70%+

### 🎨 FRONTEND

#### WebSocket Client Setup
- [ ] Configurar Socket.IO client
  ```typescript
  class GameSocket {
    private socket: Socket;
    
    connect(token: string): void
    disconnect(): void
    joinRoom(code, nickname, avatar): void
    leaveRoom(): void
    onPlayerJoined(callback): void
    onPlayerLeft(callback): void
    // ... más eventos
  }
  ```
- [ ] Zustand store para sala
  ```typescript
  interface RoomStore {
    room: Room | null;
    participants: Participant[];
    myPlayer: Participant | null;
    isConnected: boolean;
    joinRoom(code): Promise<void>;
    leaveRoom(): void;
    // ... más acciones
  }
  ```

#### Pantalla Profesor - Crear Sala
- [ ] `/teacher/rooms/create` - Configurar sala
  - Selector de quiz
  - Preview del quiz seleccionado
  - Configuración de juego:
    - Tipo de sala (kahoot, mario_party, etc)
    - Modo acceso (abierto/cerrado)
    - Tiempo por pregunta (slider)
    - Bonificaciones (checkboxes)
  - Botón "Crear Sala"
  - Al crear: redirect a lobby

#### Pantalla Profesor - Lobby
- [ ] `/teacher/rooms/:code/lobby` - Sala de espera
  - Header:
    - Código grande + QR
    - URL compartible
    - Botón copiar
  - Grid de estudiantes conectados
    - Avatar + nickname
    - Status (listo/esperando)
    - Animaciones de entrada
  - Panel de configuración:
    - Ajustar tiempo (slider)
    - Toggle bonificaciones
    - Toggle música
  - Progress bar:
    - X/Y estudiantes
    - Mínimo 2 para iniciar
  - Botón "INICIAR JUEGO"
    - Disabled si < 2 jugadores
    - Countdown 3-2-1 al presionar
  - Lista de eventos:
    - "María se unió"
    - "Juan está listo"
    - Feed en tiempo real

#### Pantalla Estudiante - Unirse
- [ ] `/join` - Pantalla de entrada
  - Input grande para código
  - Botón "Unirse"
  - Validación en tiempo real
  - Mostrar info de sala si código válido
- [ ] `/join/:code` - Personalización
  - Input nickname
  - Selector de avatar (emojis)
  - Preview
  - Botón "Entrar a la Sala"

#### Pantalla Estudiante - Lobby
- [ ] `/game/:code/lobby` - Esperando inicio
  - Info del quiz:
    - Título
    - # preguntas
    - Materia
  - Tu avatar grande
  - Tu nickname
  - Counter de jugadores
  - Lista de otros jugadores (avatars)
  - Botón "Cambiar Avatar"
  - Animación de "Esperando al profesor..."
  - Countdown cuando inicie (3-2-1)

#### Components
- [ ] `PlayerGrid` component
  - Display grid responsivo
  - Avatar cards con animación
  - Ready indicator
- [ ] `QRCodeDisplay` component
  - Generar QR con qrcode.react
  - Tamaño ajustable
- [ ] `GameConfigPanel` component
  - Sliders y toggles
  - Live preview de cambios
- [ ] `CountdownAnimation` component
  - 3-2-1 con animaciones
  - Sound effects

#### Real-time Updates
- [ ] Escuchar eventos WS:
  - `player:joined` → Agregar a lista
  - `player:left` → Remover de lista
  - `player:ready:changed` → Update status
  - `room:updated` → Sync config
  - `game:starting` → Iniciar countdown

#### Testing Frontend
- [ ] Tests de RoomStore
- [ ] Tests de GameSocket service
- [ ] Tests de CreateRoomForm
- [ ] Tests de JoinRoom flow
- [ ] Tests de PlayerGrid component
- [ ] Mock Socket.IO events
- [ ] Coverage: 65%+

### ✅ Criterios de Aceptación

- [ ] Profesor puede crear sala y ver código/QR
- [ ] Estudiante puede unirse con código
- [ ] Lista de participantes se actualiza en tiempo real
- [ ] Personalización de avatar funciona
- [ ] Heartbeat mantiene conexión
- [ ] Reconnection automática si se cae
- [ ] Countdown sincronizado en todos los clientes
- [ ] No hay lag con 50+ jugadores
- [ ] Tests passing

### 📈 Métricas de Éxito

- < 50ms latencia en eventos WS
- 99.9% uptime de conexiones
- 0 desync de estado entre clientes
- Soportar 100+ jugadores por sala

---

## 🔷 SPRINT 5: Classic Mode - Gameplay (Semanas 9-10)

### 🎯 Objetivos
- ✅ Gameplay completo modo Kahoot
- ✅ Preguntas en tiempo real sincronizadas
- ✅ Sistema de scoring con combos
- ✅ Leaderboard en vivo

### 📦 BACKEND

#### Game Flow Logic
- [ ] `socket.on('game:start')`
  - Obtener preguntas del quiz
  - Shuffle si config.shuffle_questions
  - Inicializar estado del juego en Redis
  - Broadcast `game:started`
  - Enviar primera pregunta (sin respuesta)
  - Iniciar timer server-side
  
- [ ] `sendQuestion(roomCode)`
  - Obtener pregunta actual
  - Preparar opciones (shuffle si config)
  - Remove is_correct de opciones
  - Broadcast `question:new`
  - Start countdown con setInterval
  - Broadcast `timer:tick` cada segundo

- [ ] `socket.on('answer:submit')`
  - Params: { roomCode, questionId, answer, time_taken }
  - Validar que timer no expiró
  - Check si respuesta correcta
  - Calcular puntos:
    ```typescript
    const basePoints = 1000;
    const speedBonus = calculateSpeedBonus(time_taken, time_limit);
    const comboMultiplier = 1 + (player.combo * 0.1);
    const totalPoints = (basePoints + speedBonus) * comboMultiplier;
    ```
  - Update combo_streak (++ si correcto, 0 si incorrecto)
  - Guardar en game_answers
  - Update score del player
  - Emit callback a player con resultado
  - Update leaderboard en memoria
  - Broadcast `leaderboard:update`

- [ ] Timer Management
  - Server-side countdown (no confiar en cliente)
  - Al llegar a 0:
    - Broadcast `question:timeout`
    - Esperar 5 seg (ver respuesta)
    - `showQuestionResults()`
    - Avanzar a siguiente o terminar

- [ ] `showQuestionResults(roomCode)`
  - Calcular stats de pregunta:
    - % que respondió correctamente
    - Tiempo promedio
    - Distribución de respuestas
  - Broadcast `question:results`
  - Wait 5 segundos
  - Si hay más preguntas:
    - `sendQuestion()` con siguiente
  - Si no:
    - `endGame()`

- [ ] `endGame(roomCode)`
  - Calcular leaderboard final
  - Determinar rankings
  - Calcular recompensas:
    ```typescript
    1st place: 3 copas, +800 XP
    2nd place: 2 copas, +500 XP
    3rd place: 1 copa, +300 XP
    Participación: +100 XP
    ```
  - Guardar en game_results
  - Otorgar XP y copas en user_profiles
  - Check insignias desbloqueadas
  - Broadcast `game:finished` con data completa

#### Scoring System
- [ ] `utils/scoring.ts`
  ```typescript
  export function calculateSpeedBonus(
    timeTaken: number,
    timeLimit: number
  ): number {
    const speedRatio = 1 - (timeTaken / timeLimit);
    return Math.floor(speedRatio * 500);
  }
  
  export function calculateComboMultiplier(
    comboStreak: number
  ): number {
    return 1 + (comboStreak * 0.1);
  }
  ```

- [ ] Service `GameplayService`
  ```typescript
  class GameplayService {
    initializeGame(roomCode): void
    processAnswer(params): AnswerResult
    getLeaderboard(roomCode): Player[]
    calculateRewards(player, rank, totalPlayers): Rewards
    finalizeGame(roomCode): GameResults
  }
  ```

#### Analytics y Estadísticas
- [ ] Guardar en game_answers:
  - room_id, player_id, question_id
  - respuesta, was_correct
  - time_taken_ms
  - points_earned
  - combo_multiplier
- [ ] Guardar en game_results:
  - room_id, player_id
  - total_points, rank
  - questions_correct/incorrect
  - accuracy, avg_response_time
  - max_combo
  - xp_earned, copas_earned
- [ ] Update stats en questions:
  - times_answered++
  - times_correct++ si aplicable
- [ ] Update stats en question_sets:
  - times_played++
- [ ] Update user_profiles:
  - total_xp += xp_earned
  - level (check si subió)
  - games_played++
  - games_won++ si 1st place
  - total_questions_answered += X
  - total_questions_correct += Y

#### Testing Backend
- [ ] Tests de game flow completo
- [ ] Tests de scoring (varios scenarios)
- [ ] Tests de timer logic
- [ ] Tests de end game y rewards
- [ ] Tests de analytics
- [ ] Load test: 100 players
- [ ] Coverage: 75%+

### 🎨 FRONTEND

#### Pantalla Estudiante - Gameplay

##### Waiting Screen
- [ ] Pantalla entre preguntas
  - "Get Ready..."
  - Countdown animado 3-2-1
  - Fade in/out transitions
  - Sound cue

##### Question Screen
- [ ] Componente principal de pregunta
  - Header:
    - # Pregunta (1/20)
    - Timer circular animado
    - Tu score actual
  - Pregunta:
    - Texto grande y claro
    - Imagen si exists (question.media_url)
  - Opciones:
    - 4 botones grandes
    - Colores: rojo, azul, verde, amarillo
    - Hover effects
    - Click para seleccionar
    - Disabled después de responder
  - Footer:
    - Combo indicator si >= 3
    - "Answered!" badge cuando envía

##### Answer Feedback Screen
- [ ] Pantalla de resultado (3-5 seg)
  - Si CORRECTO:
    - ✅ Grande con animación
    - Confetti effect
    - Sound "ding!"
    - Mostrar puntos ganados:
      ```
      +1000 (base)
      +450 (velocidad ⚡)
      x1.3 (combo 🔥)
      ───────────
      = +1,885 pts
      ```
    - Combo indicator actualizado
  - Si INCORRECTO:
    - ❌ con shake animation
    - Sound "buzzer"
    - Mostrar respuesta correcta
    - "Combo perdido" si tenía
  - Explicación educativa (si disponible)
  - Tu posición actual
  - Next question in 2...

##### Leaderboard Intermedio
- [ ] Mostrar entre preguntas (5 seg)
  - Top 5 jugadores
  - Animated transitions
  - Tu posición destacada
  - Cambios (↑ ↓ →)
  - Scores

##### Final Results Screen
- [ ] Pantalla de resultados finales
  - Podium animado:
    - 🥇 1st place
    - 🥈 2nd place  
    - 🥉 3rd place
  - Tu posición final
  - Stats:
    - Score total
    - Accuracy %
    - Combo máximo
    - Preguntas correctas
  - Recompensas:
    - XP ganado (con barra de progreso)
    - Copas ganadas
    - Insignias desbloqueadas (con animación)
  - Botón "Ver Leaderboard Completo"
  - Botón "Volver al Inicio"

#### Pantalla Profesor - Control Panel

##### During Game
- [ ] Panel de control en vivo
  - Header:
    - Pregunta actual (# y texto)
    - Timer sincronizado
    - Progress bar (X/20 preguntas)
  - Stats en vivo:
    - Responses: X/Y respondieron
    - Distribución de respuestas (gráfico)
    - Accuracy actual
  - Mini leaderboard (Top 10)
  - Controls:
    - [ ] Botón "Skip Question" (emergencia)
    - [ ] Botón "Pause Game"
  - Feed de eventos:
    - "María respondió correctamente"
    - "Juan perdió su combo"

##### After Game
- [ ] Post-Game Dashboard
  - Leaderboard final completo
    - Scroll para ver todos
    - Export a CSV
  - Análisis por pregunta:
    - Pregunta más difícil
    - Pregunta más fácil
    - Tiempo promedio por pregunta
  - Stats de la clase:
    - Accuracy promedio
    - Temas a reforzar
  - [ ] Recomendaciones automáticas
  - Acciones:
    - [ ] Enviar resultados a padres
    - [ ] Crear quiz de repaso
    - [ ] Jugar de nuevo
    - [ ] Copiar para otra clase

#### Animaciones y Efectos
- [ ] Framer Motion animations:
  - Entrada de preguntas (fade + slide)
  - Opciones (stagger entrance)
  - Confetti en aciertos
  - Shake en fallos
  - Leaderboard transitions
  - Number counting animations
  - Progress bars animadas

- [ ] Sonidos:
  - [ ] Correct answer (ding)
  - [ ] Wrong answer (buzzer)
  - [ ] Timer ticking (últimos 5 seg)
  - [ ] Countdown beeps
  - [ ] Combo achievement (power-up)

#### Real-time State Management
- [ ] Zustand store para gameplay
  ```typescript
  interface GameStore {
    gameState: 'waiting' | 'question' | 'feedback' | 'leaderboard' | 'finished';
    currentQuestion: Question | null;
    timeRemaining: number;
    myAnswer: string | null;
    answerResult: AnswerResult | null;
    leaderboard: Player[];
    myScore: number;
    myCombo: number;
    // ... acciones
  }
  ```

- [ ] Escuchar eventos WS:
  - `game:started` → Reset state
  - `question:new` → Mostrar pregunta
  - `timer:tick` → Update countdown
  - `question:timeout` → Block answers
  - `question:results` → Mostrar resultados
  - `leaderboard:update` → Update leaderboard
  - `game:finished` → Pantalla final

#### Testing Frontend
- [ ] Tests de QuestionScreen
- [ ] Tests de AnswerFeedback
- [ ] Tests de Leaderboard updates
- [ ] Tests de score calculations
- [ ] Tests de final results
- [ ] E2E test completo
- [ ] Coverage: 65%+

### ✅ Criterios de Aceptación

- [ ] Profesor inicia juego, countdown en todos
- [ ] Primera pregunta sync en todos los clientes
- [ ] Timer funciona y es sync
- [ ] Estudiante selecciona y envía respuesta
- [ ] Feedback inmediato (correcto/incorrecto)
- [ ] Puntos calculados correctamente (base + velocidad + combo)
- [ ] Leaderboard actualiza en tiempo real
- [ ] Combo de 3+ muestra indicador
- [ ] Al terminar tiempo, avanza automático
- [ ] Resultados finales muestran rankings correctos
- [ ] Recompensas se otorgan (XP, copas guardados)
- [ ] No hay lag con 50+ jugadores
- [ ] UI responsive en móvil
- [ ] Tests passing

### 📈 Métricas de Éxito

- Juego de 20 preguntas toma ~10-15 min
- 0 errores de sincronización
- Latency < 50ms para answer submit
- 95%+ mensajes WS entregados
- 0 crashes durante gameplay
- FPS > 30 en animaciones

---

## 🔷 SPRINT 6: Perfil y Progresión (Semanas 11-12)

### 🎯 Objetivos
- ✅ Sistema de niveles y XP funcional
- ✅ Sistema de copas y trofeos
- ✅ Sistema de insignias
- ✅ Perfil de jugador completo

### 📦 BACKEND

#### Sistema de Niveles
- [ ] Service `LevelingService`
  ```typescript
  class LevelingService {
    calculateLevel(xp: number): number
    getXPForNextLevel(currentLevel: number): number
    addXP(userId: string, xp: number): Promise<LevelUpResult>
    checkLevelUp(userId: string): Promise<boolean>
  }
  ```
- [ ] Fórmula de XP:
  ```typescript
  // XP necesaria para nivel N:
  // XP = base * (multiplier ^ (N - 1))
  // Ejemplo: base=100, mult=1.5
  // Nivel 2: 100 XP
  // Nivel 3: 150 XP
  // Nivel 4: 225 XP
  // etc.
  ```
- [ ] Evento `level:up`
  - Otorgar recompensa (insignia especial)
  - Broadcast notificación
  - Guardar en logs

#### Sistema de Copas y Trofeos
- [ ] Service `AwardsService`
  ```typescript
  class AwardsService {
    awardCopas(userId, amount, reason): void
    awardTrofeo(userId, type: 'oro'|'plata'|'bronce'): void
    getTotalCopas(userId): number
    getTrofeoStats(userId): TrofeoStats
  }
  ```
- [ ] Al finalizar juego:
  - 1er lugar: 3 copas + trofeo oro
  - 2do lugar: 2 copas + trofeo plata
  - 3er lugar: 1 copa + trofeo bronce

#### Sistema de Insignias
- [ ] CRUD Insignias (admin)
  - POST `/api/admin/badges`
  - Criterios en JSONB
- [ ] Service `BadgeService`
  ```typescript
  interface BadgeCriteria {
    type: 'games_played' | 'games_won' | 'accuracy' | 'combo' | 'level' | 'copas';
    operator: '>' | '>=' | '==' | 'in';
    value: number | string;
  }
  
  class BadgeService {
    checkBadges(userId: string): Promise<Badge[]>
    awardBadge(userId, badgeId): Promise<void>
    getUserBadges(userId): Promise<UserBadge[]>
  }
  ```
- [ ] Insignias predefinidas (seed):
  ```
  - 🎯 "Perfecto" (10/10 correctas)
  - ⚡ "Rayo" (avg tiempo < 10 seg)
  - 🔥 "En Llamas" (combo de 10+)
  - 🏆 "Campeón" (1er lugar 10 veces)
  - 🧠 "Cerebrito" (95%+ accuracy en 5 juegos)
  - 🎓 "Estudiante Dedicado" (50 juegos jugados)
  - 👑 "Rey del Quiz" (100 victorias)
  ```

#### Perfil de Usuario
- [ ] GET `/api/users/:id/profile`
  - Info básica
  - Stats de perfil_gamer
  - Insignias
  - Últimos juegos
- [ ] GET `/api/users/:id/stats`
  - Estadísticas detalladas:
    - Juegos jugados/ganados
    - Preguntas respondidas/correctas
    - Accuracy promedio
    - Mejor posición
    - Trofeos por tipo
    - Copas totales
    - Insignias por rareza
- [ ] PUT `/api/users/profile`
  - Actualizar avatar_url
  - Actualizar perfil_personalizado (JSONB)

#### Leaderboards Globales
- [ ] GET `/api/leaderboards/copas`
  - Top 100 por copas
  - Filtros: grado, clase
- [ ] GET `/api/leaderboards/nivel`
  - Top 100 por nivel + XP
- [ ] GET `/api/leaderboards/clase/:id`
  - Ranking de clase específica
- [ ] Cachear en Redis (5 minutos)

#### Testing Backend
- [ ] Tests de leveling system
- [ ] Tests de awards
- [ ] Tests de badge checking
- [ ] Tests de leaderboards
- [ ] Coverage: 75%+

### 🎨 FRONTEND

#### Perfil de Usuario
- [ ] `/profile` o `/students/:id` - Vista principal
  - Header:
    - Avatar grande (editable)
    - Nombre + username
    - Nivel + barra de XP
      ```
      Nivel 15
      [▓▓▓▓▓▓▓▓▓░░░░░░] 2,450 / 3,800 XP
      ```
  - Stats cards:
    - 🏆 Copas: 145
    - 🥇 Trofeos Oro: 23
    - 🥈 Trofeos Plata: 45
    - 🥉 Trofeos Bronce: 67
    - 🎮 Juegos: 135
    - ✅ Victorias: 23
  - Tabs:
    - Insignias
    - Estadísticas
    - Historial

#### Tab Insignias
- [ ] Grid de insignias
  - Insignias desbloqueadas (color)
  - Insignias bloqueadas (gris)
  - Filtros: todas, común, raro, épico, legendario
  - Hover/click para ver detalles:
    - Descripción
    - Criterio
    - Fecha obtenida
    - Progreso si no desbloqueada
  - Animación al desbloquear

#### Tab Estadísticas
- [ ] Gráficos y métricas:
  - Accuracy histórica (line chart)
  - Distribución de materias (pie chart)
  - Juegos por día (bar chart)
  - Mejor racha de victorias
  - Tiempo promedio por pregunta
  - Preguntas más difíciles
  - Materias favoritas

#### Tab Historial
- [ ] Lista de últimos juegos
  - Card por juego:
    - Quiz name + materia
    - Fecha y hora
    - Posición obtenida (badge)
    - Score
    - Accuracy
    - XP y copas ganadas
  - Pagination
  - Filtros: fecha, materia
  - Click para ver detalle

#### Modal de Level Up
- [ ] Animación celebración
  - Fuegos artificiales
  - Sonido de fanfarria
  - "¡Nivel [X] Alcanzado!"
  - Nueva insignia si hay
  - Botón "Continuar"

#### Modal de Badge Unlocked
- [ ] Animación entrada
  - Insignia grande en centro
  - Brillo dorado
  - Nombre + descripción
  - Recompensa (XP si aplica)
  - Botón "¡Genial!"

#### Leaderboards
- [ ] `/leaderboards` - Página de rankings
  - Tabs:
    - 🏆 Por Copas
    - ⭐ Por Nivel
    - 📚 Mi Clase
  - Tabla/lista:
    - Posición (#)
    - Avatar + nombre
    - Stat principal (copas/nivel)
    - Stats secundarios
  - Destacar posición del usuario
  - Search bar
  - Filtros (grado)
  - Auto-refresh cada minuto

#### Components
- [ ] `ProfileHeader` component
- [ ] `StatsCard` component
- [ ] `BadgeGrid` component
- [ ] `BadgeCard` component (desbloqueada/bloqueada)
- [ ] `ProgressBar` component (con animación)
- [ ] `LevelUpModal` component
- [ ] `BadgeUnlockedModal` component
- [ ] `HistoryItem` component
- [ ] `LeaderboardRow` component

#### Testing Frontend
- [ ] Tests de ProfilePage
- [ ] Tests de BadgeGrid
- [ ] Tests de level up animation
- [ ] Tests de leaderboards
- [ ] Coverage: 65%+

### ✅ Criterios de Aceptación

- [ ] Sistema de XP funciona correctamente
- [ ] Level up detectado y notificado
- [ ] Copas y trofeos se otorgan según ranking
- [ ] Insignias se desbloquean automáticamente
- [ ] Perfil muestra stats actualizadas
- [ ] Leaderboards funcionan y actualizan
- [ ] Animaciones de level up y badges
- [ ] Historial de juegos accesible
- [ ] Tests passing

### 📈 Métricas de Éxito

- 100% de XP otorgado correctamente
- 0 errores en cálculo de niveles
- 100% de insignias desbloqueadas cuando aplica
- Leaderboards cargan en < 500ms

---

# 📅 FASE 3: GAMIFICACIÓN AVANZADA

## 🔷 SPRINT 7: Misiones y Desafíos (Semanas 13-14)

### 🎯 Objetivos
- ✅ Sistema de misiones diarias/semanales/mensuales
- ✅ Tracking de progreso de misiones
- ✅ Sistema de notificaciones
- ✅ Dashboard de misiones

### 📦 BACKEND

#### CRUD Misiones
- [ ] POST `/api/admin/missions` (solo admin)
  - Crear misión
  - Body: nombre, descripcion, tipo, objetivo, recompensa, validez
- [ ] GET `/api/missions/active`
  - Listar misiones activas para usuario
  - Filtrar por tipo, grado, clase
  - Include progreso del usuario
- [ ] GET `/api/missions/:id`
  - Detalle de misión
  - Include progreso

#### Gestión de Progreso
- [ ] Service `MissionService`
  ```typescript
  interface MissionObjective {
    type: 'play_games' | 'win_games' | 'answer_questions' | 
          'accuracy' | 'combo' | 'play_subject';
    target: number;
    subject_id?: string; // opcional
  }
  
  class MissionService {
    trackProgress(userId, event): Promise<void>
    checkCompletion(userId, missionId): Promise<boolean>
    claimReward(userId, missionId): Promise<Rewards>
    getActiveMissions(userId): Promise<Mission[]>
    getUserProgress(userId, missionId): Promise<Progress>
  }
  ```

- [ ] Event-driven progress tracking:
  - Después de cada juego:
    - `trackProgress(userId, { type: 'game_played' })`
    - Si ganó: `trackProgress(userId, { type: 'game_won' })`
  - Al responder pregunta:
    - `trackProgress(userId, { type: 'question_answered' })`
    - Si correcta: `trackProgress(userId, { type: 'question_correct' })`
  - Update progreso en usuario_misiones

#### Misiones Predefinidas (Seed)
- [ ] Misiones Diarias:
  ```
  - "Primer Juego del Día" (jugar 1 juego) → +50 XP
  - "Estudiante Activo" (jugar 3 juegos) → +150 XP
  - "Perfeccionista" (80%+ accuracy en 2 juegos) → +200 XP
  ```
- [ ] Misiones Semanales:
  ```
  - "Semana Completa" (jugar cada día) → +500 XP
  - "Campeón Semanal" (ganar 5 juegos) → +300 XP
  - "Maestro de [Materia]" (10 juegos en materia) → +400 XP
  ```
- [ ] Misiones Mensuales:
  ```
  - "Estudiante del Mes" (jugar 50 juegos) → +1000 XP + Insignia
  - "Invencible" (ganar 20 juegos) → +800 XP
  ```

#### Sistema de Notificaciones
- [ ] POST `/api/notifications` (interno)
  - Crear notificación
- [ ] GET `/api/notifications`
  - Listar notificaciones del usuario
  - Filtros: leidas/no leidas, tipo
  - Pagination
- [ ] PUT `/api/notifications/:id/read`
  - Marcar como leída
- [ ] DELETE `/api/notifications/:id`
  - Eliminar notificación
- [ ] Service `NotificationService`
  ```typescript
  class NotificationService {
    send(userId, type, data): Promise<Notification>
    sendBatch(userIds, type, data): Promise<void>
    markAsRead(notificationId): Promise<void>
    getUnreadCount(userId): Promise<number>
  }
  ```
- [ ] Tipos de notificaciones:
  - mission_completed
  - badge_unlocked
  - level_up
  - new_quiz_available
  - invitation_to_game

#### WebSocket para Notificaciones Real-time
- [ ] `socket.on('notification:new')`
  - Enviar notificación en tiempo real
- [ ] Emit cuando:
  - Misión completada
  - Insignia desbloqueada
  - Level up
  - Invitación a juego

#### Testing Backend
- [ ] Tests de mission tracking
- [ ] Tests de progress calculation
- [ ] Tests de reward claiming
- [ ] Tests de notificaciones
- [ ] Coverage: 75%+

### 🎨 FRONTEND

#### Dashboard de Misiones
- [ ] `/missions` - Vista principal
  - Header con tabs:
    - Diarias
    - Semanales
    - Mensuales
  - Grid de misiones
  - Contador de tiempo restante
  - Total XP disponible

#### MissionCard Component
- [ ] Card individual de misión
  - Ícono
  - Nombre + descripción
  - Progress bar:
    ```
    [▓▓▓▓▓▓░░░░] 6/10 juegos
    ```
  - Recompensa (XP)
  - Estado:
    - En progreso
    - Completada (check)
    - Recompensa reclamada
  - Botón "Reclamar" si completada
  - Animación al completar

#### Modal Mission Completed
- [ ] Animación celebración
  - "¡Misión Completada!"
  - Nombre de la misión
  - Recompensa (XP con animación)
  - Progreso hacia siguiente nivel
  - Botón "¡Genial!"

#### Sistema de Notificaciones
- [ ] Notification Bell en navbar
  - Badge con count
  - Click para abrir dropdown
  - Lista de notificaciones:
    - Tipo (ícono)
    - Título
    - Mensaje corto
    - Tiempo relativo
    - Marcar como leída
  - "Ver todas"
- [ ] Toast notifications
  - Aparecen en esquina superior derecha
  - Auto-dismiss en 5 segundos
  - Tipos:
    - Success (verde)
    - Info (azul)
    - Achievement (dorado)
  - Click para ir a detalle

#### Page Notificaciones
- [ ] `/notifications` - Lista completa
  - Filtros: todas, no leídas, por tipo
  - Agrupadas por fecha
  - Card por notificación:
    - Ícono grande
    - Título + mensaje completo
    - Link de acción si aplica
    - Tiempo exacto
  - Marcar todas como leídas
  - Eliminar

#### Real-time Updates
- [ ] Escuchar WS:
  - `notification:new` → Show toast + update count
  - `mission:progress` → Update progress bar
  - `mission:completed` → Show modal

#### Zustand Store
```typescript
interface MissionStore {
  missions: Mission[];
  loading: boolean;
  fetchMissions(): Promise<void>;
  claimReward(missionId): Promise<void>;
  updateProgress(missionId, progress): void;
}

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  fetchNotifications(): Promise<void>;
  markAsRead(id): Promise<void>;
  markAllAsRead(): Promise<void>;
}
```

#### Testing Frontend
- [ ] Tests de MissionCard
- [ ] Tests de notification bell
- [ ] Tests de toast notifications
- [ ] Tests de mission completion flow
- [ ] Coverage: 65%+

### ✅ Criterios de Aceptación

- [ ] Misiones se muestran correctamente
- [ ] Progreso se actualiza después de cada juego
- [ ] Notificación al completar misión
- [ ] Usuario puede reclamar recompensa
- [ ] XP se otorga correctamente
- [ ] Bell icon muestra count correcto
- [ ] Toast notifications aparecen
- [ ] Misiones se resetean según tipo (diaria/semanal)
- [ ] Tests passing

### 📈 Métricas de Éxito

- 100% de progreso tracked correctamente
- 0 misiones duplicadas
- Notificaciones entregan en < 1 segundo
- 0 errores en cálculo de recompensas

---

## 🔷 SPRINT 8: Análisis y Reportes (Profesor) (Semanas 15-16)

### 🎯 Objetivos
- ✅ Dashboard analítico para profesores
- ✅ Reportes de rendimiento por estudiante
- ✅ Estadísticas por quiz y pregunta
- ✅ Exportación de datos

### 📦 BACKEND

#### Analytics Service
- [ ] Service `AnalyticsService`
  ```typescript
  class AnalyticsService {
    getClassOverview(classId): Promise<ClassStats>
    getStudentPerformance(studentId, classId): Promise<StudentStats>
    getQuizAnalytics(quizId): Promise<QuizAnalytics>
    getQuestionDifficulty(questionId): Promise<QuestionStats>
    getEngagementMetrics(classId, dateRange): Promise<Metrics>
  }
  ```

#### Endpoints de Analytics
- [ ] GET `/api/analytics/class/:id/overview`
  - Total estudiantes
  - Promedio de accuracy
  - Juegos jugados
  - Participación (% activos)
  - Temas más jugados
  - Temas difíciles
- [ ] GET `/api/analytics/class/:id/students`
  - Lista de estudiantes con métricas:
    - Nombre, avatar
    - Juegos jugados
    - Accuracy promedio
    - Nivel, XP
    - Última actividad
  - Sorting y filtros
- [ ] GET `/api/analytics/student/:id/performance`
  - Gráfico de accuracy histórica
  - Gráfico de juegos por fecha
  - Materias dominadas / a mejorar
  - Comparación con promedio de clase
  - Preguntas más falladas
- [ ] GET `/api/analytics/quiz/:id/results`
  - Todas las partidas del quiz
  - Stats agregadas:
    - Accuracy promedio por pregunta
    - Tiempo promedio por pregunta
    - Distribución de respuestas
  - Identificar preguntas problemáticas
- [ ] GET `/api/analytics/quiz/:id/questions`
  - Análisis pregunta por pregunta:
    - % acierto
    - Tiempo promedio
    - Distribución de respuestas
    - Marcadas como "difícil" si < 50% acierto

#### Reportes Exportables
- [ ] GET `/api/reports/class/:id/export`
  - Query params: format (csv, pdf)
  - Generar reporte completo de clase
  - Include: todos los estudiantes, stats
  - Download file
- [ ] GET `/api/reports/student/:id/export`
  - Reporte individual
  - Gráficos incluidos (charts to image)
- [ ] Service `ReportService`
  ```typescript
  class ReportService {
    generateClassReport(classId, format): Promise<Buffer>
    generateStudentReport(studentId, format): Promise<Buffer>
    generateQuizReport(quizId, format): Promise<Buffer>
  }
  ```
- [ ] Usar librerías:
  - CSV: papaparse
  - PDF: puppeteer (render HTML to PDF)

#### Comparaciones y Benchmarks
- [ ] GET `/api/analytics/class/:id/benchmarks`
  - Comparar clase con promedio de grado
  - Comparar clase con otras clases del profesor
- [ ] Calcular percentiles de estudiantes

#### Testing Backend
- [ ] Tests de analytics calculations
- [ ] Tests de reportes
- [ ] Tests de exportación
- [ ] Coverage: 75%+

### 🎨 FRONTEND

#### Dashboard Analítico Profesor
- [ ] `/teacher/analytics` - Vista principal
  - Selector de clase
  - Date range picker
  - Stats cards:
    - 👥 Total estudiantes
    - 📊 Accuracy promedio
    - 🎮 Juegos jugados esta semana
    - 📈 Tendencia (↑ ↓ →)
  - Gráficos:
    - Accuracy por materia (bar chart)
    - Juegos por día (line chart)
    - Distribución de niveles (pie chart)

#### Tabla de Estudiantes
- [ ] Tabla completa con columnas:
  - Avatar + Nombre
  - Nivel
  - Juegos Jugados
  - Accuracy %
  - Última Actividad
  - Acciones (Ver Perfil, Ver Reporte)
- [ ] Sorting por columna
- [ ] Filtros:
  - Nivel
  - Accuracy range
  - Última actividad
- [ ] Search bar

#### Modal Detalle Estudiante
- [ ] Vista rápida de estudiante
  - Stats principales
  - Gráfico de progreso (line chart)
  - Últimos 5 juegos
  - Materias a reforzar (badges)
  - Botones:
    - Ver perfil completo
    - Enviar mensaje
    - Exportar reporte

#### Análisis de Quiz
- [ ] `/teacher/quizzes/:id/analytics`
  - Header con info del quiz
  - Stats globales:
    - Veces jugado
    - Accuracy promedio
    - Tiempo promedio
  - Tabla de preguntas:
    - # Pregunta
    - Texto (preview)
    - % Acierto
    - Tiempo promedio
    - Indicador dificultad
  - Click en pregunta para ver detalles:
    - Distribución de respuestas (bar chart)
    - Opción correcta destacada
    - Recomendaciones

#### Página de Reportes
- [ ] `/teacher/reports` - Generación de reportes
  - Selector de tipo:
    - Reporte de Clase
    - Reporte por Estudiante
    - Reporte de Quiz
  - Configuración:
    - Seleccionar clase/estudiante/quiz
    - Date range
    - Formato (CSV, PDF)
    - Incluir gráficos (solo PDF)
  - Botón "Generar Reporte"
  - Download automático
  - Historial de reportes generados

#### Visualizaciones
- [ ] Usar Recharts o Chart.js
- [ ] Componentes reutilizables:
  - `LineChart` component
  - `BarChart` component
  - `PieChart` component
  - `ProgressBar` component
- [ ] Responsive charts
- [ ] Tooltips informativos
- [ ] Exportar charts como imagen

#### Testing Frontend
- [ ] Tests de analytics dashboard
- [ ] Tests de tablas con sorting
- [ ] Tests de gráficos
- [ ] Tests de exportación
- [ ] Coverage: 65%+

### ✅ Criterios de Aceptación

- [ ] Dashboard muestra stats actualizadas
- [ ] Gráficos renderizan correctamente
- [ ] Tabla de estudiantes sorteable y filtrable
- [ ] Modal de detalle funciona
- [ ] Análisis de quiz muestra data correcta
- [ ] Exportación de reportes funciona (CSV y PDF)
- [ ] Reportes contienen toda la data
- [ ] Charts son responsive
- [ ] Tests passing

### 📈 Métricas de Éxito

- Dashboard carga en < 2 segundos
- 100% de data correcta en reportes
- PDF genera en < 10 segundos
- Charts responsive en mobile

---

## 🔷 SPRINT 9: Optimización y Performance (Semanas 17-18)

### 🎯 Objetivos
- ✅ Optimizar queries de base de datos
- ✅ Implementar cacheo estratégico
- ✅ Mejorar performance del frontend
- ✅ Load testing y ajustes

### 📦 BACKEND

#### Optimización de Base de Datos
- [ ] Analizar queries lentas con EXPLAIN
- [ ] Agregar índices faltantes:
  ```sql
  CREATE INDEX idx_game_results_user_date ON game_results(user_id, created_at);
  CREATE INDEX idx_game_answers_correct ON game_answers(was_correct, created_at);
  CREATE INDEX idx_usuario_misiones_active ON usuario_misiones(user_id, completada);
  ```
- [ ] Optimizar queries con JOINs:
  - Usar select específico (no SELECT *)
  - Eager loading con Prisma include
  - Pagination eficiente
- [ ] Implementar connection pooling
- [ ] Database vacuum y mantenimiento

#### Estrategia de Cacheo
- [ ] Redis caching layers:
  ```typescript
  // Layer 1: User profile (5 min)
  cache.set(`user:${userId}`, userData, 300)
  
  // Layer 2: Leaderboards (1 min)
  cache.set(`leaderboard:copas`, data, 60)
  
  // Layer 3: Quiz data (10 min)
  cache.set(`quiz:${quizId}`, quizData, 600)
  
  // Layer 4: Class stats (5 min)
  cache.set(`class:${classId}:stats`, stats, 300)
  ```

- [ ] Cache invalidation:
  - Invalidar al actualizar
  - Implementar cache tags
  - TTL apropiados

- [ ] HTTP caching headers:
  - ETag para recursos estáticos
  - Cache-Control headers
  - CDN para assets

#### Rate Limiting
- [ ] Implementar rate limiting con redis
  ```typescript
  // Diferentes límites según endpoint
  - Auth: 5 req/min
  - API general: 100 req/min
  - Búsqueda: 30 req/min
  - IA generation: 10 req/hora
  ```
- [ ] Return 429 con Retry-After header

#### Optimización de WebSockets
- [ ] Batch updates cuando sea posible
- [ ] Throttle eventos no críticos
- [ ] Comprimir payloads grandes
- [ ] Heartbeat optimization
- [ ] Graceful reconnection

#### Background Jobs
- [ ] Setup Bull queue
- [ ] Jobs:
  - Procesamiento de PDFs
  - Generación de reportes
  - Cálculo de stats diarias
  - Envío de notificaciones batch
  - Limpieza de salas viejas
- [ ] Retry logic
- [ ] Job monitoring

#### Testing y Benchmarking
- [ ] Load testing con Artillery/k6:
  - 100 usuarios concurrentes
  - 500 requests/segundo
  - Mantener < 200ms response time
- [ ] Stress testing:
  - Identificar breaking point
  - Memory leaks
  - CPU usage
- [ ] Benchmark queries críticas
- [ ] Monitoring con Sentry + performance

#### Database Sharding (Opcional)
- [ ] Plan para escalar:
  - Shard por clase/institución
  - Read replicas
  - Write/Read separation

### 🎨 FRONTEND

#### Code Splitting y Lazy Loading
- [ ] Implementar route-based code splitting:
  ```typescript
  const Dashboard = lazy(() => import('./pages/Dashboard'))
  const QuizEditor = lazy(() => import('./pages/QuizEditor'))
  const GamePlay = lazy(() => import('./pages/GamePlay'))
  ```
- [ ] Suspense boundaries con loading states
- [ ] Prefetch rutas críticas

#### Optimización de Componentes
- [ ] React.memo para componentes costosos
- [ ] useMemo para cálculos pesados
- [ ] useCallback para funciones en props
- [ ] Virtualization para listas largas:
  - react-virtual o react-window
  - Aplicar en:
    - Lista de estudiantes
    - Lista de quizzes
    - Leaderboards
    - Historial de juegos

#### Estado y Data Fetching
- [ ] Optimizar TanStack Query:
  ```typescript
  // Stale time apropiado
  - User profile: 5 min
  - Leaderboards: 1 min
  - Quizzes: 10 min
  
  // Cache time
  - Mantener data in cache 15 min
  
  // Prefetching
  - Prefetch al hover en links
  
  // Optimistic updates
  - Updates inmediatos en UI
  ```

- [ ] Reducir re-renders innecesarios
- [ ] Batching de state updates

#### Optimización de Assets
- [ ] Comprimir imágenes (WebP)
- [ ] Lazy load imágenes:
  ```typescript
  <img loading="lazy" src="..." />
  ```
- [ ] Iconos como SVG sprites
- [ ] Font optimization:
  - Subset de fonts
  - font-display: swap

#### Bundle Size
- [ ] Analizar con webpack-bundle-analyzer
- [ ] Tree-shaking efectivo
- [ ] Eliminar dependencias no usadas
- [ ] Usar imports específicos:
  ```typescript
  // ❌ import _ from 'lodash'
  // ✅ import debounce from 'lodash/debounce'
  ```

#### Web Vitals
- [ ] Mejorar Core Web Vitals:
  - LCP < 2.5s
  - FID < 100ms
  - CLS < 0.1
- [ ] Monitoring con web-vitals lib
- [ ] Lighthouse CI en pipeline

#### PWA (Opcional)
- [ ] Service Worker para offline
- [ ] Manifest.json
- [ ] Install prompt
- [ ] Cache strategies

#### Testing Performance
- [ ] Lighthouse audits
- [ ] Chrome DevTools profiling
- [ ] React DevTools profiler
- [ ] Real user monitoring (RUM)

### 🚀 DEVOPS

#### Monitoring y Observability
- [ ] Setup APM (Application Performance Monitoring):
  - New Relic o Datadog
  - Track API response times
  - Error rates
  - Database query times
- [ ] Logging estructurado:
  - Winston o Pino
  - JSON logs
  - Log levels apropiados
  - Agregación con Logtail/Papertrail
- [ ] Alertas:
  - Error rate > 1%
  - Response time > 500ms
  - CPU > 80%
  - Memory > 85%

#### CI/CD Optimization
- [ ] Paralelizar tests
- [ ] Cache de dependencias
- [ ] Incremental builds
- [ ] Deploy previews por branch

#### Scaling Strategy
- [ ] Horizontal scaling del backend
- [ ] Load balancer configurado
- [ ] Auto-scaling rules
- [ ] Database connection pooling

### ✅ Criterios de Aceptación

- [ ] API response time promedio < 150ms
- [ ] Frontend FCP < 1.5s
- [ ] Soportar 100 usuarios concurrentes sin degradación
- [ ] Cache hit rate > 80%
- [ ] Bundle size < 500KB (gzipped)
- [ ] Lighthouse score > 90
- [ ] 0 memory leaks detectados
- [ ] Tests passing

### 📈 Métricas de Éxito

- 50% reducción en API response time
- 40% reducción en bundle size
- 90%+ cache hit rate
- < 1% error rate bajo carga
- 95+ Lighthouse score
- Soportar 200+ usuarios simultáneos

---

# 📅 FASE 4: MODOS AVANZADOS

## 🔷 SPRINT 10: Modo Mario Party - Fundación (Semanas 19-20)

### 🎯 Objetivos
- ✅ Sistema de tableros y casillas
- ✅ Mecánica de dados y movimiento
- ✅ Estado del juego Mario Party
- ✅ UI básica del tablero

### 📦 BACKEND

#### Modelos y Tableros
- [ ] CRUD Tableros (admin):
  - POST `/api/admin/boards`
  - Estructura en JSONB config_casillas
  - Validar casillas coherentes
- [ ] Tableros predefinidos (seed):
  ```
  - "Aventura en la Selva" (35 casillas)
  - "Viaje Espacial" (40 casillas)
  - "Reino Submarino" (38 casillas)
  ```
- [ ] Tipos de casillas:
  - 🟢 Normal
  - 🔵 Pregunta
  - ⭐ Estrella
  - 💎 Duelo
  - 🎁 Evento
  - 🔴 Trampa

#### Estado del Juego
- [ ] Service `MarioPartyService`
  ```typescript
  class MarioPartyService {
    initializeGame(roomId, boardId, players): GameState
    rollDice(roomId, playerId): Promise<DiceRoll>
    movePlayer(roomId, playerId, steps): Promise<Position>
    handleCasilla(roomId, playerId, casillaType): Promise<Event>
    nextTurn(roomId): Promise<Player>
    calculateFinalScores(roomId): Promise<Rankings>
  }
  ```

#### Gestión de Turnos
- [ ] Redis state:
  ```typescript
  interface MarioPartyState {
    room_id: string;
    board_id: string;
    players: PlayerState[];
    current_turn: string; // player_id
    round: number;
    max_rounds: number;
    estrellas_posiciones: StarPosition[];
    eventos_activos: Event[];
  }
  
  interface PlayerState {
    player_id: string;
    nickname: string;
    avatar: string;
    position: number; // casilla actual
    estrellas: number;
    items: Item[];
  }
  ```

#### WebSocket Events - Mario Party
- [ ] `socket.on('mario:roll_dice')`
  - Generar número aleatorio 1-6
  - Broadcast animación de dado
  - Return número
- [ ] `socket.on('mario:move')`
  - Mover ficha del jugador
  - Broadcast animación de movimiento
  - Trigger evento de casilla
  - Next turn
- [ ] `mario:casilla_event`
  - Procesar según tipo de casilla
  - Broadcast evento a todos
- [ ] `mario:turn_change`
  - Notificar cambio de turno
  - Incluir tiempo límite
- [ ] Guardar todos los eventos en mario_party_eventos

#### Mecánicas de Casillas
- [ ] Casilla Normal:
  - No hace nada especial
- [ ] Casilla Pregunta:
  - Mostrar 1 pregunta
  - Correcto: avanza 2 casillas extra (futuro)
  - Incorrecto: no pasa nada
- [ ] Casilla Estrella:
  - Mini-juego de 3 preguntas
  - 3/3 correctas: gana estrella
  - Menos: no gana
- [ ] Casilla Evento:
  - Ruleta con eventos aleatorios
  - Eventos buenos/malos
- [ ] Casilla Trampa:
  - Pierde turno
  - O retrocede casillas
- [ ] Casilla Duelo:
  - Seleccionar oponente
  - Pregunta rápida
  - Ganador roba 1 estrella (si hay)

#### Testing Backend
- [ ] Tests de dice rolling
- [ ] Tests de movement
- [ ] Tests de turn management
- [ ] Tests de casilla events
- [ ] Coverage: 75%+

### 🎨 FRONTEND

#### Tablero Component
- [ ] `Board` component - Canvas o SVG
  - Renderizar casillas según config
  - Path del tablero
  - Posiciones de jugadores (fichas)
  - Animaciones de movimiento
  - Highlight casilla actual
  - Zoom y pan (opcional)

#### Pantalla de Juego Mario Party
- [ ] `/game/:code/mario-party`
  - Layout:
    - Tablero (centro, grande)
    - Panel lateral derecho:
      - Turno actual
      - Ronda (X/15)
      - Clasificación mini
    - Panel inferior:
      - Stats del jugador actual
      - Botón de acción

#### Turno del Jugador
- [ ] Vista durante tu turno:
  - Botón "🎲 LANZAR DADO"
  - Animación 3D del dado girando
  - Resultado del dado
  - Animación de movimiento de ficha
  - Evento de casilla (si aplica)

#### Eventos de Casillas - Modales
- [ ] Modal Pregunta:
  - Pregunta single
  - Opciones
  - Timer
  - Feedback
- [ ] Modal Mini-juego Estrella:
  - "Responde 3 preguntas"
  - Counter (1/3, 2/3, 3/3)
  - Progress
  - Resultado final
- [ ] Modal Evento Sorpresa:
  - Ruleta animada
  - Resultado del evento
- [ ] Modal Duelo:
  - Selector de oponente
  - Pregunta rápida
  - Comparación de tiempos
  - Ganador

#### Visualización de Jugadores
- [ ] Fichas en tablero:
  - Avatar del jugador
  - Indicador de turno
  - Estrellas sobre la ficha
- [ ] Panel de clasificación:
  - Lista de jugadores
  - Avatar + nombre
  - # Estrellas
  - # Casilla actual
  - Orden dinámico

#### Animaciones
- [ ] Framer Motion para:
  - Lanzamiento de dado (3D rotation)
  - Movimiento de fichas (path animation)
  - Ruleta de eventos
  - Efectos de estrellas
  - Cambios de turno

#### Testing Frontend
- [ ] Tests de Board rendering
- [ ] Tests de dice roll animation
- [ ] Tests de casilla events
- [ ] Tests de turn management
- [ ] Coverage: 65%+

### ✅ Criterios de Aceptación

- [ ] Tablero renderiza correctamente
- [ ] Dado se lanza y anima
- [ ] Fichas se mueven correctamente
- [ ] Eventos de casillas funcionan
- [ ] Turnos rotan correctamente
- [ ] Mini-juego de estrella funciona
- [ ] Duelos funcionan
- [ ] Clasificación actualiza en tiempo real
- [ ] Tests passing

### 📈 Métricas de Éxito

- Tablero renderiza en < 1 segundo
- Animaciones smooth (30+ FPS)
- 0 bugs en lógica de turnos
- Sincronización perfecta entre jugadores

---

## 🔷 SPRINT 11: Modo Mario Party - Completar (Semanas 21-22)

### 🎯 Objetivos
- ✅ Sistema de items y power-ups
- ✅ Eventos especiales complejos
- ✅ Pantalla final con estadísticas
- ✅ Balanceo y testing completo

### 📦 BACKEND

#### Sistema de Items (Opcional MVP)
- [ ] Items disponibles:
  - 🚀 Cohete: Avanza 5 casillas
  - 🛡️ Escudo: Protege de trampas
  - 🔄 Intercambio: Swap posición con otro jugador
  - 🎲 Dado Dorado: Lanza 2 dados
  - ⭐ Ladrón de Estrellas: Roba estrella al líder

#### Eventos Especiales
- [ ] Eventos complejos:
  - "Lluvia de Estrellas": Todos ganan 1 estrella
  - "Tormenta": Todos retroceden 3 casillas
  - "Teletransporte": Jugadores intercambian posiciones
  - "Bonus Round": Preguntas de bonificación

#### Final del Juego
- [ ] `endMarioPartyGame(roomId)`
  - Calcular puntos finales:
    ```
    Score = (estrellas * 100) + (posición_casilla * 1)
    ```
  - Bonos especiales:
    - 🏆 "Más Estrellas": +50 pts
    - 🧠 "Cerebro": 100% accuracy → +30 pts
    - ⚡ "Rayo": Respuestas más rápidas → +20 pts
  - Determinar rankings
  - Otorgar recompensas (XP, copas)
  - Guardar en game_results
  - Broadcast resultados finales

#### Testing Backend
- [ ] Tests de items usage
- [ ] Tests de eventos especiales
- [ ] Tests de scoring final
- [ ] Tests de bonificaciones
- [ ] Coverage: 75%+

### 🎨 FRONTEND

#### Sistema de Items UI
- [ ] Panel de items del jugador:
  - Mostrar items actuales
  - Click para usar
  - Confirmación modal
  - Animación de uso
- [ ] Obtener items en casillas especiales

#### Eventos Especiales Visualization
- [ ] Animaciones fullscreen:
  - "Lluvia de Estrellas" (estrellas cayendo)
  - "Tormenta" (relámpagos)
  - "Teletransporte" (swap animation)
  - Sonidos y efectos visuales

#### Pantalla Final Mario Party
- [ ] `/game/:code/mario-party/results`
  - Animación de llegada a meta
  - Cálculo de puntos en vivo:
    - Mostrar estrellas de cada uno
    - Sumar bonos especiales (animado)
    - Revelar ganador
  - Podium con top 3
  - Tabla completa de resultados
  - Recompensas otorgadas
  - Botones:
    - Ver estadísticas detalladas
    - Jugar de nuevo
    - Volver al inicio

#### Estadísticas Detalladas
- [ ] Modal con stats:
  - Por jugador:
    - Casillas recorridas
    - Preguntas respondidas
    - Accuracy
    - Items usados
    - Eventos activados
  - Mejor jugada del juego
  - Peor suerte del juego
  - Momentos destacados

#### Polish y UX
- [ ] Tutorial de Mario Party (primera vez):
  - Overlay explicativo
  - Paso a paso
  - Ejemplos animados
  - Skip option
- [ ] Indicadores visuales claros:
  - Turno actual (highlight)
  - Próximo turno (preview)
  - Tiempo restante
  - Estado del juego

#### Testing Frontend
- [ ] Tests de items system
- [ ] Tests de eventos especiales
- [ ] Tests de final screen
- [ ] Tests de stats calculations
- [ ] E2E test completo Mario Party
- [ ] Coverage: 65%+

### ✅ Criterios de Aceptación

- [ ] Items se usan correctamente
- [ ] Eventos especiales funcionan
- [ ] Bonificaciones calculadas correctamente
- [ ] Pantalla final muestra ganador correcto
- [ ] Recompensas se otorgan
- [ ] Tutorial es claro y útil
- [ ] Juego completo toma 15-25 minutos
- [ ] Tests passing

### 📈 Métricas de Éxito

- 100% de eventos funcionan correctamente
- 0 bugs en cálculo de puntos finales
- Tutorial completo < 2 minutos
- Engagement: jugadores completan el juego

---

## 🔷 SPRINT 12: Modo Batalla de Equipos (Semanas 23-24)

### 🎯 Objetivos
- ✅ Sistema de equipos y votación
- ✅ Preguntas colaborativas
- ✅ Pantalla de batalla
- ✅ Resultados por equipo

### 📦 BACKEND

#### Gestión de Equipos
- [ ] Al crear sala tipo "batalla_equipos":
  - Auto-crear 2-4 equipos
  - Colores: Rojo, Azul, Verde, Amarillo
  - Iconos: 🦁, 🐬, 🦅, 🐉
- [ ] Asignación de jugadores:
  - Manual (profesor elige)
  - O automática (balanceada por nivel)
- [ ] Update sala_participantes.equipo_id

#### Sistema de Votación
- [ ] Service `TeamBattleService`
  ```typescript
  class TeamBattleService {
    initializeTeamGame(roomId): void
    submitVote(roomId, playerId, questionId, answer): Promise<void>
    getTeamConsensus(teamId, questionId): Promise<string>
    calculateTeamScore(teamId): Promise<number>
    finalizeTeamGame(roomId): Promise<TeamResults>
  }
  ```

#### Mecánica de Preguntas Colaborativas
- [ ] Al mostrar pregunta:
  - Cada jugador vota su respuesta
  - Guardar en preguntas_colaborativas
  - Actualizar conteo en tiempo real
  - Al terminar timer:
    - Calcular respuesta del equipo (mayoría)
    - Evaluar si correcta
    - Otorgar puntos al equipo
    - Broadcast resultados

#### WebSocket Events - Team Battle
- [ ] `socket.on('team:vote')`
  - Params: { roomId, questionId, answer }
  - Guardar voto individual
  - Update contador de votos
  - Broadcast `team:vote_updated`
- [ ] `team:question_result`
  - Mostrar votos del equipo
  - Revelar respuesta correcta
  - Puntos ganados/perdidos
  - Update clasificación de equipos
- [ ] `team:final_results`
  - Clasificación final de equipos
  - MVP de cada equipo
  - Estadísticas completas

#### Scoring por Equipos
- [ ] Puntos base: 1000 por pregunta correcta
- [ ] Bonus de consenso:
  - 100% acuerdo: +200 pts
  - 80%+ acuerdo: +100 pts
  - Mayoría simple: +0 pts
- [ ] Puntos individuales:
  - Cada jugador aporta puntos personales también
  - Ranking individual dentro del equipo

#### Testing Backend
- [ ] Tests de team creation
- [ ] Tests de voting system
- [ ] Tests de consensus calculation
- [ ] Tests de team scoring
- [ ] Coverage: 75%+

### 🎨 FRONTEND

#### Pantalla de Asignación de Equipos
- [ ] `/teacher/rooms/:code/teams` (solo profesor)
  - Vista de todos los jugadores conectados
  - Drag & drop a equipos:
    ```
    🦁 EQUIPO ROJO        🐬 EQUIPO AZUL
    [Lista jugadores]     [Lista jugadores]
    
    🦅 EQUIPO VERDE       🐉 EQUIPO AMARILLO
    [Lista jugadores]     [Lista jugadores]
    ```
  - Botón "Auto-balancear" (por nivel)
  - Botón "Confirmar Equipos"
  - Validar: mínimo 2 jugadores por equipo

#### Pantalla de Juego - Team Battle
- [ ] `/game/:code/team-battle`
  - Header:
    - Logo del equipo
    - Nombre del equipo
    - Score actual del equipo
    - Posición (#1, #2, etc)
  - Pregunta (como siempre)
  - Opciones para votar
  - Panel de votos del equipo:
    ```
    VOTOS DE TU EQUIPO:
    A: ███░░░░ 3 votos
    B: █████░░ 5 votos ✓ (mayoría)
    C: █░░░░░░ 1 voto
    D: ░░░░░░░ 0 votos
    
    6/8 compañeros han votado
    ```
  - Timer countdown

#### Feedback de Pregunta - Equipo
- [ ] Mostrar resultado del equipo:
  - "Tu equipo votó: B"
  - Respuesta correcta: B
  - ✅ ¡Correcto! o ❌ Incorrecto
  - Puntos ganados por el equipo
  - Bonus de consenso (si aplica)
  - Tu voto individual (si fue correcto)

#### Leaderboard de Equipos
- [ ] Tabla de equipos:
  ```
  #1 🦁 EQUIPO ROJO      4,500 pts  ⭐⭐⭐
  #2 🐬 EQUIPO AZUL      4,200 pts  ⭐⭐
  #3 🦅 EQUIPO VERDE     3,800 pts  ⭐⭐
  #4 🐉 EQUIPO AMARILLO  3,500 pts  ⭐
  ```
- [ ] Mini leaderboard siempre visible

#### Pantalla Final - Team Battle
- [ ] Podium de equipos:
  - 🥇 Equipo ganador (animación)
  - 🥈 Segundo lugar
  - 🥉 Tercer lugar
- [ ] Stats del equipo ganador:
  - Accuracy del equipo
  - Mejor jugador del equipo (MVP)
  - Preguntas acertadas en consenso
- [ ] Stats individuales:
  - Tu aporte al equipo
  - Tu accuracy personal
  - Tu posición en el equipo
- [ ] Recompensas:
  - Equipo ganador: +600 XP cada uno
  - Segundo lugar: +400 XP
  - Tercer lugar: +200 XP
  - MVP del equipo ganador: +200 XP extra

#### Chat de Equipo (Opcional)
- [ ] Chat simple durante juego:
  - Solo visible para tu equipo
  - Mensajes cortos
  - Emojis rápidos
  - Desactivar durante pregunta

#### Components
- [ ] `TeamCard` component
- [ ] `VotePanel` component
- [ ] `TeamLeaderboard` component
- [ ] `TeamResultsScreen` component
- [ ] `MVPBadge` component

#### Testing Frontend
- [ ] Tests de team assignment
- [ ] Tests de voting UI
- [ ] Tests de vote aggregation
- [ ] Tests de team leaderboard
- [ ] Tests de final results
- [ ] E2E test completo Team Battle
- [ ] Coverage: 65%+

### ✅ Criterios de Aceptación

- [ ] Profesor puede asignar jugadores a equipos
- [ ] Auto-balanceo funciona
- [ ] Votación en tiempo real
- [ ] Conteo de votos actualiza en vivo
- [ ] Consenso se calcula correctamente
- [ ] Puntos de equipo correctos
- [ ] Leaderboard de equipos funciona
- [ ] MVP se determina correctamente
- [ ] Recompensas se otorgan
- [ ] Tests passing

### 📈 Métricas de Éxito

- 100% de votos registrados correctamente
- 0 errores en cálculo de consenso
- Sincronización perfecta de votos
- Engagement: todos los jugadores votan

---

# 📊 RESUMEN Y MÉTRICAS GLOBALES

## 🎯 Objetivos del MVP Completo

Al finalizar los 12 sprints (6 meses), el sistema debe tener:

### ✅ Features Core
- [x] Autenticación RBAC completa
- [x] Gestión de clases y estudiantes
- [x] Creación de quizzes (manual + IA)
- [x] Modo Classic (Kahoot) funcional
- [x] Modo Mario Party completo
- [x] Modo Batalla de Equipos completo
- [x] Sistema de niveles y XP
- [x] Sistema de copas y trofeos
- [x] Sistema de insignias
- [x] Sistema de misiones
- [x] Notificaciones en tiempo real
- [x] Analytics y reportes (profesor)
- [x] Leaderboards globales

### 📊 Métricas de Éxito del Proyecto

#### Performance
- API response time promedio: < 150ms
- Frontend FCP: < 1.5s
- WebSocket latency: < 50ms
- Soportar: 100+ usuarios concurrentes por sala
- Uptime: 99.9%

#### Quality
- Test coverage backend: 75%+
- Test coverage frontend: 65%+
- Lighthouse score: 90+
- 0 critical bugs en producción
- < 1% error rate

#### User Experience
- Juego Classic: 10-15 minutos
- Juego Mario Party: 15-25 minutos
- Juego Team Battle: 10-15 minutos
- Tutorial completion rate: 80%+
- Return rate: 60%+

## 📋 Checklist Final Pre-Launch

### Backend
- [ ] Todas las APIs documentadas (Swagger/OpenAPI)
- [ ] Rate limiting implementado
- [ ] Error handling robusto
- [ ] Logging estructurado
- [ ] Monitoring y alertas
- [ ] Database backups automáticos
- [ ] Security audit completado
- [ ] Load testing passed (500+ concurrent users)

### Frontend
- [ ] Responsive en mobile/tablet/desktop
- [ ] Accesibilidad (WCAG AA)
- [ ] SEO optimizado
- [ ] PWA configurado (opcional)
- [ ] Error boundaries
- [ ] Analytics integrado
- [ ] Cross-browser testing
- [ ] Performance audit passed

### DevOps
- [ ] CI/CD pipeline completo
- [ ] Auto-deploy a staging
- [ ] Manual approve para producción
- [ ] Rollback strategy
- [ ] Infrastructure as Code
- [ ] Disaster recovery plan
- [ ] SSL certificates
- [ ] CDN configurado

### Legal y Compliance
- [ ] Privacy Policy
- [ ] Terms of Service
- [ ] Cookie consent
- [ ] GDPR compliance (si aplica)
- [ ] Parental consent para menores
- [ ] Data retention policy

## 🚀 Post-Launch Roadmap (Futuro)

### Sprint 13+: Features Adicionales
- [ ] Modo Examen (sin tiempo real, individual)
- [ ] Quiz de práctica (sin presión)
- [ ] Sistema de avatares personalizados
- [ ] Generación desde video (YouTube)
- [ ] Generación desde audio
- [ ] Integración con Google Classroom
- [ ] App móvil nativa (React Native)
- [ ] Modo offline
- [ ] Multiplataforma: Web + iOS + Android

### Features Avanzadas
- [ ] IA tutor personalizado
- [ ] Recomendaciones adaptativas
- [ ] Análisis predictivo (quién necesita ayuda)
- [ ] Gamificación avanzada (temp