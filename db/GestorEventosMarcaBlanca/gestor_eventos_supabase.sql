-- ============================================================
--  GestorEventosMarcaBlanca — Esquema para Supabase (PostgreSQL)
--  Pega esto en: Supabase Dashboard → SQL Editor → New query
-- ============================================================


-- ============================================================
--  ENUM TYPES (PostgreSQL usa tipos personalizados)
-- ============================================================
DO $$ BEGIN
  CREATE TYPE rol_usuario AS ENUM ('admin', 'organizador', 'asistente');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE estado_evento AS ENUM ('borrador', 'publicado', 'cancelado');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE estado_registro_tipo AS ENUM ('pendiente', 'confirmado', 'cancelado');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ============================================================
--  TABLA: usuarios
-- ============================================================
CREATE TABLE IF NOT EXISTS usuarios (
  id_usuario     SERIAL          PRIMARY KEY,
  nombre         VARCHAR(100)    NOT NULL,
  apellido       VARCHAR(100)    NOT NULL,
  email          VARCHAR(255)    NOT NULL UNIQUE,
  password_hash  VARCHAR(255)    NOT NULL,
  rol            rol_usuario     NOT NULL DEFAULT 'asistente',
  created_at     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Auto-actualizar updated_at con trigger
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_usuarios_updated_at
  BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================
--  TABLA: eventos
--  FK: id_organizador → usuarios(id_usuario)
-- ============================================================
CREATE TABLE IF NOT EXISTS eventos (
  id_evento        SERIAL          PRIMARY KEY,
  titulo           VARCHAR(255)    NOT NULL,
  descripcion      TEXT,
  fecha_inicio     TIMESTAMPTZ     NOT NULL,
  fecha_fin        TIMESTAMPTZ,
  ubicacion        VARCHAR(255),
  id_organizador   INT             NOT NULL REFERENCES usuarios(id_usuario)
                                   ON UPDATE CASCADE ON DELETE RESTRICT,
  capacidad_maxima INT             DEFAULT NULL,
  estado           estado_evento   NOT NULL DEFAULT 'borrador',
  created_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eventos_organizador ON eventos(id_organizador);
CREATE INDEX IF NOT EXISTS idx_eventos_estado      ON eventos(estado);
CREATE INDEX IF NOT EXISTS idx_eventos_fecha       ON eventos(fecha_inicio);

CREATE OR REPLACE TRIGGER trg_eventos_updated_at
  BEFORE UPDATE ON eventos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================
--  TABLA: asistentes  (tabla puente N:M usuarios ↔ eventos)
--  FK: id_usuario → usuarios(id_usuario)
--  FK: id_evento  → eventos(id_evento)
-- ============================================================
CREATE TABLE IF NOT EXISTS asistentes (
  id_asistente    SERIAL               PRIMARY KEY,
  id_usuario      INT                  NOT NULL REFERENCES usuarios(id_usuario)
                                       ON UPDATE CASCADE ON DELETE CASCADE,
  id_evento       INT                  NOT NULL REFERENCES eventos(id_evento)
                                       ON UPDATE CASCADE ON DELETE CASCADE,
  estado_registro estado_registro_tipo NOT NULL DEFAULT 'pendiente',
  fecha_registro  TIMESTAMPTZ          NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ          NOT NULL DEFAULT NOW(),

  -- Evita que un usuario se inscriba dos veces al mismo evento
  UNIQUE (id_usuario, id_evento)
);

CREATE INDEX IF NOT EXISTS idx_asistentes_usuario ON asistentes(id_usuario);
CREATE INDEX IF NOT EXISTS idx_asistentes_evento  ON asistentes(id_evento);

CREATE OR REPLACE TRIGGER trg_asistentes_updated_at
  BEFORE UPDATE ON asistentes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================
--  ROW LEVEL SECURITY (RLS) — recomendado en Supabase
--  Habilita RLS y define políticas básicas de acceso.
-- ============================================================
ALTER TABLE usuarios   ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos    ENABLE ROW LEVEL SECURITY;
ALTER TABLE asistentes ENABLE ROW LEVEL SECURITY;

-- Usuarios: cada uno ve solo su propio perfil (ajusta según tu lógica de auth)
CREATE POLICY "usuarios_select_own" ON usuarios
  FOR SELECT USING (auth.uid()::text = id_usuario::text);

CREATE POLICY "usuarios_update_own" ON usuarios
  FOR UPDATE USING (auth.uid()::text = id_usuario::text);

-- Eventos: todos pueden ver eventos publicados
CREATE POLICY "eventos_select_publicados" ON eventos
  FOR SELECT USING (estado = 'publicado');

-- Eventos: organizador puede ver/editar sus propios eventos
CREATE POLICY "eventos_all_organizador" ON eventos
  FOR ALL USING (auth.uid()::text = id_organizador::text);

-- Asistentes: cada usuario ve sus propias inscripciones
CREATE POLICY "asistentes_select_own" ON asistentes
  FOR SELECT USING (auth.uid()::text = id_usuario::text);

CREATE POLICY "asistentes_insert_own" ON asistentes
  FOR INSERT WITH CHECK (auth.uid()::text = id_usuario::text);

CREATE POLICY "asistentes_update_own" ON asistentes
  FOR UPDATE USING (auth.uid()::text = id_usuario::text);


-- ============================================================
--  DATOS DE PRUEBA
-- ============================================================
INSERT INTO usuarios (nombre, apellido, email, password_hash, rol) VALUES
  ('Admin',     'Sistema',   'admin@marcablanca.com',  '$2b$10$hashAdmin000000000000000000000000000000', 'admin'),
  ('Carlos',    'Ramírez',   'carlos@marcablanca.com', '$2b$10$hashCarlos00000000000000000000000000000', 'organizador'),
  ('Laura',     'Gómez',     'laura@marcablanca.com',  '$2b$10$hashLaura000000000000000000000000000000', 'organizador'),
  ('Andrés',    'Torres',    'andres@ejemplo.com',     '$2b$10$hashAndres00000000000000000000000000000', 'asistente'),
  ('Valentina', 'Pérez',     'valentina@ejemplo.com',  '$2b$10$hashValent00000000000000000000000000000', 'asistente'),
  ('Miguel',    'Hernández', 'miguel@ejemplo.com',     '$2b$10$hashMiguel00000000000000000000000000000', 'asistente');

INSERT INTO eventos (titulo, descripcion, fecha_inicio, fecha_fin, ubicacion, id_organizador, capacidad_maxima, estado) VALUES
  ('Lanzamiento Marca Blanca 2025',
   'Presentación oficial de GestorEventosMarcaBlanca.',
   '2025-09-15 10:00:00-05', '2025-09-15 18:00:00-05',
   'Centro de Convenciones, Bogotá', 2, 200, 'publicado'),

  ('Taller de Branding Digital',
   'Workshop intensivo sobre identidad de marca y estrategia digital.',
   '2025-10-05 09:00:00-05', '2025-10-05 17:00:00-05',
   'Evento Virtual — Zoom', 3, 50, 'publicado'),

  ('Conferencia Gestión de Eventos',
   'Panel de expertos en organización de eventos corporativos.',
   '2025-11-20 14:00:00-05', '2025-11-20 20:00:00-05',
   'Hotel Dann Carlton, Medellín', 2, 100, 'borrador');

INSERT INTO asistentes (id_usuario, id_evento, estado_registro) VALUES
  (4, 1, 'confirmado'),
  (5, 1, 'confirmado'),
  (6, 1, 'pendiente'),
  (4, 2, 'confirmado'),
  (6, 2, 'cancelado');


-- ============================================================
--  VISTAS ÚTILES (opcionales pero prácticas)
-- ============================================================

-- Vista: eventos con nombre del organizador
CREATE OR REPLACE VIEW v_eventos_detalle AS
  SELECT e.id_evento, e.titulo, e.fecha_inicio, e.fecha_fin,
         e.ubicacion, e.estado, e.capacidad_maxima,
         CONCAT(u.nombre, ' ', u.apellido) AS organizador,
         u.email AS email_organizador
  FROM eventos e
  JOIN usuarios u ON e.id_organizador = u.id_usuario;

-- Vista: conteo de asistentes confirmados por evento
CREATE OR REPLACE VIEW v_asistentes_por_evento AS
  SELECT e.id_evento, e.titulo,
         COUNT(a.id_asistente) FILTER (WHERE a.estado_registro = 'confirmado')  AS confirmados,
         COUNT(a.id_asistente) FILTER (WHERE a.estado_registro = 'pendiente')   AS pendientes,
         COUNT(a.id_asistente) FILTER (WHERE a.estado_registro = 'cancelado')   AS cancelados,
         e.capacidad_maxima
  FROM eventos e
  LEFT JOIN asistentes a ON e.id_evento = a.id_evento
  GROUP BY e.id_evento, e.titulo, e.capacidad_maxima;
