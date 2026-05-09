const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Rutas principales
const eventosRouter = require('./routes/eventos');
const analyticsRouter = require('./routes/analytics');
const notificacionesRouter = require('./routes/notificaciones');

// Compartir lista de eventos con analytics
analyticsRouter.setEventos(() => eventosRouter.getEventos());

app.use('/auth', require('./routes/auth'));
app.use('/eventos', eventosRouter);
app.use('/analytics', analyticsRouter);
app.use('/notificaciones', notificacionesRouter);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({
    mensaje: 'API Sistema de Eventos Marca Blanca',
    version: '2.0.0',
    autor: 'Cristhian Ospina (Andres)',
    endpoints: [
      'POST /auth/register',
      'POST /auth/login',
      'GET  /eventos',
      'POST /eventos',
      'GET  /eventos/:id',
      'PUT  /eventos/:id',
      'DELETE /eventos/:id',
      'GET  /eventos/:id/asistentes',
      'POST /eventos/:id/asistentes',
      '--- ANALYTICS ---',
      'GET  /analytics/resumen',
      'GET  /analytics/eventos-populares',
      'GET  /analytics/mas-vistos',
      '--- NOTIFICACIONES ---',
      'GET  /notificaciones/vapid-key',
      'POST /notificaciones/subscribe',
      'POST /notificaciones/enviar'
    ]
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`\n✅ Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📊 Analytics en http://localhost:${PORT}/analytics/resumen`);
  console.log(`🔔 Notificaciones en http://localhost:${PORT}/notificaciones/vapid-key\n`);
});
