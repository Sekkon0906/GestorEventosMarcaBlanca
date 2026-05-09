import React, { useState } from 'react'
import ListaEventos from './components/ListaEventos/ListaEventos.jsx'
import CrearEvento from './components/CrearEvento/CrearEvento.jsx'

export default function App() {
  const [vista, setVista] = useState('lista') // 'lista' | 'crear'

  return vista === 'lista'
    ? <ListaEventos onCrear={() => setVista('crear')} />
    : <CrearEvento onVolver={() => setVista('lista')} />
}
