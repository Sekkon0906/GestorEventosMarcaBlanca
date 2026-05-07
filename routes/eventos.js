// eventos.js — Router principal (Juan Medina)
const router = require('express').Router();

// ── Sub-routers ────────────────────────────────────────────
// IMPORTANTE: /categorias debe montarse antes de /:id
// para que Express no interprete "categorias" como un :id
const getEventos    = require('./eventos_get_lista');   // GET  /eventos + GET /eventos/categorias
const postEvento    = require('./eventos_post');         // POST /eventos
const getEventoById = require('./eventos_get_detalle'); // GET  /eventos/:id

router.use('/', getEventos);
router.use('/', postEvento);
router.use('/', getEventoById);

module.exports = router;