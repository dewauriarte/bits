-- ============================================
-- APPQUIZ - BASE DE DATOS COMPLETA V2.0
-- Sistema de Quizzes Educativos Gamificados
-- ============================================

-- ============================================
-- USUARIOS Y AUTENTICACIÓN
-- ============================================

CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  rol VARCHAR(20) CHECK (rol IN ('admin', 'profesor', 'estudiante')) NOT NULL,
  avatar_url VARCHAR(255),
  fecha_nacimiento DATE,
  estado VARCHAR(20) CHECK (estado IN ('activo', 'inactivo', 'suspendido')) DEFAULT 'activo',
  ultimo_login TIMESTAMP,
  fecha_creacion TIMESTAMP DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP DEFAULT NOW(),

  -- Sistema de login para estudiantes
  tipo_auth VARCHAR(20) CHECK (tipo_auth IN ('email', 'username', 'avatar', 'temporal')) DEFAULT 'email'
);

COMMENT ON COLUMN usuarios.email IS 'Email OPCIONAL - Solo requerido para admin/profesor';
COMMENT ON COLUMN usuarios.tipo_auth IS 'Método de autenticación: email (admin/profesor), username (estudiante permanente), avatar (inicial), temporal';

-- ============================================
-- GRADOS Y ORGANIZACIÓN ACADÉMICA
-- ============================================

CREATE TABLE grados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(100) NOT NULL, -- "Inicial 3 años", "1er Grado", etc.
  nivel VARCHAR(50) NOT NULL, -- "Inicial", "Primaria", "Secundaria"
  orden INT NOT NULL, -- Para ordenar
  config_ui JSONB, -- Configuración de interfaz por edad
  fecha_creacion TIMESTAMP DEFAULT NOW()
);

CREATE TABLE materias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(100) NOT NULL,
  icono VARCHAR(50),
  color VARCHAR(20),
  descripcion TEXT,
  fecha_creacion TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- CLASES Y LISTAS
-- ============================================

CREATE TABLE clases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(100) NOT NULL,
  codigo VARCHAR(10) UNIQUE NOT NULL, -- Para unirse
  profesor_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  grado_id UUID REFERENCES grados(id),
  materia_id UUID REFERENCES materias(id),
  anio_escolar VARCHAR(20), -- "2024-2025"
  descripcion TEXT,
  color VARCHAR(20),
  activo BOOLEAN DEFAULT true,
  fecha_creacion TIMESTAMP DEFAULT NOW()
);

CREATE TABLE clase_estudiantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clase_id UUID REFERENCES clases(id) ON DELETE CASCADE,
  estudiante_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  fecha_inscripcion TIMESTAMP DEFAULT NOW(),
  estado VARCHAR(20) DEFAULT 'activo',
  UNIQUE(clase_id, estudiante_id)
);

-- ============================================
-- SISTEMA DE LOGIN PARA ESTUDIANTES
-- ============================================

-- Avatares para niños de inicial (3-6 años)
CREATE TABLE avatares_clase (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clase_id UUID REFERENCES clases(id) ON DELETE CASCADE,
  estudiante_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,

  -- Avatar visual
  emoji VARCHAR(10) NOT NULL,
  color VARCHAR(20),
  nombre_avatar VARCHAR(50),

  -- Orden de visualización
  posicion INT NOT NULL,

  -- Estado
  asignado BOOLEAN DEFAULT false,
  activo BOOLEAN DEFAULT true,

  fecha_creacion TIMESTAMP DEFAULT NOW(),
  fecha_asignacion TIMESTAMP,

  UNIQUE(clase_id, posicion)
);

COMMENT ON TABLE avatares_clase IS 'Avatares visuales para niños de inicial (3-6 años) - Login sin escribir';

-- Participantes temporales (sin registro previo)
CREATE TABLE participantes_temporales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sala_id UUID REFERENCES salas(id) ON DELETE CASCADE,

  -- Identificación temporal
  nombre VARCHAR(100) NOT NULL,
  nickname VARCHAR(100),

  -- Método de acceso usado
  metodo_acceso VARCHAR(20) CHECK (metodo_acceso IN (
    'codigo_pin', 'qr_code', 'link_directo', 'avatar'
  )) NOT NULL,

  -- Token temporal de sesión
  session_token TEXT UNIQUE,

  -- Datos de sesión
  ip_address VARCHAR(45),
  user_agent TEXT,

  -- Si luego se registra, vincular
  usuario_registrado_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,

  -- Estado
  activo BOOLEAN DEFAULT true,
  fecha_entrada TIMESTAMP DEFAULT NOW(),
  fecha_salida TIMESTAMP
);

COMMENT ON TABLE participantes_temporales IS 'Estudiantes que se unen temporalmente sin cuenta (código PIN, QR, link)';

