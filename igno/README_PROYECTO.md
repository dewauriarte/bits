# 🎓 APPQUIZ - Sistema de Quizzes Educativos Gamificados

## 📁 Archivos del Proyecto

### ✅ Archivos Actualizados (Sin Monedas/Gemas/Rachas)

1. **BITS_ESPECIFICACION_COMPLETA.md** ⭐ **PRINCIPAL**
   - Especificación completa y consolidada
   - Sin economía virtual (monedas/gemas eliminadas)
   - Solo: Puntos, XP, Copas, Insignias
   - Todos los modos de juego detallados

2. **SPRINTS_PLAN.md** + **SPRINTS_PLAN_PART2.md** ⭐ **PLAN DE DESARROLLO**
   - 8 sprints de 2 semanas cada uno (4 meses total)
   - Desglose detallado de Backend, Frontend y Testing
   - Objetivos y entregables por sprint
   - Orden correcto de implementación

3. **bits.sql** ✅ **BASE DE DATOS**
   - Ya actualizada SIN monedas, gemas ni rachas
   - Incluye todas las tablas necesarias
   - Índices para performance
   - Seeds con datos iniciales

4. **stack.md**
   - Stack tecnológico completo
   - Arquitectura de tiempo real

### 📄 Archivos de Detalle (Limpios)

5. **BITS_CLEAN_1.md** - Modo Kahoot detallado
6. **BITS_CLEAN_2.md** - Modo Mario Party detallado  
7. **BITS_CLEAN_3.md** - Modo Batalla de Equipos detallado
8. **BITS_CLEAN_4.md** - Modo Examen + Resumen


## 🎯 Elementos del Sistema

### ✅ INCLUIDOS (Gamificación sin economía)
- **Puntos** - Por desempeño en juegos
- **Experiencia (XP)** - Sistema de niveles
- **Copas 🏆** - Por victorias (1º=3, 2º=2, 3º=1)
- **Trofeos** - Oro, Plata, Bronce
- **Insignias** - Logros desbloqueables
- **Estadísticas** - Tracking de rendimiento
- **Niveles** - Progresión del estudiante

### ❌ ELIMINADOS
- ~~Monedas virtuales~~
- ~~Gemas~~
- ~~Rachas de días~~
- ~~Tienda virtual~~
- ~~Historial de transacciones~~
- ~~Bonificación por rachas~~
- ~~misiones  y desafios~~

---

## 🏗️ Stack Tecnológico

### Backend
```
Node.js + Express + TypeScript
PostgreSQL + Prisma ORM
Redis (cache + sesiones)
Socket.IO (WebSockets tiempo real)
JWT (autenticación)
Bull (colas de trabajos)
```

### Frontend
```
React 18 + TypeScript
Tailwind CSS + Shadcn/ui
Zustand (estado global)
React Query (cache)
Socket.IO client
Framer Motion (animaciones)
React Router v6
```

### Servicios Externos
```
Claude API / OpenAI / Gemini (IA)
AWS S3 / Cloudinary (archivos)
YouTube Data API
Whisper API (transcripción)
```

---

## 🎮 Modos de Juego

1. **Modo Kahoot** - Competencia individual en tiempo real
2. **Modo Mario Party** - Tablero con dado y casillas especiales
3. **Modo Batalla de Equipos** - Colaborativo con votación
4. **Modo Examen** - Evaluación formal sin gamificación

---

## 👥 Roles del Sistema

1. **Admin** - Gestión completa del sistema
2. **Profesor** - Crea clases, quizzes y salas de juego
3. **Estudiante** - Juega y ve su progreso

---

## 🔐 Métodos de Login para Estudiantes

**⚠️ IMPORTANTE: Los estudiantes NO requieren correo electrónico**

