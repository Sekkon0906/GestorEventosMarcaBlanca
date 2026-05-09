// eventos.js — Router principal (Juan Medina + Andres analytics)
const router = require('express').Router();

// Sub-routers de Juan Medina
const getEventos    = require('./eventos_get_lista');
const postEvento    = require('./eventos_post');
const getEventoById = require('./eventos_get_detalle');

router.use('/', getEventos);
router.use('/', postEvento);
router.use('/', getEventoById);

// Funcion para compartir eventos con analytics (Andres)
router.getEventos = () => {
  try {
    return require('./eventos_get_lista').getEventosData
      ? require('./eventos_get_lista').getEventosData()
      : [];
  } catch {
    return [];
  }
};

module.exports = router;