-- Historial de login por método
CREATE TABLE login_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  participante_temporal_id UUID REFERENCES participantes_temporales(id) ON DELETE CASCADE,

  -- Método usado
  metodo_login VARCHAR(30) CHECK (metodo_login IN (
    'email_password',
    'username_password',
    'codigo_pin',
    'qr_code',
    'link_directo',
    'avatar'
  )) NOT NULL,

  -- Datos de sesión
  ip_address VARCHAR(45),
  user_agent TEXT,
  device_type VARCHAR(20),

  -- Contexto
  clase_id UUID REFERENCES clases(id) ON DELETE SET NULL,
  sala_id UUID REFERENCES salas(id) ON DELETE SET NULL,

  -- Estado
  exitoso BOOLEAN DEFAULT true,
  mensaje_error TEXT,

  fecha_login TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE login_history IS 'Historial de logins con todos los métodos soportados';

-- ============================================
-- PERFIL GAMER Y PROGRESO (SIN ECONOMÍA)
-- ============================================

CREATE TABLE perfiles_gamer (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE UNIQUE,

  -- Progresión
  nivel INT DEFAULT 1,
  experiencia INT DEFAULT 0,
  puntos_totales BIGINT DEFAULT 0,

  -- Logros
  copas INT DEFAULT 0,
  trofeos_oro INT DEFAULT 0,
  trofeos_plata INT DEFAULT 0,
  trofeos_bronce INT DEFAULT 0,

  -- Personalización
  avatar_personalizado JSONB,
  titulo_actual VARCHAR(100),
  color_favorito VARCHAR(20),

  -- Estadísticas globales
  estadisticas JSONB DEFAULT '{
    "juegos_jugados": 0,
    "victorias": 0,
    "podios": 0,
    "preguntas_respondidas": 0,
    "preguntas_correctas": 0,
    "tiempo_total_minutos": 0,
    "mejor_posicion": 0,
    "estrellas_totales": 0,
    "duelos_ganados": 0,
    "duelos_perdidos": 0
  }',

  fecha_creacion TIMESTAMP DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP DEFAULT NOW()
);

CREATE TABLE insignias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  icono VARCHAR(255),
  rareza VARCHAR(20) CHECK (rareza IN ('comun', 'raro', 'epico', 'legendario')),

  -- Criterio de desbloqueo
  criterio JSONB NOT NULL,
  -- Ejemplo: {
  --   "tipo": "victorias",
  --   "cantidad": 10
  -- }

  -- Recompensas
  recompensa_experiencia INT DEFAULT 0,

  activo BOOLEAN DEFAULT true,
  fecha_creacion TIMESTAMP DEFAULT NOW()
);

CREATE TABLE usuario_insignias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  insignia_id UUID REFERENCES insignias(id) ON DELETE CASCADE,
  fecha_obtencion TIMESTAMP DEFAULT NOW(),
  progreso JSONB,
  UNIQUE(usuario_id, insignia_id)
);

-- ============================================
-- QUIZZES Y PREGUNTAS
-- ============================================

CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo VARCHAR(200) NOT NULL,
  descripcion TEXT,
  creador_id UUID REFERENCES usuarios(id),
  materia_id UUID REFERENCES materias(id),
  grado_id UUID REFERENCES grados(id),

  -- Categorización
  tags TEXT[], -- ['geometria', 'ecuaciones', 'algebra']
  palabras_clave TEXT[],
  imagen_portada VARCHAR(255),

  -- Configuración
  tipo_quiz VARCHAR(30) CHECK (tipo_quiz IN (
    'kahoot', 'mario_party', 'examen',
    'batalla_equipos', 'practica'
  )) DEFAULT 'kahoot',

  dificultad VARCHAR(20) CHECK (dificultad IN ('muy_facil', 'facil', 'medio', 'dificil', 'muy_dificil')),

  -- Puntuación
  puntos_base INT DEFAULT 1000,
  bonificacion_velocidad BOOLEAN DEFAULT true,
  bonificacion_combo BOOLEAN DEFAULT true,

  -- Tiempo
  tiempo_total_minutos INT,
  tiempo_por_pregunta INT DEFAULT 20,
  duracion_estimada_minutos INT,

  -- Origen del contenido
  origen VARCHAR(50) CHECK (origen IN ('manual', 'ia_texto', 'ia_pdf', 'ia_video', 'ia_audio', 'importado')),
  metadatos_origen JSONB,

  -- Estado
  estado VARCHAR(20) CHECK (estado IN ('borrador', 'publicado', 'archivado')) DEFAULT 'borrador',
  publico BOOLEAN DEFAULT false,

  -- Configuración adicional
  configuracion JSONB DEFAULT '{
    "mostrar_ranking": true,
    "mostrar_respuestas": true,
    "permitir_repetir": true,
    "tiempo_congelamiento": 5,
    "musica_fondo": true
  }',

  -- Estadísticas
  veces_jugado INT DEFAULT 0,
  promedio_acierto DECIMAL(5,2),

  fecha_creacion TIMESTAMP DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP DEFAULT NOW()
);

