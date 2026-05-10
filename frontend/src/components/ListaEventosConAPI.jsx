// src/components/ListaEventos/ListaEventosConAPI.jsx
// Versión de ListaEventos conectada al backend real
import React, { useState, useMemo } from 'react'
import EventCard from './EventCard.jsx'
import FiltrosSidebar from './FiltrosSidebar.jsx'
import { useEventos } from '../../hooks/useEventos.js'
import styles from './ListaEventos.module.css'

const TABS = ['Todos', 'Próximos', 'Finalizados']
const TAB_ESTADO = { 'Próximos': 'publicado', 'Finalizados': 'finalizado' }

const FILTROS_INICIAL = {
  categorias: [],
  modalidad: '',
  precio: [],
  fechaDesde: '',
  fechaHasta: '',
}

// Adapta un evento del backend al formato que espera EventCard
function adaptarEvento(e) {
  const precio = e.entradas?.[0]?.precio
  const precioLabel = precio === 0 ? 'Gratis' : precio ? `$${precio.toLocaleString('es-CO')}` : 'Ver precios'

  const badge = e.asistentes_count >= e.capacidad_total ? 'soldout'
    : e.entradas?.some(t => t.disponibles <= 5 && t.disponibles > 0) ? 'ultimos'
    : precio === 0 ? 'gratuito'
    : null

  const fecha = e.fecha_inicio
    ? new Date(e.fecha_inicio).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Por confirmar'

  const lugar = e.modalidad === 'virtual'
    ? 'Virtual'
    : e.ubicacion?.ciudad || e.ubicacion?.lugar || 'Por confirmar'

  return {
    id:           e.id,
    nombre:       e.nombre,
    organizador:  e.organizador_email || 'Organizador',
    fecha,
    lugar,
    categoria:    e.categorias?.nombre || 'General',
    precio:       precioLabel,
    badge,
    modalidad:    e.modalidad,
    estado:       e.estado,
  }
}

