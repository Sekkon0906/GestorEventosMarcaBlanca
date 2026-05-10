// src/hooks/useEventos.js
import { useState, useEffect, useCallback } from 'react'
import { getEventos } from '../services/eventosService.js'

/**
 * Hook para obtener la lista de eventos desde el backend.
 * Maneja loading, error y re-fetch automático cuando cambian los filtros.
 *
 * @param {object} filtros - Mismos parámetros que acepta getEventos()
 * @returns {{ eventos, paginacion, cargando, error, refetch }}
 */
export function useEventos(filtros = {}) {
  const [eventos,    setEventos]    = useState([])
  const [paginacion, setPaginacion] = useState(null)
  const [cargando,   setCargando]   = useState(false)
  const [error,      setError]      = useState(null)

  const fetchEventos = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const data = await getEventos(filtros)
      setEventos(data.eventos || [])
      setPaginacion(data.paginacion || null)
    } catch (err) {
      setError(err.message || 'Error al cargar eventos')
      setEventos([])
    } finally {
      setCargando(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filtros)])

  useEffect(() => {
    fetchEventos()
  }, [fetchEventos])

  return { eventos, paginacion, cargando, error, refetch: fetchEventos }
}
