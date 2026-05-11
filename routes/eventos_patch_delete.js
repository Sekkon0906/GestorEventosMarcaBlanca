const router         = require('express').Router();
const supabase       = require('../db/supabase');
const verificarToken = require('../middleware/auth');
const { requirePermiso } = require('../middleware/roles');

// ════════════════════════════════════════════════════════════
//  PATCH /eventos/:id
//  Actualiza campos de un evento (solo organizador dueño o admin)
// ════════════════════════════════════════════════════════════
router.patch('/:id', verificarToken, requirePermiso('eventos:editar'), async (req, res) => {
  try {
    const { id } = req.params;

    const { data: evento, error: fetchErr } = await supabase
      .from('eventos')
      .select('id, organizador_id, estado')
      .eq('id', id)
      .single();

    if (fetchErr || !evento)
      return res.status(404).json({ error: 'Evento no encontrado.' });

    const esAdmin = req.usuario.rol === 'admin_global';
    const esDueno = String(evento.organizador_id) === String(req.usuario.id);

    if (!esAdmin && !esDueno)
      return res.status(403).json({ error: 'No tienes permiso para editar este evento.' });

    if (evento.estado === 'cancelado')
      return res.status(400).json({ error: 'No se puede editar un evento cancelado.' });

    const CAMPOS_PERMITIDOS = [
      'nombre', 'descripcion', 'modalidad', 'visibilidad', 'moneda',
      'fecha_inicio', 'fecha_fin', 'sesiones', 'ubicacion',
      'categoria_id', 'restricciones', 'imagen_portada', 'galeria',
      'entradas', 'capacidad_total', 'codigos_descuento', 'requiere_aprobacion',
      'speakers', 'patrocinadores', 'agenda', 'redes_sociales',
      'terminos_propios', 'politica_reembolso',
    ];

    const updates = {};
    for (const campo of CAMPOS_PERMITIDOS) {
      if (req.body[campo] !== undefined) updates[campo] = req.body[campo];
    }

    if (Object.keys(updates).length === 0)
      return res.status(400).json({ error: 'No se enviaron campos para actualizar.' });

    const { data: actualizado, error: updateErr } = await supabase
      .from('eventos')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    res.json({ mensaje: 'Evento actualizado correctamente.', evento: actualizado });
  } catch (err) {
    console.error('PATCH /eventos/:id:', err.message);
    res.status(500).json({ error: 'Error al actualizar el evento.' });
  }
});

// ════════════════════════════════════════════════════════════
//  DELETE /eventos/:id
// ════════════════════════════════════════════════════════════
router.delete('/:id', verificarToken, requirePermiso('eventos:eliminar'), async (req, res) => {
  try {
    const { id } = req.params;

    const { data: evento, error: fetchErr } = await supabase
      .from('eventos')
      .select('id, organizador_id, estado, nombre')
      .eq('id', id)
      .single();

    if (fetchErr || !evento)
      return res.status(404).json({ error: 'Evento no encontrado.' });

    const esAdmin = req.usuario.rol === 'admin_global';
    const esDueno = String(evento.organizador_id) === String(req.usuario.id);

    if (!esAdmin && !esDueno)
      return res.status(403).json({ error: 'No tienes permiso para eliminar este evento.' });

    if (evento.estado === 'publicado' && !esAdmin)
      return res.status(400).json({ error: 'No puedes eliminar un evento publicado. Primero cancélalo.' });

    const { error: deleteErr } = await supabase.from('eventos').delete().eq('id', id);
    if (deleteErr) throw deleteErr;

    res.json({ mensaje: `Evento "${evento.nombre}" eliminado correctamente.` });
  } catch (err) {
    console.error('DELETE /eventos/:id:', err.message);
    res.status(500).json({ error: 'Error al eliminar el evento.' });
  }
});

