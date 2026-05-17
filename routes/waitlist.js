/* GESTEK — Gestión de lista de espera (owner del evento).
   GET    /eventos/:eventoId/waitlist             — listar
   POST   /eventos/:eventoId/waitlist/:id/promover — marcar promovido + notificar
   DELETE /eventos/:eventoId/waitlist/:id          — quitar de la lista

   Se monta en /eventos (paths con :eventoId internos). */

const express = require('express');
const supabase = require('../lib/supabase.js');
const { verifySupabaseJWT } = require('../middleware/auth.js');
const { notificar } = require('../lib/notificar.js');

const router = express.Router();
router.use(verifySupabaseJWT);

async function assertOwner(eventoId, userId) {
  const { data, error } = await supabase
    .from('eventos').select('id, owner_id, titulo, slug').eq('id', eventoId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('Evento no encontrado.');
  if (data.owner_id !== userId) throw new Error('No autorizado.');
  return data;
}

router.get('/:eventoId/waitlist', async (req, res) => {
  const { eventoId } = req.params;
  try {
    await assertOwner(eventoId, req.user.id);
    const { data, error } = await supabase
      .from('waitlist')
      .select(`id, guest_nombre, guest_email, guest_telefono, estado, posicion,
               promovido_at, created_at,
               tipo:ticket_types!ticket_type_id(id, nombre)`)
      .eq('evento_id', eventoId)
      .order('created_at', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });

    const stats = (data || []).reduce((acc, w) => {
      acc.total++;
      acc[w.estado] = (acc[w.estado] || 0) + 1;
      return acc;
    }, { total: 0 });

    res.json({ waitlist: data || [], stats });
  } catch (e) {
    res.status(e.message === 'No autorizado.' ? 403 : 400).json({ error: e.message });
  }
});

router.post('/:eventoId/waitlist/:id/promover', async (req, res) => {
  const { eventoId, id } = req.params;
  try {
    const ev = await assertOwner(eventoId, req.user.id);

    const { data: entry, error: e1 } = await supabase
      .from('waitlist').select('*').eq('id', id).eq('evento_id', eventoId).maybeSingle();
    if (e1) return res.status(500).json({ error: e1.message });
    if (!entry) return res.status(404).json({ error: 'Entrada no encontrada.' });
    if (entry.estado !== 'esperando') return res.status(400).json({ error: 'Ya fue procesada.' });

    const { error: e2 } = await supabase
      .from('waitlist')
      .update({ estado: 'promovido', promovido_at: new Date().toISOString() })
      .eq('id', id);
    if (e2) return res.status(500).json({ error: e2.message });

    /* Si el invitado tiene cuenta, le mandamos notificación in-app además del link */
    const { data: profile } = await supabase
      .from('profiles').select('id').ilike('email', entry.guest_email).maybeSingle();
    if (profile?.id) {
      notificar({
        userId : profile.id,
        tipo   : 'reserva',
        titulo : '¡Se liberó un cupo!',
        cuerpo : `Te promovieron de la lista de espera de ${ev.titulo}. Reservá tu boleta ahora.`,
        link   : `/explorar/${ev.slug}`,
        eventoId,
      });
    }

    res.json({
      ok: true,
      reserva_url: `/explorar/${ev.slug}`,
      email: entry.guest_email,
      tiene_cuenta: Boolean(profile?.id),
    });
  } catch (e) {
    res.status(e.message === 'No autorizado.' ? 403 : 400).json({ error: e.message });
  }
});

router.delete('/:eventoId/waitlist/:id', async (req, res) => {
  const { eventoId, id } = req.params;
  try {
    await assertOwner(eventoId, req.user.id);
    const { error } = await supabase
      .from('waitlist').delete().eq('id', id).eq('evento_id', eventoId);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ ok: true });
  } catch (e) {
    res.status(e.message === 'No autorizado.' ? 403 : 400).json({ error: e.message });
  }
});

module.exports = router;
