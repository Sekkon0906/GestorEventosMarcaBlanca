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

// GET /analytics/exportar-csv — exportar asistentes de todos los eventos
router.get('/exportar-csv', verificarToken, (req, res) => {
  const eventos = getEventos ? getEventos() : [];

  // Cabecera del CSV
  let csv = 'Evento,Fecha,Lugar,Asistente,Email,Registrado_En\n';

  eventos.forEach(e => {
    if (e.asistentes && e.asistentes.length > 0) {
      e.asistentes.forEach(a => {
        csv += `"${e.nombre}","${e.fecha}","${e.lugar || ''}","${a.nombre}","${a.email}","${a.id || ''}"\n`;
      });
    }
  });

  // Devolver como archivo descargable
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="asistentes-gestek.csv"');
  res.send('﻿' + csv); // BOM para que Excel lo abra bien
});

// GET /analytics/exportar-csv/:id — exportar asistentes de un evento especifico
router.get('/exportar-csv/:id', verificarToken, (req, res) => {
  const eventos = getEventos ? getEventos() : [];
  const evento = eventos.find(e => e.id == req.params.id);

  if (!evento) {
    return res.status(404).json({ error: 'Evento no encontrado.' });
  }

  let csv = 'Nombre,Email\n';
  (evento.asistentes || []).forEach(a => {
    csv += `"${a.nombre}","${a.email}"\n`;
  });

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="asistentes-${evento.nombre}.csv"`);
  res.send('﻿' + csv);
});

module.exports = router;
