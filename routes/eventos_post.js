const router    = require('express').Router();
const supabase  = require('../db/supabase');
const verificarToken = require('../middleware/auth');

// ════════════════════════════════════════════════════════════
//  CONSTANTES DE VALIDACIÓN
// ════════════════════════════════════════════════════════════
const MONEDAS_VALIDAS     = ['COP', 'USD', 'EUR', 'MXN', 'ARS', 'BRL'];
const MODALIDADES_VALIDAS = ['fisico', 'virtual', 'hibrido'];
const NIVELES_SPONSOR     = ['oro', 'plata', 'bronce', 'general'];
const TIPO_DESCUENTO      = ['porcentaje', 'valor_fijo'];

// ════════════════════════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════════════════════════
const esFechaValida = (str) => str && !isNaN(Date.parse(str));

const calcularProgreso = (datos) => {
  const checks = {
    info_basica : !!(datos.nombre && datos.modalidad && datos.descripcion),
    fechas      : !!(datos.fecha_inicio),
    ubicacion   : !!(datos.ubicacion?.ciudad || datos.ubicacion?.link_streaming),
    entradas    : (datos.entradas || []).length > 0,
    media       : !!(datos.imagen_portada),
    agenda      : (datos.agenda || []).length > 0,
    speakers    : (datos.speakers || []).length > 0,
  };
  const completados = Object.values(checks).filter(Boolean).length;
  return {
    checks,
    porcentaje         : Math.round((completados / Object.keys(checks).length) * 100),
    listo_para_publicar: checks.info_basica && checks.fechas && checks.ubicacion && checks.entradas,
  };
};

// ════════════════════════════════════════════════════════════
//  GET /eventos/categorias
//  Buscador de categorías para el frontend (Alejo)
// ════════════════════════════════════════════════════════════
router.get('/categorias', async (req, res) => {
  try {
    const { q } = req.query;

    let query = supabase.from('categorias').select('id, nombre');
    if (q) query = query.ilike('nombre', `%${q}%`);

    const { data, error } = await query.order('nombre');
    if (error) throw error;

    res.json({
      total             : data.length,
      categorias        : data,
      puede_crear_nueva : data.length === 0,
    });
  } catch (err) {
    console.error('GET /categorias:', err.message);
    res.status(500).json({ error: 'Error al obtener categorías.' });
  }
});

