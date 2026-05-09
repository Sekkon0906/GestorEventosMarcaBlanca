const router         = require('express').Router();
const supabase       = require('../db/supabase');
const verificarToken = require('../middleware/auth');
const {
  requirePermiso,
  getPermisosEfectivos,
  PERMISOS_POR_ROL,
  ROLES_VALIDOS,
} = require('../middleware/roles');

// ════════════════════════════════════════════════════════════
//  GET /usuarios/me/permisos
//  Cualquier usuario autenticado puede ver sus propios permisos.
// ════════════════════════════════════════════════════════════
router.get('/me/permisos', verificarToken, (req, res) => {
  const usuario = req.usuario;
  const permisos = getPermisosEfectivos(usuario);
  res.json({
    id                : usuario.id,
    nombre            : usuario.nombre,
    email             : usuario.email,
    rol               : usuario.rol || 'asistente',
    permisos_efectivos: permisos,
    permisos_extra    : usuario.permisos || [],
  });
});

// ════════════════════════════════════════════════════════════
//  GET /usuarios
// ════════════════════════════════════════════════════════════
router.get('/', verificarToken, requirePermiso('usuarios:ver'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nombre, email, rol, permisos, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const usuariosConPermisos = data.map((u) => ({
      ...u,
      permisos_efectivos: getPermisosEfectivos(u),
    }));

    res.json({ total: data.length, usuarios: usuariosConPermisos });
  } catch (err) {
    console.error('GET /usuarios:', err.message);
    res.status(500).json({ error: 'Error al obtener usuarios.' });
  }
});

// ════════════════════════════════════════════════════════════
//  GET /usuarios/:id
// ════════════════════════════════════════════════════════════
router.get('/:id', verificarToken, requirePermiso('usuarios:ver'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nombre, email, rol, permisos, created_at')
      .eq('id', req.params.id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Usuario no encontrado.' });

    res.json({ ...data, permisos_efectivos: getPermisosEfectivos(data) });
  } catch (err) {
    console.error('GET /usuarios/:id:', err.message);
    res.status(500).json({ error: 'Error al obtener el usuario.' });
  }
});

// ════════════════════════════════════════════════════════════
//  PATCH /usuarios/:id/rol
//  Body: { "rol": "organizador" }
// ════════════════════════════════════════════════════════════
router.patch('/:id/rol', verificarToken, requirePermiso('usuarios:asignar_rol'), async (req, res) => {
  try {
    const { id }  = req.params;
    const { rol } = req.body;

    if (!rol || !ROLES_VALIDOS.includes(rol)) {
      return res.status(400).json({
        error        : `Rol inválido. Valores permitidos: ${ROLES_VALIDOS.join(', ')}.`,
        roles_validos: ROLES_VALIDOS,
      });
    }

    if (String(req.usuario.id) === String(id) && rol !== 'admin_global') {
      return res.status(403).json({
        error: 'No puedes quitarte a ti mismo el rol de admin_global.',
      });
    }

    const { data, error } = await supabase
      .from('usuarios')
      .update({ rol })
      .eq('id', id)
      .select('id, nombre, email, rol, permisos')
      .single();

    if (error || !data) return res.status(404).json({ error: 'Usuario no encontrado.' });

    res.json({
      mensaje : `Rol actualizado a "${rol}" correctamente.`,
      usuario : { ...data, permisos_efectivos: getPermisosEfectivos(data) },
    });
  } catch (err) {
    console.error('PATCH /usuarios/:id/rol:', err.message);
    res.status(500).json({ error: 'Error al actualizar el rol.' });
  }
});

// ════════════════════════════════════════════════════════════
//  PATCH /usuarios/:id/permisos
//  Body: { "agregar": ["eventos:publicar"], "quitar": ["eventos:eliminar"] }
// ════════════════════════════════════════════════════════════
router.patch('/:id/permisos', verificarToken, requirePermiso('usuarios:editar'), async (req, res) => {
  try {
    const { id }              = req.params;
    const { agregar, quitar } = req.body;

    if (agregar && !Array.isArray(agregar))
      return res.status(400).json({ error: '"agregar" debe ser un array de permisos.' });
    if (quitar && !Array.isArray(quitar))
      return res.status(400).json({ error: '"quitar" debe ser un array de permisos.' });

    const TODOS_LOS_PERMISOS  = [...new Set(Object.values(PERMISOS_POR_ROL).flat())];
    const permisosInvalidos   = [...(agregar || []), ...(quitar || [])].filter(
      (p) => !TODOS_LOS_PERMISOS.includes(p)
    );

    if (permisosInvalidos.length > 0) {
      return res.status(400).json({
        error              : `Permisos inválidos: ${permisosInvalidos.join(', ')}.`,
        permisos_disponibles: TODOS_LOS_PERMISOS,
      });
    }

    const { data: usuarioActual, error: fetchError } = await supabase
      .from('usuarios')
      .select('id, nombre, email, rol, permisos')
      .eq('id', id)
      .single();

    if (fetchError || !usuarioActual)
      return res.status(404).json({ error: 'Usuario no encontrado.' });

    let permisosActuales = usuarioActual.permisos || [];
    if (agregar?.length) permisosActuales = [...new Set([...permisosActuales, ...agregar])];
    if (quitar?.length)  permisosActuales = permisosActuales.filter((p) => !quitar.includes(p));

    const { data, error } = await supabase
      .from('usuarios')
      .update({ permisos: permisosActuales })
      .eq('id', id)
      .select('id, nombre, email, rol, permisos')
      .single();

    if (error) throw error;

    res.json({
      mensaje : 'Permisos actualizados correctamente.',
      usuario : { ...data, permisos_efectivos: getPermisosEfectivos(data) },
    });
  } catch (err) {
    console.error('PATCH /usuarios/:id/permisos:', err.message);
    res.status(500).json({ error: 'Error al actualizar los permisos.' });
  }
});

// ════════════════════════════════════════════════════════════
//  GET /usuarios/:id/permisos
// ════════════════════════════════════════════════════════════
router.get('/:id/permisos', verificarToken, requirePermiso('usuarios:ver'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nombre, email, rol, permisos')
      .eq('id', req.params.id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Usuario no encontrado.' });

    res.json({
      id                : data.id,
      nombre            : data.nombre,
      email             : data.email,
      rol               : data.rol || 'asistente',
      permisos_de_rol   : PERMISOS_POR_ROL[data.rol || 'asistente'] || [],
      permisos_extra    : data.permisos || [],
      permisos_efectivos: getPermisosEfectivos(data),
    });
  } catch (err) {
    console.error('GET /usuarios/:id/permisos:', err.message);
    res.status(500).json({ error: 'Error al obtener los permisos.' });
  }
});

// ════════════════════════════════════════════════════════════
//  DELETE /usuarios/:id
// ════════════════════════════════════════════════════════════
router.delete('/:id', verificarToken, requirePermiso('usuarios:eliminar'), async (req, res) => {
  try {
    const { id } = req.params;

    if (String(req.usuario.id) === String(id))
      return res.status(403).json({ error: 'No puedes eliminarte a ti mismo.' });

    const { error } = await supabase.from('usuarios').delete().eq('id', id);
    if (error) throw error;

    res.json({ mensaje: 'Usuario eliminado correctamente.' });
  } catch (err) {
    console.error('DELETE /usuarios/:id:', err.message);
    res.status(500).json({ error: 'Error al eliminar el usuario.' });
  }
});

module.exports = router;
