import React, { useState } from 'react'
import CrearEvento from './components/CrearEvento/CrearEvento.jsx'
import ListaEventos from './components/ListaEventos/ListaEventos.jsx'

export default function App() {
  const [vista, setVista] = useState('lista')

  return (
    <>
      {/* Navegación de desarrollo entre pantallas */}
      <div style={{
        position: 'fixed', bottom: '20px', right: '20px',
        background: '#1A1A18', borderRadius: '12px',
        padding: '8px', display: 'flex', gap: '4px', zIndex: 999,
        boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
      }}>
        <button
          onClick={() => setVista('lista')}
          style={{
            padding: '6px 14px', borderRadius: '8px', border: 'none',
            background: vista === 'lista' ? '#fff' : 'transparent',
            color: vista === 'lista' ? '#1A1A18' : '#888',
            fontSize: '12px', cursor: 'pointer', fontFamily: 'DM Mono, monospace'
          }}
        >Lista</button>
        <button
          onClick={() => setVista('crear')}
          style={{
            padding: '6px 14px', borderRadius: '8px', border: 'none',
            background: vista === 'crear' ? '#fff' : 'transparent',
            color: vista === 'crear' ? '#1A1A18' : '#888',
            fontSize: '12px', cursor: 'pointer', fontFamily: 'DM Mono, monospace'
          }}
        >Crear</button>
      </div>

      {vista === 'lista' ? <ListaEventos /> : <CrearEvento />}
    </>
  )
}