CREATE TABLE preguntas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  orden INT NOT NULL,

  -- Contenido
  texto TEXT NOT NULL,
  imagen_url VARCHAR(255),
  video_url VARCHAR(255),
  audio_url VARCHAR(255),

  -- Tipo y configuración
  tipo VARCHAR(30) CHECK (tipo IN (
    'multiple_choice', 'multiple_select', 'true_false',
    'short_answer', 'fill_blank', 'order_sequence',
    'match_columns'
  )) DEFAULT 'multiple_choice',

  -- Opciones y respuestas
  opciones JSONB NOT NULL,
  respuesta_correcta JSONB,

  -- Puntuación
  puntos INT DEFAULT 1000,
  tiempo_limite INT DEFAULT 20,

  -- Feedback
  explicacion TEXT,
  imagen_explicacion VARCHAR(255),

  -- Estadísticas
  veces_respondida INT DEFAULT 0,
  veces_correcta INT DEFAULT 0,

  fecha_creacion TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- SALAS Y PARTIDAS
-- ============================================

CREATE TABLE salas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(8) UNIQUE NOT NULL, -- PIN de acceso
  quiz_id UUID REFERENCES quizzes(id),
  profesor_id UUID REFERENCES usuarios(id),
  clase_id UUID REFERENCES clases(id),

  -- Configuración de la sala
  tipo_sala VARCHAR(30) CHECK (tipo_sala IN (
    'kahoot', 'mario_party', 'examen',
    'batalla_equipos', 'practica'
  )) NOT NULL,

  modo_acceso VARCHAR(20) CHECK (modo_acceso IN ('abierto', 'cerrado')) DEFAULT 'abierto',

  -- Estado
  estado VARCHAR(20) CHECK (estado IN (
    'esperando', 'en_curso', 'pausado', 'finalizado'
  )) DEFAULT 'esperando',

  -- Configuración específica
  config_juego JSONB DEFAULT '{}',

  -- Control de tiempo
  fecha_inicio TIMESTAMP,
  fecha_fin TIMESTAMP,

  -- Pregunta actual
  pregunta_actual_index INT DEFAULT 0,
  tiempo_inicio_pregunta TIMESTAMP,

  fecha_creacion TIMESTAMP DEFAULT NOW(),

  -- Sistema de acceso extendido (QR, Links)
  qr_token TEXT,
  qr_url VARCHAR(255),
  join_url VARCHAR(255),
  permite_invitados BOOLEAN DEFAULT true,
  max_participantes INT
);

COMMENT ON TABLE salas IS 'Salas de juego en tiempo real con múltiples métodos de acceso';

CREATE TABLE sala_participantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sala_id UUID REFERENCES salas(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES usuarios(id),

  -- Identificación en sala
  nickname VARCHAR(100),
  avatar VARCHAR(100),

  -- Para batalla de equipos
  equipo_id UUID, -- Cambiado a UUID para referencia

  -- Estado de conexión
  estado VARCHAR(20) CHECK (estado IN (
    'conectado', 'desconectado', 'finalizado'
  )) DEFAULT 'conectado',

  -- Tracking de conexión
  ultimo_ping TIMESTAMP DEFAULT NOW(),
  ultimo_heartbeat TIMESTAMP,
  latencia_ms INT,
  dispositivo VARCHAR(50), -- 'mobile', 'tablet', 'desktop'
  navegador VARCHAR(50),

  -- Progreso en tiempo real
  puntos_actuales INT DEFAULT 0,
  respuestas_correctas INT DEFAULT 0,
  respuestas_incorrectas INT DEFAULT 0,
  racha_actual INT DEFAULT 0,
  racha_maxima INT DEFAULT 0,

  -- Para Mario Party
  posicion_tablero INT DEFAULT 0,
  estrellas INT DEFAULT 0,
  items_especiales JSONB DEFAULT '[]',

  fecha_union TIMESTAMP DEFAULT NOW()
);

CREATE TABLE sala_respuestas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sala_id UUID REFERENCES salas(id) ON DELETE CASCADE,
  participante_id UUID REFERENCES sala_participantes(id) ON DELETE CASCADE,
  pregunta_id UUID REFERENCES preguntas(id),

  -- Respuesta
  respuesta JSONB NOT NULL,
  correcta BOOLEAN NOT NULL,

  -- Métricas de tiempo
  tiempo_respuesta_ms INT NOT NULL,
  timestamp_respuesta TIMESTAMP DEFAULT NOW(),

  -- Puntuación
  puntos_base INT,
  puntos_velocidad INT,
  multiplicador INT DEFAULT 1,
  puntos_totales INT,

  -- Contexto
  racha_al_momento INT,
  posicion_al_momento INT
);

