const { createClient } = require('@supabase/supabase-js');

// RONALD TIENE DEBE AGREGAR LA URL Y KEY EN EL .ENV PARA QUE FUNCIONE EL SUPABASE
// Sin las credenciales el servidor igual arranca, pero login/register no funcionan
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'placeholder-key';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

module.exports = supabase;