const router   = require('express').Router();
const supabase = require('../db/supabase');
const verificarToken      = require('../middleware/auth');
const verificarTokenOpcional = require('../middleware/authOpcional');

// ════════════════════════════════════════════════════════════
//  CONSTANTES
// ════════════════════════════════════════════════════════════
const ORDENAMIENTOS_VALIDOS = ['fecha_inicio', '-fecha_inicio', 'nombre', '-nombre', 'creado_en', '-creado_en'];
const LIMIT_MAX             = 100;
const LIMIT_DEFAULT         = 20;

// ════════════════════════════════════════════════════════════
//  RESUMEN DE = GET /eventos
//
//  Filtros disponibles:
//    ?q=           búsqueda textual (nombre o descripción)
//    ?categoria=   id de categoría
//    ?modalidad=   fisico | virtual | hibrido
//    ?ciudad=      coincidencia parcial
//    ?lugar=       coincidencia parcial
//    ?fecha_inicio=  eventos desde esta fecha (ISO 8601)
//    ?fecha_fin=     eventos hasta esta fecha (ISO 8601)
//    ?estado=      borrador | publicado | cerrado | finalizado | cancelado
//    ?visibilidad= publico | privado
//    ?moneda=      COP | USD | EUR ...
//
//  Paginación:
//    ?page=1       página actual (default: 1)
//    ?limit=20     resultados por página (default: 20, max: 100)
//
//  Ordenamiento:
//    ?sort=fecha_inicio   ascendente
//    ?sort=-fecha_inicio  descendente (default)
//
//  Control de acceso:
//    - Sin token    → solo eventos publicados y públicos
//    - Con token    → el organizador ve todos sus eventos
//                     (incluyendo borradores y privados de su organización)
// ════════════════════════════════════════════════════════════
router.get('/', verificarTokenOpcional, async (req, res) => {
  try {
    const {
      q,
      categoria,
      modalidad,
      ciudad,
      lugar,
      fecha_inicio,
      fecha_fin,
      estado,
      visibilidad,
      moneda,
      page,
      limit,
      sort,
    } = req.query;

    // ── Paginación ─────────────────────────────────────────────────────────
    const paginaActual    = Math.max(1, parseInt(page)  || 1);
    const resultadosPorPagina = Math.min(LIMIT_MAX, Math.max(1, parseInt(limit) || LIMIT_DEFAULT));
    const desde           = (paginaActual - 1) * resultadosPorPagina;
    const hasta           = desde + resultadosPorPagina - 1;

    // ── Ordenamiento ───────────────────────────────────────────────────────
    let columnaOrden    = 'fecha_inicio';
    let ordenAscendente = false; // por defecto más próximos primero

    if (sort) {
      const sortLimpio = sort.trim();
      if (!ORDENAMIENTOS_VALIDOS.includes(sortLimpio)) {
        return res.status(400).json({
          error            : 'Valor de sort no válido.',
          opciones_validas : ORDENAMIENTOS_VALIDOS,
        });
      }
      ordenAscendente = !sortLimpio.startsWith('-');
      columnaOrden    = sortLimpio.replace(/^-/, '');
    }

    // ── Base de la query ───────────────────────────────────────────────────
    let query = supabase
      .from('eventos')
      .select(`
        id,
        nombre,
        descripcion,
        modalidad,
        visibilidad,
        estado,
        moneda,
        fecha_inicio,
        fecha_fin,
        ubicacion,
        imagen_portada,
        capacidad_total,
        asistentes_count,
        categoria_id,
        organizacion_id,
        organizador_id,
        entradas,
        redes_sociales,
        creado_en,
        categorias ( id, nombre )
      `, { count: 'exact' });

    // ── Control de acceso ──────────────────────────────────────────────────
    if (req.usuario) {
      // Usuario autenticado: ve sus propios eventos (todos los estados)
      // + eventos públicos y publicados de otros
      query = query.or(
        `organizacion_id.eq.${req.usuario.organizacion_id || req.usuario.id},` +
        `and(estado.eq.publicado,visibilidad.eq.publico)`
      );
    } else {
      // Sin token: solo eventos publicados y públicos
      query = query
        .eq('estado', 'publicado')
        .eq('visibilidad', 'publico');
    }

    // ── Filtros opcionales ─────────────────────────────────────────────────

    // Búsqueda textual (nombre o descripción)
    if (q && q.trim() !== '') {
      query = query.or(`nombre.ilike.%${q.trim()}%,descripcion.ilike.%${q.trim()}%`);
    }

    // Categoría
    if (categoria) {
      const catId = parseInt(categoria);
      if (isNaN(catId)) {
        return res.status(400).json({ error: 'El filtro categoria debe ser un número (id de categoría).' });
      }
      query = query.eq('categoria_id', catId);
    }

    // Modalidad
    if (modalidad) {
      const modalidades = ['fisico', 'virtual', 'hibrido'];
      if (!modalidades.includes(modalidad)) {
        return res.status(400).json({ error: 'Modalidad inválida.', opciones_validas: modalidades });
      }
      query = query.eq('modalidad', modalidad);
    }

    // Ciudad (dentro del JSON de ubicacion)
    if (ciudad && ciudad.trim() !== '') {
      query = query.ilike('ubicacion->>ciudad', `%${ciudad.trim()}%`);
    }

    // Lugar (dentro del JSON de ubicacion)
    if (lugar && lugar.trim() !== '') {
      query = query.ilike('ubicacion->>lugar', `%${lugar.trim()}%`);
    }

    // Rango de fechas
    if (fecha_inicio) {
      if (isNaN(Date.parse(fecha_inicio))) {
        return res.status(400).json({ error: 'fecha_inicio tiene formato inválido.', formato_esperado: 'ISO 8601' });
      }
      query = query.gte('fecha_inicio', fecha_inicio);
    }

    if (fecha_fin) {
      if (isNaN(Date.parse(fecha_fin))) {
        return res.status(400).json({ error: 'fecha_fin tiene formato inválido.', formato_esperado: 'ISO 8601' });
      }
      query = query.lte('fecha_inicio', fecha_fin);
    }

    // Estado — solo el organizador puede filtrar por borrador/cancelado
    if (estado) {
      const estadosValidos = ['borrador', 'publicado', 'cerrado', 'finalizado', 'cancelado'];
      if (!estadosValidos.includes(estado)) {
        return res.status(400).json({ error: 'Estado inválido.', opciones_validas: estadosValidos });
      }
      // Si pide borradores sin token, rechazar
      if ((estado === 'borrador' || estado === 'cancelado') && !req.usuario) {
        return res.status(401).json({ error: 'Debes iniciar sesión para filtrar por ese estado.' });
      }
      query = query.eq('estado', estado);
    }

    // Visibilidad — solo con token
    if (visibilidad) {
      if (!['publico', 'privado'].includes(visibilidad)) {
        return res.status(400).json({ error: 'Visibilidad inválida.', opciones_validas: ['publico', 'privado'] });
      }
      if (visibilidad === 'privado' && !req.usuario) {
        return res.status(401).json({ error: 'Debes iniciar sesión para ver eventos privados.' });
      }
      query = query.eq('visibilidad', visibilidad);
    }

    // Moneda
    if (moneda) {
      query = query.eq('moneda', moneda.toUpperCase().trim());
    }

    // ── Ordenamiento y paginación ──────────────────────────────────────────
    query = query
      .order(columnaOrden, { ascending: ordenAscendente })
      .range(desde, hasta);

    // ── Ejecutar query ─────────────────────────────────────────────────────
    const { data: eventos, error, count } = await query;

    if (error) throw error;

    // ── Calcular metadata de paginación ───────────────────────────────────
    const totalResultados  = count || 0;
    const totalPaginas     = Math.ceil(totalResultados / resultadosPorPagina);
    const hayPaginaSiguiente = paginaActual < totalPaginas;
    const hayPaginaAnterior  = paginaActual > 1;

    // ── Enriquecer cada evento con links HATEOAS ───────────────────────────
    const eventosConLinks = (eventos || []).map(e => ({
      ...e,
      links: {
        self       : `/eventos/${e.id}`,
        asistentes : `/eventos/${e.id}/asistentes`,
        ...(req.usuario && (req.usuario.id === e.organizador_id)
          ? {
              publicar : `/eventos/${e.id}/publicar`,
              cancelar : `/eventos/${e.id}/cancelar`,
              staff    : `/eventos/${e.id}/staff`,
              editar   : `/eventos/${e.id}`,
            }
          : {}
        ),
      },
    }));

    // ── Respuesta final ────────────────────────────────────────────────────
    return res.json({
      paginacion: {
        total              : totalResultados,
        pagina_actual      : paginaActual,
        resultados_por_pagina: resultadosPorPagina,
        total_paginas      : totalPaginas,
        hay_siguiente      : hayPaginaSiguiente,
        hay_anterior       : hayPaginaAnterior,
        siguiente          : hayPaginaSiguiente ? `/eventos?page=${paginaActual + 1}&limit=${resultadosPorPagina}` : null,
        anterior           : hayPaginaAnterior  ? `/eventos?page=${paginaActual - 1}&limit=${resultadosPorPagina}` : null,
      },
      filtros_aplicados: {
        q, categoria, modalidad, ciudad, lugar,
        fecha_inicio, fecha_fin, estado, visibilidad, moneda,
        sort: sort || '-fecha_inicio',
      },
      eventos: eventosConLinks,
    });

  } catch (err) {
    console.error('Error en GET /eventos:', err.message);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

module.exports = router;