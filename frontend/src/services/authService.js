// src/services/authService.js
import apiFetch from './api.js'

/**
 * Registra un nuevo usuario.
 * POST /auth/register
 * Body: { nombre, email, password }
 */
export async function register({ nombre, email, password }) {
  return apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ nombre, email, password }),
  })
}

/**
 * Inicia sesión y guarda el token en localStorage.
 * POST /auth/login
 * Body: { email, password }
 * Retorna: { mensaje, token, usuario }
 */
export async function login({ email, password }) {
  const data = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })

  // Guardar token y datos de usuario
  localStorage.setItem('token', data.token)
  localStorage.setItem('usuario', JSON.stringify(data.usuario))

  return data
}

/**
 * Cierra la sesión limpiando el localStorage.
 */
export function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('usuario')
}

/**
 * Retorna el usuario guardado en localStorage, o null si no hay sesión.
 */
export function getUsuarioLocal() {
  try {
    const raw = localStorage.getItem('usuario')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/**
 * Retorna true si hay token guardado (sesión activa).
 */
export function estaAutenticado() {
  return !!localStorage.getItem('token')
}