### **OPCIÓN 1: Código PIN (Más Simple)**
```
Profesor genera partida → Código: ABC123

Estudiante:
1. Abre app/web
2. Ve pantalla: "Ingresa código del juego"
3. Escribe: ABC123
4. Escribe su nombre (o selecciona de lista)
5. ¡Listo! Entra directo
```

### **OPCIÓN 2: QR Code (Más Rápido)**
```
Profesor proyecta QR en pantalla

Estudiante:
1. Abre app
2. Toca "Escanear QR"
3. Apunta cámara al QR
4. Selecciona su nombre
5. ¡Entra automáticamente!
```

### **OPCIÓN 3: Link Directo**
```
Profesor comparte: tuapp.com/game/ABC123

Estudiante:
1. Clic en link (desde WhatsApp, email, etc.)
2. Se abre automáticamente
3. Selecciona nombre
4. ¡Listo!
```

### **OPCIÓN 4: Modo "Clase Permanente" (Recomendado)**
```
Para clases regulares:

Estudiante se registra UNA VEZ con:
- Usuario: nombre.apellido
- Contraseña simple: 1234 (puede cambiarla después)
- Edad/grado

Luego siempre accede con sus credenciales

✅ Ventaja: Guarda todo su progreso histórico
```

### **OPCIÓN 5: Login con Avatares (Para Niños de Inicial 3-6 años)**
```
🎨 LOGIN CON AVATARES

1. Estudiante abre app
2. Ve pantalla con 20 avatares (animales, personajes)
3. Toca SU avatar asignado (lo reconoce visualmente)
4. Listo, entra sin escribir nada

Profesor asigna previamente:
- María → 🐱 Gatita Rosa
- Juan → 🦁 León Amarillo
- Ana → 🐼 Osito Panda

✅ Perfecto para niños que no saben leer/escribir
```

### **Resumen de Métodos**

| Método | Edad Recomendada | Velocidad | Requiere Registro |
|--------|------------------|-----------|-------------------|
| 1. Código PIN | 7+ años | ⭐⭐⭐ | No |
| 2. QR Code | 7+ años | ⭐⭐⭐⭐⭐ | No |
| 3. Link Directo | 7+ años | ⭐⭐⭐⭐ | No |
| 4. Clase Permanente | 7+ años | ⭐⭐⭐⭐ | Sí (una sola vez) |
| 5. Avatares | 3-6 años | ⭐⭐⭐⭐⭐ | No |

**Nota:** Opciones 1, 2 y 3 son ideales para partidas rápidas o estudiantes invitados. La opción 4 es mejor para clases regulares donde se necesita tracking histórico.

---

## 📅 Plan de Desarrollo en inportatnt sprints

## 🚀 Cómo Empezar

### 1. Leer la Especificación
```
📖 Archivo: BITS_ESPECIFICACION_COMPLETA.md
```
Este archivo tiene TODA la información consolidada y limpia.

### 2. Revisar el Plan de Sprints
```
📋 Archivos: 
   - SPRINTS_PLAN.md (Sprints 1-5)
   - SPRINTS_PLAN_PART2.md (Sprints 6-8)
```
Plan detallado con tareas de Backend, Frontend y Testing.

### 3. Revisar la Base de Datos
```
🗄️ Archivo: bits.sql
```
Schema completo ya sin monedas/gemas/rachas.

### 4. Comenzar Sprint 1
```bash
# Backend
cd backend
npm init -y
npm install express typescript prisma @prisma/client
# ... seguir instrucciones del Sprint 1

# Frontend  
cd frontend
npx create-react-app . --template typescript
npm install tailwindcss @shadcn/ui
# ... seguir instrucciones del Sprint 1
```

---

## 📊 Métricas de Éxito

- ✅ Todos los 4 modos de juego funcionales
- ✅ Sistema de IA para generación de contenido
- ✅ Tiempo real con WebSockets sin lag
- ✅ Tests con >80% coverage
- ✅ Performance <2s tiempo de carga
- ✅ 0 bugs críticos
- ✅ Aplicación deployada en producción

