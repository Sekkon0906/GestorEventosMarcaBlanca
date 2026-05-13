'use strict';

/**
 * validators/evento.validator.js
 *
 * Validaciones PURAS para el dominio de eventos.
 * Sin efectos secundarios — sin acceso a BD, sin HTTP.
 * Las validaciones que requieren BD van en services/evento.service.js.
 *
 * Patrón de retorno:
 *   null                           → input válido, continuar
 *   { status, error, meta? }       → input inválido, responder con error
 */

// ── Constantes exportadas (reutilizables por service y tests) ─
const MODALIDADES_VALIDAS   = ['fisico', 'virtual', 'hibrido'];
const VISIBILIDADES_VALIDAS = ['publico', 'privado'];
const MONEDAS_VALIDAS       = ['COP', 'USD', 'EUR', 'MXN', 'ARS', 'BRL'];
const ESTADOS_VALIDOS       = ['borrador', 'publicado', 'cerrado', 'finalizado', 'cancelado'];
const TIPOS_DESCUENTO       = ['porcentaje', 'valor_fijo'];
const NIVELES_PATROCINADOR  = ['oro', 'plata', 'bronce', 'general'];

// ── Helpers ───────────────────────────────────────────────────
const isValidDate  = (s) => Boolean(s) && !isNaN(Date.parse(s));
const isValidUrl   = (s) => { try { new URL(s); return true; } catch { return false; } };
const isValidTime  = (s) => /^\d{2}:\d{2}$/.test(s || '');

// ════════════════════════════════════════════════════════════
//  validateCrear — POST /eventos
// ════════════════════════════════════════════════════════════
/**
 * Valida el body de POST /eventos.
 * Cubre: campos básicos, fechas, modalidad vs ubicación, moneda,
 *        entradas, descuentos, speakers, patrocinadores, agenda, sesiones.
 *
 * NO valida: existencia de categoria_id en BD (eso va al service).
 */