-- ============================================
-- MODO MARIO PARTY
-- ============================================

CREATE TABLE tableros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(100) NOT NULL,
  tema VARCHAR(50), -- "selva", "espacio", "oceano", "ciudad"
  total_casillas INT NOT NULL,

  -- Configuración de casillas
  config_casillas JSONB NOT NULL,

  -- Visualización
  imagen_preview VARCHAR(255),

  -- Configuración de estrellas
  posiciones_estrellas INT[] DEFAULT ARRAY[13, 26],

  activo BOOLEAN DEFAULT true,
  fecha_creacion TIMESTAMP DEFAULT NOW()
);

CREATE TABLE mario_party_estado (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sala_id UUID REFERENCES salas(id) ON DELETE CASCADE UNIQUE,
  tablero_id UUID REFERENCES tableros(id),

  -- Estado del juego
  ronda_actual INT DEFAULT 1,
  rondas_totales INT DEFAULT 15,
  jugador_turno_id UUID REFERENCES sala_participantes(id),

  -- Estrellas disponibles
  estrellas_disponibles JSONB DEFAULT '[
    {"posicion": 13, "activa": true},
    {"posicion": 26, "activa": true}
  ]',

  -- Eventos especiales activos
  eventos_activos JSONB DEFAULT '[]',

  fecha_creacion TIMESTAMP DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP DEFAULT NOW()
);

CREATE TABLE mario_party_eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sala_id UUID REFERENCES salas(id) ON DELETE CASCADE,
  participante_id UUID REFERENCES sala_participantes(id),
  ronda INT NOT NULL,

  tipo_evento VARCHAR(50) CHECK (tipo_evento IN (
    'lanzar_dado', 'mover_ficha', 'caer_casilla',
    'responder_pregunta', 'ganar_estrella', 'duelo',
    'evento_sorpresa', 'intercambio_posicion',
    'avanzar_extra', 'retroceder'
  )) NOT NULL,

  detalles JSONB NOT NULL,

  fecha_creacion TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- MODO BATALLA DE EQUIPOS
-- ============================================

CREATE TABLE equipos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sala_id UUID REFERENCES salas(id) ON DELETE CASCADE,

  nombre VARCHAR(100) NOT NULL,
  color VARCHAR(20) NOT NULL, -- "rojo", "azul", "verde", "amarillo"
  icono VARCHAR(50),

  -- Puntuación del equipo
  puntos_totales INT DEFAULT 0,
  respuestas_correctas INT DEFAULT 0,
  respuestas_incorrectas INT DEFAULT 0,
  porcentaje_acierto DECIMAL(5,2) DEFAULT 0,

  -- Ranking
  posicion_final INT,

  fecha_creacion TIMESTAMP DEFAULT NOW()
);

-- Agregar constraint para equipo_id en sala_participantes
ALTER TABLE sala_participantes
  ADD CONSTRAINT fk_equipo
  FOREIGN KEY (equipo_id)
  REFERENCES equipos(id)
  ON DELETE SET NULL;

CREATE TABLE equipo_miembros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipo_id UUID REFERENCES equipos(id) ON DELETE CASCADE,
  participante_id UUID REFERENCES sala_participantes(id) ON DELETE CASCADE,

  -- Contribución individual
  puntos_aportados INT DEFAULT 0,
  respuestas_correctas INT DEFAULT 0,
  respuestas_incorrectas INT DEFAULT 0,

  es_capitan BOOLEAN DEFAULT false,

  fecha_union TIMESTAMP DEFAULT NOW(),
  UNIQUE(equipo_id, participante_id)
);

CREATE TABLE preguntas_colaborativas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sala_id UUID REFERENCES salas(id) ON DELETE CASCADE,
  pregunta_id UUID REFERENCES preguntas(id),
  equipo_id UUID REFERENCES equipos(id),

  -- Votación del equipo
  votos JSONB DEFAULT '{}',

  respuesta_final VARCHAR(10), -- La opción con más votos
  correcta BOOLEAN,

  tiempo_decision_segundos INT,
  puntos_ganados INT DEFAULT 0,

  fecha_inicio TIMESTAMP DEFAULT NOW(),
  fecha_decision TIMESTAMP
);

-- ============================================
-- RESULTADOS Y ESTADÍSTICAS (SIN ECONOMÍA)
-- ============================================

