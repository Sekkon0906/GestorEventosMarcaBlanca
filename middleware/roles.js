/**
 * middleware/roles.js — JuanesSosa
 * Roles de administrador global y sistema de permisos granular en usuarios.
 *
 * ROLES DISPONIBLES:
 *   admin_global  → acceso total al sistema
 *   organizador   → puede crear/editar sus propios eventos
 *   asistente     → puede inscribirse a eventos
 *
 * PERMISOS GRANULARES (se asignan individualmente a cada usuario):
 *   eventos:crear        → crear nuevos eventos
 *   eventos:editar       → editar eventos propios
 *   eventos:eliminar     → eliminar eventos propios
 *   eventos:publicar     → cambiar estado a publicado
 *   usuarios:ver         → listar usuarios (solo admin_global por defecto)
 *   usuarios:editar      → editar datos de otros usuarios
 *   usuarios:eliminar    → eliminar usuarios
 *   usuarios:asignar_rol → cambiar el rol de un usuario
 *   notificaciones:ver   → ver notificaciones del sistema
 */

// ── Permisos por defecto según rol ──────────────────────────
const PERMISOS_POR_ROL = {
  admin_global: [
    'eventos:crear',
    'eventos:editar',
    'eventos:eliminar',
    'eventos:publicar',
    'usuarios:ver',
    'usuarios:editar',
    'usuarios:eliminar',
    'usuarios:asignar_rol',
    'notificaciones:ver',
  ],
  organizador: [
    'eventos:crear',
    'eventos:editar',
    'eventos:eliminar',
    'eventos:publicar',
  ],
  asistente: [],
};

const ROLES_VALIDOS = Object.keys(PERMISOS_POR_ROL);

// ────────────────────────────────────────────────────────────
//  requireRol(...roles)
//  Verifica que el usuario autenticado tenga al menos uno de
//  los roles indicados. Debe usarse después de verificarToken.
//
//  Uso: router.delete('/:id', verificarToken, requireRol('admin_global'), handler)
// ────────────────────────────────────────────────────────────
const requireRol = (...roles) => (req, res, next) => {
  const usuario = req.usuario;
  if (!usuario) {
    return res.status(401).json({ error: 'Autenticación requerida.' });
  }

  const rolUsuario = usuario.rol || 'asistente';

  // admin_global siempre pasa
  if (rolUsuario === 'admin_global') return next();

  if (roles.includes(rolUsuario)) return next();

  return res.status(403).json({
    error: `Acceso denegado. Se requiere uno de los roles: ${roles.join(', ')}.`,
    tu_rol: rolUsuario,
  });
};

// ────────────────────────────────────────────────────────────
//  requirePermiso(permiso)
//  Verifica que el usuario tenga un permiso específico.
//  Combina los permisos de su rol + permisos granulares extra
//  que se hayan asignado individualmente.
//
//  Uso: router.post('/', verificarToken, requirePermiso('eventos:crear'), handler)
// ────────────────────────────────────────────────────────────
const requirePermiso = (permiso) => (req, res, next) => {
  const usuario = req.usuario;
  if (!usuario) {
    return res.status(401).json({ error: 'Autenticación requerida.' });
  }

  const rolUsuario     = usuario.rol || 'asistente';
  const permisosDeRol  = PERMISOS_POR_ROL[rolUsuario] || [];
  const permisosExtra  = usuario.permisos || [];            // permisos granulares guardados en el JWT
  const todosPermisos  = [...new Set([...permisosDeRol, ...permisosExtra])];

  if (todosPermisos.includes(permiso)) return next();

  return res.status(403).json({
    error: `Permiso insuficiente. Se requiere: ${permiso}.`,
    tu_rol: rolUsuario,
    tus_permisos: todosPermisos,
  });
};

// ────────────────────────────────────────────────────────────
//  getPermisosEfectivos(usuario)
//  Devuelve todos los permisos activos de un usuario
//  (rol base + granulares extra).
// ────────────────────────────────────────────────────────────
const getPermisosEfectivos = (usuario) => {
  const rol           = usuario.rol || 'asistente';
  const permisosDeRol = PERMISOS_POR_ROL[rol] || [];
  const permisosExtra = usuario.permisos || [];
  return [...new Set([...permisosDeRol, ...permisosExtra])];
};

module.exports = {
  requireRol,
  requirePermiso,
  getPermisosEfectivos,
  PERMISOS_POR_ROL,
  ROLES_VALIDOS,
};
