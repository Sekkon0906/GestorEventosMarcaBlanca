'use strict';

/**
 * services/notification.service.js
 *
 * Servicio de notificaciones con persistencia en Supabase.
 * Graceful degradation: si Supabase falla, opera en modo memoria
 * para no romper el flujo crítico de la aplicación.
 *
 * Fases 5.2 + 5.3:
 *   - Socket.IO emite a rooms por userId (no broadcast global)
 *   - Persistencia real en tabla `notifications` de Supabase
 *   - Fallback en memoria si BD no disponible
 *
 * API pública (retrocompatible):
 *   create({ type, message, userId? })
 *   getAll({ userId?, limit?, onlyUnread? })
 *   markAsRead(id)
 *   setSocketServer(io)
 */

const supabase = require('../db/supabase');

const VALID_TYPES       = ['USER_REGISTRATION', 'EVENT_UPDATE', 'SYSTEM_ALERT'];
const MAX_MEM           = 100;       // máximo en memoria si BD no disponible
const ALERT_INTERVAL_MS = 2 * 60 * 1000;

// Mensajes de sistema para el simulador
const SYSTEM_MESSAGES = [
  'Backup automático completado exitosamente.',
  'Sincronización con Supabase completada sin errores.',
  'Pico de tráfico detectado en /eventos.',
  'Nuevo intento de acceso no autorizado bloqueado.',
  'Capacidad del servidor al 80% — revisar recursos.',
];

class NotificationService {
  constructor() {
    this._io          = null;
    this._memStore    = [];         // fallback en memoria
    this._useSupabase = true;       // optimista: intenta Supabase primero
    this._startSimulator();
  }

  // ── Inyección de Socket.IO server ──────────────────────────
  setSocketServer(io) {
    this._io = io;
  }

  // ── create ──────────────────────────────────────────────────
  /**
   * Crea una notificación y la persiste.
   * @param {{ type: string, message: string, userId?: number|null }} params
   */
  async create({ type, message, userId = null }) {
    if (!VALID_TYPES.includes(type))
      throw new Error(`Tipo inválido: "${type}". Válidos: ${VALID_TYPES.join(', ')}`);

    let notification;

    if (this._useSupabase) {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .insert({ type, message, user_id: userId, read: false })
          .select()
          .single();

        if (error) throw error;

        notification = {
          id        : data.id,
          type      : data.type,
          message   : data.message,
          userId    : data.user_id,
          read      : data.read,
          createdAt : data.created_at,
        };
      } catch (err) {
        // Supabase no disponible — marcar y usar memoria
        if (!this._supabaseWarnSent) {
          console.warn('[Notifications] Supabase no disponible, usando modo memoria:', err.message);
          this._supabaseWarnSent = true;
        }
        this._useSupabase = false;
        notification = this._createInMemory({ type, message, userId });
      }
    } else {
      notification = this._createInMemory({ type, message, userId });
    }

    // ── Emitir por Socket.IO scoped ─────────────────────────
    if (this._io) {
      if (notification.userId) {
        // Notificación de usuario específico → solo a su room
        this._io.to(`user:${notification.userId}`).emit('notification_received', notification);
      } else {
        // Alerta de sistema → solo a admins suscritos
        this._io.to('system_alerts').emit('notification_received', notification);
      }
    }

    return notification;
  }

  // ── getAll ──────────────────────────────────────────────────
  /**
   * Obtiene notificaciones con filtros opcionales.
   * @param {{ userId?: number, limit?: number, onlyUnread?: boolean }}
   */
  async getAll({ userId, limit = 50, onlyUnread = false } = {}) {
    if (this._useSupabase) {
      try {
        let query = supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (userId !== undefined) query = query.eq('user_id', userId);
        if (onlyUnread)           query = query.eq('read', false);

        const { data, error } = await query;
        if (error) throw error;

        return data.map(n => ({
          id        : n.id,
          type      : n.type,
          message   : n.message,
          userId    : n.user_id,
          read      : n.read,
          createdAt : n.created_at,
        }));
      } catch (err) {
        this._useSupabase = false;
        console.warn('[Notifications] getAll fallback a memoria:', err.message);
      }
    }

    // Fallback memoria
    let store = [...this._memStore].reverse();
    if (userId !== undefined) store = store.filter(n => n.userId === userId || n.userId === null);
    if (onlyUnread)           store = store.filter(n => !n.read);
    return store.slice(0, limit);
  }

  // ── markAsRead ──────────────────────────────────────────────
  async markAsRead(id) {
    if (this._useSupabase) {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .update({ read: true })
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        if (!data) return null;

        return { id: data.id, type: data.type, message: data.message, userId: data.user_id, read: data.read, createdAt: data.created_at };
      } catch (err) {
        this._useSupabase = false;
        console.warn('[Notifications] markAsRead fallback a memoria:', err.message);
      }
    }

    // Fallback memoria
    const n = this._memStore.find(x => x.id === id);
    if (!n) return null;
    n.read = true;
    return n;
  }

  // ── Helpers privados ────────────────────────────────────────
  _createInMemory({ type, message, userId }) {
    if (this._memStore.length >= MAX_MEM) this._memStore.shift();
    const notification = {
      id        : `ntf_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      type, message, userId,
      read      : false,
      createdAt : new Date().toISOString(),
    };
    this._memStore.push(notification);
    return notification;
  }

  _startSimulator() {
    const interval = setInterval(() => {
      const message = SYSTEM_MESSAGES[Math.floor(Math.random() * SYSTEM_MESSAGES.length)];
      this.create({ type: 'SYSTEM_ALERT', message }).catch(() => {});
    }, ALERT_INTERVAL_MS);
    interval.unref();
  }
}

module.exports = new NotificationService();
