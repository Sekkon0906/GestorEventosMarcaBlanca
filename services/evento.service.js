'use strict';

/**
 * services/evento.service.js
 *
 * Lógica de negocio del dominio de eventos.
 * Sin conocimiento de HTTP — sin req/res.
 *
 * Patrón de respuesta:
 *   { ok: true,  data: {...} }          → éxito
 *   { ok: false, status, error, meta? } → fallo controlado
 *
 * Responsabilidades:
 *   - Validaciones que requieren BD (categoría existente)
 *   - Normalización/transformación de arrays de entrada
 *   - Cálculo de progreso del evento
 *   - Insert / Update en Supabase
 *
 * Lo que NO hace este service:
 *   - Parsear req.body (eso es la ruta)
 *   - Validar shape/formato (eso es el validator)
 *   - Responder HTTP (eso es la ruta)
 */

const supabase = require('../db/supabase');
const { TIPOS_DESCUENTO, NIVELES_PATROCINADOR } = require('../validators/evento.validator');

// ── Campos permitidos en PATCH /eventos/:id ───────────────────
const CAMPOS_ACTUALIZABLES = [
  'nombre', 'descripcion', 'modalidad', 'visibilidad', 'moneda',
  'fecha_inicio', 'fecha_fin', 'ubicacion', 'imagen_portada', 'galeria',
  'entradas', 'capacidad_total', 'requiere_aprobacion',
  'speakers', 'patrocinadores', 'agenda', 'redes_sociales',
  'terminos_propios', 'politica_reembolso', 'sesiones',
];

// ════════════════════════════════════════════════════════════
//  HELPERS PRIVADOS — normalización de sub-entidades
// ════════════════════════════════════════════════════════════

function _normalizarEntradas(entradas, moneda) {
  return (entradas || []).map(e => ({
    tipo                : e.tipo.trim(),
    descripcion         : e.descripcion            || '',
    precio              : parseFloat(e.precio),
    moneda,
    capacidad           : parseInt(e.capacidad, 10),
    vendidas            : 0,
    disponibles         : parseInt(e.capacidad, 10),
    fecha_limite_venta  : e.fecha_limite_venta      || null,
    precio_early_bird   : e.precio_early_bird !== undefined ? parseFloat(e.precio_early_bird) : null,
    fecha_fin_early_bird: e.fecha_fin_early_bird    || null,
    visible             : e.visible !== undefined ? Boolean(e.visible) : true,
  }));
}

function _normalizarDescuentos(codigos) {
  return (codigos || []).map(c => ({
    codigo          : c.codigo.toUpperCase().trim(),
    descuento       : parseFloat(c.descuento),
    tipo            : c.tipo,
    aplica_a        : c.aplica_a        || null,
    usos_maximos    : c.usos_maximos    || null,
    usos_actuales   : 0,
    activo          : true,
    fecha_expiracion: c.fecha_expiracion || null,
  }));
}

function _normalizarSpeakers(speakers) {
  return (speakers || []).map(s => ({
    nombre  : s.nombre.trim(),
    cargo   : s.cargo   || '',
    empresa : s.empresa || '',
    bio     : s.bio     || '',
    foto    : s.foto    || null,
    redes   : Array.isArray(s.redes) ? s.redes : [],
  }));
}

function _normalizarPatrocinadores(patrocinadores) {
  return (patrocinadores || []).map(p => ({
    nombre : p.nombre.trim(),
    logo   : p.logo  || null,
    url    : p.url   || null,
    nivel  : NIVELES_PATROCINADOR.includes(p.nivel) ? p.nivel : 'general',
  }));
}

function _normalizarAgenda(agenda) {
  return (agenda || []).map(a => ({
    hora_inicio : a.hora_inicio,
    hora_fin    : a.hora_fin    || null,
    actividad   : a.actividad.trim(),
    descripcion : a.descripcion || '',
    lugar       : a.lugar       || null,
    speaker_id  : a.speaker_id  || null,
  }));
}

