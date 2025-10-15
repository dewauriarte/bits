## 🔷 SPRINT 5: Classic Mode - Gameplay (Semanas 9-10)

### 🎯 Objetivos
- ✅ Gameplay completo modo Kahoot (Backend 100%)
- ✅ Preguntas en tiempo real sincronizadas
- ✅ Sistema de scoring con combos
- ✅ Leaderboard en vivo
- ⏳ Frontend UI (pendiente implementación)

### 📦 BACKEND - ✅ COMPLETADO 100%

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
    * ✅ Actualizar stats de quiz (veces_jugado)
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
- [✅] Pantalla entre preguntas
  - ✅ "Get Ready..." / "Prepárate"
  - ✅ Countdown animado 3-2-1
  - ✅ Fade in/out transitions (Framer Motion)
  - ⏳ Sound cue (pendiente audio)

##### Question Screen
- [✅] Componente principal de pregunta
  - ✅ Header:
    - ✅ # Pregunta (1/20)
    - ✅ Timer con progress bar animado
    - ✅ Tu score actual
  - ✅ Pregunta:
    - ✅ Texto grande y claro
    - ✅ Imagen si exists (question.media_url)
  - ✅ Opciones:
    - ✅ 4 botones grandes
    - ✅ Colores sólidos: rojo, azul, amarillo, verde
    - ✅ Hover effects (scale)
    - ✅ Click para seleccionar
    - ✅ Disabled después de responder
  - ✅ Footer:
    - ✅ Combo indicator si >= 3
    - ✅ "Answered!" badge cuando envía

##### Answer Feedback Screen
- [✅] Pantalla de resultado (3-5 seg)
  - ✅ Si CORRECTO:
    - ✅ Grande con animación
    - ✅ Confetti effect
    - ⏳ Sound "ding!" (pendiente audio)
    - ✅ Mostrar puntos ganados:
      ```
      +1000 (base)
      +450 (velocidad ⚡)
      x1.3 (combo 🔥)
      ───────────
      = +1,885 pts
      ```
    - ✅ Combo indicator actualizado
  - ✅ Si INCORRECTO:
    - ✅ con shake animation
    - ⏳ Sound "buzzer" (pendiente audio)
    - ✅ Mostrar respuesta correcta
    - ✅ "Combo perdido" si tenía
  - ⏳ Explicación educativa (pendiente backend)
  - ⏳ Tu posición actual (en leaderboard screen)
  - ✅ Next question in breve...

##### Leaderboard Intermedio
- [✅] Mostrar entre preguntas (5 seg)
  - ✅ Top 5 jugadores
  - ✅ Animated transitions (stagger)
  - ✅ Tu posición destacada (con aproximación)
  - ✅ Cambios (↑ ↓ →) indicadores de tendencia
  - ✅ Scores con formato y colores por ranking

##### Final Results Screen
- [✅] Pantalla de resultados finales
  - ✅ Podium animado:
    - ✅ 🥇 1st place
    - ✅ 🥈 2nd place  
    - ✅ 🥉 3rd place
  - ✅ Tu posición final
  - ✅ Stats:
    - ✅ Score total
    - ✅ Accuracy %
    - ⏳ Combo máximo (en desarrollo)
    - ✅ Preguntas correctas
  - ✅ Recompensas:
    - ✅ XP ganado
    - ✅ Copas ganadas
    - ✅ Gemas ganadas
    - ⏳ Insignias desbloqueadas (pendiente)
  - ⏳ Botón "Ver Leaderboard Completo" (opcional)
  - ✅ Botón "Volver al Inicio"

#### Pantalla Profesor - Control Panel

