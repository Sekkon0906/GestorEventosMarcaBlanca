require('dotenv').config();

const http    = require('http');
const express = require('express');
const cors    = require('cors');
const app     = express();
const server  = http.createServer(app);

app.use(cors());
app.use(express.json());

// Rutas principales
const eventosRouter        = require('./routes/eventos');
const analyticsRouter      = require('./routes/analytics');
const notificacionesRouter = require('./routes/notificaciones');

analyticsRouter.setEventos(() => eventosRouter.getEventos());

app.use('/auth',              require('./routes/auth'));
app.use('/eventos',           eventosRouter);
app.use('/usuarios',          require('./routes/usuarios'));
app.use('/analytics',         analyticsRouter);
app.use('/notificaciones',    notificacionesRouter);
app.use('/api/notifications', require('./routes/notification.routes'));

// Socket.IO condicional
if (process.env.ENABLE_SOCKETS === 'true') {
  try {
    const { Server } = require('socket.io');
    const io = new Server(server, { cors: { origin: '*' } });
    require('./services/notification.service').setSocketServer(io);
    io.on('connection', socket => {
      console.log(`[Socket.IO] Cliente conectado: ${socket.id}`);
      socket.on('disconnect', () => console.log(`[Socket.IO] Cliente desconectado: ${socket.id}`));
    });
    console.log('[Socket.IO] Habilitado.');
  } catch {
    console.warn('[Socket.IO] No disponible.');
  }
}

app.get('/', (req, res) => {
  res.json({
    mensaje : 'API Sistema de Eventos Marca Blanca',
    version : '2.0.0',
    equipo  : 'Cristhian, Juan Medina, JuanesSosa, Misael, NG, Ronald, Alejo',
    endpoints: [
      'POST /auth/register',
      'POST /auth/login',
      'GET  /eventos',
      'POST /eventos',
      'GET  /eventos/:id',
      'GET  /eventos/categorias',
      'GET  /api/notifications',
      'GET  /usuarios',
      '--- ANALYTICS (Andres) ---',
      'GET  /analytics/resumen',
      'GET  /analytics/eventos-populares',
      'GET  /analytics/mas-vistos',
      '--- NOTIFICACIONES PUSH (Andres) ---',
      'GET  /notificaciones/vapid-key',
      'POST /notificaciones/subscribe',
      'POST /notificaciones/enviar'
    ]
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n Servidor corriendo en http://localhost:${PORT}`);
  console.log(`Analytics en http://localhost:${PORT}/analytics/resumen`);
  console.log(`Notificaciones Push en http://localhost:${PORT}/notificaciones/vapid-key\n`);
});
