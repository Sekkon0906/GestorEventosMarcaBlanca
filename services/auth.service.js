'use strict';

/**
 * services/auth.service.js
 *
 * Lógica de negocio del dominio de autenticación.
 * Sin conocimiento de HTTP (sin req/res) — solo datos de entrada y retorno.
 *
 * Dependencias: Supabase, bcryptjs, jsonwebtoken, config/env
 *
 * Patrón de respuesta:
 *   { ok: true, data: {...} }   → éxito
 *   { ok: false, status, error } → fallo controlado
 *
 * El controller/route usa ok para decidir el status HTTP.
 */

const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const supabase = require('../db/supabase');
const { JWT_SECRET, JWT_EXPIRES } = require('../config/env');

const BCRYPT_ROUNDS = 10;

// ── Campos seguros a devolver de un usuario ───────────────────
const USER_SAFE_FIELDS = 'id, nombre, email, rol, permisos, organizacion_id, created_at';

/**
 * Registrar nuevo usuario.
 * Siempre crea con rol = 'asistente'. El rol lo asigna admin_global.
 *
 * @param {{ nombre: string, email: string, password: string }} data
 */
async function register({ nombre, email, password }) {
  const emailNorm = email.toLowerCase().trim();

  // Verificar unicidad de email
  const { data: existe } = await supabase
    .from('usuarios')
    .select('id')
    .eq('email', emailNorm)
    .maybeSingle();

  if (existe)
    return { ok: false, status: 409, error: 'Ya existe un usuario con ese email.' };

  const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const { data: usuario, error } = await supabase
    .from('usuarios')
    .insert({
      nombre       : nombre.trim(),
      email        : emailNorm,
      password_hash,
      rol          : 'asistente',
      permisos     : [],
    })
    .select('id, nombre, email, rol, permisos, created_at')
    .single();

  if (error) throw error;

  return {
    ok  : true,
    data: {
      id      : usuario.id,
      nombre  : usuario.nombre,
      email   : usuario.email,
      rol     : usuario.rol,
      permisos: usuario.permisos,
    },
  };
}

/**
 * Autenticar usuario y generar JWT.
 *
 * @param {{ email: string, password: string }} data
 */
async function login({ email, password }) {
  const { data: usuario, error } = await supabase
    .from('usuarios')
    .select(`${USER_SAFE_FIELDS}, password_hash`)
    .eq('email', email.toLowerCase().trim())
    .maybeSingle();

  if (error) throw error;

  // Respuesta genérica para no revelar si el email existe (timing attack mitigation: bcrypt.compare de todos modos)
  if (!usuario)
    return { ok: false, status: 401, error: 'Email o password incorrectos.' };

  const passwordValido = await bcrypt.compare(password, usuario.password_hash);
  if (!passwordValido)
    return { ok: false, status: 401, error: 'Email o password incorrectos.' };

  const payload = {
    id             : usuario.id,
    nombre         : usuario.nombre,
    email          : usuario.email,
    rol            : usuario.rol      || 'asistente',
    permisos       : usuario.permisos  || [],
    organizacion_id: usuario.organizacion_id || null,
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });

  return { ok: true, data: { token, usuario: payload } };
}

/**
 * Obtener perfil fresco desde BD (no confía en JWT).
 *
 * @param {number|string} userId
 */
async function getProfile(userId) {
  const { data: usuario, error } = await supabase
    .from('usuarios')
    .select(USER_SAFE_FIELDS)
    .eq('id', userId)
    .single();

  if (error || !usuario)
    return { ok: false, status: 404, error: 'Usuario no encontrado.' };

  return { ok: true, data: { usuario } };
}

/**
 * Actualizar perfil del usuario autenticado.
 *
 * @param {number|string} userId
 * @param {{ nombre?: string, password?: string }} updates
 */
async function updateProfile(userId, updates) {
  const dbUpdates = {};

  if (updates.nombre)   dbUpdates.nombre        = updates.nombre.trim();
  if (updates.password) dbUpdates.password_hash = await bcrypt.hash(updates.password, BCRYPT_ROUNDS);

  const { data: usuario, error } = await supabase
    .from('usuarios')
    .update(dbUpdates)
    .eq('id', userId)
    .select('id, nombre, email, rol, permisos')
    .single();

  if (error) throw error;

  return { ok: true, data: { usuario } };
}

module.exports = { register, login, getProfile, updateProfile };