##### During Game
- [✅] Panel de control en vivo
  - ✅ Header:
    - ✅ Pregunta actual (# y texto)
    - ✅ Timer sincronizado
    - ✅ Progress bar (X/20 preguntas)
  - ✅ Stats en vivo:
    - ✅ Responses: X/Y respondieron
    - ✅ Distribución de respuestas (barras horizontales)
    - ✅ Accuracy actual
  - ✅ Mini leaderboard (Top 10)
  - ✅ Controls:
    - ✅ Botón "Skip Question" (estructura, lógica pendiente)
    - ✅ Botón "Pause Game" (estructura, lógica pendiente)
  - ✅ Feed de eventos:
    - ✅ Sistema de eventos en tiempo real
    - ✅ Últimos 10 eventos visibles

##### After Game
- [✅] Post-Game Dashboard
  - ✅ Leaderboard final completo
    - ✅ Scroll para ver todos
    - ✅ Export a CSV
  - ✅ Análisis por pregunta:
    - ✅ Pregunta más difícil (destacada)
    - ✅ Pregunta más fácil (destacada)
    - ✅ Tiempo promedio por pregunta
    - ✅ Lista completa con stats
  - ✅ Stats de la clase:
    - ✅ Accuracy promedio
    - ✅ Temas a reforzar
    - ✅ Temas dominados
  - ✅ Recomendaciones automáticas (con IA básica)
  - ✅ Acciones:
    - ✅ Enviar resultados a padres (estructura)
    - ✅ Crear quiz de repaso (estructura)
    - ✅ Jugar de nuevo
    - ✅ Copiar para otra clase (estructura)
    

#### Real-time State Management
- [✅] Zustand store para gameplay
  ```typescript
  interface GameStore {
    gameState: 'waiting' | 'countdown' | 'question' | 'feedback' | 'leaderboard' | 'finished';
    currentQuestion: Question | null;
    timeRemaining: number;
    myAnswer: string | string[] | Record<string, string> | null;
    answerResult: AnswerResult | null;
    leaderboard: Player[];
    finalResults: FinalResults | null;
    myScore: number;
    myCombo: number;
    countdown: number;
    // ... acciones + socket listeners
  }
  ```

- [✅] Escuchar eventos WS:
  - ✅ `game:started` → Reset state + countdown 3-2-1
  - ✅ `question:new` → Mostrar pregunta + reset timer
  - ✅ `timer:tick` → Update countdown cada segundo
  - ✅ `question:timeout` → Block answers + auto-feedback
  - ✅ `question:waiting` → Waiting screen
  - ✅ `question:results` → Trigger leaderboard screen
  - ✅ `leaderboard:update` → Update leaderboard en tiempo real
  - ✅ `game:finished` → Pantalla final con resultados
  - ✅ `game:closed` → Manejo de cierre por profesor

#### Testing Frontend
- [ ] Tests de QuestionScreen
- [ ] Tests de AnswerFeedback
- [ ] Tests de Leaderboard updates
- [ ] Tests de score calculations
- [ ] Tests de final results
- [ ] E2E test completo
- [ ] Coverage: 65%+

### ✅ Criterios de Aceptación

- [✅] Profesor inicia juego, countdown en todos (implementado en backend)
- [✅] Primera pregunta sync en todos los clientes (Socket.IO `question:new`)
- [✅] Timer funciona y es sync (`timer:tick` broadcast cada segundo)
- [✅] Estudiante selecciona y envía respuesta (7 tipos implementados)
- [✅] Feedback inmediato (correcto/incorrecto) (AnswerFeedbackScreen)
- [✅] Puntos calculados correctamente (base + velocidad + combo) (scoring.ts)
- [✅] Leaderboard actualiza en tiempo real (`leaderboard:update`)
- [✅] Combo de 3+ muestra indicador (badge de fuego 🔥)
- [✅] Al terminar tiempo, avanza automático (`question:timeout`)
- [✅] Resultados finales muestran rankings correctos (FinalResultsScreen)
- [✅] Recompensas se otorgan (XP, copas guardados) (perfiles_gamer)
- [⏳] No hay lag con 50+ jugadores (pendiente load testing)
- [✅] UI responsive en móvil (Tailwind mobile-first)
- [⏳] Tests passing (pendiente implementar tests)

### 📈 Métricas de Éxito

- Juego de 20 preguntas toma ~10-15 min
- 0 errores de sincronización
- Latency < 50ms para answer submit
- 95%+ mensajes WS entregados
- 0 crashes durante gameplay
- FPS > 30 en animaciones

---