// ════════════════════════════════════════════════════════════
//  POST /eventos/:id/publicar
// ════════════════════════════════════════════════════════════
router.post('/:id/publicar', verificarToken, requirePermiso('eventos:publicar'), async (req, res) => {
  try {
    const { id } = req.params;

    const { data: evento, error: fetchErr } = await supabase
      .from('eventos')
      .select('id, organizador_id, estado, nombre, fecha_inicio, modalidad, ubicacion, entradas')
      .eq('id', id)
      .single();

    if (fetchErr || !evento)
      return res.status(404).json({ error: 'Evento no encontrado.' });

    const esAdmin = req.usuario.rol === 'admin_global';
    const esDueno = String(evento.organizador_id) === String(req.usuario.id);

    if (!esAdmin && !esDueno)
      return res.status(403).json({ error: 'No tienes permiso para publicar este evento.' });

    if (evento.estado !== 'borrador')
      return res.status(400).json({ error: `El evento ya está en estado "${evento.estado}". Solo se pueden publicar borradores.` });

    const errores = [];
    if (!evento.nombre) errores.push('nombre es obligatorio.');
    if (!evento.fecha_inicio) errores.push('fecha_inicio es obligatorio.');
    if (!evento.modalidad) errores.push('modalidad es obligatoria.');
    if (!evento.entradas || evento.entradas.length === 0) errores.push('El evento debe tener al menos una entrada.');

    if (errores.length > 0)
      return res.status(400).json({ error: 'El evento no cumple los requisitos mínimos para publicar.', errores });

    const { data: publicado, error: updateErr } = await supabase
      .from('eventos')
      .update({ estado: 'publicado' })
      .eq('id', id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    res.json({ mensaje: `Evento "${evento.nombre}" publicado exitosamente.`, evento: publicado });
  } catch (err) {
    console.error('POST /eventos/:id/publicar:', err.message);
    res.status(500).json({ error: 'Error al publicar el evento.' });
  }
});

// ════════════════════════════════════════════════════════════
//  POST /eventos/:id/cancelar
// ════════════════════════════════════════════════════════════
router.post('/:id/cancelar', verificarToken, requirePermiso('eventos:editar'), async (req, res) => {
  try {
    const { id } = req.params;

    const { data: evento, error: fetchErr } = await supabase
      .from('eventos')
      .select('id, organizador_id, estado, nombre')
      .eq('id', id)
      .single();

    if (fetchErr || !evento)
      return res.status(404).json({ error: 'Evento no encontrado.' });

    const esAdmin = req.usuario.rol === 'admin_global';
    const esDueno = String(evento.organizador_id) === String(req.usuario.id);

    if (!esAdmin && !esDueno)
      return res.status(403).json({ error: 'No tienes permiso para cancelar este evento.' });

    if (evento.estado === 'cancelado')
      return res.status(400).json({ error: 'El evento ya está cancelado.' });

    const { data: cancelado, error: updateErr } = await supabase
      .from('eventos')
      .update({ estado: 'cancelado' })
      .eq('id', id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    res.json({ mensaje: `Evento "${evento.nombre}" cancelado.`, evento: cancelado });
  } catch (err) {
    console.error('POST /eventos/:id/cancelar:', err.message);
    res.status(500).json({ error: 'Error al cancelar el evento.' });
  }
});

// ════════════════════════════════════════════════════════════
//  GET /eventos/:id/asistentes
// ════════════════════════════════════════════════════════════
router.get('/:id/asistentes', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: evento, error: fetchErr } = await supabase
      .from('eventos')
      .select('id, organizador_id, nombre')
      .eq('id', id)
      .single();

    if (fetchErr || !evento)
      return res.status(404).json({ error: 'Evento no encontrado.' });

    const esAdmin = req.usuario.rol === 'admin_global';
    const esDueno = String(evento.organizador_id) === String(req.usuario.id);

    if (!esAdmin && !esDueno)
      return res.status(403).json({ error: 'Solo el organizador puede ver los asistentes.' });

    const { data: asistentes, error: asistErr } = await supabase
      .from('asistentes')
      .select('id, estado_registro, fecha_registro, usuario:usuarios(id, nombre, email)')
      .eq('evento_id', id)
      .order('fecha_registro', { ascending: false });

    if (asistErr) throw asistErr;

    const stats = {
      total      : asistentes.length,
      confirmados: asistentes.filter(a => a.estado_registro === 'confirmado').length,
      pendientes : asistentes.filter(a => a.estado_registro === 'pendiente').length,
      cancelados : asistentes.filter(a => a.estado_registro === 'cancelado').length,
    };

    res.json({ evento: evento.nombre, stats, asistentes });
  } catch (err) {
    console.error('GET /eventos/:id/asistentes:', err.message);
    res.status(500).json({ error: 'Error al obtener asistentes.' });
  }
});

// ════════════════════════════════════════════════════════════
//  POST /eventos/:id/inscribirse
// ════════════════════════════════════════════════════════════
router.post('/:id/inscribirse', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario.id;

    const { data: evento, error: fetchErr } = await supabase
      .from('eventos')
      .select('id, nombre, estado, capacidad_total, asistentes_count, requiere_aprobacion')
      .eq('id', id)
      .single();

    if (fetchErr || !evento)
      return res.status(404).json({ error: 'Evento no encontrado.' });

    if (evento.estado !== 'publicado')
      return res.status(400).json({ error: 'Solo puedes inscribirte a eventos publicados.' });

    if (evento.capacidad_total && evento.asistentes_count >= evento.capacidad_total)
      return res.status(400).json({ error: 'El evento está lleno.' });

    const { data: yaInscrito } = await supabase
      .from('asistentes')
      .select('id, estado_registro')
      .eq('evento_id', id)
      .eq('usuario_id', usuarioId)
      .maybeSingle();

    if (yaInscrito)
      return res.status(409).json({ error: `Ya estás inscrito con estado: ${yaInscrito.estado_registro}.` });

    const estado = evento.requiere_aprobacion ? 'pendiente' : 'confirmado';

    const { data: inscripcion, error: insertErr } = await supabase
      .from('asistentes')
      .insert({ evento_id: id, usuario_id: usuarioId, estado_registro: estado })
      .select()
      .single();

    if (insertErr) throw insertErr;

    if (estado === 'confirmado') {
      await supabase.from('eventos').update({ asistentes_count: evento.asistentes_count + 1 }).eq('id', id);
    }

    res.status(201).json({
      mensaje    : estado === 'confirmado' ? 'Inscripción confirmada.' : 'Inscripción pendiente de aprobación.',
      inscripcion,
    });
  } catch (err) {
    console.error('POST /eventos/:id/inscribirse:', err.message);
    res.status(500).json({ error: 'Error al inscribirse al evento.' });
  }
});

module.exports = router;
