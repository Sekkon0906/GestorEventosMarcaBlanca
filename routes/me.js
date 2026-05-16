const express = require('express');
const supabase = require('../lib/supabase.js');
const { verifySupabaseJWT } = require('../middleware/auth.js');

const router = express.Router();
router.use(verifySupabaseJWT);

/* GET /me — perfil del usuario logueado */
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', req.user.id)
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ profile: data });
});

/* PATCH /me — actualizar campos editables del perfil */
router.patch('/', async (req, res) => {
  const allowed = ['nombre', 'handle', 'avatar_url', 'telefono', 'ciudad', 'empresa', 'ocupacion'];
  const updates = {};
  for (const k of allowed) {
    if (k in req.body) updates[k] = req.body[k];
  }
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'Sin campos válidos para actualizar.' });
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', req.user.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ profile: data });
});

module.exports = router;
