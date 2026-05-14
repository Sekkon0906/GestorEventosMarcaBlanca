const router         = require('express').Router();
const jwt            = require('jsonwebtoken');
const QRCode         = require('qrcode');
const verificarToken = require('../middleware/auth');
const { enviarConfirmacionInscripcion } = require('../services/email.service');
const { agregarPuntos } = require('./gamificacion');

const SECRET = process.env.JWT_SECRET || 'eventos_marca_blanca_secret';

// Almacenamiento en memoria de inscripciones (funciona sin Supabase)
const inscripciones = [];

// ─────────────────────────────────────────────────────────────
// POST /qr/inscribirse/:eventoId
// El usuario autenticado se inscribe y recibe un QR único
// ─────────────────────────────────────────────────────────────
router.post('/inscribirse/:eventoId', verificarToken, async (req, res) => {
  try {
    const { eventoId } = req.params;
    const { tipo_entrada = 'General' } = req.body;
    const usuario = req.usuario;

    // Verificar que no esté ya inscrito
    const yaInscrito = inscripciones.find(
      i => i.evento_id == eventoId && i.user_id === usuario.id
    );
    if (yaInscrito) {
      return res.status(409).json({
        error: 'Ya estás inscrito en este evento.',
        qr_token: yaInscrito.qr_token,
      });
    }

    // Crear el payload del QR (JWT firmado)
    const payload = {
      evento_id   : eventoId,
      user_id     : usuario.id,
      nombre      : usuario.nombre,
      email       : usuario.email,
      tipo_entrada,
      inscrito_en : new Date().toISOString(),
    };

    const qr_token = jwt.sign(payload, SECRET, { expiresIn: '30d' });

    // Guardar inscripción en memoria
    const inscripcion = {
      id          : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      evento_id   : eventoId,
      user_id     : usuario.id,
      nombre      : usuario.nombre,
      email       : usuario.email,
      tipo_entrada,
      qr_token,
      usado       : false,
      fecha_checkin: null,
      inscrito_en : new Date().toISOString(),
    };

    inscripciones.push(inscripcion);

    // Generar imagen QR en base64
    const qr_imagen = await QRCode.toDataURL(qr_token, {
      width       : 300,
      margin      : 2,
      color       : { dark: '#000000', light: '#ffffff' },
    });

    // 📧 Enviar email de confirmación con QR
    enviarConfirmacionInscripcion({
      nombre      : usuario.nombre,
      email       : usuario.email,
      eventoId,
      eventoNombre: req.body.evento_nombre || null,
      tipoEntrada : tipo_entrada,
      qrImagen    : qr_imagen,
    }).catch(err => console.error('Email error:', err.message));

    // 🎮 Sumar puntos por inscripción
    agregarPuntos(usuario.id, usuario.nombre, 'inscripcion', eventoId);

    res.status(201).json({
      mensaje      : '¡Inscripción exitosa! Guarda tu QR de entrada.',
      inscripcion  : {
        id          : inscripcion.id,
        evento_id   : eventoId,
        nombre      : usuario.nombre,
        email       : usuario.email,
        tipo_entrada,
        inscrito_en : inscripcion.inscrito_en,
      },
      qr_token,
      qr_imagen,    // base64 PNG — úsalo en <img src="...">
    });

  } catch (err) {
    console.error('POST /qr/inscribirse:', err.message);
    res.status(500).json({ error: 'Error al generar la inscripción.' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /qr/mi-entrada/:eventoId
// El usuario autenticado ve su QR de un evento
// ─────────────────────────────────────────────────────────────
router.get('/mi-entrada/:eventoId', verificarToken, async (req, res) => {
  try {
    const { eventoId } = req.params;
    const usuario = req.usuario;

    const inscripcion = inscripciones.find(
      i => i.evento_id == eventoId && i.user_id === usuario.id
    );

    if (!inscripcion) {
      return res.status(404).json({ error: 'No estás inscrito en este evento.' });
    }

    const qr_imagen = await QRCode.toDataURL(inscripcion.qr_token, {
      width : 300,
      margin: 2,
    });

    res.json({
      inscripcion: {
        id          : inscripcion.id,
        evento_id   : eventoId,
        nombre      : inscripcion.nombre,
        email       : inscripcion.email,
        tipo_entrada: inscripcion.tipo_entrada,
        usado       : inscripcion.usado,
        fecha_checkin: inscripcion.fecha_checkin,
        inscrito_en : inscripcion.inscrito_en,
      },
      qr_imagen,
    });

  } catch (err) {
    console.error('GET /qr/mi-entrada:', err.message);
    res.status(500).json({ error: 'Error al obtener el QR.' });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /qr/verificar
// El staff escanea el QR — verde si válido, rojo si ya fue usado
// ─────────────────────────────────────────────────────────────
router.post('/verificar', verificarToken, (req, res) => {
  try {
    const { qr_token } = req.body;

    if (!qr_token) {
      return res.status(400).json({ error: 'Se requiere el qr_token.' });
    }

    // Verificar firma del JWT
    let payload;
    try {
      payload = jwt.verify(qr_token, SECRET);
    } catch {
      return res.status(400).json({
        valido  : false,
        estado  : 'invalido',
        mensaje : '❌ QR inválido o adulterado.',
        color   : 'rojo',
      });
    }

    // Buscar la inscripción
    const inscripcion = inscripciones.find(i => i.qr_token === qr_token);

    if (!inscripcion) {
      return res.status(404).json({
        valido  : false,
        estado  : 'no_encontrado',
        mensaje : '❌ Este QR no está registrado.',
        color   : 'rojo',
      });
    }

    // Si ya fue usado
    if (inscripcion.usado) {
      return res.status(200).json({
        valido        : false,
        estado        : 'ya_usado',
        mensaje       : '⚠️ Este QR ya fue escaneado.',
        color         : 'amarillo',
        fecha_checkin : inscripcion.fecha_checkin,
        asistente     : { nombre: inscripcion.nombre, email: inscripcion.email },
      });
    }

    // Marcar como usado ✅
    inscripcion.usado         = true;
    inscripcion.fecha_checkin = new Date().toISOString();

    // 🎮 Sumar puntos por check-in
    agregarPuntos(payload.user_id, payload.nombre, 'checkin', payload.evento_id);

    return res.json({
      valido      : true,
      estado      : 'ok',
      mensaje     : '✅ Entrada válida. ¡Bienvenido!',
      color       : 'verde',
      asistente   : {
        nombre      : inscripcion.nombre,
        email       : inscripcion.email,
        tipo_entrada: inscripcion.tipo_entrada,
        evento_id   : inscripcion.evento_id,
      },
      fecha_checkin: inscripcion.fecha_checkin,
    });

  } catch (err) {
    console.error('POST /qr/verificar:', err.message);
    res.status(500).json({ error: 'Error al verificar el QR.' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /qr/asistentes/:eventoId
// Lista de inscritos en un evento (para el organizador)
// ─────────────────────────────────────────────────────────────
router.get('/asistentes/:eventoId', verificarToken, (req, res) => {
  const { eventoId } = req.params;
  const lista = inscripciones
    .filter(i => i.evento_id == eventoId)
    .map(i => ({
      id           : i.id,
      nombre       : i.nombre,
      email        : i.email,
      tipo_entrada : i.tipo_entrada,
      usado        : i.usado,
      fecha_checkin: i.fecha_checkin,
      inscrito_en  : i.inscrito_en,
    }));

  res.json({
    evento_id  : eventoId,
    total      : lista.length,
    presentes  : lista.filter(i => i.usado).length,
    ausentes   : lista.filter(i => !i.usado).length,
    asistentes : lista,
  });
});

module.exports = router;
