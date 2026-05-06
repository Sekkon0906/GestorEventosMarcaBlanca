const jwt = require('jsonwebtoken');
const SECRET = 'eventos_marca_blanca_secret';

module.exports = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Token requerido. Inicia sesión primero.' });
  }

  try {
    const decoded = jwt.verify(token, SECRET);
    req.usuario = decoded;
    next();
  } catch {
    res.status(403).json({ error: 'Token inválido o expirado.' });
  }
};
