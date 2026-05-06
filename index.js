const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Rutas
app.use('/auth', require('./routes/auth'));
app.use('/eventos', require('./routes/eventos'));

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({
    mensaje: 'API Sistema de Eventos Marca Blanca',
    version: '1.0.0',
    autor: 'Cristhian Ospina',
    endpoints: [
      'POST /auth/register',
      'POST /auth/login',
      'GET  /eventos',
      'POST /eventos',
      'GET  /eventos/:id',
      'PUT  /eventos/:id',
      'DELETE /eventos/:id',
      'GET  /eventos/:id/asistentes',
      'POST /eventos/:id/asistentes'
    ]
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`\n✅ Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📋 Endpoints disponibles en http://localhost:${PORT}/\n`);
});
