
# 🔷 SPRINT 9: Sistema de Logros (Semanas 17-18)

## 🎯 Objetivos

* Sistema de achievements completo
* Tracking automático de progreso
* Notificaciones de desbloqueo
* Showcase de logros en perfil

---

## 📦 Backend Tasks

### **Achievement System**

* [ ] Poblar tabla `achievements` con 30-50 logros
  * Quiz category: "First Steps", "Perfect Score", "Speed Demon"
  * Social: "Social Butterfly", "Team Player"
  * Progression: "Level 10", "Level 50", "Level 100"
  * Collection: "5 Pets", "10 Skins"
  * Mastery: "Math Master", "Science Genius"
  * Special: "Weekend Warrior", "Night Owl"
  * Seasonal: eventos especiales
* [ ] `GET /api/achievements` - Listar achievements
  * Filtros: category, rarity, is_unlocked
  * Incluir progreso del usuario
  * Ordenar por: newest, rarity, progress
  * No mostrar is_secret si no está desbloqueado
* [ ] `GET /api/achievements/:id` - Detalle
  * Info completa (si no es secreto)
  * Progreso: current / requirement
  * Recompensas al desbloquear
  * % de jugadores que lo tienen

### **Achievement Tracking**

* [ ] Método `checkAchievements(userId, eventType, eventData)`
  * Ejecutar tras acciones clave:
    * Completar quiz
    * Ganar juego
    * Alcanzar nivel
    * Agregar amigo
    * Adoptar mascota
  * Iterar achievements aplicables
  * Actualizar progress en user_achievements
  * Si progress >= requirement: unlockAchievement()
* [ ] Método `unlockAchievement(userId, achievementId)`
  * Marcar is_unlocked = true
  * Registrar unlocked_at timestamp
  * Otorgar recompensas (coins, gems, XP, title, item)
  * Crear notificación con celebración
  * Broadcast a amigos si es logro raro
  * Incrementar times_completed si es repeatable
* [ ] Achievement triggers por evento
  * `quiz_completed`: "First Steps" (1 quiz)
  * `perfect_score`: "Perfectionist" (100% accuracy)
  * `games_won`: "Champion" (50 victorias)
  * `level_reached`: "Level X" (por nivel)
  * `friends_added`: "Social" (10 amigos)
  * `pets_collected`: "Collector" (5 mascotas)
  * `streak_milestone`: "Week Warrior" (7 días consecutivos)

### **Progress Tracking**

* [ ] Auto-crear user_achievements al crear usuario
  * Insertar todos los achievements con progress = 0
  * Así siempre hay registro para trackear
* [ ] Método `getAchievementProgress(userId)`
  * Retornar todos los achievements con progreso
  * Calcular % completado global
  * Listar próximos a desbloquear (>70% progreso)
* [ ] Método `getShowcasedAchievements(userId)`
  * Retornar achievements con is_showcased = true
  * Máximo 5 showcased
  * Mostrar en perfil público

### **Endpoints**

* [ ] `GET /api/achievements` - Listar todos
* [ ] `GET /api/achievements/:id` - Detalle
* [ ] `GET /api/users/:id/achievements` - Logros del usuario
* [ ] `PUT /api/users/achievements/:id/showcase` - Destacar logro
* [ ] `GET /api/achievements/progress` - Progreso global

### **Testing Backend**

* [ ] Tests de tracking automático
* [ ] Tests de unlock con rewards
* [ ] Tests de achievements repeatables
* [ ] Tests de achievements secretos

---

## 🎨 Frontend Tasks

### **Achievements Page**

* [ ] AchievementsGallery (/achievements)
  * Grid de achievement cards
  * Tabs por categoría (All, Quiz, Social, etc.)
  * Filtro "Unlocked Only"
  * Progress indicator global: "15/50 achievements"
  * Barra de progreso total
* [ ] AchievementCard component
  * Badge icon animado
  * Nombre + descripción
  * Rareza con glow
  * Progress bar si no desbloqueado
  * "Locked" overlay con candado si secreto
  * Hover: tooltip con recompensas
  * Click: abrir detalles

### **Achievement Unlock Animation**

* [ ] AchievementUnlockModal
  * Fullscreen overlay con fondo oscuro
  * Badge aparece con zoom + glow
  * Nombre del achievement
  * "+500 coins, +50 gems" animados
  * Confetti dorado
  * Sound effect de logro
  * Botón "Claim Rewards"
* [ ] Toast notification
  * Mini card en esquina superior derecha
  * Badge + "Achievement Unlocked!"
  * Auto-dismiss en 5 segundos
  * Click: abrir modal completo

### **Profile Integration**

* [ ] "Mis Logros" section en perfil
  * Showcase de 5 achievements destacados
  * Grid más grande para estos 5
  * Botón "Manage Showcase"
  * Progress summary: "15/50 unlocked"
  * Link a "View All Achievements"
* [ ] ShowcaseManager modal
  * Lista de achievements desbloqueados
  * Checkbox para seleccionar 5
  * Preview de cómo se verán
  * Botón "Save Showcase"

### **Dashboard Widget**

* [ ] RecentAchievements widget
  * Últimos 3 logros desbloqueados
  * Mini cards con badge
  * "View All" link
  * Empty state: "Start your journey!"

### **Testing Frontend**

* [ ] Tests de animación de unlock
* [ ] Tests de showcase selection
* [ ] Tests de filtros

---

## ✅ Criterios de Aceptación

* [ ] Sistema trackea progreso automáticamente
* [ ] Logros se desbloquean al cumplir requisitos
* [ ] Notificación celebratoria al desbloquear
* [ ] Recompensas se otorgan correctamente
* [ ] Usuario puede ver todos sus achievements
* [ ] Usuario puede destacar 5 achievements en perfil
* [ ] Progress bars muestran avance correcto
* [ ] Achievements secretos no revelan info hasta unlock
* [ ] UI es motivante y celebratoria

---