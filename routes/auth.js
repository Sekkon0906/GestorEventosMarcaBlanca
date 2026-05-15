'use strict';

/**
 * routes/auth.js
 *
 * Router delgado — solo parseo de request, delegación al service, respuesta HTTP.
 * Toda la lógica de negocio vive en services/auth.service.js
 * Toda la validación de inputs vive en validators/auth.validator.js
 */

const router             = require('express').Router();
const verificarToken     = require('../middleware/auth');
const authService        = require('../services/auth.service');
const { validateRegister, validateLogin, validateUpdateMe } = require('../validators/auth.validator');
const notificationService = require('../services/notification.service');

// ── POST /auth/register ────────────────────────────────────
router.post('/register', async (req, res) => {
  const validationError = validateRegister(req.body);
  if (validationError) return res.status(validationError.status).json({ error: validationError.error });

  try {
    const result = await authService.register(req.body);
    if (!result.ok) return res.status(result.status).json({ error: result.error });

    try {
      notificationService.create({
        type   : 'USER_REGISTRATION',
        message: `Nuevo usuario registrado: ${result.data.nombre} (${result.data.email})`,
        userId : result.data.id,
      });
    } catch { /* notificación no bloquea el flujo */ }

    res.status(201).json({ mensaje: 'Usuario registrado exitosamente.', usuario: result.data });
  } catch (err) {
    console.error('POST /auth/register:', err.message);
    res.status(500).json({ error: 'Error interno al registrar el usuario.' });
  }
});

// ── POST /auth/login ───────────────────────────────────────
router.post('/login', async (req, res) => {
  const validationError = validateLogin(req.body);
  if (validationError) return res.status(validationError.status).json({ error: validationError.error });

  try {
    const result = await authService.login(req.body);
    if (!result.ok) return res.status(result.status).json({ error: result.error });

    res.json({ mensaje: 'Login exitoso.', ...result.data });
  } catch (err) {
    console.error('POST /auth/login:', err.message);
    res.status(500).json({ error: 'Error interno al iniciar sesión.' });
  }
});

// ── GET /auth/me ───────────────────────────────────────────
router.get('/me', verificarToken, async (req, res) => {
  try {
    const result = await authService.getProfile(req.usuario.id);
    if (!result.ok) return res.status(result.status).json({ error: result.error });

    res.json(result.data);
  } catch (err) {
    console.error('GET /auth/me:', err.message);
    res.status(500).json({ error: 'Error al obtener el perfil.' });
  }
});

// ── PATCH /auth/me ─────────────────────────────────────────
router.patch('/me', verificarToken, async (req, res) => {
  const validationError = validateUpdateMe(req.body);
  if (validationError) return res.status(validationError.status).json({ error: validationError.error });

  try {
    const result = await authService.updateProfile(req.usuario.id, req.body);
    if (!result.ok) return res.status(result.status).json({ error: result.error });

    res.json({ mensaje: 'Perfil actualizado.', ...result.data });
  } catch (err) {
    console.error('PATCH /auth/me:', err.message);
    res.status(500).json({ error: 'Error al actualizar el perfil.' });
  }
});

module.exports = router;
