'use strict';

/**
 * validators/auth.validator.js
 *
 * Funciones de validación puras para el dominio de autenticación.
 * Sin efectos secundarios — solo reciben datos y retornan errores o null.
 *
 * Patrón: cada función retorna null si OK, o un objeto { status, error } si falla.
 * El route/controller usa el resultado para responder o continuar.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Valida el body de POST /auth/register
 * @param {object} body - req.body ya sanitizado
 * @returns {{ status: number, error: string } | null}
 */
function validateRegister(body) {
  const { nombre, email, password } = body;

  if (!nombre || typeof nombre !== 'string' || nombre.trim().length < 2)
    return { status: 400, error: 'nombre es obligatorio y debe tener al menos 2 caracteres.' };

  if (!email || typeof email !== 'string')
    return { status: 400, error: 'email es obligatorio.' };

  if (!EMAIL_REGEX.test(email.trim()))
    return { status: 400, error: 'Formato de email inválido.' };

  if (!password || typeof password !== 'string')
    return { status: 400, error: 'password es obligatorio.' };

  if (password.length < 8)
    return { status: 400, error: 'La contraseña debe tener al menos 8 caracteres.' };

  return null;
}

/**
 * Valida el body de POST /auth/login
 * @param {object} body
 * @returns {{ status: number, error: string } | null}
 */
function validateLogin(body) {
  const { email, password } = body;

  if (!email || !password)
    return { status: 400, error: 'email y password son obligatorios.' };

  if (!EMAIL_REGEX.test((email || '').trim()))
    return { status: 400, error: 'Formato de email inválido.' };

  return null;
}

/**
 * Valida el body de PATCH /auth/me
 * @param {object} body
 * @returns {{ status: number, error: string } | null}
 */
function validateUpdateMe(body) {
  const { nombre, password } = body;

  if (!nombre && !password)
    return { status: 400, error: 'No hay campos para actualizar.' };

  if (password && password.length < 8)
    return { status: 400, error: 'La contraseña debe tener al menos 8 caracteres.' };

  if (nombre && nombre.trim().length < 2)
    return { status: 400, error: 'El nombre debe tener al menos 2 caracteres.' };

  return null;
}

module.exports = { validateRegister, validateLogin, validateUpdateMe };
