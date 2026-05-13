'use strict';

/**
 * tests/setup.js — Setup global de Jest.
 * Se ejecuta antes de cada suite de tests.
 * Configura variables de entorno mínimas para que los módulos carguen sin warnings.
 */

process.env.NODE_ENV          = 'test';
process.env.JWT_SECRET        = 'test_jwt_secret_for_jest_only_32chars';
process.env.SUPABASE_URL      = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_KEY = 'test_service_key';
