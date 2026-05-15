'use strict';

/**
 * middleware/auth.js
 *
 * Verifica el JWT en el header Authorization: Bearer <token>.
 * El SECRET se obtiene de config/env.js — nunca tiene fallback hardcodeado.
 * Si JWT_SECRET no está configurado, config/env.js ya habrá abortado el proceso.
 */

const jwt    = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');

// ── verificarToken — uso en rutas protegidas ─────────────────
const verificarToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token      = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Token requerido.' });

  try {
    req.usuario = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    const msg = err.name === 'TokenExpiredError'
      ? 'Token expirado. Vuelve a iniciar sesión.'
      : 'Token inválido.';
    res.status(403).json({ error: msg });
  }
};

// ── verificarTokenOpcional — para endpoints públicos con auth opcional ───
const verificarTokenOpcional = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token      = authHeader && authHeader.split(' ')[1];

  if (!token) { req.usuario = null; return next(); }

  try {
    req.usuario = jwt.verify(token, JWT_SECRET);
  } catch {
    req.usuario = null;
  }
  next();
};

// Mantener compatibilidad con require('../middleware/auth') y require('../middleware/auth').verificarToken
verificarToken.verificarToken         = verificarToken;
verificarToken.verificarTokenOpcional = verificarTokenOpcional;

module.exports = verificarToken;
