// instrument.js DEBE ir primero (Sentry)
require('./instrument.js');

// config/env.js valida las variables de entorno — proceso.exit(1) si faltan en producción
require('dotenv').config();
const env = require('./config/env');

const http       = require('http');
const express    = require('express');
const Sentry     = require('@sentry/node');

const { applySecurity, authLimiter } = require('./config/security');

const app    = express();
const server = http.createServer(app);

// ── 1. Body parsers ──────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── 2. Stack de seguridad (helmet + CORS + rate limit + sanitize) ──
applySecurity(app);

// ── 3. Rutas ─────────────────────────────────────────────────
// authLimiter aplicado solo en auth (máx 10 intentos / 15 min por IP)
app.use('/auth',              authLimiter, require('./routes/auth'));
app.use('/eventos',           require('./routes/eventos'));
app.use('/eventos',           require('./routes/eventos_patch_delete'));
app.use('/usuarios',          require('./routes/usuarios'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/analytics',     require('./routes/analytics'));
app.use('/notificaciones',    require('./routes/notificaciones'));

// ── 4. Socket.IO (activar con ENABLE_SOCKETS=true en .env) ──
if (env.ENABLE_SOCKETS) {
  try {
    const { Server } = require('socket.io');
    const { ALLOWED_ORIGINS } = require('./config/security');
    const io = new Server(server, { cors: { origin: ALLOWED_ORIGINS, credentials: true } });
    require('./services/notification.service').setSocketServer(io);
    io.on('connection', socket => {
      // Unir al usuario a su sala personal para notificaciones scoped
      socket.on('join', (userId) => {
        if (userId) socket.join(`user:${userId}`);
      });
      if (!env.IS_PROD) {
        console.log(`[Socket.IO] Conectado: ${socket.id}`);
        socket.on('disconnect', () => console.log(`[Socket.IO] Desconectado: ${socket.id}`));
      }
    });
    console.log('[Socket.IO] Habilitado.');
  } catch {
    console.warn('[Socket.IO] No disponible — npm install socket.io');
  }
}

// ── 5. Health / Root ─────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({
    producto : 'GESTEK — Event OS',
    version  : '2.0.0',
    entorno  : env.NODE_ENV,
    estado   : 'operativo',
    endpoints: {
      auth    : ['POST /auth/register', 'POST /auth/login', 'GET /auth/me', 'PATCH /auth/me'],
      eventos : [
        'GET  /eventos', 'POST /eventos', 'GET  /eventos/:id',
        'PATCH /eventos/:id', 'DELETE /eventos/:id',
        'POST /eventos/:id/publicar', 'POST /eventos/:id/cancelar',
        'GET  /eventos/:id/asistentes', 'POST /eventos/:id/inscribirse',
        'GET  /eventos/categorias',
      ],
      usuarios: [
        'GET    /usuarios', 'GET /usuarios/:id',
        'GET    /usuarios/me/permisos',
        'PATCH  /usuarios/:id/rol', 'PATCH /usuarios/:id/permisos',
        'DELETE /usuarios/:id',
      ],
      misc: ['GET /api/notifications', 'PATCH /api/notifications/:id/read', 'GET /api/analytics'],
    },
  });
});

app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString(), env: env.NODE_ENV }));

// ── 6. Debug Sentry (solo en desarrollo) ────────────────────
if (!env.IS_PROD) {
  app.get('/debug-sentry', () => { throw new Error('Prueba Sentry — solo en desarrollo'); });
}

// ── 7. Sentry error handler ──────────────────────────────────
Sentry.setupExpressErrorHandler(app);

// ── 8. 404 ───────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.path}` }));

// ── 9. Error handler global ──────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  if (err.message?.startsWith('CORS:')) return res.status(403).json({ error: err.message });
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Error interno del servidor.' });
});

// ── 10. Arrancar servidor ────────────────────────────────────
server.listen(env.PORT, () => {
  console.log(`\nGESTEK API ── ${env.NODE_ENV.toUpperCase()}`);
  console.log(`Escuchando en http://localhost:${env.PORT}`);
  console.log(`Endpoints: http://localhost:${env.PORT}/\n`);
});
