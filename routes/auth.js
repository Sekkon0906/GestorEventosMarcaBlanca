const router  = require('express').Router();
const jwt     = require('jsonwebtoken');
const notificationService = require('../services/notification.service');
const { ROLES_VALIDOS, PERMISOS_POR_ROL } = require('../middleware/roles');

const usuarios = [];
const SECRET   = process.env.JWT_SECRET || 'eventos_marca_blanca_secret';

router.post('/register', (req, res) => {
  const { nombre, email, password, rol, permisos } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({
      error: 'Faltan campos: nombre, email y password son obligatorios.',
    });
  }

  const existe = usuarios.find((u) => u.email === email);
  if (existe) return res.status(409).json({ error: 'Ya existe un usuario con ese email.' });

  const rolFinal = rol || 'asistente';
  if (!ROLES_VALIDOS.includes(rolFinal)) {
    return res.status(400).json({
      error        : `Rol inválido. Valores permitidos: ${ROLES_VALIDOS.join(', ')}.`,
      roles_validos: ROLES_VALIDOS,
    });
  }

  const TODOS_LOS_PERMISOS = [...new Set(Object.values(PERMISOS_POR_ROL).flat())];
  const permisosExtra      = Array.isArray(permisos) ? permisos : [];
  const permisosInvalidos  = permisosExtra.filter((p) => !TODOS_LOS_PERMISOS.includes(p));
  if (permisosInvalidos.length > 0) {
    return res.status(400).json({
      error              : `Permisos inválidos: ${permisosInvalidos.join(', ')}.`,
      permisos_disponibles: TODOS_LOS_PERMISOS,
    });
  }

  const usuario = { id: Date.now(), nombre, email, password, rol: rolFinal, permisos: permisosExtra };
  usuarios.push(usuario);

  try {
    notificationService.create({
      type   : 'USER_REGISTRATION',
      message: `Nuevo usuario registrado: ${nombre} (${email}) — rol: ${rolFinal}`,
      userId : usuario.id,
    });
  } catch (err) {
    console.warn('[Notifications] No se pudo registrar la notificación:', err.message);
  }

  res.status(201).json({
    mensaje : 'Usuario registrado exitosamente',
    usuario : { id: usuario.id, nombre, email, rol: rolFinal, permisos: permisosExtra },
  });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: 'Email y password son obligatorios.' });

  const usuario = usuarios.find((u) => u.email === email && u.password === password);
  if (!usuario) return res.status(401).json({ error: 'Email o password incorrectos.' });

  const token = jwt.sign(
    {
      id      : usuario.id,
      nombre  : usuario.nombre,
      email   : usuario.email,
      rol     : usuario.rol     || 'asistente',
      permisos: usuario.permisos || [],
    },
    SECRET,
    { expiresIn: '2h' },
  );

  res.json({
    mensaje : 'Login exitoso',
    token,
    usuario : {
      id      : usuario.id,
      nombre  : usuario.nombre,
      email   : usuario.email,
      rol     : usuario.rol     || 'asistente',
      permisos: usuario.permisos || [],
    },
  });
});

module.exports = router;