function validateCrear(body) {
  const {
    nombre, modalidad, visibilidad, moneda,
    fecha_inicio, fecha_fin, sesiones,
    ubicacion, entradas, codigos_descuento,
    speakers, patrocinadores, agenda,
  } = body;

  // ── 1. Campos obligatorios ──────────────────────────────────
  if (!nombre || typeof nombre !== 'string' || nombre.trim().length < 3)
    return { status: 400, error: 'nombre es obligatorio y debe tener al menos 3 caracteres.', campo: 'nombre' };

  if (!modalidad || !MODALIDADES_VALIDAS.includes(modalidad))
    return { status: 400, error: `modalidad debe ser: ${MODALIDADES_VALIDAS.join(', ')}.`, campo: 'modalidad', opciones_validas: MODALIDADES_VALIDAS };

  // ── 2. Fechas ───────────────────────────────────────────────
  if (fecha_inicio && !isValidDate(fecha_inicio))
    return { status: 400, error: 'fecha_inicio no tiene formato válido (ISO 8601).', campo: 'fecha_inicio' };

  if (fecha_fin && !isValidDate(fecha_fin))
    return { status: 400, error: 'fecha_fin no tiene formato válido (ISO 8601).', campo: 'fecha_fin' };

  if (fecha_inicio && fecha_fin && new Date(fecha_fin) <= new Date(fecha_inicio))
    return { status: 400, error: 'fecha_fin debe ser posterior a fecha_inicio.' };

  if (fecha_inicio && new Date(fecha_inicio) < new Date())
    return { status: 400, error: 'La fecha de inicio no puede estar en el pasado.' };

  // ── 3. Modalidad vs Ubicación ───────────────────────────────
  if ((modalidad === 'virtual' || modalidad === 'hibrido')) {
    if (!ubicacion?.link_streaming)
      return { status: 400, error: 'Los eventos virtuales e híbridos requieren ubicacion.link_streaming.', campo: 'ubicacion.link_streaming' };
    if (!isValidUrl(ubicacion.link_streaming))
      return { status: 400, error: 'ubicacion.link_streaming debe ser una URL válida.' };
  }

  if ((modalidad === 'fisico' || modalidad === 'hibrido') && (!ubicacion?.ciudad || !ubicacion?.lugar))
    return { status: 400, error: 'Los eventos físicos e híbridos requieren ciudad y lugar.', campos: ['ubicacion.ciudad', 'ubicacion.lugar'] };

  // ── 4. Visibilidad y moneda ─────────────────────────────────
  if (visibilidad && !VISIBILIDADES_VALIDAS.includes(visibilidad))
    return { status: 400, error: `visibilidad debe ser: ${VISIBILIDADES_VALIDAS.join(', ')}.` };

  const monedaFinal = (moneda || 'COP').toUpperCase().trim();
  if (!MONEDAS_VALIDAS.includes(monedaFinal))
    return { status: 400, error: `moneda no válida. Opciones: ${MONEDAS_VALIDAS.join(', ')}.`, opciones_validas: MONEDAS_VALIDAS };

  // ── 5. Sesiones ─────────────────────────────────────────────
  if (sesiones !== undefined && !Array.isArray(sesiones))
    return { status: 400, error: 'sesiones debe ser un arreglo.', campo: 'sesiones' };

  for (let i = 0; i < (sesiones || []).length; i++) {
    const s = sesiones[i];
    if (!s.fecha || !isValidDate(s.fecha))
      return { status: 400, error: `sesiones[${i}].fecha es obligatorio y debe ser fecha válida.` };
    if (!s.hora_inicio || !isValidTime(s.hora_inicio))
      return { status: 400, error: `sesiones[${i}].hora_inicio es obligatorio (formato HH:MM).` };
  }

  // ── 6. Entradas / tickets ───────────────────────────────────
  if (entradas !== undefined && !Array.isArray(entradas))
    return { status: 400, error: 'entradas debe ser un arreglo.', campo: 'entradas' };

  for (let i = 0; i < (entradas || []).length; i++) {
    const e = entradas[i];
    if (!e.tipo || e.precio === undefined || !e.capacidad)
      return {
        status: 400,
        error: `entradas[${i}]: se requieren tipo, precio y capacidad.`,
        ejemplo: { tipo: 'VIP', precio: 150000, capacidad: 100 },
      };
    if (Number(e.precio) < 0)
      return { status: 400, error: `entradas[${i}]: precio no puede ser negativo.` };
    if (Number(e.capacidad) < 1)
      return { status: 400, error: `entradas[${i}]: capacidad debe ser al menos 1.` };
    if (e.fecha_limite_venta && !isValidDate(e.fecha_limite_venta))
      return { status: 400, error: `entradas[${i}]: fecha_limite_venta no es válida.` };
    if (e.precio_early_bird !== undefined && Number(e.precio_early_bird) >= Number(e.precio))
      return { status: 400, error: `entradas[${i}]: precio_early_bird debe ser menor al precio regular.` };
  }

  // ── 7. Códigos de descuento ─────────────────────────────────
  if (codigos_descuento !== undefined && !Array.isArray(codigos_descuento))
    return { status: 400, error: 'codigos_descuento debe ser un arreglo.' };

  const codigosVistos = new Set();
  for (let i = 0; i < (codigos_descuento || []).length; i++) {
    const c = codigos_descuento[i];
    if (!c.codigo || c.descuento === undefined || !c.tipo)
      return { status: 400, error: `codigos_descuento[${i}]: se requieren codigo, descuento y tipo.` };
    if (!TIPOS_DESCUENTO.includes(c.tipo))
      return { status: 400, error: `codigos_descuento[${i}]: tipo debe ser ${TIPOS_DESCUENTO.join(', ')}.` };
    if (c.tipo === 'porcentaje' && (Number(c.descuento) <= 0 || Number(c.descuento) > 100))
      return { status: 400, error: `codigos_descuento[${i}]: descuento porcentual debe estar entre 1 y 100.` };
    const codigoNorm = c.codigo.toUpperCase().trim();
    if (codigosVistos.has(codigoNorm))
      return { status: 400, error: `Código de descuento duplicado: "${c.codigo}".` };
    codigosVistos.add(codigoNorm);
  }

  // ── 8. Speakers ─────────────────────────────────────────────
  if (speakers !== undefined && !Array.isArray(speakers))
    return { status: 400, error: 'speakers debe ser un arreglo.' };

  for (let i = 0; i < (speakers || []).length; i++) {
    if (!speakers[i].nombre?.trim())
      return { status: 400, error: `speakers[${i}]: nombre es obligatorio.` };
  }

  // ── 9. Patrocinadores ───────────────────────────────────────
  if (patrocinadores !== undefined && !Array.isArray(patrocinadores))
    return { status: 400, error: 'patrocinadores debe ser un arreglo.' };

  for (let i = 0; i < (patrocinadores || []).length; i++) {
    const p = patrocinadores[i];
    if (!p.nombre?.trim())
      return { status: 400, error: `patrocinadores[${i}]: nombre es obligatorio.` };
    if (p.nivel && !NIVELES_PATROCINADOR.includes(p.nivel))
      return { status: 400, error: `patrocinadores[${i}]: nivel debe ser ${NIVELES_PATROCINADOR.join(', ')}.` };
  }

  // ── 10. Agenda ──────────────────────────────────────────────
  if (agenda !== undefined && !Array.isArray(agenda))
    return { status: 400, error: 'agenda debe ser un arreglo.' };

  for (let i = 0; i < (agenda || []).length; i++) {
    const a = agenda[i];
    if (!a.hora_inicio || !isValidTime(a.hora_inicio))
      return { status: 400, error: `agenda[${i}]: hora_inicio es obligatorio (HH:MM).` };
    if (!a.actividad?.trim())
      return { status: 400, error: `agenda[${i}]: actividad es obligatorio.` };
  }

  return null; // válido
}

