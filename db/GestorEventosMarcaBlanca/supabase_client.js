// db/supabase.js — GestorEventosMarcaBlanca
// Instalar: npm install @supabase/supabase-js dotenv

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // service_role key (backend)

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan SUPABASE_URL o SUPABASE_SERVICE_KEY en el .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;

// ── Ejemplos de uso ────────────────────────────────────────────────────────

// const supabase = require('./db/supabase');

// // Obtener todos los eventos publicados
// const { data, error } = await supabase
//   .from('eventos')
//   .select('*, usuarios(nombre, apellido)')
//   .eq('estado', 'publicado');

// // Inscribir un asistente
// const { data, error } = await supabase
//   .from('asistentes')
//   .insert({ id_usuario: 4, id_evento: 1, estado_registro: 'pendiente' });

// // Actualizar estado de inscripción
// const { data, error } = await supabase
//   .from('asistentes')
//   .update({ estado_registro: 'confirmado' })
//   .eq('id_usuario', 4)
//   .eq('id_evento', 1);
