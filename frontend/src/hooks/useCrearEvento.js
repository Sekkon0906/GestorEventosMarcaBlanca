// src/hooks/useCrearEvento.js
import { useState } from 'react'
import { crearEvento, formToEventoBody } from '../services/eventosService.js'

/**
 * Hook para manejar el envío del formulario de creación de evento.
 *
 * @returns {{ enviar, cargando, error, exito, eventoCreado }}
 *
 * Uso:
 *   const { enviar, cargando, error, exito } = useCrearEvento()
 *   await enviar(formData)
 */
export function useCrearEvento() {
  const [cargando,     setCargando]     = useState(false)
  const [error,        setError]        = useState(null)
  const [exito,        setExito]        = useState(false)
  const [eventoCreado, setEventoCreado] = useState(null)

  const enviar = async (formData) => {
    setCargando(true)
    setError(null)
    setExito(false)
    setEventoCreado(null)

    try {
      const body = formToEventoBody(formData)
      const data = await crearEvento(body)
      setExito(true)
      setEventoCreado(data.evento)
      return data
    } catch (err) {
      // Mostrar el mensaje de error del backend
      setError(err.message || 'Error al crear el evento')
      throw err
    } finally {
      setCargando(false)
    }
  }

  const reset = () => {
    setError(null)
    setExito(false)
    setEventoCreado(null)
  }

  return { enviar, cargando, error, exito, eventoCreado, reset }
}