// ════════════════════════════════════════════════════════════
//  validatePublicar — POST /eventos/:id/publicar
// ════════════════════════════════════════════════════════════
function validatePublicar(evento) {
  if (!evento.nombre?.trim())
    return { status: 400, error: 'El evento necesita un nombre para publicarse.' };
  if (!evento.modalidad)
    return { status: 400, error: 'El evento necesita una modalidad para publicarse.' };
  if (!evento.fecha_inicio)
    return { status: 400, error: 'El evento necesita fecha_inicio para publicarse.' };
  if (!(evento.entradas?.length > 0))
    return { status: 400, error: 'El evento necesita al menos un tipo de entrada para publicarse.' };
  return null;
}

// ════════════════════════════════════════════════════════════
//  validateActualizar — PATCH /eventos/:id
// ════════════════════════════════════════════════════════════
function validateActualizar(updates) {
  if (!updates || Object.keys(updates).length === 0)
    return { status: 400, error: 'No se enviaron campos para actualizar.' };
  if (updates.modalidad && !MODALIDADES_VALIDAS.includes(updates.modalidad))
    return { status: 400, error: `modalidad debe ser: ${MODALIDADES_VALIDAS.join(', ')}.` };
  if (updates.visibilidad && !VISIBILIDADES_VALIDAS.includes(updates.visibilidad))
    return { status: 400, error: `visibilidad debe ser: ${VISIBILIDADES_VALIDAS.join(', ')}.` };
  if (updates.moneda && !MONEDAS_VALIDAS.includes(updates.moneda?.toUpperCase()))
    return { status: 400, error: `moneda debe ser: ${MONEDAS_VALIDAS.join(', ')}.` };
  if (updates.estado && !ESTADOS_VALIDOS.includes(updates.estado))
    return { status: 400, error: `estado debe ser: ${ESTADOS_VALIDOS.join(', ')}.` };
  if (updates.fecha_inicio && !isValidDate(updates.fecha_inicio))
    return { status: 400, error: 'fecha_inicio no es válida.' };
  if (updates.fecha_fin && !isValidDate(updates.fecha_fin))
    return { status: 400, error: 'fecha_fin no es válida.' };
  return null;
}

module.exports = {
  validateCrear,
  validatePublicar,
  validateActualizar,
  MODALIDADES_VALIDAS,
  VISIBILIDADES_VALIDAS,
  MONEDAS_VALIDAS,
  ESTADOS_VALIDOS,
  TIPOS_DESCUENTO,
  NIVELES_PATROCINADOR,
};
