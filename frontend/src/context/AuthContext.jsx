import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, supabaseConfigured, authRedirect } from '../lib/supabase.js';

const AuthContext = createContext(null);

/* Convierte un user de Supabase + metadata en el shape que usa el resto de la app. */
function mapUser(user) {
  if (!user) return null;
  const meta = user.user_metadata || {};
  return {
    id     : user.id,
    email  : user.email,
    nombre : meta.nombre || meta.name || user.email,
    rol    : meta.rol    || 'organizador',
    foto   : meta.foto   || null,
    ocupacion: meta.ocupacion || null,
    empresa  : meta.empresa   || null,
    ciudad   : meta.ciudad    || null,
    telefono : meta.telefono  || null,
    permisos : meta.permisos  || [],
    emailConfirmado: Boolean(user.email_confirmed_at),
    raw    : user,
  };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  /* Inicializar: leer sesión actual y suscribirse a cambios. */
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setUsuario(mapUser(data.session?.user));
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess ?? null);
      setUsuario(mapUser(sess?.user));
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email, password) => {
    if (!supabaseConfigured) return { ok: false, error: 'Supabase no está configurado. Ver docs/SUPABASE_SETUP.md' };
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: traducirError(error.message) };
    return { ok: true, data };
  }, []);

  const register = useCallback(async (fields) => {
    if (!supabaseConfigured) return { ok: false, error: 'Supabase no está configurado. Ver docs/SUPABASE_SETUP.md' };
    const { nombre, email, password, ...metadata } = fields;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: authRedirect('/confirmar'),
        data: {
          nombre,
          rol: 'organizador',
          ...metadata,
        },
      },
    });
    if (error) return { ok: false, error: traducirError(error.message) };
    return { ok: true, data, requiresConfirmation: !data.session };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUsuario(null);
  }, []);

  const resetPassword = useCallback(async (email) => {
    if (!supabaseConfigured) return { ok: false, error: 'Supabase no está configurado.' };
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: authRedirect('/restablecer'),
    });
    if (error) return { ok: false, error: traducirError(error.message) };
    return { ok: true };
  }, []);

  const updatePassword = useCallback(async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { ok: false, error: traducirError(error.message) };
    return { ok: true };
  }, []);

  const updateProfile = useCallback(async (metadata) => {
    const { data, error } = await supabase.auth.updateUser({ data: metadata });
    if (error) return { ok: false, error: traducirError(error.message) };
    setUsuario(mapUser(data.user));
    return { ok: true };
  }, []);

  const resendConfirmation = useCallback(async (email) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: authRedirect('/confirmar') },
    });
    if (error) return { ok: false, error: traducirError(error.message) };
    return { ok: true };
  }, []);

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

  const token = session?.access_token || null;

  return (
    <AuthContext.Provider value={{
      token, session, usuario, loading,
      login, register, logout,
      resetPassword, updatePassword, updateProfile, resendConfirmation,
      hasPermiso, hasRol,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};

/* Traduce errores comunes de Supabase a español */
function traducirError(msg) {
  if (!msg) return 'Error desconocido';
  const m = msg.toLowerCase();
  if (m.includes('invalid login credentials'))     return 'Email o contraseña incorrectos.';
  if (m.includes('email not confirmed'))            return 'Confirma tu correo antes de iniciar sesión.';
  if (m.includes('user already registered'))        return 'Ya existe una cuenta con ese email.';
  if (m.includes('password should be at least'))    return 'La contraseña debe tener al menos 8 caracteres.';
  if (m.includes('email rate limit exceeded'))      return 'Demasiados intentos. Espera unos minutos.';
  if (m.includes('over email send rate limit'))     return 'Demasiados correos enviados. Espera unos minutos.';
  if (m.includes('invalid email'))                  return 'Email inválido.';
  if (m.includes('signup is disabled'))              return 'El registro está deshabilitado temporalmente.';
  if (m.includes('token has expired'))               return 'El enlace expiró. Solicita uno nuevo.';
  return msg;
}