export default function ListaEventosConAPI() {
  const [busqueda, setBusqueda]   = useState('')
  const [tabActivo, setTabActivo] = useState('Todos')
  const [vista, setVista]         = useState('grid')
  const [filtros, setFiltros]     = useState(FILTROS_INICIAL)
  const [pagina, setPagina]       = useState(1)

  // Construir parámetros para el hook
  const params = useMemo(() => ({
    q:           busqueda || undefined,
    modalidad:   filtros.modalidad || undefined,
    estado:      TAB_ESTADO[tabActivo] || undefined,
    fechaInicio: filtros.fechaDesde || undefined,
    fechaFin:    filtros.fechaHasta || undefined,
    page:        pagina,
    limit:       6,
    sort:        '-fecha_inicio',
  }), [busqueda, filtros, tabActivo, pagina])

  const { eventos: eventosRaw, paginacion, cargando, error, refetch } = useEventos(params)

  const eventos = useMemo(() => eventosRaw.map(adaptarEvento), [eventosRaw])

  const handleFiltros = (nuevos) => { setFiltros(nuevos); setPagina(1) }
  const handleBusqueda = (v)     => { setBusqueda(v);     setPagina(1) }
  const handleTab = (tab)        => { setTabActivo(tab);  setPagina(1) }

  const totalPaginas = paginacion?.total_paginas || 1

  return (
    <div className={styles.page}>

      {/* Navbar */}
      <nav className={styles.navbar}>
        <div className={styles.logo}>SEMB</div>
        <div className={styles.navLinks}>
          <span className={`${styles.navLink} ${styles.navLinkActive}`}>Explorar</span>
          <span className={styles.navLink}>Mis eventos</span>
          <span className={styles.navLink}>Precios</span>
        </div>
        <div className={styles.navRight}>
          <div className={styles.avatar} />
          <span className={styles.userName}>Alejandro M.</span>
        </div>
      </nav>

      {/* Header */}
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTop}>
          <div>
            <h1 className={styles.sectionTitle}>Explorar eventos</h1>
            <p className={styles.sectionSub}>Encuentra eventos por categoría, fecha o ubicación</p>
          </div>
          <button className={styles.btnCrear}>+ Crear evento</button>
        </div>

        {/* Búsqueda */}
        <div className={styles.searchBar}>
          <div className={styles.searchInput}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="7" cy="7" r="5"/><path d="M11 11l3 3" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              placeholder="Buscar eventos..."
              value={busqueda}
              onChange={e => handleBusqueda(e.target.value)}
              className={styles.searchInputBare}
            />
            {busqueda && (
              <button className={styles.searchClear} onClick={() => handleBusqueda('')}>×</button>
            )}
          </div>

          <select
            className={styles.filterChip}
            value={filtros.modalidad}
            onChange={e => handleFiltros({ ...filtros, modalidad: e.target.value })}
          >
            <option value="">Modalidad</option>
            <option value="fisico">Presencial</option>
            <option value="virtual">Virtual</option>
            <option value="hibrido">Híbrido</option>
          </select>

          <div className={styles.viewToggle}>
            <button className={`${styles.toggleBtn} ${vista === 'grid' ? styles.toggleActive : ''}`} onClick={() => setVista('grid')}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/>
                <rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/>
              </svg>
            </button>
            <button className={`${styles.toggleBtn} ${vista === 'lista' ? styles.toggleActive : ''}`} onClick={() => setVista('lista')}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M1 4h14M1 8h14M1 12h14" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        <div className={styles.tabs}>
          {TABS.map(tab => (
            <button key={tab} className={`${styles.tab} ${tabActivo === tab ? styles.tabActive : ''}`} onClick={() => handleTab(tab)}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Layout */}
      <div className={styles.mainLayout}>
        <FiltrosSidebar filtros={filtros} onChange={handleFiltros} onClear={() => { setFiltros(FILTROS_INICIAL); setPagina(1) }} />

        <div className={styles.content}>
          <div className={styles.contentHeader}>
            <p className={styles.resultCount}>
              {cargando ? 'Cargando...' : `${paginacion?.total ?? 0} evento${paginacion?.total !== 1 ? 's' : ''} encontrado${paginacion?.total !== 1 ? 's' : ''}`}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{ padding: '16px', background: 'var(--red-light)', borderRadius: 'var(--radius-md)', color: 'var(--red)', fontSize: '13px' }}>
              {error} — <button onClick={refetch} style={{ color: 'var(--red)', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}>Reintentar</button>
            </div>
          )}

          {/* Loading skeleton */}
          {cargando && (
            <div className={styles.grid}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                  <div style={{ height: '110px', background: 'var(--surface2)', animation: 'pulse 1.5s infinite' }} />
                  <div style={{ padding: '12px 14px' }}>
                    <div style={{ height: '10px', background: 'var(--surface2)', borderRadius: '3px', marginBottom: '8px', width: '85%' }} />
                    <div style={{ height: '8px',  background: 'var(--surface2)', borderRadius: '3px', width: '60%' }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Grid/Lista */}
          {!cargando && eventos.length > 0 && (
            <div className={vista === 'grid' ? styles.grid : styles.listaView}>
              {eventos.map(evento => <EventCard key={evento.id} event={evento} />)}
            </div>
          )}

          {/* Empty */}
          {!cargando && !error && eventos.length === 0 && (
            <div className={styles.empty}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35" strokeLinecap="round"/>
              </svg>
              <p>No se encontraron eventos</p>
              <span>Intenta con otros filtros o búsqueda</span>
            </div>
          )}

          {/* Paginación */}
          {!cargando && totalPaginas > 1 && (
            <div className={styles.pagination}>
              <button className={styles.pageBtn} onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1}>‹</button>
              {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(n => (
                <button key={n} className={`${styles.pageBtn} ${n === pagina ? styles.pageBtnActive : ''}`} onClick={() => setPagina(n)}>{n}</button>
              ))}
              <button className={styles.pageBtn} onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas}>›</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
