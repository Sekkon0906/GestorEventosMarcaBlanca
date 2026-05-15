'use strict';

/**
 * routes/eventos_post.js
 *
 * Router delgado para POST /eventos y GET /eventos/categorias.
 * Toda la validación → validators/evento.validator.js
 * Toda la lógica     → services/evento.service.js
 *
 * Este archivo solo parsea, delega y responde.
 */

const router         = require('express').Router();
const verificarToken = require('../middleware/auth');
const eventoService  = require('../services/evento.service');
const { validateCrear } = require('../validators/evento.validator');

// ── GET /eventos/categorias ───────────────────────────────
router.get('/categorias', async (req, res) => {
  try {
    const data = await eventoService.getCategorias(req.query.q);
    res.json(data);
  } catch (err) {
    console.error('GET /eventos/categorias:', err.message);
    res.status(500).json({ error: 'Error al obtener categorías.' });
  }
});

// ── POST /eventos ─────────────────────────────────────────
router.post('/', verificarToken, async (req, res) => {
  // 1. Validar shape (sin efectos secundarios)
  const validationError = validateCrear(req.body);
  if (validationError) {
    return res.status(validationError.status).json({
      error: validationError.error,
      ...(validationError.campo         && { campo: validationError.campo }),
      ...(validationError.campos        && { campos: validationError.campos }),
      ...(validationError.opciones_validas && { opciones_validas: validationError.opciones_validas }),
      ...(validationError.ejemplo       && { ejemplo: validationError.ejemplo }),
    });
  }

  try {
    // 2. Delegar al service (lógica + BD)
    const result = await eventoService.crear(req.body, req.usuario);

    if (!result.ok) {
      return res.status(result.status).json({
        error: result.error,
        ...(result.meta || {}),
      });
    }

    // 3. Responder — mismo formato que antes
    return res.status(201).json(result.data);

  } catch (err) {
    console.error('POST /eventos:', err.message);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

module.exports = router;
