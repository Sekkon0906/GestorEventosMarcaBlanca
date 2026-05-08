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

const requireRol = (...roles) => (req, res, next) => {
  const usuario = req.usuario;
  if (!usuario) {
    return res.status(401).json({ error: 'Autenticación requerida.' });
  }
  const rolUsuario = usuario.rol || 'asistente';
  if (rolUsuario === 'admin_global') return next();
  if (roles.includes(rolUsuario)) return next();
  return res.status(403).json({
    error: `Acceso denegado. Se requiere uno de los roles: ${roles.join(', ')}.`,
    tu_rol: rolUsuario,
  });
};

const requirePermiso = (permiso) => (req, res, next) => {
  const usuario = req.usuario;
  if (!usuario) {
    return res.status(401).json({ error: 'Autenticación requerida.' });
  }
  const rolUsuario    = usuario.rol || 'asistente';
  const permisosDeRol = PERMISOS_POR_ROL[rolUsuario] || [];
  const permisosExtra = usuario.permisos || [];
  const todosPermisos = [...new Set([...permisosDeRol, ...permisosExtra])];
  if (todosPermisos.includes(permiso)) return next();
  return res.status(403).json({
    error: `Permiso insuficiente. Se requiere: ${permiso}.`,
    tu_rol: rolUsuario,
    tus_permisos: todosPermisos,
  });
};

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
