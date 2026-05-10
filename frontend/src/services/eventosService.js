// src/services/eventosService.js
import apiFetch from './api.js'

// ─────────────────────────────────────────────────────────────
//  GET /eventos
//  Trae la lista de eventos con filtros y paginación.
//
//  Parámetros disponibles (todos opcionales):
//    q, categoria, modalidad, ciudad, lugar,
//    fecha_inicio, fecha_fin, estado, visibilidad, moneda,
//    page, limit, sort
// ─────────────────────────────────────────────────────────────
export async function getEventos(filtros = {}) {
  // Construir query string solo con parámetros definidos
  const params = new URLSearchParams()

  const mapa = {
    q:            filtros.q,
    categoria:    filtros.categoria,
    modalidad:    filtros.modalidad,
    ciudad:       filtros.ciudad,
    lugar:        filtros.lugar,
    fecha_inicio: filtros.fechaInicio,
    fecha_fin:    filtros.fechaFin,
    estado:       filtros.estado,
    visibilidad:  filtros.visibilidad,
    moneda:       filtros.moneda,
    page:         filtros.page,
    limit:        filtros.limit,
    sort:         filtros.sort,
  }

  Object.entries(mapa).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      params.append(key, val)
    }
  })

  const qs = params.toString()
  return apiFetch(`/eventos${qs ? `?${qs}` : ''}`)
}

// ─────────────────────────────────────────────────────────────
//  GET /eventos/categorias
//  Retorna categorías disponibles. Acepta ?q= para búsqueda.
// ─────────────────────────────────────────────────────────────
export async function getCategorias(q = '') {
  const qs = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''
  return apiFetch(`/eventos/categorias${qs}`)
}

// ─────────────────────────────────────────────────────────────
//  GET /eventos/:id
//  Retorna el detalle de un evento por su ID.
// ─────────────────────────────────────────────────────────────
export async function getEventoById(id) {
  return apiFetch(`/eventos/${id}`)
}

// ─────────────────────────────────────────────────────────────
//  POST /eventos
//  Crea un nuevo evento. Requiere JWT (organizador autenticado).
//
//  Body mínimo:
//  {
//    nombre:     string (requerido)
//    modalidad:  'fisico' | 'virtual' | 'hibrido' (requerido)
//    visibilidad:'publico' | 'privado'
//    descripcion: string
//    fecha_inicio: ISO 8601
//    fecha_fin:    ISO 8601
//    ubicacion: {
//      ciudad, lugar, direccion,    // para fisico/hibrido
//      link_streaming               // para virtual/hibrido
//    }
//    categoria_id:    number
//    categoria_nueva: string  (si no existe la categoría)
//    entradas: [{
//      tipo, precio, capacidad,
//      descripcion, fecha_limite_venta,
//      precio_early_bird, fecha_fin_early_bird, visible
//    }]
//    moneda: 'COP' | 'USD' | 'EUR' ...
//  }
// ─────────────────────────────────────────────────────────────
export async function crearEvento(datosEvento) {
  return apiFetch('/eventos', {
    method: 'POST',
    body: JSON.stringify(datosEvento),
  })
}

// ─────────────────────────────────────────────────────────────
//  Helpers de transformación
//  Convierte el formulario React → formato que espera el backend
// ─────────────────────────────────────────────────────────────

/**
 * Mapea los valores del formulario CrearEvento al body del backend.
 * @param {object} form - Estado del formulario React
 * @returns {object}    - Body listo para POST /eventos
 */
export function formToEventoBody(form) {
  // Mapear modalidad del formulario al valor del backend
  const modalidadMap = {
    Presencial: 'fisico',
    Virtual:    'virtual',
    Híbrido:    'hibrido',
  }

  const modalidad = modalidadMap[form.modalidad] || 'fisico'

  // Construir ubicación según modalidad
  const ubicacion = {}
  if (form.ubicacion) {
    if (modalidad === 'fisico' || modalidad === 'hibrido') {
      ubicacion.ciudad    = form.ubicacion
      ubicacion.lugar     = form.ubicacion
      ubicacion.direccion = form.ubicacion
    }
    if (modalidad === 'virtual' || modalidad === 'hibrido') {
      ubicacion.link_streaming = form.ubicacion
    }
  }

  // Construir fecha_inicio en ISO 8601
  let fecha_inicio = null
  if (form.fechaInicio && form.horaInicio) {
    fecha_inicio = `${form.fechaInicio}T${form.horaInicio}:00-05:00`
  } else if (form.fechaInicio) {
    fecha_inicio = `${form.fechaInicio}T00:00:00-05:00`
  }

  let fecha_fin = null
  if (form.fechaCierre && form.horaFin) {
    fecha_fin = `${form.fechaCierre}T${form.horaFin}:00-05:00`
  } else if (form.fechaCierre) {
    fecha_fin = `${form.fechaCierre}T23:59:00-05:00`
  }

  return {
    nombre:              form.nombre?.trim(),
    descripcion:         form.descripcion?.trim() || '',
    modalidad,
    visibilidad:         form.visibilidad === 'publico' ? 'publico' : 'privado',
    fecha_inicio,
    fecha_fin,
    ubicacion,
    categoria_nueva:     form.categoria || undefined,
    moneda:              'COP',
    requiere_aprobacion: form.requiereRegistro || false,
    entradas:            form.capacidad
      ? [{
          tipo:      'General',
          precio:    0,
          capacidad: parseInt(form.capacidad) || 1,
          visible:   true,
        }]
      : [],
  }
}