CREATE TABLE resultados_finales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sala_id UUID REFERENCES salas(id) ON DELETE CASCADE,
  participante_id UUID REFERENCES sala_participantes(id) ON DELETE CASCADE,

  -- Puntuación final
  puntos_totales INT NOT NULL,
  posicion INT NOT NULL,

  -- Estadísticas detalladas
  preguntas_respondidas INT,
  respuestas_correctas INT,
  respuestas_incorrectas INT,
  porcentaje_acierto DECIMAL(5,2),

  -- Tiempo
  tiempo_promedio_respuesta INT, -- Segundos
  tiempo_total_juego INT, -- Segundos

  -- Recompensas (Solo XP y copas)
  experiencia_ganada INT DEFAULT 0,
  copas_ganadas INT DEFAULT 0, -- 1er = 3, 2do = 2, 3ro = 1
  trofeo_tipo VARCHAR(20), -- 'oro', 'plata', 'bronce', null

  -- Insignias desbloqueadas
  insignias_desbloqueadas JSONB DEFAULT '[]',

  fecha_creacion TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- NOTIFICACIONES
-- ============================================

CREATE TABLE notificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,

  tipo VARCHAR(50) CHECK (tipo IN (
    'insignia_desbloqueada',
    'nueva_clase', 'invitacion_sala', 'resultado_quiz',
    'mensaje_profesor', 'logro', 'nivel_subido'
  )) NOT NULL,

  titulo VARCHAR(200) NOT NULL,
  mensaje TEXT NOT NULL,
  icono VARCHAR(50),

  -- Metadata adicional
  data JSONB DEFAULT '{}',

  -- URL de acción
  action_url VARCHAR(255),

  -- Estado
  leida BOOLEAN DEFAULT false,
  fecha_leida TIMESTAMP,

  fecha_creacion TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- CONFIGURACIÓN Y LOGS
-- ============================================

CREATE TABLE configuracion_sistema (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clave VARCHAR(100) UNIQUE NOT NULL,
  valor JSONB NOT NULL,
  descripcion TEXT,
  fecha_actualizacion TIMESTAMP DEFAULT NOW()
);

CREATE TABLE logs_ia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuarios(id),
  tipo_operacion VARCHAR(50) NOT NULL,
  prompt TEXT,
  respuesta JSONB,
  tokens_usados INT,
  costo_estimado DECIMAL(10,4),
  tiempo_procesamiento_ms INT,
  proveedor VARCHAR(50), -- 'claude', 'openai', 'gemini'
  modelo VARCHAR(50),
  exitoso BOOLEAN,
  error TEXT,
  fecha_creacion TIMESTAMP DEFAULT NOW()
);

