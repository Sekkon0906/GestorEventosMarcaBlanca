'use strict';

/**
 * validators/evento.validator.js
 *
 * Validaciones puras para el dominio de eventos.
 * Extraídas de routes/eventos_post.js y routes/eventos_patch_delete.js.
 *
 * Cada función retorna null (válido) o { status, error, detalle? } (inválido).
 * Sin efectos secundarios — solo reciben datos y retornan resultado.
 */

const MODALIDADES_VALIDAS   = ['fisico', 'virtual', 'hibrido'];
const VISIBILIDADES_VALIDAS = ['publico', 'privado'];
const MONEDAS_VALIDAS       = ['COP', 'USD', 'EUR', 'MXN', 'ARS', 'BRL'];
const ESTADOS_VALIDOS       = ['borrador', 'publicado', 'cerrado', 'finalizado', 'cancelado'];
const TIPOS_DESCUENTO       = ['porcentaje', 'valor_fijo'];
const NIVELES_PATROCINADOR  = ['oro', 'plata', 'bronce', 'general'];

// ── Helpers internos ─────────────────────────────────────────
function isValidDate(str) {
  if (!str) return false;
  const d = new Date(str);
  return !isNaN(d.getTime());
}

function isValidUrl(str) {
  if (!str) return false;
  try { new URL(str); return true; } catch { return false; }
}

function isValidTime(str) {
  return /^\d{2}:\d{2}$/.test(str || '');
}

// ── validateCrear ─────────────────────────────────────────────
/**
 * Valida el body completo de POST /eventos.
 * Solo comprueba campos requeridos y formatos básicos.
 * La lógica de negocio (calcular progreso, insertar en BD) va al service.
 *
 * @param {object} body
 * @returns {{ status: number, error: string, detalle?: string } | null}
 */
function validateCrear(body) {
  const { nombre, modalidad } = body;

  if (!nombre || typeof nombre !== 'string' || nombre.trim().length < 3)
    return { status: 400, error: 'nombre es obligatorio y debe tener al menos 3 caracteres.' };

  if (!modalidad || !MODALIDADES_VALIDAS.includes(modalidad))
    return { status: 400, error: `modalidad debe ser: ${MODALIDADES_VALIDAS.join(', ')}.` };

  // Fechas — opcionales pero si se pasan deben ser válidas
  const { fecha_inicio, fecha_fin } = body;
  if (fecha_inicio && !isValidDate(fecha_inicio))
    return { status: 400, error: 'fecha_inicio no es una fecha válida (ISO 8601).' };

  if (fecha_fin && !isValidDate(fecha_fin))
    return { status: 400, error: 'fecha_fin no es una fecha válida (ISO 8601).' };

  if (fecha_inicio && fecha_fin && new Date(fecha_fin) <= new Date(fecha_inicio))
    return { status: 400, error: 'fecha_fin debe ser posterior a fecha_inicio.' };

  // Visibilidad
  if (body.visibilidad && !VISIBILIDADES_VALIDAS.includes(body.visibilidad))
    return { status: 400, error: `visibilidad debe ser: ${VISIBILIDADES_VALIDAS.join(', ')}.` };

  // Moneda
  if (body.moneda && !MONEDAS_VALIDAS.includes(body.moneda))
    return { status: 400, error: `moneda debe ser: ${MONEDAS_VALIDAS.join(', ')}.` };

  // Ubicación — virtual/hibrido requieren link_streaming
  if ((modalidad === 'virtual' || modalidad === 'hibrido') && body.ubicacion) {
    if (!body.ubicacion.link_streaming)
      return { status: 400, error: 'Eventos virtuales/híbridos requieren ubicacion.link_streaming.' };
    if (!isValidUrl(body.ubicacion.link_streaming))
      return { status: 400, error: 'ubicacion.link_streaming debe ser una URL válida.' };
  }

  // Entradas
  const entradas = body.entradas || [];
  for (let i = 0; i < entradas.length; i++) {
    const e = entradas[i];
    if (!e.tipo)        return { status: 400, error: `entradas[${i}].tipo es obligatorio.` };
    if (e.precio === undefined || e.precio === null || isNaN(Number(e.precio)) || Number(e.precio) < 0)
      return { status: 400, error: `entradas[${i}].precio debe ser un número >= 0.` };
    if (!e.capacidad || isNaN(Number(e.capacidad)) || Number(e.capacidad) < 1)
      return { status: 400, error: `entradas[${i}].capacidad debe ser un entero positivo.` };
    if (e.fecha_limite_venta && !isValidDate(e.fecha_limite_venta))
      return { status: 400, error: `entradas[${i}].fecha_limite_venta no es válida.` };
    if (e.precio_early_bird !== undefined && !isValidDate(e.fecha_fin_early_bird))
      return { status: 400, error: `entradas[${i}].fecha_fin_early_bird es obligatorio cuando se usa precio_early_bird.` };
  }

  // Códigos de descuento
  const descuentos = body.codigos_descuento || [];
  for (let i = 0; i < descuentos.length; i++) {
    const d = descuentos[i];
    if (!d.codigo)  return { status: 400, error: `codigos_descuento[${i}].codigo es obligatorio.` };
    if (d.descuento === undefined || isNaN(Number(d.descuento)) || Number(d.descuento) <= 0)
      return { status: 400, error: `codigos_descuento[${i}].descuento debe ser un número positivo.` };
    if (!TIPOS_DESCUENTO.includes(d.tipo))
      return { status: 400, error: `codigos_descuento[${i}].tipo debe ser: ${TIPOS_DESCUENTO.join(', ')}.` };
  }

  // Speakers
  const speakers = body.speakers || [];
  for (let i = 0; i < speakers.length; i++) {
    if (!speakers[i].nombre)
      return { status: 400, error: `speakers[${i}].nombre es obligatorio.` };
  }

  // Patrocinadores
  const patrocinadores = body.patrocinadores || [];
  for (let i = 0; i < patrocinadores.length; i++) {
    const p = patrocinadores[i];
    if (!p.nombre) return { status: 400, error: `patrocinadores[${i}].nombre es obligatorio.` };
    if (p.nivel && !NIVELES_PATROCINADOR.includes(p.nivel))
      return { status: 400, error: `patrocinadores[${i}].nivel debe ser: ${NIVELES_PATROCINADOR.join(', ')}.` };
  }

  // Agenda
  const agenda = body.agenda || [];
  for (let i = 0; i < agenda.length; i++) {
    const a = agenda[i];
    if (!a.hora_inicio || !isValidTime(a.hora_inicio))
      return { status: 400, error: `agenda[${i}].hora_inicio es obligatorio (formato HH:MM).` };
    if (!a.actividad)
      return { status: 400, error: `agenda[${i}].actividad es obligatorio.` };
  }

  // Sesiones
  const sesiones = body.sesiones || [];
  for (let i = 0; i < sesiones.length; i++) {
    const s = sesiones[i];
    if (!s.fecha || !isValidDate(s.fecha))
      return { status: 400, error: `sesiones[${i}].fecha es obligatorio y debe ser una fecha válida.` };
    if (!isValidTime(s.hora_inicio))
      return { status: 400, error: `sesiones[${i}].hora_inicio es obligatorio (formato HH:MM).` };
  }

  return null;
}