// ════════════════════════════════════════════════════════════
//  POST /eventos
//  Crea un nuevo evento. Siempre inicia como borrador.
//  Requiere token JWT (solo organizadores autenticados).
// ════════════════════════════════════════════════════════════
router.post('/', verificarToken, async (req, res) => {
  try {
    const {
      nombre, descripcion, modalidad, visibilidad, moneda,
      fecha_inicio, fecha_fin, sesiones,
      ubicacion,
      categoria_id, categoria_nueva,
      restricciones,
      imagen_portada, galeria,
      entradas, capacidad_total, codigos_descuento,
      requiere_aprobacion,
      speakers, patrocinadores, agenda,
      redes_sociales,
      terminos_propios, politica_reembolso,
    } = req.body;

    // ── BLOQUE 1: Campos básicos obligatorios ──────────────────────────────
    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({ error: 'El nombre del evento es obligatorio.', campo: 'nombre' });
    }

    if (!modalidad || !MODALIDADES_VALIDAS.includes(modalidad)) {
      return res.status(400).json({
        error: 'La modalidad es obligatoria.',
        opciones_validas: MODALIDADES_VALIDAS,
        campo: 'modalidad',
      });
    }

    // ── BLOQUE 2: Validaciones de fecha ────────────────────────────────────
    if (fecha_inicio && !esFechaValida(fecha_inicio)) {
      return res.status(400).json({
        error: 'fecha_inicio no tiene formato válido.',
        formato_esperado: 'ISO 8601 — Ej: 2026-09-10T09:00:00-05:00',
      });
    }

    if (fecha_fin && !esFechaValida(fecha_fin)) {
      return res.status(400).json({
        error: 'fecha_fin no tiene formato válido.',
        formato_esperado: 'ISO 8601 — Ej: 2026-09-12T18:00:00-05:00',
      });
    }

    if (fecha_inicio && fecha_fin && new Date(fecha_fin) <= new Date(fecha_inicio)) {
      return res.status(400).json({ error: 'fecha_fin debe ser posterior a fecha_inicio.' });
    }

    if (fecha_inicio && new Date(fecha_inicio) < new Date()) {
      return res.status(400).json({ error: 'La fecha de inicio no puede estar en el pasado.' });
    }

    if (sesiones && !Array.isArray(sesiones)) {
      return res.status(400).json({ error: 'sesiones debe ser un arreglo.', campo: 'sesiones' });
    }

    const sesionesValidadas = (sesiones || []).map((s, i) => {
      if (!s.fecha || !s.hora_inicio) {
        throw {
          status : 400,
          mensaje: `La sesión en posición [${i}] requiere fecha y hora_inicio.`,
          ejemplo: { fecha: '2026-09-10', hora_inicio: '09:00', hora_fin: '18:00', descripcion: 'Día 1' },
        };
      }
      return {
        fecha       : s.fecha,
        hora_inicio : s.hora_inicio,
        hora_fin    : s.hora_fin    || null,
        descripcion : s.descripcion || '',
        lugar       : s.lugar       || null,
      };
    });

    // ── BLOQUE 3: Modalidad vs Ubicación ───────────────────────────────────
    if ((modalidad === 'virtual' || modalidad === 'hibrido') && !ubicacion?.link_streaming) {
      return res.status(400).json({
        error: 'Los eventos virtuales e híbridos requieren un link_streaming.',
        campo: 'ubicacion.link_streaming',
      });
    }

    if ((modalidad === 'fisico' || modalidad === 'hibrido') && (!ubicacion?.ciudad || !ubicacion?.lugar)) {
      return res.status(400).json({
        error: 'Los eventos físicos e híbridos requieren ciudad y lugar.',
        campos: ['ubicacion.ciudad', 'ubicacion.lugar'],
      });
    }

    // ── BLOQUE 4: Moneda ───────────────────────────────────────────────────
    const monedaFinal = moneda ? moneda.toUpperCase().trim() : 'COP';
    if (!MONEDAS_VALIDAS.includes(monedaFinal)) {
      return res.status(400).json({ error: 'Moneda no válida.', opciones_validas: MONEDAS_VALIDAS });
    }

    // ── BLOQUE 5: Categoría ────────────────────────────────────────────────
    let categoriaFinal = null;

    if (categoria_id) {
      const { data: cat, error: catErr } = await supabase
        .from('categorias')
        .select('id, nombre')
        .eq('id', categoria_id)
        .single();

      if (catErr || !cat) {
        const { data: todas } = await supabase.from('categorias').select('id, nombre');
        return res.status(400).json({
          error                  : `No existe una categoría con id ${categoria_id}.`,
          sugerencia             : 'Usa categoria_nueva para crear una categoría personalizada.',
          categorias_disponibles : todas || [],
        });
      }
      categoriaFinal = cat;

    } else if (categoria_nueva && categoria_nueva.trim() !== '') {
      // Buscar si ya existe (case insensitive)
      const { data: existe } = await supabase
        .from('categorias')
        .select('id, nombre')
        .ilike('nombre', categoria_nueva.trim())
        .maybeSingle();

      if (existe) {
        categoriaFinal = existe;
      } else {
        const { data: nueva, error: nuevaErr } = await supabase
          .from('categorias')
          .insert({ nombre: categoria_nueva.trim() })
          .select()
          .single();

        if (nuevaErr) throw nuevaErr;
        categoriaFinal = nueva;
      }
    }

    // ── BLOQUE 6: Validación de entradas / tickets ─────────────────────────
    if (entradas && !Array.isArray(entradas)) {
      return res.status(400).json({ error: 'entradas debe ser un arreglo.', campo: 'entradas' });
    }

    const entradasValidadas = [];
    for (let i = 0; i < (entradas || []).length; i++) {
      const e = entradas[i];

      if (!e.tipo || e.precio === undefined || !e.capacidad) {
        return res.status(400).json({
          error  : `La entrada en posición [${i}] requiere: tipo, precio y capacidad.`,
          ejemplo: {
            tipo                : 'VIP',
            descripcion         : 'Acceso preferencial con kit de bienvenida',
            precio              : 150000,
            capacidad           : 100,
            fecha_limite_venta  : '2026-09-01T23:59:00-05:00',
            precio_early_bird   : 120000,
            fecha_fin_early_bird: '2026-07-01T23:59:00-05:00',
            visible             : true,
          },
        });
      }

      if (Number(e.precio) < 0) {
        return res.status(400).json({ error: `El precio de "${e.tipo}" no puede ser negativo.` });
      }
      if (Number(e.capacidad) < 1) {
        return res.status(400).json({ error: `La capacidad de "${e.tipo}" debe ser al menos 1.` });
      }
      if (e.fecha_limite_venta && !esFechaValida(e.fecha_limite_venta)) {
        return res.status(400).json({ error: `fecha_limite_venta de "${e.tipo}" no tiene formato válido.` });
      }
      if (e.precio_early_bird !== undefined && Number(e.precio_early_bird) >= Number(e.precio)) {
        return res.status(400).json({ error: `El precio Early Bird de "${e.tipo}" debe ser menor al precio regular.` });
      }

      entradasValidadas.push({
        tipo                : e.tipo.trim(),
        descripcion         : e.descripcion         || '',
        precio              : parseFloat(e.precio),
        moneda              : monedaFinal,
        capacidad           : parseInt(e.capacidad),
        vendidas            : 0,
        disponibles         : parseInt(e.capacidad),
        fecha_limite_venta  : e.fecha_limite_venta   || null,
        precio_early_bird   : e.precio_early_bird !== undefined ? parseFloat(e.precio_early_bird) : null,
        fecha_fin_early_bird: e.fecha_fin_early_bird || null,
        visible             : e.visible !== undefined ? Boolean(e.visible) : true,
      });
    }

    // ── BLOQUE 7: Códigos de descuento ─────────────────────────────────────
    if (codigos_descuento && !Array.isArray(codigos_descuento)) {
      return res.status(400).json({ error: 'codigos_descuento debe ser un arreglo.' });
    }

    const codigosValidados = [];
    for (let i = 0; i < (codigos_descuento || []).length; i++) {
      const c = codigos_descuento[i];

      if (!c.codigo || c.descuento === undefined || !c.tipo) {
        return res.status(400).json({
          error  : `El código en posición [${i}] requiere: codigo, descuento y tipo.`,
          ejemplo: { codigo: 'EARLY20', descuento: 20, tipo: 'porcentaje', usos_maximos: 100 },
        });
      }
      if (!TIPO_DESCUENTO.includes(c.tipo)) {
        return res.status(400).json({ error: `Tipo de descuento inválido.`, opciones_validas: TIPO_DESCUENTO });
      }
      if (c.tipo === 'porcentaje' && (Number(c.descuento) <= 0 || Number(c.descuento) > 100)) {
        return res.status(400).json({ error: `El descuento porcentual de "${c.codigo}" debe estar entre 1 y 100.` });
      }

      const duplicado = codigosValidados.find(x => x.codigo === c.codigo.toUpperCase().trim());
      if (duplicado) {
        return res.status(400).json({ error: `El código "${c.codigo}" está duplicado.` });
      }

      codigosValidados.push({
        codigo          : c.codigo.toUpperCase().trim(),
        descuento       : parseFloat(c.descuento),
        tipo            : c.tipo,
        aplica_a        : c.aplica_a        || null,
        usos_maximos    : c.usos_maximos    || null,
        usos_actuales   : 0,
        activo          : true,
        fecha_expiracion: c.fecha_expiracion || null,
      });
    }

    // ── BLOQUE 8: Speakers ─────────────────────────────────────────────────
    if (speakers && !Array.isArray(speakers)) {
      return res.status(400).json({ error: 'speakers debe ser un arreglo.' });
    }

    const speakersValidados = (speakers || []).map((s, i) => {
      if (!s.nombre?.trim()) {
        throw { status: 400, mensaje: `El speaker en posición [${i}] requiere al menos un nombre.` };
      }
      return {
        nombre  : s.nombre.trim(),
        cargo   : s.cargo   || '',
        empresa : s.empresa || '',
        bio     : s.bio     || '',
        foto    : s.foto    || null,
        redes   : s.redes   || [],
      };
    });

    // ── BLOQUE 9: Patrocinadores ───────────────────────────────────────────
    if (patrocinadores && !Array.isArray(patrocinadores)) {
      return res.status(400).json({ error: 'patrocinadores debe ser un arreglo.' });
    }

    const patrocinadoresValidados = (patrocinadores || []).map((p, i) => {
      if (!p.nombre?.trim()) {
        throw { status: 400, mensaje: `El patrocinador en posición [${i}] requiere al menos un nombre.` };
      }
      if (p.nivel && !NIVELES_SPONSOR.includes(p.nivel)) {
        throw { status: 400, mensaje: `Nivel de patrocinador inválido: "${p.nivel}". Opciones: ${NIVELES_SPONSOR.join(', ')}.` };
      }
      return {
        nombre : p.nombre.trim(),
        logo   : p.logo  || null,
        url    : p.url   || null,
        nivel  : p.nivel || 'general',
      };
    });

    // ── BLOQUE 10: Agenda ──────────────────────────────────────────────────
    if (agenda && !Array.isArray(agenda)) {
      return res.status(400).json({ error: 'agenda debe ser un arreglo.' });
    }

    const agendaValidada = (agenda || []).map((item, i) => {
      if (!item.hora_inicio || !item.actividad) {
        throw {
          status : 400,
          mensaje: `El ítem de agenda en posición [${i}] requiere hora_inicio y actividad.`,
          ejemplo: { hora_inicio: '09:00', hora_fin: '10:30', actividad: 'Keynote', lugar: 'Auditorio Principal', speaker_id: null },
        };
      }
      return {
        hora_inicio : item.hora_inicio,
        hora_fin    : item.hora_fin    || null,
        actividad   : item.actividad.trim(),
        descripcion : item.descripcion || '',
        lugar       : item.lugar       || null,
        speaker_id  : item.speaker_id  || null,
      };
    });

    // ── BLOQUE 11: Redes sociales ──────────────────────────────────────────
    if (redes_sociales && !Array.isArray(redes_sociales)) {
      return res.status(400).json({ error: 'redes_sociales debe ser un arreglo.' });
    }

    const redesValidadas = (redes_sociales || []).map(r => ({
      plataforma : r.plataforma || 'otro',
      url        : r.url        || '',
      etiqueta   : r.etiqueta   || r.plataforma || 'Link',
    }));

    // ── BLOQUE 12: Armar el objeto evento para insertar en Supabase ────────
    const capacidadTotal = capacidad_total
      || entradasValidadas.reduce((acc, e) => acc + e.capacidad, 0);

    const nuevoEvento = {
      organizacion_id     : req.usuario.organizacion_id || req.usuario.id,
      organizador_id      : req.usuario.id,
      nombre              : nombre.trim(),
      descripcion         : descripcion              || '',
      modalidad,
      visibilidad         : visibilidad              || 'publico',
      estado              : 'borrador',
      moneda              : monedaFinal,
      fecha_inicio        : fecha_inicio             || null,
      fecha_fin           : fecha_fin                || null,
      sesiones            : sesionesValidadas,
      ubicacion           : {
        ciudad         : ubicacion?.ciudad         || null,
        lugar          : ubicacion?.lugar          || null,
        direccion      : ubicacion?.direccion      || null,
        coordenadas    : ubicacion?.coordenadas    || null,
        link_streaming : ubicacion?.link_streaming || null,
      },
      categoria_id        : categoriaFinal?.id       || null,
      restricciones       : restricciones            || null,
      imagen_portada      : imagen_portada           || null,
      galeria             : galeria                  || [],
      entradas            : entradasValidadas,
      capacidad_total     : capacidadTotal,
      asistentes_count    : 0,
      requiere_aprobacion : requiere_aprobacion !== undefined ? Boolean(requiere_aprobacion) : false,
      codigos_descuento   : codigosValidados,
      speakers            : speakersValidados,
      patrocinadores      : patrocinadoresValidados,
      agenda              : agendaValidada,
      redes_sociales      : redesValidadas,
      terminos_propios    : terminos_propios          || null,
      politica_reembolso  : politica_reembolso        || null,
      acepta_terminos_plataforma: true,
    };

    // ── BLOQUE 13: Insertar en Supabase ────────────────────────────────────
    const { data: eventoCreado, error: insertError } = await supabase
      .from('eventos')
      .insert(nuevoEvento)
      .select()
      .single();

    if (insertError) throw insertError;

    // ── BLOQUE 14: Calcular progreso y armar respuesta ─────────────────────
    const progreso = calcularProgreso(eventoCreado);

    const links = {
      self       : `/eventos/${eventoCreado.id}`,
      publicar   : `/eventos/${eventoCreado.id}/publicar`,
      cancelar   : `/eventos/${eventoCreado.id}/cancelar`,
      staff      : `/eventos/${eventoCreado.id}/staff`,
      asistentes : `/eventos/${eventoCreado.id}/asistentes`,
    };

    return res.status(201).json({
      mensaje        : 'Evento creado exitosamente como borrador.',
      progreso,
      siguiente_paso : progreso.listo_para_publicar
        ? 'El evento cumple los requisitos mínimos. Llama a POST /eventos/:id/publicar cuando esté listo.'
        : 'Completa los campos marcados como false en progreso.checks antes de publicar.',
      links,
      evento         : eventoCreado,
    });

  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.mensaje });
    }
    console.error('Error en POST /eventos:', err.message);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

module.exports = router;