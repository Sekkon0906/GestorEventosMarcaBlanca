require("./instrument.js");
require('dotenv').config();

const http    = require('http');
const express = require('express');
const cors    = require('cors');
const Sentry  = require("@sentry/node");

const app    = express();
const server = http.createServer(app);

// ── CORS ────────────────────────────────────────────────────
const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000']
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin     : (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origen no permitido — ${origin}`));
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── RUTAS ───────────────────────────────────────────────────
app.use('/auth',              require('./routes/auth'));
app.use('/eventos',           require('./routes/eventos'));
app.use('/eventos',           require('./routes/eventos_patch_delete'));
app.use('/usuarios',          require('./routes/usuarios'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/analytics',     require('./routes/analytics'));

// ── Socket.IO (activar con ENABLE_SOCKETS=true en .env) ─────
if (process.env.ENABLE_SOCKETS === 'true') {
  try {
    const { Server } = require('socket.io');
    const io = new Server(server, { cors: { origin: allowedOrigins } });
    require('./services/notification.service').setSocketServer(io);
    io.on('connection', socket => {
      console.log(`[Socket.IO] Cliente conectado: ${socket.id}`);
      socket.on('disconnect', () => console.log(`[Socket.IO] Desconectado: ${socket.id}`));
    });
    console.log('[Socket.IO] Habilitado.');
  } catch {
    console.warn('[Socket.IO] No disponible. npm install socket.io');
  }
}

// ── HEALTH / ROOT ───────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    producto : 'GESTEK — Event OS',
    version  : '2.0.0',
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
        'GET    /usuarios/:id/permisos', 'DELETE /usuarios/:id',
      ],
      misc: ['GET /api/notifications', 'PATCH /api/notifications/:id/read', 'GET /api/analytics'],
    },
  });
});

app.get('/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── DEBUG SENTRY ─────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.get('/debug-sentry', () => { throw new Error('Prueba Sentry'); });
}

Sentry.setupExpressErrorHandler(app);

// ── 404 ──────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.path}` }));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n🚀 GESTEK API corriendo en http://localhost:${PORT}`);
  console.log(`📋 Endpoints en http://localhost:${PORT}/\n`);
});
