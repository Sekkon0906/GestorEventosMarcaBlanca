-- ============================================================
--  GestorEventosMarcaBlanca — Migración Completa v2.0
--  Esquema 100 % alineado con el código fuente del API.
--
--  Instrucciones:
--    Supabase Dashboard → SQL Editor → New query → pegar y ejecutar.
--    O usar: psql $DATABASE_URL -f migration_v2_completa.sql
--
--  Contraseña usuarios de prueba: Demo2026!
-- ============================================================


-- ============================================================
--  0. EXTENSIONES
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================================
--  1. TIPOS ENUM
-- ============================================================

-- Roles del sistema (admin_global es el rol con acceso total)
DO $$ BEGIN
  CREATE TYPE rol_usuario AS ENUM ('admin_global', 'organizador', 'asistente');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Modalidad de realización del evento
DO $$ BEGIN
  CREATE TYPE modalidad_evento AS ENUM ('fisico', 'virtual', 'hibrido');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Visibilidad del evento
DO $$ BEGIN
  CREATE TYPE visibilidad_evento AS ENUM ('publico', 'privado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Estados del ciclo de vida de un evento
DO $$ BEGIN
  CREATE TYPE estado_evento AS ENUM ('borrador', 'publicado', 'cerrado', 'finalizado', 'cancelado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Estado de la inscripción de un asistente
DO $$ BEGIN
  CREATE TYPE estado_registro_tipo AS ENUM ('pendiente', 'confirmado', 'cancelado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tipos de notificación del sistema
DO $$ BEGIN
  CREATE TYPE tipo_notificacion AS ENUM ('USER_REGISTRATION', 'EVENT_UPDATE', 'SYSTEM_ALERT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ============================================================
--  2. FUNCIONES DE TRIGGER
-- ============================================================

-- Para tablas que usan "updated_at"
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Para la tabla eventos que usa "actualizado_en"
CREATE OR REPLACE FUNCTION set_actualizado_en()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
--  3. TABLA: organizaciones
--     Entidad raíz de la plataforma white-label.
--     Permite aislar los datos de cada cliente/marca.
-- ============================================================
CREATE TABLE IF NOT EXISTS organizaciones (
  id          SERIAL        PRIMARY KEY,
  nombre      VARCHAR(255)  NOT NULL,
  slug        VARCHAR(100)  UNIQUE,
  logo        TEXT,
  website     TEXT,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_organizaciones_updated_at ON organizaciones;
CREATE TRIGGER trg_organizaciones_updated_at
  BEFORE UPDATE ON organizaciones
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================
--  4. TABLA: usuarios
--     Almacena todos los usuarios. El campo "permisos" contiene
--     permisos granulares adicionales sobre los del rol base.
--     El campo "organizacion_id" permite multi-tenant.
-- ============================================================
CREATE TABLE IF NOT EXISTS usuarios (
  id              SERIAL          PRIMARY KEY,
  nombre          VARCHAR(100)    NOT NULL,
  apellido        VARCHAR(100),
  email           VARCHAR(255)    NOT NULL UNIQUE,
  password_hash   VARCHAR(255)    NOT NULL,
  rol             rol_usuario     NOT NULL DEFAULT 'asistente',
  permisos        TEXT[]          NOT NULL DEFAULT '{}',
  organizacion_id INT             REFERENCES organizaciones(id)
                                  ON UPDATE CASCADE ON DELETE SET NULL,
  created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usuarios_email        ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol          ON usuarios(rol);
CREATE INDEX IF NOT EXISTS idx_usuarios_organizacion ON usuarios(organizacion_id);

DROP TRIGGER IF EXISTS trg_usuarios_updated_at ON usuarios;
CREATE TRIGGER trg_usuarios_updated_at
  BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================
--  5. TABLA: categorias
--     Clasificación de eventos. Se crean dinámicamente desde
--     el endpoint POST /eventos con el campo "categoria_nueva".
-- ============================================================
CREATE TABLE IF NOT EXISTS categorias (
  id          SERIAL        PRIMARY KEY,
  nombre      VARCHAR(100)  NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);


-- ============================================================
--  6. TABLA: eventos
--     Modelo de evento completo. Los arrays de objetos
--     (entradas, speakers, agenda, etc.) se almacenan como JSONB
--     para flexibilidad máxima sin joins adicionales.
--
--     NOTA IMPORTANTE sobre nombres de columnas:
--       - creado_en / actualizado_en  (no created_at/updated_at)
--         para alinearse con las queries en eventos_get_lista.js
--         y eventos_get_detalle.js.
-- ============================================================
CREATE TABLE IF NOT EXISTS eventos (
  id                         SERIAL             PRIMARY KEY,

  -- Autoría y organización
  organizacion_id            INT,
  organizador_id             INT                NOT NULL
                               REFERENCES usuarios(id)
                               ON UPDATE CASCADE ON DELETE RESTRICT,
  organizador_email          TEXT,

  -- Información básica
  nombre                     VARCHAR(255)       NOT NULL,
  descripcion                TEXT,
  modalidad                  modalidad_evento   NOT NULL,
  visibilidad                visibilidad_evento NOT NULL DEFAULT 'publico',
  estado                     estado_evento      NOT NULL DEFAULT 'borrador',
  moneda                     CHAR(3)            NOT NULL DEFAULT 'COP',

  -- Fechas y sesiones multi-día
  fecha_inicio               TIMESTAMPTZ,
  fecha_fin                  TIMESTAMPTZ,
  -- JSONB: [{fecha, hora_inicio, hora_fin, descripcion, lugar}]
  sesiones                   JSONB              NOT NULL DEFAULT '[]',

  -- Ubicación — JSONB: {ciudad, lugar, direccion, coordenadas, link_streaming}
  ubicacion                  JSONB              NOT NULL DEFAULT '{}',

  -- Categoría
  categoria_id               INT                REFERENCES categorias(id)
                               ON UPDATE CASCADE ON DELETE SET NULL,

  -- Configuración del evento
  restricciones              TEXT,
  requiere_aprobacion        BOOLEAN            NOT NULL DEFAULT FALSE,
  acepta_terminos_plataforma BOOLEAN            NOT NULL DEFAULT TRUE,
  terminos_propios           TEXT,
  politica_reembolso         TEXT,

  -- Media
  imagen_portada             TEXT,
  -- JSONB: array de URLs de imágenes
  galeria                    JSONB              NOT NULL DEFAULT '[]',

  -- Entradas / Tickets — JSONB:
  -- [{tipo, descripcion, precio, moneda, capacidad, vendidas, disponibles,
  --   fecha_limite_venta, precio_early_bird, fecha_fin_early_bird, visible}]
  entradas                   JSONB              NOT NULL DEFAULT '[]',
  capacidad_total            INT,
  asistentes_count           INT                NOT NULL DEFAULT 0,

  -- Códigos de descuento — JSONB:
  -- [{codigo, descuento, tipo, aplica_a, usos_maximos, usos_actuales,
  --   activo, fecha_expiracion}]
  codigos_descuento          JSONB              NOT NULL DEFAULT '[]',

  -- Ponentes — JSONB: [{nombre, cargo, empresa, bio, foto, redes}]
  speakers                   JSONB              NOT NULL DEFAULT '[]',

  -- Patrocinadores — JSONB: [{nombre, logo, url, nivel}]
  patrocinadores             JSONB              NOT NULL DEFAULT '[]',

  -- Agenda — JSONB: [{hora_inicio, hora_fin, actividad, descripcion, lugar, speaker_id}]
  agenda                     JSONB              NOT NULL DEFAULT '[]',

  -- Redes sociales — JSONB: [{plataforma, url, etiqueta}]
  redes_sociales             JSONB              NOT NULL DEFAULT '[]',

  -- Staff interno (solo visible para organizador) — JSONB
  staff                      JSONB              NOT NULL DEFAULT '[]',

  -- Contador de vistas (para analytics)
  vistas                     INT                NOT NULL DEFAULT 0,

  -- Timestamps (nombres usados en el código fuente del API)
  creado_en                  TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  actualizado_en             TIMESTAMPTZ        NOT NULL DEFAULT NOW()
);

-- Índices de eventos
CREATE INDEX IF NOT EXISTS idx_eventos_organizador          ON eventos(organizador_id);
CREATE INDEX IF NOT EXISTS idx_eventos_organizacion         ON eventos(organizacion_id);
CREATE INDEX IF NOT EXISTS idx_eventos_estado               ON eventos(estado);
CREATE INDEX IF NOT EXISTS idx_eventos_visibilidad          ON eventos(visibilidad);
CREATE INDEX IF NOT EXISTS idx_eventos_categoria            ON eventos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_eventos_fecha_inicio         ON eventos(fecha_inicio);
CREATE INDEX IF NOT EXISTS idx_eventos_modalidad            ON eventos(modalidad);
CREATE INDEX IF NOT EXISTS idx_eventos_moneda               ON eventos(moneda);

-- Índice compuesto para la consulta más frecuente: publicados + públicos
CREATE INDEX IF NOT EXISTS idx_eventos_publicados_publicos
  ON eventos(estado, visibilidad)
  WHERE estado = 'publicado' AND visibilidad = 'publico';

-- Trigger para actualizado_en
DROP TRIGGER IF EXISTS trg_eventos_actualizado_en ON eventos;
CREATE TRIGGER trg_eventos_actualizado_en
  BEFORE UPDATE ON eventos
  FOR EACH ROW EXECUTE FUNCTION set_actualizado_en();


-- ============================================================
--  7. TABLA: asistentes
--     Tabla puente N:M entre usuarios y eventos.
--     Gestiona el proceso de inscripción con estados.
-- ============================================================
CREATE TABLE IF NOT EXISTS asistentes (
  id               SERIAL                PRIMARY KEY,
  id_usuario       INT                   NOT NULL
                     REFERENCES usuarios(id)
                     ON UPDATE CASCADE ON DELETE CASCADE,
  id_evento        INT                   NOT NULL
                     REFERENCES eventos(id)
                     ON UPDATE CASCADE ON DELETE CASCADE,
  estado_registro  estado_registro_tipo  NOT NULL DEFAULT 'pendiente',
  fecha_registro   TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ           NOT NULL DEFAULT NOW(),

  -- Evita doble inscripción del mismo usuario al mismo evento
  UNIQUE (id_usuario, id_evento)
);

CREATE INDEX IF NOT EXISTS idx_asistentes_usuario ON asistentes(id_usuario);
CREATE INDEX IF NOT EXISTS idx_asistentes_evento  ON asistentes(id_evento);

DROP TRIGGER IF EXISTS trg_asistentes_updated_at ON asistentes;
CREATE TRIGGER trg_asistentes_updated_at
  BEFORE UPDATE ON asistentes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================
--  8. TABLA: notificaciones
--     Persistencia de notificaciones del sistema.
--     Actualmente el servicio las guarda en memoria;
--     esta tabla permite migrar a persistencia real.
-- ============================================================
CREATE TABLE IF NOT EXISTS notificaciones (
  id          VARCHAR(60)         PRIMARY KEY,  -- ntf_<timestamp>_<random>
  tipo        tipo_notificacion   NOT NULL,
  mensaje     TEXT                NOT NULL,
  usuario_id  INT                 REFERENCES usuarios(id)
                                  ON UPDATE CASCADE ON DELETE SET NULL,
  leido       BOOLEAN             NOT NULL DEFAULT FALSE,
  creado_en   TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario  ON notificaciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_leido    ON notificaciones(leido);
CREATE INDEX IF NOT EXISTS idx_notificaciones_tipo     ON notificaciones(tipo);


-- ============================================================
--  9. TABLA: push_subscriptions
--     Suscripciones Web Push para notificaciones del navegador.
-- ============================================================
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id          SERIAL        PRIMARY KEY,
  endpoint    TEXT          NOT NULL UNIQUE,
  -- JSONB: {p256dh, auth} — claves de encriptación del navegador
  keys        JSONB         NOT NULL DEFAULT '{}',
  usuario_id  INT           REFERENCES usuarios(id)
                            ON UPDATE CASCADE ON DELETE CASCADE,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_usuario ON push_subscriptions(usuario_id);


-- ============================================================
--  10. ROW LEVEL SECURITY (RLS)
--      El backend Express usa SUPABASE_SERVICE_KEY (bypassa RLS).
--      Estas políticas protegen conexiones directas desde el cliente.
-- ============================================================
ALTER TABLE organizaciones     ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios           ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias         ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE asistentes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificaciones     ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Categorías: lectura pública sin autenticación
DROP POLICY IF EXISTS "categorias_select_all" ON categorias;
CREATE POLICY "categorias_select_all" ON categorias
  FOR SELECT USING (true);

-- Eventos publicados y públicos: visibles para todos
DROP POLICY IF EXISTS "eventos_select_publicados" ON eventos;
CREATE POLICY "eventos_select_publicados" ON eventos
  FOR SELECT USING (estado = 'publicado' AND visibilidad = 'publico');

-- Eventos: el organizador dueño puede ver y modificar todos sus eventos
DROP POLICY IF EXISTS "eventos_all_organizador" ON eventos;
CREATE POLICY "eventos_all_organizador" ON eventos
  FOR ALL USING (auth.uid()::text = organizador_id::text);

-- Usuarios: cada usuario ve y edita solo su propio perfil
DROP POLICY IF EXISTS "usuarios_select_own" ON usuarios;
CREATE POLICY "usuarios_select_own" ON usuarios
  FOR SELECT USING (auth.uid()::text = id::text);

DROP POLICY IF EXISTS "usuarios_update_own" ON usuarios;
CREATE POLICY "usuarios_update_own" ON usuarios
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Asistentes: cada usuario gestiona sus propias inscripciones
DROP POLICY IF EXISTS "asistentes_select_own" ON asistentes;
CREATE POLICY "asistentes_select_own" ON asistentes
  FOR SELECT USING (auth.uid()::text = id_usuario::text);

DROP POLICY IF EXISTS "asistentes_insert_own" ON asistentes;
CREATE POLICY "asistentes_insert_own" ON asistentes
  FOR INSERT WITH CHECK (auth.uid()::text = id_usuario::text);

DROP POLICY IF EXISTS "asistentes_update_own" ON asistentes;
CREATE POLICY "asistentes_update_own" ON asistentes
  FOR UPDATE USING (auth.uid()::text = id_usuario::text);

-- Notificaciones: cada usuario ve las suyas
DROP POLICY IF EXISTS "notificaciones_select_own" ON notificaciones;
CREATE POLICY "notificaciones_select_own" ON notificaciones
  FOR SELECT USING (auth.uid()::text = usuario_id::text OR usuario_id IS NULL);

-- Push subscriptions: cada usuario ve las suyas
DROP POLICY IF EXISTS "push_select_own" ON push_subscriptions;
CREATE POLICY "push_select_own" ON push_subscriptions
  FOR ALL USING (auth.uid()::text = usuario_id::text);


-- ============================================================
--  11. VISTAS ANALÍTICAS
-- ============================================================

-- Vista: eventos enriquecidos con nombre del organizador y categoría
CREATE OR REPLACE VIEW v_eventos_detalle AS
  SELECT
    e.id,
    e.nombre,
    e.descripcion,
    e.modalidad,
    e.visibilidad,
    e.estado,
    e.moneda,
    e.fecha_inicio,
    e.fecha_fin,
    e.ubicacion,
    e.imagen_portada,
    e.capacidad_total,
    e.asistentes_count,
    e.vistas,
    e.creado_en,
    CONCAT(u.nombre, ' ', COALESCE(u.apellido, '')) AS organizador,
    u.email                                          AS email_organizador,
    c.nombre                                         AS categoria
  FROM eventos e
  JOIN usuarios u    ON e.organizador_id = u.id
  LEFT JOIN categorias c ON e.categoria_id = c.id;


-- Vista: conteo de asistentes por evento con porcentaje de ocupación
CREATE OR REPLACE VIEW v_asistentes_por_evento AS
  SELECT
    e.id                AS id_evento,
    e.nombre            AS titulo,
    e.capacidad_total,
    e.asistentes_count,
    COUNT(a.id) FILTER (WHERE a.estado_registro = 'confirmado') AS confirmados,
    COUNT(a.id) FILTER (WHERE a.estado_registro = 'pendiente')  AS pendientes,
    COUNT(a.id) FILTER (WHERE a.estado_registro = 'cancelado')  AS cancelados,
    ROUND(
      COUNT(a.id) FILTER (WHERE a.estado_registro = 'confirmado')::numeric
      / NULLIF(e.capacidad_total, 0) * 100,
      1
    ) AS porcentaje_ocupacion
  FROM eventos e
  LEFT JOIN asistentes a ON e.id = a.id_evento
  GROUP BY e.id, e.nombre, e.capacidad_total, e.asistentes_count;


-- Vista: resumen global para el dashboard de analytics
CREATE OR REPLACE VIEW v_analytics_resumen AS
  SELECT
    (SELECT COUNT(*)                                        FROM eventos)                  AS total_eventos,
    (SELECT COUNT(*)                                        FROM eventos WHERE estado = 'publicado') AS eventos_publicados,
    (SELECT COUNT(*)                                        FROM usuarios)                 AS total_usuarios,
    (SELECT COALESCE(SUM(asistentes_count), 0)             FROM eventos)                  AS total_asistentes,
    (SELECT COALESCE(SUM(vistas), 0)                       FROM eventos)                  AS total_vistas;


-- ============================================================
--  12. DATOS INICIALES — CATEGORÍAS BASE
-- ============================================================
INSERT INTO categorias (nombre) VALUES
  ('Tecnología'),
  ('Negocios y Emprendimiento'),
  ('Arte y Cultura'),
  ('Educación y Formación'),
  ('Salud y Bienestar'),
  ('Deportes y Recreación'),
  ('Música y Entretenimiento'),
  ('Gastronomía'),
  ('Ciencia e Innovación'),
  ('Marketing y Comunicación')
ON CONFLICT (nombre) DO NOTHING;


-- ============================================================
--  13. DATOS DE PRUEBA
--      Contraseña para todos los usuarios: Demo2026!
--      Hash: $2a$10$HncyGiNUcsazAC.u2Vztwe/Sn2xpViBmaaeVSFpdmKTAVqcdZyUGu
-- ============================================================

-- Organización demo
INSERT INTO organizaciones (nombre, slug, website) VALUES
  ('Marca Blanca Demo', 'marcablanca', 'https://marcablanca.com')
ON CONFLICT (slug) DO NOTHING;

-- Usuarios de prueba
INSERT INTO usuarios (nombre, apellido, email, password_hash, rol, permisos, organizacion_id)
SELECT
  u.nombre, u.apellido, u.email,
  '$2a$10$HncyGiNUcsazAC.u2Vztwe/Sn2xpViBmaaeVSFpdmKTAVqcdZyUGu',
  u.rol::rol_usuario,
  u.permisos,
  o.id
FROM (VALUES
  ('Admin',     'Sistema',    'admin@marcablanca.com',    'admin_global', ARRAY[]::text[]),
  ('Carlos',    'Ramírez',    'carlos@marcablanca.com',   'organizador',  ARRAY[]::text[]),
  ('Laura',     'Gómez',      'laura@marcablanca.com',    'organizador',  ARRAY[]::text[]),
  ('Andrés',    'Torres',     'andres@ejemplo.com',       'asistente',    ARRAY[]::text[]),
  ('Valentina', 'Pérez',      'valentina@ejemplo.com',    'asistente',    ARRAY[]::text[]),
  ('Miguel',    'Hernández',  'miguel@ejemplo.com',       'asistente',    ARRAY[]::text[])
) AS u(nombre, apellido, email, rol, permisos)
CROSS JOIN organizaciones o
WHERE o.slug = 'marcablanca'
ON CONFLICT (email) DO NOTHING;

-- Evento 1: publicado, híbrido (visita Tecnología)
INSERT INTO eventos (
  organizador_id, organizador_email, organizacion_id,
  nombre, descripcion, modalidad, visibilidad, estado, moneda,
  fecha_inicio, fecha_fin,
  ubicacion,
  categoria_id,
  imagen_portada,
  entradas, capacidad_total, asistentes_count,
  speakers, agenda
)
SELECT
  u.id, u.email, u.organizacion_id,
  'Lanzamiento GESTEK 2026',
  'Presentación oficial de GestorEventosMarcaBlanca. Conoce todas las funcionalidades de la plataforma y cómo puede transformar la gestión de tus eventos corporativos.',
  'hibrido', 'publico', 'publicado', 'COP',
  '2026-09-15 10:00:00-05', '2026-09-15 18:00:00-05',
  '{"ciudad": "Bogotá", "lugar": "Centro de Convenciones Ágora", "direccion": "Calle 24 # 38-47, Bogotá", "link_streaming": "https://zoom.us/j/gestek2026"}'::jsonb,
  c.id,
  NULL,
  '[
    {"tipo": "General", "descripcion": "Acceso presencial y virtual al evento", "precio": 0, "moneda": "COP", "capacidad": 150, "vendidas": 45, "disponibles": 105, "visible": true},
    {"tipo": "VIP", "descripcion": "Acceso preferencial con kit de bienvenida y almuerzo", "precio": 250000, "moneda": "COP", "capacidad": 50, "vendidas": 12, "disponibles": 38, "visible": true}
  ]'::jsonb,
  200, 57,
  '[
    {"nombre": "Ana Martínez", "cargo": "CEO", "empresa": "GESTEK", "bio": "Experta en gestión de eventos y tecnología.", "foto": null, "redes": []},
    {"nombre": "Roberto Silva", "cargo": "CTO", "empresa": "GESTEK", "bio": "Arquitecto de soluciones cloud y SaaS.", "foto": null, "redes": []}
  ]'::jsonb,
  '[
    {"hora_inicio": "10:00", "hora_fin": "10:30", "actividad": "Registro y bienvenida", "lugar": "Lobby", "speaker_id": null},
    {"hora_inicio": "10:30", "hora_fin": "12:00", "actividad": "Presentación de la plataforma GESTEK", "lugar": "Auditorio Principal", "speaker_id": 0},
    {"hora_inicio": "12:00", "hora_fin": "13:00", "actividad": "Almuerzo y networking", "lugar": "Terraza", "speaker_id": null},
    {"hora_inicio": "13:00", "hora_fin": "15:00", "actividad": "Demo en vivo y casos de uso", "lugar": "Auditorio Principal", "speaker_id": 1},
    {"hora_inicio": "15:00", "hora_fin": "16:00", "actividad": "Ronda de preguntas", "lugar": "Auditorio Principal", "speaker_id": null}
  ]'::jsonb
FROM usuarios u
JOIN categorias c ON c.nombre = 'Tecnología'
WHERE u.email = 'carlos@marcablanca.com'
LIMIT 1;

-- Evento 2: publicado, virtual (Taller de Branding)
INSERT INTO eventos (
  organizador_id, organizador_email, organizacion_id,
  nombre, descripcion, modalidad, visibilidad, estado, moneda,
  fecha_inicio, fecha_fin,
  ubicacion,
  categoria_id,
  entradas, capacidad_total, asistentes_count
)
SELECT
  u.id, u.email, u.organizacion_id,
  'Taller de Branding Digital',
  'Workshop intensivo sobre identidad de marca y estrategia digital. Aprende a construir una marca sólida desde cero con herramientas modernas.',
  'virtual', 'publico', 'publicado', 'COP',
  '2026-10-05 09:00:00-05', '2026-10-05 17:00:00-05',
  '{"link_streaming": "https://zoom.us/j/taller-branding-2026"}'::jsonb,
  c.id,
  '[
    {"tipo": "Estándar", "descripcion": "Acceso completo al taller virtual", "precio": 150000, "moneda": "COP", "capacidad": 40, "vendidas": 12, "disponibles": 28, "visible": true},
    {"tipo": "Early Bird", "descripcion": "Precio especial hasta el 15 de septiembre", "precio": 99000, "precio_early_bird": 99000, "fecha_fin_early_bird": "2026-09-15T23:59:00-05:00", "moneda": "COP", "capacidad": 10, "vendidas": 8, "disponibles": 2, "visible": true}
  ]'::jsonb,
  50, 20
FROM usuarios u
JOIN categorias c ON c.nombre = 'Marketing y Comunicación'
WHERE u.email = 'laura@marcablanca.com'
LIMIT 1;

-- Evento 3: borrador, físico (Conferencia)
INSERT INTO eventos (
  organizador_id, organizador_email, organizacion_id,
  nombre, descripcion, modalidad, visibilidad, estado, moneda,
  fecha_inicio, fecha_fin,
  ubicacion,
  categoria_id,
  entradas, capacidad_total
)
SELECT
  u.id, u.email, u.organizacion_id,
  'Conferencia Gestión de Eventos 2026',
  'Panel de expertos en organización de eventos corporativos. Casos de éxito, tendencias del sector y networking de alto nivel.',
  'fisico', 'publico', 'borrador', 'COP',
  '2026-11-20 14:00:00-05', '2026-11-20 20:00:00-05',
  '{"ciudad": "Medellín", "lugar": "Hotel Dann Carlton", "direccion": "Calle 65 # 43E-131, El Poblado, Medellín"}'::jsonb,
  c.id,
  '[]'::jsonb,
  100
FROM usuarios u
JOIN categorias c ON c.nombre = 'Negocios y Emprendimiento'
WHERE u.email = 'carlos@marcablanca.com'
LIMIT 1;

-- Inscripciones de prueba (asistentes a eventos publicados)
INSERT INTO asistentes (id_usuario, id_evento, estado_registro)
SELECT u.id, e.id, 'confirmado'
FROM usuarios u, eventos e
WHERE u.email = 'andres@ejemplo.com'
  AND e.nombre = 'Lanzamiento GESTEK 2026'
ON CONFLICT (id_usuario, id_evento) DO NOTHING;

INSERT INTO asistentes (id_usuario, id_evento, estado_registro)
SELECT u.id, e.id, 'confirmado'
FROM usuarios u, eventos e
WHERE u.email = 'valentina@ejemplo.com'
  AND e.nombre = 'Lanzamiento GESTEK 2026'
ON CONFLICT (id_usuario, id_evento) DO NOTHING;

INSERT INTO asistentes (id_usuario, id_evento, estado_registro)
SELECT u.id, e.id, 'pendiente'
FROM usuarios u, eventos e
WHERE u.email = 'miguel@ejemplo.com'
  AND e.nombre = 'Lanzamiento GESTEK 2026'
ON CONFLICT (id_usuario, id_evento) DO NOTHING;

INSERT INTO asistentes (id_usuario, id_evento, estado_registro)
SELECT u.id, e.id, 'confirmado'
FROM usuarios u, eventos e
WHERE u.email = 'andres@ejemplo.com'
  AND e.nombre = 'Taller de Branding Digital'
ON CONFLICT (id_usuario, id_evento) DO NOTHING;

INSERT INTO asistentes (id_usuario, id_evento, estado_registro)
SELECT u.id, e.id, 'cancelado'
FROM usuarios u, eventos e
WHERE u.email = 'miguel@ejemplo.com'
  AND e.nombre = 'Taller de Branding Digital'
ON CONFLICT (id_usuario, id_evento) DO NOTHING;
