const router   = require('express').Router();
const supabase = require('../db/supabase');
const verificarToken = require('../middleware/auth');

// ── GET /api/analytics/resumen ──────────────────────────────────────────────
router.get('/resumen', verificarToken, async (req, res) => {
  try {
    const orgId = req.usuario.organizacion_id || req.usuario.id;

    const { data: eventos, error } = await supabase
      .from('eventos')
      .select('id, asistentes_count, capacidad_total')
      .eq('organizacion_id', orgId);

    if (error) throw error;

    // Contar vistas desde event_views si existe la tabla
    const { count: totalVistas } = await supabase
      .from('event_views')
      .select('id', { count: 'exact', head: true })
      .in('evento_id', (eventos || []).map(e => e.id));

    const totalEventos    = eventos?.length || 0;
    const totalAsistentes = (eventos || []).reduce((s, e) => s + (e.asistentes_count || 0), 0);

    res.json({
      resumen: {
        total_eventos    : totalEventos,
        total_asistentes : totalAsistentes,
        total_vistas     : totalVistas || 0,
      }
    });
  } catch (err) {
    console.error('[analytics/resumen]', err.message);
    res.status(500).json({ error: 'Error al obtener resumen.' });
  }
});

// ── GET /api/analytics/eventos-populares ────────────────────────────────────
router.get('/eventos-populares', verificarToken, async (req, res) => {
  try {
    const orgId = req.usuario.organizacion_id || req.usuario.id;

    const { data: eventos, error } = await supabase
      .from('eventos')
      .select('id, nombre, fecha_inicio, ubicacion, capacidad_total, asistentes_count')
      .eq('organizacion_id', orgId)
      .order('asistentes_count', { ascending: false })
      .limit(5);

    if (error) throw error;

    const populares = (eventos || []).map(e => ({
      id                    : e.id,
      nombre                : e.nombre,
      fecha                 : e.fecha_inicio,
      lugar                 : e.ubicacion?.lugar || e.ubicacion?.ciudad || '',
      capacidad             : e.capacidad_total || 0,
      asistentes_registrados: e.asistentes_count || 0,
      porcentaje_ocupacion  : e.capacidad_total
        ? Math.round(((e.asistentes_count || 0) / e.capacidad_total) * 100) + '%'
        : '0%',
    }));

    res.json({ eventos_populares: populares });
  } catch (err) {
    console.error('[analytics/eventos-populares]', err.message);
    res.status(500).json({ error: 'Error al obtener eventos populares.' });
  }
});

// ── GET /api/analytics/mas-vistos ────────────────────────────────────────────
router.get('/mas-vistos', verificarToken, async (req, res) => {
  try {
    const orgId = req.usuario.organizacion_id || req.usuario.id;

    const { data: eventos, error } = await supabase
      .from('eventos')
      .select('id, nombre, asistentes_count')
      .eq('organizacion_id', orgId);

    if (error) throw error;

    // Agrupar vistas por evento desde event_views
    const eventoIds = (eventos || []).map(e => e.id);
    let vistasMap   = {};

    if (eventoIds.length > 0) {
      const { data: views } = await supabase
        .from('event_views')
        .select('evento_id')
        .in('evento_id', eventoIds);

      (views || []).forEach(v => {
        vistasMap[v.evento_id] = (vistasMap[v.evento_id] || 0) + 1;
      });
    }

    const masVistos = (eventos || [])
      .map(e => ({
        id        : e.id,
        nombre    : e.nombre,
        vistas    : vistasMap[e.id] || 0,
        asistentes: e.asistentes_count || 0,
      }))
      .sort((a, b) => b.vistas - a.vistas)
      .slice(0, 5);

    res.json({ mas_vistos: masVistos });
  } catch (err) {
    console.error('[analytics/mas-vistos]', err.message);
    res.status(500).json({ error: 'Error al obtener eventos más vistos.' });
  }
});