CREATE TABLE logs_actividad (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuarios(id),
  tipo_evento VARCHAR(50) NOT NULL,
  descripcion TEXT,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  fecha_creacion TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================

-- Usuarios
CREATE INDEX idx_usuarios_rol ON usuarios(rol);
CREATE INDEX idx_usuarios_estado ON usuarios(estado);
CREATE INDEX idx_usuarios_email ON usuarios(email);

-- Clases
CREATE INDEX idx_clases_profesor ON clases(profesor_id);
CREATE INDEX idx_clases_codigo ON clases(codigo);
CREATE INDEX idx_clase_estudiantes_clase ON clase_estudiantes(clase_id);
CREATE INDEX idx_clase_estudiantes_estudiante ON clase_estudiantes(estudiante_id);

-- Quizzes
CREATE INDEX idx_quizzes_creador ON quizzes(creador_id);
CREATE INDEX idx_quizzes_estado ON quizzes(estado);
CREATE INDEX idx_quizzes_tipo ON quizzes(tipo_quiz);
CREATE INDEX idx_quizzes_tags ON quizzes USING gin(tags);
CREATE INDEX idx_preguntas_quiz ON preguntas(quiz_id);

-- Salas
CREATE INDEX idx_salas_codigo ON salas(codigo);
CREATE INDEX idx_salas_estado ON salas(estado);
CREATE INDEX idx_salas_profesor ON salas(profesor_id);
CREATE INDEX idx_sala_participantes_sala ON sala_participantes(sala_id);
CREATE INDEX idx_sala_participantes_usuario ON sala_participantes(usuario_id);
CREATE INDEX idx_sala_respuestas_participante ON sala_respuestas(participante_id);

-- Equipos
CREATE INDEX idx_equipos_sala ON equipos(sala_id);
CREATE INDEX idx_equipo_miembros_equipo ON equipo_miembros(equipo_id);

-- Resultados
CREATE INDEX idx_resultados_sala ON resultados_finales(sala_id);
CREATE INDEX idx_resultados_participante ON resultados_finales(participante_id);

-- Notificaciones
CREATE INDEX idx_notificaciones_usuario ON notificaciones(usuario_id);
CREATE INDEX idx_notificaciones_leida ON notificaciones(leida);
CREATE INDEX idx_notificaciones_tipo ON notificaciones(tipo);

-- Logs
CREATE INDEX idx_logs_ia_usuario ON logs_ia(usuario_id);
CREATE INDEX idx_logs_ia_fecha ON logs_ia(fecha_creacion);
CREATE INDEX idx_logs_actividad_usuario ON logs_actividad(usuario_id);
CREATE INDEX idx_logs_actividad_tipo ON logs_actividad(tipo_evento);

-- Login de estudiantes
CREATE INDEX idx_avatares_clase_clase ON avatares_clase(clase_id);
CREATE INDEX idx_avatares_clase_estudiante ON avatares_clase(estudiante_id);
CREATE INDEX idx_participantes_sala ON participantes_temporales(sala_id);
CREATE INDEX idx_participantes_token ON participantes_temporales(session_token);
CREATE INDEX idx_login_history_usuario ON login_history(usuario_id);
CREATE INDEX idx_login_history_fecha ON login_history(fecha_login);

-- ============================================
-- FUNCIONES Y TRIGGERS ÚTILES
-- ============================================

-- Función para actualizar fecha_actualizacion automáticamente
CREATE OR REPLACE FUNCTION actualizar_fecha_actualizacion()
RETURNS TRIGGER AS $$
BEGIN
  NEW.fecha_actualizacion = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para usuarios
CREATE TRIGGER trg_usuarios_actualizacion
BEFORE UPDATE ON usuarios
FOR EACH ROW
EXECUTE FUNCTION actualizar_fecha_actualizacion();

-- Trigger para quizzes
CREATE TRIGGER trg_quizzes_actualizacion
BEFORE UPDATE ON quizzes
FOR EACH ROW
EXECUTE FUNCTION actualizar_fecha_actualizacion();

-- Trigger para perfiles_gamer
CREATE TRIGGER trg_perfiles_actualizacion
BEFORE UPDATE ON perfiles_gamer
FOR EACH ROW
EXECUTE FUNCTION actualizar_fecha_actualizacion();

-- ============================================
-- FUNCIONES PARA LOGIN DE ESTUDIANTES
-- ============================================

-- Función para generar avatares por defecto para una clase
CREATE OR REPLACE FUNCTION generar_avatares_clase(p_clase_id UUID)
RETURNS void AS $$
DECLARE
  avatares_data JSONB := '[
    {"emoji": "🐱", "color": "Rosa", "nombre": "Gatita Rosa"},
    {"emoji": "🦁", "color": "Amarillo", "nombre": "León Amarillo"},
    {"emoji": "🐼", "color": "Blanco", "nombre": "Osito Panda"},
    {"emoji": "🐨", "color": "Gris", "nombre": "Koala Gris"},
    {"emoji": "🦊", "color": "Naranja", "nombre": "Zorrito Naranja"},
    {"emoji": "🐸", "color": "Verde", "nombre": "Ranita Verde"},
    {"emoji": "🐰", "color": "Blanco", "nombre": "Conejito Blanco"},
    {"emoji": "🐯", "color": "Naranja", "nombre": "Tigre Naranja"},
    {"emoji": "🐵", "color": "Café", "nombre": "Monito Café"},
    {"emoji": "🐶", "color": "Café", "nombre": "Perrito Café"},
    {"emoji": "🦉", "color": "Café", "nombre": "Búho Café"},
    {"emoji": "🐷", "color": "Rosa", "nombre": "Cerdito Rosa"},
    {"emoji": "🐮", "color": "Blanco", "nombre": "Vaquita Blanca"},
    {"emoji": "🐔", "color": "Amarillo", "nombre": "Pollito Amarillo"},
    {"emoji": "🐧", "color": "Negro", "nombre": "Pingüino Negro"},
    {"emoji": "🦋", "color": "Azul", "nombre": "Mariposa Azul"},
    {"emoji": "🐝", "color": "Amarillo", "nombre": "Abejita Amarilla"},
    {"emoji": "🐢", "color": "Verde", "nombre": "Tortuga Verde"},
    {"emoji": "🦈", "color": "Azul", "nombre": "Tiburón Azul"},
    {"emoji": "🦄", "color": "Rosa", "nombre": "Unicornio Rosa"}
  ]'::jsonb;
  avatar_data JSONB;
  i INT := 1;
BEGIN
  FOR avatar_data IN SELECT * FROM jsonb_array_elements(avatares_data)
  LOOP
    INSERT INTO avatares_clase (
      clase_id,
      emoji,
      color,
      nombre_avatar,
      posicion,
      asignado,
      activo
    ) VALUES (
      p_clase_id,
      avatar_data->>'emoji',
      avatar_data->>'color',
      avatar_data->>'nombre',
      i,
      false,
      true
    );
    i := i + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Función para generar código de sala único
CREATE OR REPLACE FUNCTION generar_codigo_sala()
RETURNS VARCHAR(8) AS $$
DECLARE
  caracteres TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  codigo VARCHAR(8) := '';
  i INT;
  existe BOOLEAN;
