-- ════════════════════════════════════════════════════════════════
-- MIGRACIÓN 001 — Tabla notifications
-- Proyecto: Gestek Eventos
-- Fecha: 2026-05-12
-- Descripción: Crea la tabla de notificaciones persistente en Supabase
--              para reemplazar el almacenamiento en memoria.
-- ════════════════════════════════════════════════════════════════

-- ── 1. Crear tabla ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          TEXT         PRIMARY KEY DEFAULT gen_random_uuid()::text,
  type        TEXT         NOT NULL
    CHECK (type IN ('USER_REGISTRATION', 'EVENT_UPDATE', 'SYSTEM_ALERT')),
  message     TEXT         NOT NULL,
  user_id     BIGINT       REFERENCES usuarios(id) ON DELETE SET NULL,
  read        BOOLEAN      NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ── 2. Índices de performance ───────────────────────────────────
-- Consultas frecuentes: por usuario, por estado de lectura, por fecha
CREATE INDEX IF NOT EXISTS idx_notifications_user_id
  ON notifications (user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_read
  ON notifications (read)
  WHERE read = false;   -- índice parcial: solo las no leídas (más eficiente)

CREATE INDEX IF NOT EXISTS idx_notifications_created_at
  ON notifications (created_at DESC);

-- Índice compuesto para la query principal de getAll()
CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON notifications (user_id, created_at DESC);

-- ── 3. Row Level Security (preparación para multitenancy) ───────
-- Habilitar RLS (las políticas van en el siguiente paso)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Política: admin_global ve todas, usuarios ven solo las suyas
-- NOTA: Esta política usa Supabase Auth (auth.uid()).
--       Si se usa Service Key (como hace este backend), RLS se bypasea
--       automáticamente y la lógica de filtrado va en el service.
--       Esta política protege acceso directo desde el cliente.
CREATE POLICY IF NOT EXISTS "notifications_select_policy"
  ON notifications
  FOR SELECT
  USING (
    user_id IS NULL                                          -- alertas de sistema visibles a todos
    OR user_id::text = auth.uid()                            -- propias del usuario
  );

-- ── 4. Limpieza automática de notificaciones antiguas ──────────
-- Opcional: función para limpiar notificaciones > 90 días
-- Activar en producción con pg_cron:
--   SELECT cron.schedule('cleanup-notifications', '0 2 * * *', 'CALL cleanup_old_notifications()');

CREATE OR REPLACE PROCEDURE cleanup_old_notifications(days_to_keep INT DEFAULT 90)
LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM notifications
  WHERE created_at < NOW() - make_interval(days => days_to_keep)
    AND read = true;
END;
$$;

-- ── 5. Verificar creación ───────────────────────────────────────
-- Ejecutar para confirmar:
-- SELECT table_name, column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'notifications'
-- ORDER BY ordinal_position;

-- ════════════════════════════════════════════════════════════════
-- ROLLBACK (si necesitas deshacer):
--
-- DROP TABLE IF EXISTS notifications CASCADE;
-- DROP PROCEDURE IF EXISTS cleanup_old_notifications;
-- ════════════════════════════════════════════════════════════════
