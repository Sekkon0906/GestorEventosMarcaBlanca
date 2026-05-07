require('dotenv').config(); // ← carga el archivo env

const express = require('express');
const cors    = require('cors');
const app     = express();

app.use(cors());
app.use(express.json());

// Rutas
app.use('/auth',    require('./routes/auth'));
app.use('/eventos', require('./routes/eventos'));

// Ruta de prueba
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
    ]
  });
});

const PORT = process.env.PORT || 3000; // ← leer del .env
app.listen(PORT, () => {
  console.log(`\n Servidor corriendo en http://localhost:${PORT}`);
  console.log(`Endpoints disponibles en http://localhost:${PORT}/\n`);
});