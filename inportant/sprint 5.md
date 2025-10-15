## 🔷 SPRINT 5: Classic Mode - Gameplay (Semanas 9-10)

### 🎯 Objetivos
- ✅ Gameplay completo modo Kahoot
- ✅ Preguntas en tiempo real sincronizadas
- ✅ Sistema de scoring con combos
- ✅ Leaderboard en vivo

### 📦 BACKEND

#### Game Flow Logic
- [✅] `socket.on('game:start')`
  - ✅ Obtener preguntas del quiz
  - ✅ Shuffle si config.shuffle_questions
  - ✅ Inicializar estado del juego en Redis
  - ✅ Broadcast `game:started`
  - ✅ Enviar primera pregunta (sin respuesta)
  - ✅ Iniciar timer server-side
  
- [✅] `sendQuestion(roomCode)`
  - ✅ Obtener pregunta actual
  - ✅ Preparar opciones (shuffle si config)
  - ✅ Remove is_correct de opciones
  - ✅ Broadcast `question:new`
  - ✅ Start countdown con setInterval
  - ✅ Broadcast `timer:tick` cada segundo

- [✅] `socket.on('answer:submit')`
  - ✅ Params: { roomCode, questionId, answer, time_taken }
  - ✅ Validar que timer no expiró
  - ✅ Check si respuesta correcta
  - ✅ Calcular puntos:
    ```typescript
    const basePoints = 1000;
    const speedBonus = calculateSpeedBonus(time_taken, time_limit);
    const comboMultiplier = 1 + (player.combo * 0.1);
    const totalPoints = (basePoints + speedBonus) * comboMultiplier;
    ```
  - ✅ Update combo_streak (++ si correcto, 0 si incorrecto)
  - ✅ Guardar en sala_respuestas
  - ✅ Update score del player
  - ✅ Emit callback a player con resultado
  - ✅ Update leaderboard en memoria
  - ✅ Broadcast `leaderboard:update`

- [✅] Timer Management
  - ✅ Server-side countdown (no confiar en cliente)
  - ✅ Al llegar a 0:
    - ✅ Broadcast `question:timeout`
    - ✅ Esperar 3 seg (ver respuesta)
    - ✅ `showQuestionResults()`
    - ✅ Avanzar a siguiente o terminar

- [✅] `showQuestionResults(roomCode)`
  - ✅ Calcular stats de pregunta:
    - ✅ % que respondió correctamente
    - ✅ Tiempo promedio
    - ✅ Distribución de respuestas
  - ✅ Broadcast `question:results`
  - ✅ Wait 5 segundos
  - ✅ Si hay más preguntas:
    - ✅ `sendQuestion()` con siguiente
  - ✅ Si no:
    - ✅ `endGame()`

- [✅] `endGame(roomCode)`
  - ✅ Calcular leaderboard final
  - ✅ Determinar rankings
  - ✅ Calcular recompensas:
    ```typescript
    1st place: 3 copas, +800 XP
    2nd place: 2 copas, +500 XP
    3rd place: 1 copa, +300 XP
    Participación: +100 XP
    ```
  - ✅ Guardar en resultados_finales
  - ✅ Otorgar XP y copas en perfiles_gamer
  - ⚠️ Check insignias desbloqueadas (pendiente)
  - ✅ Broadcast `game:finished` con data completa

#### Scoring System
- [✅] `utils/scoring.ts`
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

- [✅] Service `GameplayService`
  ```typescript
  class GameplayService {
    ✅ initializeGame(roomCode): void
    ✅ processAnswer(params): AnswerResult
    ✅ getLeaderboard(roomCode): Player[]
    ✅ calculateRewards(player, rank, totalPlayers): Rewards
    ✅ finalizeGame(roomCode): GameResults
  }
  ```

#### Analytics y Estadísticas
- [✅] Guardar estadísticas detalladas
    * ✅ sala_respuestas con todos los datos (correcta, tiempo_respuesta_ms, puntos, multiplicador)
    * ✅ resultados_finales con estadísticas finales (accuracy, posicion, rank, rewards)
    * ✅ Actualizar stats de questions (veces_respondida, veces_correcta)
    * ⚠️ Actualizar stats de quiz (veces_jugado) - PENDIENTE
    * ✅ Actualizar perfiles_gamer (experiencia, copas, trofeos, estadisticas JSON)
    * ✅ Actualizar sala_participantes en tiempo real (puntos_actuales, respuestas_correctas)

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
