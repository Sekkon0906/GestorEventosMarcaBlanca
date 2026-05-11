import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/auth.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token,   setToken]   = useState(() => localStorage.getItem('gestek_token') || null);
  const [usuario, setUsuario] = useState(() => {
    try {
      const raw = localStorage.getItem('gestek_user');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const data = await authApi.login(email, password);
      localStorage.setItem('gestek_token', data.token);
      localStorage.setItem('gestek_user',  JSON.stringify(data.usuario));
      setToken(data.token);
      setUsuario(data.usuario);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (fields) => {
    setLoading(true);
    try {
      const data = await authApi.register(fields);
      return { ok: true, data };
    } catch (err) {
      return { ok: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('gestek_token');
    localStorage.removeItem('gestek_user');
    setToken(null);
    setUsuario(null);
  }, []);

  const refreshMe = useCallback(async () => {
    if (!token) return;
    try {
      const data = await authApi.me();
      setUsuario(data.usuario);
      localStorage.setItem('gestek_user', JSON.stringify(data.usuario));
    } catch { logout(); }
  }, [token, logout]);

  const hasPermiso = useCallback((permiso) => {
    if (!usuario) return false;
    if (usuario.rol === 'admin_global') return true;
    const permisosRol = {
      admin_global: ['eventos:crear','eventos:editar','eventos:eliminar','eventos:publicar','usuarios:ver','usuarios:editar','usuarios:eliminar','usuarios:asignar_rol','notificaciones:ver'],
      organizador : ['eventos:crear','eventos:editar','eventos:eliminar','eventos:publicar'],
      asistente   : [],
    };
    const base = permisosRol[usuario.rol] || [];
    const extra = usuario.permisos || [];
    return [...base, ...extra].includes(permiso);
  }, [usuario]);

  const hasRol = useCallback((rol) => usuario?.rol === rol, [usuario]);

  return (
    <AuthContext.Provider value={{ token, usuario, loading, login, register, logout, refreshMe, hasPermiso, hasRol }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