function _normalizarSesiones(sesiones) {
  return (sesiones || []).map(s => ({
    fecha       : s.fecha,
    hora_inicio : s.hora_inicio,
    hora_fin    : s.hora_fin    || null,
    descripcion : s.descripcion || '',
    lugar       : s.lugar       || null,
  }));
}

function _normalizarRedes(redes) {
  return (redes || []).map(r => ({
    plataforma : r.plataforma || 'otro',
    url        : r.url        || '',
    etiqueta   : r.etiqueta   || r.plataforma || 'Link',
  }));
}

// ════════════════════════════════════════════════════════════
//  calcularProgreso — devuelve % de completitud del evento
// ════════════════════════════════════════════════════════════
function calcularProgreso(datos) {
  const checks = {
    info_basica : !!(datos.nombre && datos.modalidad && datos.descripcion),
    fechas      : !!(datos.fecha_inicio),
    ubicacion   : !!(datos.ubicacion?.ciudad || datos.ubicacion?.link_streaming),
    entradas    : (datos.entradas || []).length > 0,
    media       : !!(datos.imagen_portada),
    agenda      : (datos.agenda  || []).length > 0,
    speakers    : (datos.speakers || []).length > 0,
  };
  const completados = Object.values(checks).filter(Boolean).length;
  return {
    checks,
    porcentaje          : Math.round((completados / Object.keys(checks).length) * 100),
    listo_para_publicar : checks.info_basica && checks.fechas && checks.ubicacion && checks.entradas,
  };
}

// ════════════════════════════════════════════════════════════
//  resolverCategoria — lookup o creación en BD
//  Retorna { id, nombre } o lanza objeto con status/error
// ════════════════════════════════════════════════════════════
async function _resolverCategoria(categoria_id, categoria_nueva) {
  if (!categoria_id && !categoria_nueva) return null;

  if (categoria_id) {
    const { data: cat, error } = await supabase
      .from('categorias')
      .select('id, nombre')
      .eq('id', categoria_id)
      .single();

    if (error || !cat) {
      const { data: todas } = await supabase.from('categorias').select('id, nombre');
      return {
        _error: true,
        status: 400,
        error : `No existe una categoría con id ${categoria_id}.`,
        meta  : { categorias_disponibles: todas || [] },
      };
    }
    return cat;
  }

  // categoria_nueva — buscar primero (case insensitive), crear si no existe
  const nombreTrim = categoria_nueva.trim();
  const { data: existente } = await supabase
    .from('categorias')
    .select('id, nombre')
    .ilike('nombre', nombreTrim)
    .maybeSingle();

  if (existente) return existente;

  const { data: nueva, error: err } = await supabase
    .from('categorias')
    .insert({ nombre: nombreTrim })
    .select()
    .single();

  if (err) throw err;
  return nueva;
}

// ════════════════════════════════════════════════════════════
//  crear — POST /eventos
// ════════════════════════════════════════════════════════════
/**
 * @param {object} body  - req.body ya validado por validateCrear()
 * @param {object} organizador - req.usuario (id, organizacion_id)
 */
