const router         = require('express').Router();
const verificarToken = require('../middleware/auth');

// ─────────────────────────────────────────────────────────────
// Sistema de puntos en memoria
// En producción esto viviría en Supabase (tabla points_log)
// ─────────────────────────────────────────────────────────────
const puntosUsuarios = {}; // { userId: { puntos, acciones: [] } }

const PUNTOS = {
  inscripcion : 50,
  checkin     : 100,
  referido    : 75,
  encuesta    : 25,
};

const NIVELES = [
  { nombre: 'Bronze',   minPuntos: 0,    icono: '🥉', color: '#cd7f32' },
  { nombre: 'Silver',   minPuntos: 200,  icono: '🥈', color: '#c0c0c0' },
  { nombre: 'Gold',     minPuntos: 500,  icono: '🥇', color: '#ffd700' },
  { nombre: 'Platinum', minPuntos: 1000, icono: '💎', color: '#e5e4e2' },
];

function getNivel(puntos) {
  let nivel = NIVELES[0];
  for (const n of NIVELES) {
    if (puntos >= n.minPuntos) nivel = n;
  }
  const idx = NIVELES.indexOf(nivel);
  const siguiente = NIVELES[idx + 1] || null;
  return {
    ...nivel,
    siguiente,
    puntosParaSiguiente: siguiente ? siguiente.minPuntos - puntos : 0,
    progreso: siguiente
      ? Math.round(((puntos - nivel.minPuntos) / (siguiente.minPuntos - nivel.minPuntos)) * 100)
      : 100,
  };
}

function getPerfil(userId) {
  if (!puntosUsuarios[userId]) {
    puntosUsuarios[userId] = { puntos: 0, acciones: [] };
  }
  return puntosUsuarios[userId];
}

// ─────────────────────────────────────────────────────────────
// Función exportada — agregar puntos desde otros módulos
// ─────────────────────────────────────────────────────────────
function agregarPuntos(userId, nombre, accion, eventoId = null) {
  const pts = PUNTOS[accion] || 0;
  if (!pts) return;

  const perfil = getPerfil(userId);
  perfil.puntos += pts;
  perfil.acciones.push({
    accion,
    puntos     : pts,
    evento_id  : eventoId,
    fecha      : new Date().toISOString(),
  });

  console.log(`🎮 [PUNTOS] +${pts} pts → usuario ${nombre} (${accion}) | Total: ${perfil.puntos}`);
  return perfil.puntos;
}

// ─────────────────────────────────────────────────────────────
// GET /gamificacion/mis-puntos
// El usuario ve sus puntos, nivel y progreso
// ─────────────────────────────────────────────────────────────
router.get('/mis-puntos', verificarToken, (req, res) => {
  const usuario = req.usuario;
  const perfil  = getPerfil(usuario.id);
  const nivel   = getNivel(perfil.puntos);

  res.json({
    usuario: {
      id    : usuario.id,
      nombre: usuario.nombre,
      email : usuario.email,
    },
    puntos   : perfil.puntos,
    nivel,
    historial: perfil.acciones.slice(-10).reverse(), // últimas 10 acciones
    tabla_puntos: PUNTOS,
  });
});

// ─────────────────────────────────────────────────────────────
// GET /gamificacion/ranking
// Top 10 usuarios con más puntos
// ─────────────────────────────────────────────────────────────
router.get('/ranking', verificarToken, (req, res) => {
  const ranking = Object.entries(puntosUsuarios)
    .map(([userId, data]) => ({
      user_id: userId,
      puntos : data.puntos,
      nivel  : getNivel(data.puntos).nombre,
      icono  : getNivel(data.puntos).icono,
    }))
    .sort((a, b) => b.puntos - a.puntos)
    .slice(0, 10);

  res.json({ ranking, total_participantes: Object.keys(puntosUsuarios).length });
});

// ─────────────────────────────────────────────────────────────
// POST /gamificacion/sumar  (para pruebas manuales)
// ─────────────────────────────────────────────────────────────
router.post('/sumar', verificarToken, (req, res) => {
  const { accion, evento_id } = req.body;
  const usuario = req.usuario;

  if (!PUNTOS[accion]) {
    return res.status(400).json({
      error: 'Acción no válida.',
      acciones_disponibles: Object.keys(PUNTOS),
    });
  }

  const totalPuntos = agregarPuntos(usuario.id, usuario.nombre, accion, evento_id);
  const nivel = getNivel(totalPuntos);

  res.json({
    mensaje        : `+${PUNTOS[accion]} puntos por "${accion}" 🎉`,
    puntos_ganados : PUNTOS[accion],
    total_puntos   : totalPuntos,
    nivel,
  });
});

module.exports = router;
module.exports.agregarPuntos = agregarPuntos;
