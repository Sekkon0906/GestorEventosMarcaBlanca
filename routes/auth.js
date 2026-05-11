const router    = require('express').Router();
const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const supabase  = require('../db/supabase');
const verificarToken = require('../middleware/auth');
const notificationService = require('../services/notification.service');
const { ROLES_VALIDOS, PERMISOS_POR_ROL } = require('../middleware/roles');

const SECRET = process.env.JWT_SECRET || 'gestek_secret_change_in_production';

// ── POST /auth/register ────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { nombre, email, password, rol, permisos } = req.body;

    if (!nombre || !email || !password)
      return res.status(400).json({ error: 'nombre, email y password son obligatorios.' });

    const rolFinal = rol || 'asistente';
    if (!ROLES_VALIDOS.includes(rolFinal))
      return res.status(400).json({ error: `Rol inválido. Valores: ${ROLES_VALIDOS.join(', ')}.`, roles_validos: ROLES_VALIDOS });

    const TODOS_LOS_PERMISOS = [...new Set(Object.values(PERMISOS_POR_ROL).flat())];
    const permisosExtra      = Array.isArray(permisos) ? permisos : [];
    const permisosInvalidos  = permisosExtra.filter(p => !TODOS_LOS_PERMISOS.includes(p));
    if (permisosInvalidos.length > 0)
      return res.status(400).json({ error: `Permisos inválidos: ${permisosInvalidos.join(', ')}.`, permisos_disponibles: TODOS_LOS_PERMISOS });

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
        nombre        : nombre.trim(),
        email         : email.toLowerCase().trim(),
        password_hash,
        rol           : rolFinal,
        permisos      : permisosExtra,
      })
      .select('id, nombre, email, rol, permisos, created_at')
      .single();

    if (insertError) throw insertError;

    try {
      notificationService.create({
        type   : 'USER_REGISTRATION',
        message: `Nuevo usuario registrado: ${usuario.nombre} (${usuario.email}) — rol: ${rolFinal}`,
        userId : usuario.id,
      });
    } catch { /* no-op */ }

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

    const token = jwt.sign(payload, SECRET, { expiresIn: '8h' });

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
