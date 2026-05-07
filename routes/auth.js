const router = require('express').Router();
const jwt = require('jsonwebtoken');

const usuarios = [];
const SECRET = 'eventos_marca_blanca_secret';

// POST /auth/register
router.post('/register', (req, res) => {
  const { nombre, email, password } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({ error: 'Faltan campos: nombre, email y password son obligatorios.' });
  }

  const existe = usuarios.find(u => u.email === email);
  if (existe) {
    return res.status(409).json({ error: 'Ya existe un usuario con ese email.' });
  }

  const usuario = { id: Date.now(), nombre, email, password };
  usuarios.push(usuario);

  res.status(201).json({
    mensaje: 'Usuario registrado exitosamente',
    usuario: { id: usuario.id, nombre, email }
  });
});

// POST /auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y password son obligatorios.' });
  }

  const usuario = usuarios.find(u => u.email === email && u.password === password);

  if (!usuario) {
    return res.status(401).json({ error: 'Email o password incorrectos.' });
  }

  const token = jwt.sign(
    { id: usuario.id, nombre: usuario.nombre, email: usuario.email },
    SECRET,
    { expiresIn: '2h' }
  );

  res.json({
    mensaje: 'Login exitoso',
    token,
    usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email }
  });
});

module.exports = router;
