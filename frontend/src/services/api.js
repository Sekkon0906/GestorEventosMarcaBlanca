// src/services/api.js
// Cliente base — apunta al backend Node.js
// Cambia BASE_URL según tu entorno

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

/**
 * Hace un fetch al backend con manejo de token JWT y errores unificado.
 * @param {string} endpoint  - Ej: '/eventos', '/auth/login'
 * @param {object} options   - Opciones fetch estándar (method, body, etc.)
 * @returns {Promise<any>}   - JSON de respuesta
 */
async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('token')

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  const data = await response.json()

  if (!response.ok) {
    // Lanzamos un error con el mensaje del backend
    const mensaje = data.error || data.mensaje || `Error ${response.status}`
    const err = new Error(mensaje)
    err.status = response.status
    err.data = data
    throw err
  }

  return data
}

export default apiFetch
