require('dotenv').config();

const http    = require('http');
const express = require('express');
const cors    = require('cors');
const app     = express();
const server  = http.createServer(app);

app.use(cors());
app.use(express.json());

// Rutas existentes
app.use('/auth',    require('./routes/auth'));
app.use('/eventos', require('./routes/eventos'));

// Rutas de notificaciones
app.use('/api/notifications', require('./routes/notification.routes'));

// Socket.IO condicional — activar con ENABLE_SOCKETS=true en .env
if (process.env.ENABLE_SOCKETS === 'true') {
  try {
    const { Server } = require('socket.io');
    const io = new Server(server, { cors: { origin: '*' } });
    require('./services/notification.service').setSocketServer(io);
    io.on('connection', socket => {
      console.log(`[Socket.IO] Cliente conectado: ${socket.id}`);
      socket.on('disconnect', () => console.log(`[Socket.IO] Cliente desconectado: ${socket.id}`));
    });
    console.log('[Socket.IO] Habilitado — eventos en tiempo real activos.');
  } catch {
    console.warn('[Socket.IO] No disponible. Instalar con: npm install socket.io');
  }
}

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    mensaje : 'API Sistema de Eventos Marca Blanca',
    version : '1.0.0',
    equipo  : 'Cristhian Ospina, Juan Medina, JuanesSosa, Misael, NG, Ronald, Alejo',
    endpoints: [
      'POST /auth/register',
      'POST /auth/login',
      'GET  /eventos',
      'POST /eventos',
      'GET  /eventos/:id',
      'GET  /eventos/categorias',
      'GET  /api/notifications',
      'PATCH /api/notifications/:id/read',
    ]
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n Servidor corriendo en http://localhost:${PORT}`);
  console.log(`Endpoints disponibles en http://localhost:${PORT}/\n`);
});