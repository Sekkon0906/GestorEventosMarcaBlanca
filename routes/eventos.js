const router = require('express').Router();
const verificarToken = require('../middleware/auth');

let eventos = [];

// GET /eventos — público
router.get('/', (req, res) => {
  res.json({
    total: eventos.length,
    eventos
  });
});

// GET /eventos/:id — público (cuenta vistas para analytics)
router.get('/:id', (req, res) => {
  const evento = eventos.find(e => e.id == req.params.id);
  if (!evento) {
    return res.status(404).json({ error: 'Evento no encontrado.' });
  }
  evento.vistas = (evento.vistas || 0) + 1; // contar vista
  res.json(evento);
});

// POST /eventos — requiere token
router.post('/', verificarToken, (req, res) => {
  const { nombre, descripcion, fecha, lugar, capacidad } = req.body;

  if (!nombre || !fecha) {
    return res.status(400).json({ error: 'Nombre y fecha son obligatorios.' });
  }

  const evento = {
    id: Date.now(),
    nombre,
    descripcion: descripcion || '',
    fecha,
    lugar: lugar || 'Por definir',
    capacidad: capacidad || 100,
    organizador: req.usuario.email,
    asistentes: [],
    creadoEn: new Date().toISOString()
  };

  eventos.push(evento);

  res.status(201).json({
    mensaje: 'Evento creado exitosamente',
    evento
  });
});

// PUT /eventos/:id — requiere token
router.put('/:id', verificarToken, (req, res) => {
  const index = eventos.findIndex(e => e.id == req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Evento no encontrado.' });
  }

  eventos[index] = { ...eventos[index], ...req.body, id: eventos[index].id };

  res.json({
    mensaje: 'Evento actualizado',
    evento: eventos[index]
  });
});

// DELETE /eventos/:id — requiere token
router.delete('/:id', verificarToken, (req, res) => {
  const existe = eventos.find(e => e.id == req.params.id);
  if (!existe) {
    return res.status(404).json({ error: 'Evento no encontrado.' });
  }

  eventos = eventos.filter(e => e.id != req.params.id);

  res.json({ mensaje: 'Evento eliminado correctamente.' });
});

// POST /eventos/:id/asistentes — público (cualquiera se puede registrar)
router.post('/:id/asistentes', (req, res) => {
  const evento = eventos.find(e => e.id == req.params.id);
  if (!evento) {
    return res.status(404).json({ error: 'Evento no encontrado.' });
  }

  const { nombre, email } = req.body;
  if (!nombre || !email) {
    return res.status(400).json({ error: 'Nombre y email del asistente son obligatorios.' });
  }

  if (evento.asistentes.length >= evento.capacidad) {
    return res.status(400).json({ error: 'El evento ya alcanzó su capacidad máxima.' });
  }

  const yaRegistrado = evento.asistentes.find(a => a.email === email);
  if (yaRegistrado) {
    return res.status(409).json({ error: 'Este email ya está registrado en el evento.' });
  }

  const asistente = { id: Date.now(), nombre, email };
  evento.asistentes.push(asistente);

  res.status(201).json({
    mensaje: 'Asistente registrado exitosamente',
    asistente,
    evento: evento.nombre
  });
});

// GET /eventos/:id/asistentes — requiere token (solo organizadores)
router.get('/:id/asistentes', verificarToken, (req, res) => {
  const evento = eventos.find(e => e.id == req.params.id);
  if (!evento) {
    return res.status(404).json({ error: 'Evento no encontrado.' });
  }

  res.json({
    evento: evento.nombre,
    total_asistentes: evento.asistentes.length,
    capacidad: evento.capacidad,
    asistentes: evento.asistentes
  });
});

// Funcion para compartir eventos con analytics
router.getEventos = () => eventos;

module.exports = router;
