const jwt    = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'eventos_marca_blanca_secret';

const verificarToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  // Acepta token desde header Authorization O desde query param ?token= (para descargas directas)
  const token = (authHeader && authHeader.split(' ')[1]) || req.query.token;
  if (!token) return res.status(401).json({ error: 'Token requerido.' });
  try {
    req.usuario = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(403).json({ error: 'Token inválido.' });
  }
};

const verificarTokenOpcional = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token      = authHeader && authHeader.split(' ')[1];
  if (!token) { req.usuario = null; return next(); }
  try {
    req.usuario = jwt.verify(token, SECRET);
    next();
  } catch {
    req.usuario = null;
    next();
  }
};

// Esta parte es la clave:
// 1. Exportamos las funciones por su nombre
// 2. Exportamos verificarToken por defecto para las rutas que hacen require('../middleware/auth') a secas.
verificarToken.verificarToken = verificarToken;
verificarToken.verificarTokenOpcional = verificarTokenOpcional;

module.exports = verificarToken;