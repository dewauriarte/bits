# 🔐 Sistema de Autenticación Frontend - Guía Completa

## ✅ Implementación Completada

### 📦 Archivos Creados

#### **Schemas de Validación**
- `src/schemas/auth.schema.ts` - Validación con Zod para login y registro

#### **API Client & Services**
- `src/lib/authApi.ts` - Funciones de autenticación
  - `register()` - Registro de usuarios
  - `login()` - Inicio de sesión
  - `logout()` - Cerrar sesión
  - `getMe()` - Obtener usuario actual
  - `refreshToken()` - Refrescar token

#### **Store (Zustand)**
- `src/stores/authStore.ts` - Estado global mejorado
  - Login, register, logout async
  - Refresh token automático
  - Persistencia en localStorage
  - Loading y error states

#### **Componentes UI (shadcn/ui)**
- `src/components/ui/checkbox.tsx` - Checkbox personalizado
- `src/components/ui/tabs.tsx` - Tabs para formularios

#### **Páginas**
- `src/pages/LoginPage.tsx` - Página de login con:
  - Form con React Hook Form + Zod
  - Email o username
  - "Recordarme" checkbox
  - Animaciones con Framer Motion
  - Gradientes modernos

- `src/pages/RegisterPage.tsx` - Página de registro con:
  - Tabs: Estudiante / Profesor
  - Validación completa
  - Selector de grado (estudiantes)
  - Selector de materias (profesores)
  - Terms & conditions
  - Animaciones

- `src/pages/DashboardPage.tsx` - Dashboard protegido con:
  - Información del usuario
  - Perfil gamer
  - Logout button

#### **Layouts**
- `src/layouts/PublicLayout.tsx` - Layout público con:
  - Header con logo y navegación
  - Footer con links sociales
  - Outlet para rutas anidadas

#### **Componentes de Protección**
- `src/components/ProtectedRoute.tsx` - Rutas protegidas
  - Verifica autenticación
  - Loading state
  - Redirect a /login

- `src/components/RoleRoute.tsx` - Protección por rol
  - Verifica permisos
  - Página 403 personalizada
  - Redirect opcional

#### **Tipos**
- `src/types/index.ts` - Tipos actualizados
  - `User` con perfil_gamer
  - `LoginInput`, `RegisterInput`
  - `AuthResponse`, `LoginResponse`

#### **Configuración**
- `src/vite-env.d.ts` - Tipos para variables de entorno
- `.env` - Variables de entorno
- `src/App.tsx` - Rutas configuradas

---

## 🚀 Rutas Implementadas

### Rutas Públicas (con PublicLayout)
- `/` - Redirect a /login
- `/login` - Página de inicio de sesión
- `/register` - Página de registro

### Rutas Protegidas
- `/dashboard` - Dashboard general (todos los usuarios autenticados)

### Rutas por Rol
- `/admin/*` - Solo admin
- `/profesor/*` - Profesor y admin
- `/estudiante/*` - Estudiante y admin

### Otras
- `*` - Página 404 personalizada

---

## 🎨 Características de UI/UX

### Diseño Moderno
- ✅ Gradientes de color (indigo → purple)
- ✅ Animaciones con Framer Motion
- ✅ Componentes shadcn/ui
- ✅ Tailwind CSS
- ✅ Responsive design

### Interactividad
- ✅ Loading states en botones
- ✅ Validación en tiempo real
- ✅ Mensajes de error claros
- ✅ Animaciones suaves
- ✅ Icons de Lucide React

### Formularios
- ✅ React Hook Form
- ✅ Validación Zod
- ✅ Password strength
- ✅ Confirmación de password
- ✅ Checkbox personalizados

---

## 🔧 Cómo Probar

### 1. Iniciar Backend
```bash
cd backend
npm run dev
# Backend en http://localhost:3001
```

### 2. Iniciar Frontend
```bash
cd frontend
npm run dev
# Frontend en http://localhost:5173
```

### 3. Probar Flujos

#### Registro de Estudiante
1. Ir a `/register`
2. Seleccionar tab "Estudiante"
3. Llenar formulario:
   - Nombre y apellido
   - Username único
   - Email válido
   - Seleccionar grado
   - Contraseña fuerte (min 8 chars, mayúscula, minúscula, número, especial)
   - Aceptar términos
4. Click en "Crear Cuenta"
5. Redirect automático a `/dashboard`

#### Registro de Profesor
1. Ir a `/register`
2. Seleccionar tab "Profesor"
3. Llenar formulario:
   - Datos personales
   - Seleccionar 1-5 materias
   - Contraseña
   - Aceptar términos
4. Click en "Crear Cuenta"
5. Redirect a `/dashboard`

#### Login
1. Ir a `/login`
2. Ingresar email/username y password
3. Opcional: marcar "Recordarme"
4. Click en "Iniciar Sesión"
5. Redirect a `/dashboard`

#### Dashboard
- Ver información del usuario
- Ver perfil gamer (nivel, puntos, racha, monedas)
- Botón de logout

#### Rutas Protegidas
- Intentar acceder a `/dashboard` sin login → redirect a `/login`
- Login como estudiante → intentar acceder a `/admin` → página 403

---

## 🔑 Usuarios de Prueba (del seed)

```
Admin:
- username: admin
- password: Admin123!

Profesor:
- username: prof_maria
- password: Prof123!

Estudiante:
- username: est_juan
- password: Est123!
```

---

## 🛡️ Seguridad Implementada

1. **JWT Tokens**
   - Access token (15 min)
   - Refresh token (7 días)
   - Guardados en localStorage

2. **Interceptores Axios**
   - Auto-attach de Bearer token
   - Auto-refresh cuando expira
   - Redirect a login si falla refresh

3. **Rutas Protegidas**
   - `ProtectedRoute` verifica autenticación
   - `RoleRoute` verifica permisos
   - Loading states mientras verifica

4. **Validación**
   - Frontend: Zod schemas
   - Backend: Zod schemas
   - Password strength requirements

---

## 📱 Responsive Design

✅ Mobile first
✅ Breakpoints md, lg
✅ Grid layouts adaptativos
✅ Touch-friendly buttons

---

## 🎯 Próximos Pasos

- [ ] Forgot password flow
- [ ] Email verification
- [ ] OAuth providers (Google, GitHub)
- [ ] 2FA
- [ ] User profile editing
- [ ] Avatar upload
- [ ] Session management (múltiples dispositivos)

---

## 📝 Notas Técnicas

### AuthStore
- Usa Zustand con persist middleware
- Sincroniza con localStorage
- Maneja loading y error states
- Funciones async para todas las acciones

### API Client
- Axios instance configurado
- Base URL desde `.env`
- Interceptores para auth
- Error handling global

### Forms
- React Hook Form para performance
- Zod para validación
- Tipado completo con TypeScript
- Mensajes de error personalizados

---

**Autor:** AppQuiz Team  
**Fecha:** 2025  
**Stack:** React + TypeScript + Vite + Tailwind + shadcn/ui
