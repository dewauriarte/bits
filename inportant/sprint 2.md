
## 🔷 SPRINT 2: Gestión de Clases y Estudiantes (Semanas 3-4)

### 🎯 Objetivos
- ✅ Profesores pueden crear y gestionar clases
- ✅ Sistema de códigos de clase
- ✅ Estudiantes pueden unirse a clases
- ✅ Dashboard profesor funcional

### 📦 BACKEND

#### Models y Controllers - Clases
- [x] GET `/api/classes`
  - Listar clases del profesor (con filtros)
  - Include: grado, materia, count estudiantes
- [x] POST `/api/classes`
  - Crear nueva clase
  - Generar código único (6 chars)
  - Validar profesor_id = current user
- [x] GET `/api/classes/:id`
  - Detalle de clase
  - Include: estudiantes, quizzes
  - Solo profesor owner o estudiantes inscritos
- [x] PUT `/api/classes/:id`
  - Actualizar clase
  - Solo profesor owner
- [x] DELETE `/api/classes/:id`
  - Archivar clase (soft delete)
  - Solo profesor owner
- [x] POST `/api/classes/join`
  - Body: { codigo }
  - Verificar código existe
  - Agregar estudiante a clase
  - Return clase data

#### Models y Controllers - Estudiantes
- [x] GET `/api/classes/:id/students`
  - Listar estudiantes de la clase
  - Include: perfil_gamer stats básicas
  - Solo profesor owner
- [x] DELETE `/api/classes/:id/students/:studentId`
  - Remover estudiante de clase
  - Solo profesor owner
- [x] GET `/api/students/classes`
  - Listar clases del estudiante actual
  - Include: profesor, materia, próximos quizzes

#### Servicios
- [x] `ClassService.generateUniqueCode()`
  - Generar código alfanumérico
  - Verificar que no existe
  - Retry si duplicado
- [x] `ClassService.getClassStats(classId)`
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
- [x] `/teacher/dashboard` - Vista principal
  - Sidebar con navegación
  - Stats cards:
    - Total clases
    - Total estudiantes
    - Quizzes creados
  - Lista de clases recientes
  - Acciones rápidas
- [x] `/teacher/classes` - Gestión de Clases
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
- [x] Modal "Crear Clase"
  - Form con validación
  - Campos:
    - Nombre (requerido)
    - Grado (select)
    - Materia (select)
    - Año escolar (select)
    - Descripción (opcional)
  - Submit y actualizar lista
- [x] Modal "Editar Clase"
  - Pre-cargar datos
  - Mismos campos que crear
- [x] Modal "Ver Código de Clase"
  - Mostrar código grande
  - QR code
  - URL para compartir
  - Botón copiar

#### Detalle de Clase
- [x] `/teacher/classes/:id` - Vista detallada
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
- [x] `/student/dashboard` - Vista principal
  - Stats personales:
    - Nivel actual + XP
    - Copas totales
    - Insignias
  - Mis Clases (cards)
  - Últimos resultados
- [x] `/student/classes` - Mis Clases
  - Lista de clases inscritas
  - Card por clase con:
    - Nombre + profesor
    - Materia
    - Próximos juegos
  - Botón "Unirse a Clase"

#### Modal Unirse a Clase
- [x] Modal con input de código
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