const router = require('express').Router();
const verificarToken = require('../middleware/auth');

// Importamos los eventos desde una variable compartida
// En produccion esto vendria de la base de datos
let getEventos = null;
router.setEventos = (fn) => { getEventos = fn; };

// GET /analytics/resumen — resumen general
router.get('/resumen', verificarToken, (req, res) => {
  const eventos = getEventos ? getEventos() : [];

  const totalEventos = eventos.length;
  const totalAsistentes = eventos.reduce((sum, e) => sum + e.asistentes.length, 0);
  const totalVistas = eventos.reduce((sum, e) => sum + (e.vistas || 0), 0);

  res.json({
    resumen: {
      total_eventos: totalEventos,
      total_asistentes: totalAsistentes,
      total_vistas: totalVistas
    }
  });
});

// GET /analytics/eventos-populares — eventos con mas asistentes
router.get('/eventos-populares', verificarToken, (req, res) => {
  const eventos = getEventos ? getEventos() : [];

  const populares = [...eventos]
    .sort((a, b) => b.asistentes.length - a.asistentes.length)
    .slice(0, 5)
    .map(e => ({
      id: e.id,
      nombre: e.nombre,
      fecha: e.fecha,
      lugar: e.lugar,
      capacidad: e.capacidad,
      asistentes_registrados: e.asistentes.length,
      porcentaje_ocupacion: Math.round((e.asistentes.length / e.capacidad) * 100) + '%',
      vistas: e.vistas || 0
    }));

  res.json({
    eventos_populares: populares
  });
});

// GET /analytics/mas-vistos — eventos con mas vistas
router.get('/mas-vistos', verificarToken, (req, res) => {
  const eventos = getEventos ? getEventos() : [];

  const masVistos = [...eventos]
    .sort((a, b) => (b.vistas || 0) - (a.vistas || 0))
    .slice(0, 5)
    .map(e => ({
      id: e.id,
      nombre: e.nombre,
      vistas: e.vistas || 0,
      asistentes: e.asistentes.length
    }));

  res.json({
    mas_vistos: masVistos
  });
});

module.exports = router;