BEGIN
  LOOP
    codigo := '';
    FOR i IN 1..6 LOOP
      codigo := codigo || substr(caracteres, floor(random() * length(caracteres) + 1)::int, 1);
    END LOOP;

    SELECT EXISTS(SELECT 1 FROM salas WHERE codigo = codigo AND estado != 'finalizado') INTO existe;

    EXIT WHEN NOT existe;
  END LOOP;

  RETURN codigo;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- DATOS INICIALES (SEED)
-- ============================================

-- Insertar grados básicos
INSERT INTO grados (nombre, nivel, orden) VALUES
('Inicial 3 años', 'Inicial', 1),
('Inicial 4 años', 'Inicial', 2),
('Inicial 5 años', 'Inicial', 3),
('1er Grado', 'Primaria', 4),
('2do Grado', 'Primaria', 5),
('3er Grado', 'Primaria', 6),
('4to Grado', 'Primaria', 7),
('5to Grado', 'Primaria', 8),
('6to Grado', 'Primaria', 9),
('1ro Secundaria', 'Secundaria', 10),
('2do Secundaria', 'Secundaria', 11),
('3ro Secundaria', 'Secundaria', 12),
('4to Secundaria', 'Secundaria', 13),
('5to Secundaria', 'Secundaria', 14);

-- Insertar materias básicas
INSERT INTO materias (nombre, icono, color) VALUES
('Matemáticas', 'calculator', '#3B82F6'),
('Lenguaje', 'book', '#10B981'),
('Ciencias', 'flask', '#8B5CF6'),
('Historia', 'scroll', '#F59E0B'),
('Geografía', 'globe', '#06B6D4'),
('Inglés', 'language', '#EF4444'),
('Arte', 'palette', '#EC4899'),
('Educación Física', 'sports', '#14B8A6'),
('Música', 'music', '#A855F7'),
('Computación', 'computer', '#6366F1');

-- Tablero ejemplo para Mario Party
INSERT INTO tableros (nombre, tema, total_casillas, config_casillas, posiciones_estrellas) VALUES
('Aventura en la Selva', 'selva', 35,
'[
  {"posicion": 0, "tipo": "inicio", "icono": "flag"},
  {"posicion": 1, "tipo": "normal", "icono": "circle"},
  {"posicion": 2, "tipo": "pregunta", "icono": "question"},
  {"posicion": 3, "tipo": "normal", "icono": "circle"},
  {"posicion": 4, "tipo": "normal", "icono": "circle"},
  {"posicion": 5, "tipo": "evento", "icono": "gift"},
  {"posicion": 6, "tipo": "normal", "icono": "circle"},
  {"posicion": 7, "tipo": "pregunta", "icono": "question"},
  {"posicion": 8, "tipo": "normal", "icono": "circle"},
  {"posicion": 9, "tipo": "normal", "icono": "circle"},
  {"posicion": 10, "tipo": "trampa", "icono": "warning"},
  {"posicion": 11, "tipo": "pregunta", "icono": "question"},
  {"posicion": 12, "tipo": "normal", "icono": "circle"},
  {"posicion": 13, "tipo": "estrella", "icono": "star"},
  {"posicion": 14, "tipo": "normal", "icono": "circle"},
  {"posicion": 15, "tipo": "gema", "icono": "gem"},
  {"posicion": 16, "tipo": "normal", "icono": "circle"},
  {"posicion": 17, "tipo": "pregunta", "icono": "question"},
  {"posicion": 18, "tipo": "normal", "icono": "circle"},
  {"posicion": 19, "tipo": "evento", "icono": "gift"},
  {"posicion": 20, "tipo": "normal", "icono": "circle"},
  {"posicion": 21, "tipo": "pregunta", "icono": "question"},
  {"posicion": 22, "tipo": "normal", "icono": "circle"},
  {"posicion": 23, "tipo": "trampa", "icono": "warning"},
  {"posicion": 24, "tipo": "normal", "icono": "circle"},
  {"posicion": 25, "tipo": "pregunta", "icono": "question"},
  {"posicion": 26, "tipo": "estrella", "icono": "star"},
  {"posicion": 27, "tipo": "normal", "icono": "circle"},
  {"posicion": 28, "tipo": "normal", "icono": "circle"},
  {"posicion": 29, "tipo": "gema", "icono": "gem"},
  {"posicion": 30, "tipo": "normal", "icono": "circle"},
  {"posicion": 31, "tipo": "pregunta", "icono": "question"},
  {"posicion": 32, "tipo": "normal", "icono": "circle"},
  {"posicion": 33, "tipo": "evento", "icono": "gift"},
  {"posicion": 34, "tipo": "normal", "icono": "circle"},
  {"posicion": 35, "tipo": "meta", "icono": "flag"}
]'::jsonb,
ARRAY[13, 26]);

