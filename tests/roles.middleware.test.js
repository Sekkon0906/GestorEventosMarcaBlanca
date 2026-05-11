/**
 * tests/roles.middleware.test.js — JuanesSosa (QA)
 * Suite de tests unitarios para middleware/roles.js
 */

const {
  requireRol,
  requirePermiso,
  getPermisosEfectivos,
  PERMISOS_POR_ROL,
  ROLES_VALIDOS,
} = require('../middleware/roles');

// Helper: crea mocks de req, res, next
const mockReq = (usuario) => ({ usuario });
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};
const mockNext = () => jest.fn();

// ── PERMISOS_POR_ROL ──────────────────────────────────────

describe('PERMISOS_POR_ROL', () => {
  it('admin_global tiene todos los permisos del sistema', () => {
    expect(PERMISOS_POR_ROL.admin_global).toContain('usuarios:ver');
    expect(PERMISOS_POR_ROL.admin_global).toContain('usuarios:asignar_rol');
    expect(PERMISOS_POR_ROL.admin_global).toContain('eventos:publicar');
  });

  it('organizador puede crear, editar, eliminar y publicar eventos', () => {
    expect(PERMISOS_POR_ROL.organizador).toContain('eventos:crear');
    expect(PERMISOS_POR_ROL.organizador).toContain('eventos:editar');
    expect(PERMISOS_POR_ROL.organizador).toContain('eventos:eliminar');
    expect(PERMISOS_POR_ROL.organizador).toContain('eventos:publicar');
  });

  it('organizador NO tiene permisos de usuarios', () => {
    expect(PERMISOS_POR_ROL.organizador).not.toContain('usuarios:ver');
    expect(PERMISOS_POR_ROL.organizador).not.toContain('usuarios:eliminar');
  });

  it('asistente no tiene ningún permiso', () => {
    expect(PERMISOS_POR_ROL.asistente).toEqual([]);
  });
});

// ── ROLES_VALIDOS ─────────────────────────────────────────

describe('ROLES_VALIDOS', () => {
  it('contiene los tres roles del sistema', () => {
    expect(ROLES_VALIDOS).toContain('admin_global');
    expect(ROLES_VALIDOS).toContain('organizador');
    expect(ROLES_VALIDOS).toContain('asistente');
  });
});

// ── getPermisosEfectivos() ────────────────────────────────

describe('getPermisosEfectivos()', () => {
  it('retorna los permisos del rol sin extras', () => {
    const usuario = { rol: 'organizador', permisos: [] };
    const result  = getPermisosEfectivos(usuario);
    expect(result).toEqual(expect.arrayContaining(PERMISOS_POR_ROL.organizador));
  });

  it('combina permisos del rol + permisos extra sin duplicados', () => {
    const usuario = { rol: 'organizador', permisos: ['usuarios:ver'] };
    const result  = getPermisosEfectivos(usuario);
    expect(result).toContain('eventos:crear');
    expect(result).toContain('usuarios:ver');
    // Sin duplicados
    expect(result.filter(p => p === 'usuarios:ver').length).toBe(1);
  });

  it('usa asistente por defecto si no tiene rol', () => {
    const usuario = { permisos: [] };
    const result  = getPermisosEfectivos(usuario);
    expect(result).toEqual([]);
  });

  it('usa array vacío si no tiene permisos extra', () => {
    const usuario = { rol: 'asistente' };
    const result  = getPermisosEfectivos(usuario);
    expect(result).toEqual([]);
  });
});

// ── requireRol() ──────────────────────────────────────────

describe('requireRol()', () => {
  it('llama next() si el usuario tiene el rol requerido', () => {
    const req  = mockReq({ rol: 'organizador' });
    const res  = mockRes();
    const next = mockNext();

    requireRol('organizador')(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('admin_global siempre pasa sin importar el rol requerido', () => {
    const req  = mockReq({ rol: 'admin_global' });
    const res  = mockRes();
    const next = mockNext();

    requireRol('organizador')(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('retorna 403 si el usuario no tiene el rol requerido', () => {
    const req  = mockReq({ rol: 'asistente' });
    const res  = mockRes();
    const next = mockNext();

    requireRol('organizador')(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('retorna 401 si no hay usuario en el request', () => {
    const req  = mockReq(null);
    const res  = mockRes();
    const next = mockNext();

    requireRol('organizador')(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('acepta múltiples roles — pasa si tiene uno de ellos', () => {
    const req  = mockReq({ rol: 'organizador' });
    const res  = mockRes();
    const next = mockNext();

    requireRol('admin_global', 'organizador')(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('usa asistente por defecto si el usuario no tiene campo rol', () => {
    const req  = mockReq({ id: 1, nombre: 'sin rol' });
    const res  = mockRes();
    const next = mockNext();

    requireRol('organizador')(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });
});

// ── requirePermiso() ──────────────────────────────────────

describe('requirePermiso()', () => {
  it('llama next() si el rol del usuario incluye el permiso', () => {
    const req  = mockReq({ rol: 'organizador', permisos: [] });
    const res  = mockRes();
    const next = mockNext();

    requirePermiso('eventos:crear')(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('llama next() si el permiso está en los permisos extra del usuario', () => {
    const req  = mockReq({ rol: 'asistente', permisos: ['usuarios:ver'] });
    const res  = mockRes();
    const next = mockNext();

    requirePermiso('usuarios:ver')(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('admin_global pasa siempre (tiene todos los permisos por rol)', () => {
    const req  = mockReq({ rol: 'admin_global', permisos: [] });
    const res  = mockRes();
    const next = mockNext();

    requirePermiso('usuarios:eliminar')(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('retorna 403 si no tiene el permiso ni por rol ni por extras', () => {
    const req  = mockReq({ rol: 'asistente', permisos: [] });
    const res  = mockRes();
    const next = mockNext();

    requirePermiso('eventos:publicar')(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('retorna 401 si no hay usuario en el request', () => {
    const req  = mockReq(null);
    const res  = mockRes();
    const next = mockNext();

    requirePermiso('eventos:crear')(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('la respuesta 403 incluye los permisos actuales del usuario', () => {
    const req  = mockReq({ rol: 'asistente', permisos: [] });
    const res  = mockRes();
    const next = mockNext();

    requirePermiso('usuarios:eliminar')(req, res, next);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ tus_permisos: expect.any(Array) })
    );
  });
});
