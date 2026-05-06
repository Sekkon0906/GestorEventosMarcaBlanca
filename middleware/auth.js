const jwt    = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'eventos_marca_blanca_secret';

// ════════════════════════════════════════════════════════════
//  MODO ESTRICTO — verificarToken
//  Úsalo en rutas que REQUIEREN autenticación.
//  Si no hay token o es inválido → 401 / 403
//  Uso: router.post('/', verificarToken, (req, res) => { ... })
// ════════════════════════════════════════════════════════════
const verificarToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token      = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Token requerido. Inicia sesión primero.' });
  }

  try {
    req.usuario = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(403).json({ error: 'Token inválido o expirado.' });
  }
};

// ════════════════════════════════════════════════════════════
//  MODO OPCIONAL — verificarTokenOpcional
//  Úsalo en rutas PÚBLICAS que también funcionan con token.
//  Si hay token válido  → req.usuario = { datos del usuario }
//  Si no hay token      → req.usuario = null (sigue sin bloquear)
//  Uso: router.get('/', verificarTokenOpcional, (req, res) => { ... })
// ════════════════════════════════════════════════════════════
const verificarTokenOpcional = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token      = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.usuario = null;
    return next();
  }

  try {
    req.usuario = jwt.verify(token, SECRET);
    next();
  } catch {
    // Token inválido → tratar como anónimo, no bloquear
    req.usuario = null;
    next();
  }
};

module.exports = { verificarToken, verificarTokenOpcional };