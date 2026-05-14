'use strict';

/**
 * config/env.js
 *
 * Single source of truth for all environment variables.
 * Validates critical vars at startup — process.exit(1) if any are missing
 * so the server NEVER starts in an insecure state.
 *
 * Usage:
 *   const { JWT_SECRET, PORT } = require('./config/env');
 */

// ── Vars obligatorias en producción ──────────────────────────
const REQUIRED_IN_PRODUCTION = ['JWT_SECRET', 'SUPABASE_URL', 'SUPABASE_SERVICE_KEY'];

const IS_PROD = process.env.NODE_ENV === 'production';

for (const key of REQUIRED_IN_PRODUCTION) {
  if (!process.env[key]) {
    if (IS_PROD) {
      console.error(`\n[FATAL] Variable de entorno "${key}" no está configurada.`);
      console.error('[FATAL] El servidor no puede iniciar sin esta variable en producción.\n');
      process.exit(1);
    } else {
      console.warn(`[WARN]  Variable de entorno "${key}" no configurada (entorno: ${process.env.NODE_ENV || 'development'}).`);
    }
  }
}

// ── JWT_SECRET nunca debe tener fallback en producción ───────
if (!process.env.JWT_SECRET && IS_PROD) {
  console.error('[FATAL] JWT_SECRET ausente en producción. Abortando.');
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.warn('[WARN]  JWT_SECRET no configurado. Usando valor de desarrollo. NUNCA use esto en producción.');
}

// ── Exportar todas las vars validadas ────────────────────────
module.exports = {
  NODE_ENV   : process.env.NODE_ENV || 'development',
  IS_PROD,
  IS_DEV     : !IS_PROD,

  PORT       : parseInt(process.env.PORT, 10) || 3000,

  // Auth — sin fallback en prod; fallback explícito y ruidoso solo en dev
  JWT_SECRET : process.env.JWT_SECRET || 'DEV_ONLY_SECRET_NOT_FOR_PRODUCTION',
  JWT_EXPIRES: process.env.JWT_EXPIRES || '8h',

  // Supabase
  SUPABASE_URL        : process.env.SUPABASE_URL,
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,

  // CORS — lista separada por comas en producción
  FRONTEND_URL : process.env.FRONTEND_URL || null,

  // Features opcionales
  ENABLE_SOCKETS : process.env.ENABLE_SOCKETS === 'true',
  SENTRY_DSN     : process.env.SENTRY_DSN || null,

  // Rate limiting (configurable por entorno)
  RATE_LIMIT_AUTH_MAX     : parseInt(process.env.RATE_LIMIT_AUTH_MAX, 10)     || 10,
  RATE_LIMIT_AUTH_WINDOW  : parseInt(process.env.RATE_LIMIT_AUTH_WINDOW, 10)  || 15,
  RATE_LIMIT_API_MAX      : parseInt(process.env.RATE_LIMIT_API_MAX, 10)      || 200,
  RATE_LIMIT_API_WINDOW   : parseInt(process.env.RATE_LIMIT_API_WINDOW, 10)   || 15,

  // VAPID (push notifications)
  VAPID_PUBLIC_KEY : process.env.VAPID_PUBLIC_KEY  || null,
  VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY || null,
  VAPID_SUBJECT    : process.env.VAPID_SUBJECT     || 'mailto:admin@gestoreventos.com',
};