async function crear(body, organizador) {
  const {
    nombre, descripcion, modalidad, visibilidad, moneda,
    fecha_inicio, fecha_fin, sesiones, ubicacion,
    categoria_id, categoria_nueva, restricciones,
    imagen_portada, galeria, entradas, capacidad_total,
    codigos_descuento, requiere_aprobacion,
    speakers, patrocinadores, agenda,
    redes_sociales, terminos_propios, politica_reembolso,
  } = body;

  // 1. Resolver categoría (puede requerir BD)
  const categoriaResult = await _resolverCategoria(categoria_id, categoria_nueva);
  if (categoriaResult?._error) {
    return { ok: false, status: categoriaResult.status, error: categoriaResult.error, meta: categoriaResult.meta };
  }

  // 2. Moneda normalizada
  const monedaFinal = (moneda || 'COP').toUpperCase().trim();

  // 3. Normalizar todas las sub-entidades
  const entradasNorm      = _normalizarEntradas(entradas, monedaFinal);
  const descuentosNorm    = _normalizarDescuentos(codigos_descuento);
  const speakersNorm      = _normalizarSpeakers(speakers);
  const patrocinadoresNorm = _normalizarPatrocinadores(patrocinadores);
  const agendaNorm        = _normalizarAgenda(agenda);
  const sesionesNorm      = _normalizarSesiones(sesiones);
  const redesNorm         = _normalizarRedes(redes_sociales);

  // 4. Capacidad total auto-calculada si no se pasa explícitamente
  const capacidadTotal = capacidad_total
    || entradasNorm.reduce((acc, e) => acc + e.capacidad, 0);

  // 5. Construir objeto del evento
  const nuevoEvento = {
    organizacion_id      : organizador.organizacion_id || organizador.id,
    organizador_id       : organizador.id,
    nombre               : nombre.trim(),
    descripcion          : descripcion                  || '',
    modalidad,
    visibilidad          : visibilidad                  || 'publico',
    estado               : 'borrador',
    moneda               : monedaFinal,
    fecha_inicio         : fecha_inicio                 || null,
    fecha_fin            : fecha_fin                    || null,
    sesiones             : sesionesNorm,
    ubicacion: {
      ciudad         : ubicacion?.ciudad         || null,
      lugar          : ubicacion?.lugar          || null,
      direccion      : ubicacion?.direccion      || null,
      coordenadas    : ubicacion?.coordenadas    || null,
      link_streaming : ubicacion?.link_streaming || null,
    },
    categoria_id         : categoriaResult?.id           || null,
    restricciones        : restricciones                 || null,
    imagen_portada       : imagen_portada                || null,
    galeria              : Array.isArray(galeria) ? galeria : [],
    entradas             : entradasNorm,
    capacidad_total      : capacidadTotal,
    asistentes_count     : 0,
    requiere_aprobacion  : requiere_aprobacion !== undefined ? Boolean(requiere_aprobacion) : false,
    codigos_descuento    : descuentosNorm,
    speakers             : speakersNorm,
    patrocinadores       : patrocinadoresNorm,
    agenda               : agendaNorm,
    redes_sociales       : redesNorm,
    terminos_propios     : terminos_propios              || null,
    politica_reembolso   : politica_reembolso            || null,
    acepta_terminos_plataforma: true,
  };

  // 6. Insertar en Supabase
  const { data: eventoCreado, error: insertError } = await supabase
    .from('eventos')
    .insert(nuevoEvento)
    .select()
    .single();

  if (insertError) throw insertError;

  // 7. Calcular progreso y armar links HATEOAS
  const progreso = calcularProgreso(eventoCreado);
  const links = {
    self       : `/eventos/${eventoCreado.id}`,
    publicar   : `/eventos/${eventoCreado.id}/publicar`,
    cancelar   : `/eventos/${eventoCreado.id}/cancelar`,
    staff      : `/eventos/${eventoCreado.id}/staff`,
    asistentes : `/eventos/${eventoCreado.id}/asistentes`,
  };

  return {
    ok  : true,
    data: {
      mensaje        : 'Evento creado exitosamente como borrador.',
      progreso,
      siguiente_paso : progreso.listo_para_publicar
        ? 'El evento cumple los requisitos mínimos. Llama a POST /eventos/:id/publicar cuando esté listo.'
        : 'Completa los campos marcados como false en progreso.checks antes de publicar.',
      links,
      evento         : eventoCreado,
    },
  };
}

// ════════════════════════════════════════════════════════════
//  getCategorias — GET /eventos/categorias
// ════════════════════════════════════════════════════════════
async function getCategorias(q) {
  let query = supabase.from('categorias').select('id, nombre');
  if (q) query = query.ilike('nombre', `%${q}%`);
  const { data, error } = await query.order('nombre');
  if (error) throw error;
  return { total: data.length, categorias: data, puede_crear_nueva: data.length === 0 };
}

module.exports = { crear, getCategorias, calcularProgreso };
