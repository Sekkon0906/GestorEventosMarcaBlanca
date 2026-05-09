const router   = require('express').Router();
const supabase = require('../db/supabase');
const verificarTokenOpcional = require('../middleware/authOpcional');

// ════════════════════════════════════════════════════════════
//  RESUMEN DE = GET /eventos/:id
//
//  Devuelve el detalle completo de un evento.
//
//  Control de acceso:
//    - Sin token:
//        → Solo eventos publicados y públicos
//        → No ve codigos_descuento ni lista de staff
//    - Con token (usuario autenticado no organizador):
//        → Solo eventos publicados (públicos o privados)
//        → No ve codigos_descuento ni staff interno
//    - Con token (organizador del evento):
//        → Ve todo: borradores, privados, códigos, staff, progreso
// ════════════════════════════════════════════════════════════



router.get('/:id', verificarTokenOpcional, async (req, res) => {
  try {
    const { id } = req.params;

    // ── Validar que el id sea numérico ─────────────────────────────────────
    if (isNaN(Number(id))) {
      return res.status(400).json({ error: 'El id del evento debe ser un número.' });
    }

    // ── Buscar el evento en Supabase ───────────────────────────────────────
    const { data: evento, error } = await supabase
      .from('eventos')
      .select(`
        id,
        organizacion_id,
        organizador_id,
        organizador_email,
        nombre,
        descripcion,
        modalidad,
        visibilidad,
        estado,
        moneda,
        fecha_inicio,
        fecha_fin,
        sesiones,
        ubicacion,
        categoria_id,
        restricciones,
        imagen_portada,
        galeria,
        entradas,
        capacidad_total,
        asistentes_count,
        requiere_aprobacion,
        codigos_descuento,
        speakers,
        patrocinadores,
        agenda,
        redes_sociales,
        terminos_propios,
        politica_reembolso,
        acepta_terminos_plataforma,
        staff,
        creado_en,
        actualizado_en,
        categorias ( id, nombre )
      `)
      .eq('id', id)
      .single();

    if (error || !evento) {
      return res.status(404).json({ error: `No existe un evento con id ${id}.` });
    }

    // ── Determinar el rol del solicitante ──────────────────────────────────
    const esOrganizador = req.usuario &&
      (req.usuario.id === evento.organizador_id ||
       req.usuario.organizacion_id === evento.organizacion_id);

    const esAutenticado = !!req.usuario;

    // ── Control de acceso por estado y visibilidad ─────────────────────────

    // Borradores: solo el organizador puede verlos
    if (evento.estado === 'borrador' && !esOrganizador) {
      return res.status(403).json({
        error: 'Este evento aún no está publicado.',
      });
    }

    // Eventos cancelados o finalizados: solo el organizador los ve completos
    // El público solo ve una respuesta resumida
    if ((evento.estado === 'cancelado' || evento.estado === 'finalizado') && !esOrganizador) {
      return res.status(200).json({
        mensaje : `Este evento fue ${evento.estado}.`,
        evento  : {
          id          : evento.id,
          nombre      : evento.nombre,
          estado      : evento.estado,
          fecha_inicio: evento.fecha_inicio,
          imagen_portada: evento.imagen_portada,
        },
      });
    }

    // Eventos privados: solo autenticados pueden verlos
    if (evento.visibilidad === 'privado' && !esAutenticado) {
      return res.status(401).json({
        error: 'Este evento es privado. Debes iniciar sesión para verlo.',
      });
    }

    // ── Calcular disponibilidad de entradas ────────────────────────────────
    const ahora = new Date();

    const entradasConEstado = (evento.entradas || []).map(entrada => {
      const agotada        = entrada.disponibles <= 0;
      const vencida        = entrada.fecha_limite_venta && new Date(entrada.fecha_limite_venta) < ahora;
      const enEarlyBird    = entrada.precio_early_bird !== null &&
                             entrada.fecha_fin_early_bird &&
                             new Date(entrada.fecha_fin_early_bird) > ahora;

      return {
        ...entrada,
        precio_vigente : enEarlyBird ? entrada.precio_early_bird : entrada.precio,
        en_early_bird  : enEarlyBird,
        disponible     : !agotada && !vencida && entrada.visible,
        razon_no_disponible: agotada  ? 'agotada'
                           : vencida  ? 'venta_cerrada'
                           : !entrada.visible ? 'no_visible'
                           : null,
        // Ocultar vendidas al público general
        vendidas       : esOrganizador ? entrada.vendidas : undefined,
      };
    });

    // ── Calcular progreso del borrador (solo para el organizador) ──────────
    let progreso = null;
    if (esOrganizador && evento.estado === 'borrador') {
      const checks = {
        info_basica : !!(evento.nombre && evento.modalidad && evento.descripcion),
        fechas      : !!(evento.fecha_inicio),
        ubicacion   : !!(evento.ubicacion?.ciudad || evento.ubicacion?.link_streaming),
        entradas    : (evento.entradas || []).length > 0,
        media       : !!(evento.imagen_portada),
        agenda      : (evento.agenda || []).length > 0,
        speakers    : (evento.speakers || []).length > 0,
      };
      const completados = Object.values(checks).filter(Boolean).length;
      progreso = {
        checks,
        porcentaje         : Math.round((completados / Object.keys(checks).length) * 100),
        listo_para_publicar: checks.info_basica && checks.fechas && checks.ubicacion && checks.entradas,
      };
    }

    // ── Armar links HATEOAS según el rol ──────────────────────────────────
    const links = {
      self       : `/eventos/${evento.id}`,
      lista      : '/eventos',
      asistentes : esOrganizador ? `/eventos/${evento.id}/asistentes` : undefined,
    };

    if (esOrganizador) {
      if (evento.estado === 'borrador')   links.publicar  = `/eventos/${evento.id}/publicar`;
      if (evento.estado === 'publicado')  links.cerrar    = `/eventos/${evento.id}/cerrar`;
      if (evento.estado !== 'cancelado' &&
          evento.estado !== 'finalizado') links.cancelar  = `/eventos/${evento.id}/cancelar`;
      links.editar = `/eventos/${evento.id}`;
      links.staff  = `/eventos/${evento.id}/staff`;
    }

    // ── Construir respuesta según el rol ───────────────────────────────────
    const respuesta = {
      id                : evento.id,
      nombre            : evento.nombre,
      descripcion       : evento.descripcion,
      modalidad         : evento.modalidad,
      visibilidad       : evento.visibilidad,
      estado            : evento.estado,
      moneda            : evento.moneda,
      fecha_inicio      : evento.fecha_inicio,
      fecha_fin         : evento.fecha_fin,
      sesiones          : evento.sesiones,
      ubicacion         : evento.ubicacion,
      categoria         : evento.categorias,
      restricciones     : evento.restricciones,
      imagen_portada    : evento.imagen_portada,
      galeria           : evento.galeria,
      capacidad_total   : evento.capacidad_total,
      asistentes_count  : evento.asistentes_count,
      requiere_aprobacion: evento.requiere_aprobacion,
      entradas          : entradasConEstado,
      speakers          : evento.speakers,
      patrocinadores    : evento.patrocinadores,
      agenda            : evento.agenda,
      redes_sociales    : evento.redes_sociales,
      terminos_propios  : evento.terminos_propios,
      politica_reembolso: evento.politica_reembolso,
      creado_en         : evento.creado_en,
      actualizado_en    : evento.actualizado_en,

      // Solo visible para el organizador
      ...(esOrganizador && {
        organizador_email : evento.organizador_email,
        codigos_descuento : evento.codigos_descuento,
        staff             : evento.staff,
        progreso,
      }),

      links,
    };

    return res.json({ evento: respuesta });

  } catch (err) {
    console.error('❌ Error en GET /eventos/:id:', err.message);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

module.exports = router;