const router    = require('express').Router();
const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const supabase  = require('../db/supabase');
const verificarToken = require('../middleware/auth');
const notificationService = require('../services/notification.service');
const { PERMISOS_POR_ROL } = require('../middleware/roles');
const { JWT_SECRET, JWT_EXPIRES } = require('../config/env');

// ── POST /auth/register ────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { nombre, email, password } = req.body;

    // Nota: `rol` y `permisos` del body son ignorados intencionalmente.
    // Todo usuario nuevo nace como "asistente". El rol lo asigna un admin_global.

    if (!nombre || !email || !password)
      return res.status(400).json({ error: 'nombre, email y password son obligatorios.' });

    if (password.length < 8)
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres.' });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return res.status(400).json({ error: 'Formato de email inválido.' });

    const { data: existe } = await supabase
      .from('usuarios')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (existe)
      return res.status(409).json({ error: 'Ya existe un usuario con ese email.' });

    const password_hash = await bcrypt.hash(password, 10);

    const { data: usuario, error: insertError } = await supabase
      .from('usuarios')
      .insert({
        nombre       : nombre.trim(),
        email        : email.toLowerCase().trim(),
        password_hash,
        rol          : 'asistente',   // siempre asistente — nunca del body
        permisos     : [],
      })
      .select('id, nombre, email, rol, permisos, created_at')
      .single();

    if (insertError) throw insertError;

    try {
      notificationService.create({
        type   : 'USER_REGISTRATION',
        message: `Nuevo usuario registrado: ${usuario.nombre} (${usuario.email})`,
        userId : usuario.id,
      });
    } catch { /* notificación no bloquea el flujo */ }

    res.status(201).json({
      mensaje : 'Usuario registrado exitosamente.',
      usuario : { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol, permisos: usuario.permisos },
    });
  } catch (err) {
    console.error('POST /auth/register:', err.message);
    res.status(500).json({ error: 'Error interno al registrar el usuario.' });
  }
});

// ── POST /auth/login ───────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: 'email y password son obligatorios.' });

    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('id, nombre, email, password_hash, rol, permisos, organizacion_id')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (error) throw error;
    if (!usuario)
      return res.status(401).json({ error: 'Email o password incorrectos.' });

    const passwordValido = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordValido)
      return res.status(401).json({ error: 'Email o password incorrectos.' });

    const payload = {
      id             : usuario.id,
      nombre         : usuario.nombre,
      email          : usuario.email,
      rol            : usuario.rol      || 'asistente',
      permisos       : usuario.permisos  || [],
      organizacion_id: usuario.organizacion_id || null,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });

    res.json({ mensaje: 'Login exitoso.', token, usuario: payload });
  } catch (err) {
    console.error('POST /auth/login:', err.message);
    res.status(500).json({ error: 'Error interno al iniciar sesión.' });
  }
});

// ── GET /auth/me ───────────────────────────────────────────
router.get('/me', verificarToken, async (req, res) => {
  try {
    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('id, nombre, email, rol, permisos, organizacion_id, created_at')
      .eq('id', req.usuario.id)
      .single();

    if (error || !usuario)
      return res.status(404).json({ error: 'Usuario no encontrado.' });

    res.json({ usuario });
  } catch (err) {
    console.error('GET /auth/me:', err.message);
    res.status(500).json({ error: 'Error al obtener el perfil.' });
  }
});

// ── PATCH /auth/me ─────────────────────────────────────────
router.patch('/me', verificarToken, async (req, res) => {
  try {
    const { nombre, password } = req.body;
    const updates = {};

    if (nombre) updates.nombre = nombre.trim();
    if (password) updates.password_hash = await bcrypt.hash(password, 10);

    if (Object.keys(updates).length === 0)
      return res.status(400).json({ error: 'No hay campos para actualizar.' });

    const { data: usuario, error } = await supabase
      .from('usuarios')
      .update(updates)
      .eq('id', req.usuario.id)
      .select('id, nombre, email, rol, permisos')
      .single();

    if (error) throw error;
    res.json({ mensaje: 'Perfil actualizado.', usuario });
  } catch (err) {
    console.error('PATCH /auth/me:', err.message);
    res.status(500).json({ error: 'Error al actualizar el perfil.' });
  }
});

module.exports = router;
