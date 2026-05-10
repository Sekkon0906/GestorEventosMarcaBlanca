// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react'
import { login as loginService, logout as logoutService, getUsuarioLocal } from '../services/authService.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario]   = useState(() => getUsuarioLocal())
  const [cargando, setCargando] = useState(false)
  const [error, setError]       = useState(null)

  const login = useCallback(async (email, password) => {
    setCargando(true)
    setError(null)
    try {
      const data = await loginService({ email, password })
      setUsuario(data.usuario)
      return data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setCargando(false)
    }
  }, [])

  const logout = useCallback(() => {
    logoutService()
    setUsuario(null)
  }, [])

  return (
    <AuthContext.Provider value={{ usuario, cargando, error, login, logout, estaAutenticado: !!usuario }}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook para usar el contexto en cualquier componente
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