// ── validatePublicar ─────────────────────────────────────────
/**
 * Verifica que un evento (ya cargado de BD) tenga suficiente info para publicarse.
 *
 * @param {object} evento - objeto del evento desde Supabase
 * @returns {{ status: number, error: string } | null}
 */
function validatePublicar(evento) {
  if (!evento.nombre?.trim())
    return { status: 400, error: 'El evento necesita un nombre para publicarse.' };

  if (!evento.modalidad)
    return { status: 400, error: 'El evento necesita una modalidad para publicarse.' };

  if (!evento.fecha_inicio)
    return { status: 400, error: 'El evento necesita fecha_inicio para publicarse.' };

  const entradas = evento.entradas || [];
  if (entradas.length === 0)
    return { status: 400, error: 'El evento necesita al menos un tipo de entrada para publicarse.' };

  return null;
}

// ── validateActualizar ───────────────────────────────────────
/**
 * Valida campos enviados en PATCH /eventos/:id.
 * Solo comprueba lo que el usuario envía.
 *
 * @param {object} updates - campos a actualizar
 * @returns {{ status: number, error: string } | null}
 */
function validateActualizar(updates) {
  if (!updates || Object.keys(updates).length === 0)
    return { status: 400, error: 'No se enviaron campos para actualizar.' };

  if (updates.modalidad && !MODALIDADES_VALIDAS.includes(updates.modalidad))
    return { status: 400, error: `modalidad debe ser: ${MODALIDADES_VALIDAS.join(', ')}.` };

  if (updates.visibilidad && !VISIBILIDADES_VALIDAS.includes(updates.visibilidad))
    return { status: 400, error: `visibilidad debe ser: ${VISIBILIDADES_VALIDAS.join(', ')}.` };

  if (updates.moneda && !MONEDAS_VALIDAS.includes(updates.moneda))
    return { status: 400, error: `moneda debe ser: ${MONEDAS_VALIDAS.join(', ')}.` };

  if (updates.estado && !ESTADOS_VALIDOS.includes(updates.estado))
    return { status: 400, error: `estado debe ser: ${ESTADOS_VALIDOS.join(', ')}.` };

  if (updates.fecha_inicio && !isValidDate(updates.fecha_inicio))
    return { status: 400, error: 'fecha_inicio no es una fecha válida.' };

  if (updates.fecha_fin && !isValidDate(updates.fecha_fin))
    return { status: 400, error: 'fecha_fin no es una fecha válida.' };

  return null;
}

module.exports = {
  validateCrear,
  validatePublicar,
  validateActualizar,
  // Exportamos constantes para reutilizar en otros validators
  MODALIDADES_VALIDAS,
  VISIBILIDADES_VALIDAS,
  MONEDAS_VALIDAS,
  ESTADOS_VALIDOS,
};
