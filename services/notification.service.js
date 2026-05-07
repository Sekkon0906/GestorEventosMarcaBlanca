const MAX_NOTIFICATIONS = 100;
const ALERT_INTERVAL_MS = 2 * 60 * 1000;

const VALID_TYPES = ['USER_REGISTRATION', 'EVENT_UPDATE', 'SYSTEM_ALERT'];

const ALERT_MESSAGES = [
  'Capacidad del servidor al 80% — revisar recursos.',
  'Pico de tráfico detectado en /eventos.',
  'Backup automático completado exitosamente.',
  'Nuevo intento de acceso no autorizado bloqueado.',
  'Sincronización con Supabase completada sin errores.',
];

class NotificationService {
  constructor() {
    this._store = [];
    this._io = null;
    this._startSimulator();
  }

  // Inyección del servidor Socket.IO (opcional)
  setSocketServer(io) {
    this._io = io;
  }

  create({ type, message, userId = null }) {
    if (!VALID_TYPES.includes(type)) {
      throw new Error(`Tipo inválido: "${type}". Tipos soportados: ${VALID_TYPES.join(', ')}`);
    }

    if (this._store.length >= MAX_NOTIFICATIONS) {
      this._store.shift(); // evitar memory leak: descarta la más antigua
    }

    const notification = {
      id: `ntf_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      type,
      message,
      userId,
      read: false,
      createdAt: new Date().toISOString(),
    };

    this._store.push(notification);

    if (this._io) {
      this._io.emit('notification_received', notification);
    }

    return notification;
  }

  getAll() {
    return [...this._store].reverse(); // más reciente primero
  }

  markAsRead(id) {
    const notification = this._store.find(n => n.id === id);
    if (!notification) return null;
    notification.read = true;
    return notification;
  }

  // Simulador de alertas del sistema cada 2 minutos
  _startSimulator() {
    const interval = setInterval(() => {
      const message = ALERT_MESSAGES[Math.floor(Math.random() * ALERT_MESSAGES.length)];
      this.create({ type: 'SYSTEM_ALERT', message });
    }, ALERT_INTERVAL_MS);

    interval.unref(); // no bloquear el cierre natural del proceso
  }
}

module.exports = new NotificationService(); // Singleton