-- Configuraciones del sistema
INSERT INTO configuracion_sistema (clave, valor, descripcion) VALUES
('xp_por_nivel', '{"base": 100, "multiplicador": 1.5}'::jsonb, 'XP necesaria por nivel'),
('copas_por_posicion', '{"1": 3, "2": 2, "3": 1}'::jsonb, 'Copas según posición');

-- ============================================
-- VISTAS ÚTILES
-- ============================================

-- Vista de estudiantes con su progreso
CREATE VIEW vista_estudiantes_progreso AS
SELECT
  u.id,
  u.username,
  u.nombre,
  u.apellido,
  u.avatar_url,
  pg.nivel,
  pg.experiencia,
  pg.puntos_totales,
  pg.copas,
  pg.estadisticas,
  COUNT(DISTINCT ce.clase_id) as total_clases,
  COUNT(DISTINCT ui.insignia_id) as total_insignias
FROM usuarios u
LEFT JOIN perfiles_gamer pg ON u.id = pg.usuario_id
LEFT JOIN clase_estudiantes ce ON u.id = ce.estudiante_id
LEFT JOIN usuario_insignias ui ON u.id = ui.usuario_id
WHERE u.rol = 'estudiante'
GROUP BY u.id, pg.nivel, pg.experiencia, pg.puntos_totales,
         pg.copas, pg.estadisticas;

-- Vista de quizzes con estadísticas
CREATE VIEW vista_quizzes_stats AS
SELECT
  q.id,
  q.titulo,
  q.tipo_quiz,
  q.dificultad,
  q.estado,
  m.nombre as materia,
  g.nombre as grado,
  u.nombre || ' ' || u.apellido as creador,
  COUNT(DISTINCT p.id) as total_preguntas,
  q.veces_jugado,
  q.promedio_acierto,
  q.fecha_creacion
FROM quizzes q
LEFT JOIN materias m ON q.materia_id = m.id
LEFT JOIN grados g ON q.grado_id = g.id
LEFT JOIN usuarios u ON q.creador_id = u.id
LEFT JOIN preguntas p ON q.id = p.quiz_id
GROUP BY q.id, m.nombre, g.nombre, u.nombre, u.apellido;

-- Vista de estudiantes por clase con su método de login
CREATE VIEW v_estudiantes_clase AS
SELECT
  ce.clase_id,
  c.nombre AS clase_nombre,
  u.id AS estudiante_id,
  u.username,
  u.nombre,
  u.apellido,
  u.tipo_auth,
  u.avatar_url,
  CASE
    WHEN u.tipo_auth = 'avatar' THEN ac.emoji
    ELSE NULL
  END AS avatar_emoji,
  CASE
    WHEN u.tipo_auth = 'avatar' THEN ac.nombre_avatar
    ELSE NULL
  END AS avatar_nombre,
  ce.fecha_inscripcion
FROM clase_estudiantes ce
JOIN usuarios u ON ce.estudiante_id = u.id
JOIN clases c ON ce.clase_id = c.id
LEFT JOIN avatares_clase ac ON ac.estudiante_id = u.id AND ac.clase_id = ce.clase_id
WHERE ce.estado = 'activo'
ORDER BY c.nombre, u.nombre;

-- Vista de participación en salas (permanentes + temporales)
CREATE VIEW v_participantes_salas AS
SELECT
  s.id AS sala_id,
  s.codigo AS sala_codigo,
  COALESCE(u.id, pt.id) AS participante_id,
  COALESCE(u.nombre || ' ' || u.apellido, pt.nombre) AS participante_nombre,
  CASE
    WHEN u.id IS NOT NULL THEN 'registrado'
    ELSE 'temporal'
  END AS tipo_participante,
  COALESCE(
    CASE
      WHEN u.tipo_auth = 'email' THEN 'email'
      WHEN u.tipo_auth = 'username' THEN 'username'
      WHEN u.tipo_auth = 'avatar' THEN 'avatar'
    END,
    pt.metodo_acceso
  ) AS metodo_acceso
FROM salas s
LEFT JOIN sala_participantes sp ON s.id = sp.sala_id
LEFT JOIN usuarios u ON sp.usuario_id = u.id
LEFT JOIN participantes_temporales pt ON s.id = pt.sala_id;

-- ============================================
-- COMENTARIOS EN TABLAS
-- ============================================

COMMENT ON TABLE usuarios IS 'Usuarios del sistema con sus roles';
COMMENT ON TABLE perfiles_gamer IS 'Perfil de gamificación sin economía virtual';
COMMENT ON TABLE salas IS 'Salas de juego en tiempo real';
COMMENT ON TABLE equipos IS 'Equipos para modo batalla';
COMMENT ON TABLE tableros IS 'Tableros configurables para Mario Party';
COMMENT ON TABLE notificaciones IS 'Sistema de notificaciones push';

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
