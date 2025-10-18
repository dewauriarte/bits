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