// ── GET /api/analytics/exportar-csv ─────────────────────────────────────────
// Exporta todos los tickets de todos los eventos del organizador
router.get('/exportar-csv', verificarToken, async (req, res) => {
  try {
    const orgId = req.usuario.organizacion_id || req.usuario.id;

    // Primero obtener todos los eventos del organizador
    const { data: eventos, error: errEventos } = await supabase
      .from('eventos')
      .select('id, nombre, fecha_inicio, ubicacion')
      .eq('organizacion_id', orgId);

    if (errEventos) throw errEventos;

    const eventoIds  = (eventos || []).map(e => e.id);
    const eventoMap  = {};
    (eventos || []).forEach(e => { eventoMap[e.id] = e; });

    // Luego obtener los tickets de esos eventos
    let tickets = [];
    if (eventoIds.length > 0) {
      const { data, error: errTickets } = await supabase
        .from('tickets')
        .select('id, evento_id, nombre_asistente, email_asistente, tipo_entrada, estado, precio_pagado, creado_en')
        .in('evento_id', eventoIds)
        .order('creado_en', { ascending: true });

      if (errTickets) throw errTickets;
      tickets = data || [];
    }

    // Construir CSV con BOM para que Excel lo abra correctamente
    const BOM = '﻿';
    const headers = 'Evento,Fecha,Lugar,Nombre_Asistente,Email,Tipo_Entrada,Estado,Precio,Registrado_En\n';

    const rows = tickets.map(t => {
      const ev = eventoMap[t.evento_id] || {};
      const fecha  = ev.fecha_inicio ? new Date(ev.fecha_inicio).toLocaleDateString('es-CO') : '';
      const lugar  = ev.ubicacion?.lugar || ev.ubicacion?.ciudad || '';
      const precio = t.precio_pagado != null ? t.precio_pagado : '';
      const reg    = t.creado_en ? new Date(t.creado_en).toLocaleString('es-CO') : '';

      return [
        `"${(ev.nombre || '').replace(/"/g, '""')}"`,
        `"${fecha}"`,
        `"${lugar.replace(/"/g, '""')}"`,
        `"${(t.nombre_asistente || '').replace(/"/g, '""')}"`,
        `"${(t.email_asistente  || '').replace(/"/g, '""')}"`,
        `"${(t.tipo_entrada      || '').replace(/"/g, '""')}"`,
        `"${(t.estado           || '').replace(/"/g, '""')}"`,
        `"${precio}"`,
        `"${reg}"`,
      ].join(',');
    }).join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="asistentes-gestek.csv"');
    res.send(BOM + headers + rows);
  } catch (err) {
    console.error('[analytics/exportar-csv]', err.message);
    res.status(500).json({ error: 'Error al exportar CSV.' });
  }
});

// ── GET /api/analytics/exportar-csv/:id ─────────────────────────────────────
// Exporta tickets de un evento especifico
router.get('/exportar-csv/:id', verificarToken, async (req, res) => {
  try {
    const orgId    = req.usuario.organizacion_id || req.usuario.id;
    const eventoId = req.params.id;

    // Verificar que el evento pertenece al organizador
    const { data: evento, error: errEvento } = await supabase
      .from('eventos')
      .select('id, nombre, fecha_inicio, ubicacion, organizacion_id')
      .eq('id', eventoId)
      .single();

    if (errEvento || !evento) {
      return res.status(404).json({ error: 'Evento no encontrado.' });
    }

    if (evento.organizacion_id !== orgId) {
      return res.status(403).json({ error: 'No tienes acceso a este evento.' });
    }

    // Obtener tickets
    const { data: tickets, error: errTickets } = await supabase
      .from('tickets')
      .select('id, nombre_asistente, email_asistente, tipo_entrada, estado, precio_pagado, creado_en')
      .eq('evento_id', eventoId)
      .order('creado_en', { ascending: true });

    if (errTickets) throw errTickets;

    const BOM     = '﻿';
    const headers = 'Nombre_Asistente,Email,Tipo_Entrada,Estado,Precio,Registrado_En\n';

    const rows = (tickets || []).map(t => {
      const precio = t.precio_pagado != null ? t.precio_pagado : '';
      const reg    = t.creado_en ? new Date(t.creado_en).toLocaleString('es-CO') : '';
      return [
        `"${(t.nombre_asistente || '').replace(/"/g, '""')}"`,
        `"${(t.email_asistente  || '').replace(/"/g, '""')}"`,
        `"${(t.tipo_entrada      || '').replace(/"/g, '""')}"`,
        `"${(t.estado           || '').replace(/"/g, '""')}"`,
        `"${precio}"`,
        `"${reg}"`,
      ].join(',');
    }).join('\n');

    const nombreArchivo = evento.nombre.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="asistentes-${nombreArchivo}.csv"`);
    res.send(BOM + headers + rows);
  } catch (err) {
    console.error('[analytics/exportar-csv/:id]', err.message);
    res.status(500).json({ error: 'Error al exportar CSV del evento.' });
  }
});

module.exports = router;
