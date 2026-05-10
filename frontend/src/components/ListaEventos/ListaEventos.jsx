import React, { useState, useMemo } from 'react'
import EventCard from './EventCard.jsx'
import FiltrosSidebar from './FiltrosSidebar.jsx'
import { EVENTOS } from './eventos.data.js'
import styles from './ListaEventos.module.css'

const TABS = ['Todos', 'Próximos', 'En curso', 'Finalizados', 'Mis eventos']
const POR_PAGINA = 6

const FILTROS_INICIAL = {
  categorias: [],
  modalidad: '',
  precio: [],
  fechaDesde: '',
  fechaHasta: '',
}

export default function ListaEventos() {
  const [busqueda, setBusqueda]   = useState('')
  const [tabActivo, setTabActivo] = useState('Todos')
  const [orden, setOrden]         = useState('recientes')
  const [vista, setVista]         = useState('grid')
  const [filtros, setFiltros]     = useState(FILTROS_INICIAL)
  const [pagina, setPagina]       = useState(1)

  const eventosFiltrados = useMemo(() => {
    let lista = [...EVENTOS]

    // Tab
    if (tabActivo === 'Próximos')    lista = lista.filter(e => e.estado === 'proximo')
    if (tabActivo === 'Finalizados') lista = lista.filter(e => e.estado === 'finalizado')
    if (tabActivo === 'En curso')    lista = lista.filter(e => e.estado === 'encurso')

    // Búsqueda
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase()
      lista = lista.filter(e =>
        e.nombre.toLowerCase().includes(q) ||
        e.organizador.toLowerCase().includes(q) ||
        e.categoria.toLowerCase().includes(q)
      )
    }

    // Categorías
    if (filtros.categorias.length > 0) {
      lista = lista.filter(e => filtros.categorias.includes(e.categoria))
    }

    // Modalidad
    if (filtros.modalidad) {
      lista = lista.filter(e => e.modalidad === filtros.modalidad)
    }

    // Precio
    if (filtros.precio.length > 0) {
      lista = lista.filter(e => {
        if (filtros.precio.includes('Gratuito') && e.precio === 'Gratis') return true
        if (filtros.precio.includes('De pago')  && e.precio !== 'Gratis') return true
        return false
      })
    }

    // Orden
    if (orden === 'az') lista.sort((a, b) => a.nombre.localeCompare(b.nombre))

    return lista
  }, [busqueda, tabActivo, filtros, orden])

  const totalPaginas = Math.max(1, Math.ceil(eventosFiltrados.length / POR_PAGINA))
  const eventosPagina = eventosFiltrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)

  const handleFiltros = (nuevos) => { setFiltros(nuevos); setPagina(1) }
  const handleBusqueda = (v)      => { setBusqueda(v);    setPagina(1) }
  const handleTab = (tab)         => { setTabActivo(tab); setPagina(1) }

  return (
    <div className={styles.page}>

      {/* Navbar */}
      <nav className={styles.navbar}>
        <div className={styles.logo}>SEMB</div>
        <div className={styles.navLinks}>
          <span className={styles.navLink}>Explorar</span>
          <span className={`${styles.navLink} ${styles.navLinkActive}`}>Mis eventos</span>
          <span className={styles.navLink}>Precios</span>
        </div>
        <div className={styles.navRight}>
          <div className={styles.avatar} />
          <span className={styles.userName}>Alejandro M.</span>
        </div>
      </nav>

      {/* Header sección */}
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTop}>
          <div>
            <h1 className={styles.sectionTitle}>Explorar eventos</h1>
            <p className={styles.sectionSub}>Encuentra eventos por categoría, fecha o ubicación</p>
          </div>
          <button className={styles.btnCrear}>+ Crear evento</button>
        </div>

        {/* Barra búsqueda + filtros */}
        <div className={styles.searchBar}>
          <div className={styles.searchInput}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="7" cy="7" r="5"/>
              <path d="M11 11l3 3" strokeLinecap="round"/>
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
            <option value="Presencial">Presencial</option>
            <option value="Virtual">Virtual</option>
            <option value="Híbrido">Híbrido</option>
          </select>

          <div className={styles.viewToggle}>
            <button
              className={`${styles.toggleBtn} ${vista === 'grid' ? styles.toggleActive : ''}`}
              onClick={() => setVista('grid')}
              title="Vista cuadrícula"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/>
                <rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/>
              </svg>
            </button>
            <button
              className={`${styles.toggleBtn} ${vista === 'lista' ? styles.toggleActive : ''}`}
              onClick={() => setVista('lista')}
              title="Vista lista"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M1 4h14M1 8h14M1 12h14" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          {TABS.map(tab => (
            <button
              key={tab}
              className={`${styles.tab} ${tabActivo === tab ? styles.tabActive : ''}`}
              onClick={() => handleTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Layout principal */}
      <div className={styles.mainLayout}>

        {/* Sidebar filtros */}
        <FiltrosSidebar
          filtros={filtros}
          onChange={handleFiltros}
          onClear={() => { setFiltros(FILTROS_INICIAL); setPagina(1) }}
        />

        {/* Contenido */}
        <div className={styles.content}>

          {/* Info + ordenar */}
          <div className={styles.contentHeader}>
            <p className={styles.resultCount}>
              {eventosFiltrados.length} evento{eventosFiltrados.length !== 1 ? 's' : ''} encontrado{eventosFiltrados.length !== 1 ? 's' : ''}
            </p>
            <div className={styles.ordenar}>
              <span className={styles.ordenarLabel}>Ordenar por</span>
              <select
                className={styles.ordenarSelect}
                value={orden}
                onChange={e => setOrden(e.target.value)}
              >
                <option value="recientes">Más recientes</option>
                <option value="az">A → Z</option>
              </select>
            </div>
          </div>

          {/* Grid / Lista */}
          {eventosPagina.length > 0 ? (
            <div className={vista === 'grid' ? styles.grid : styles.listaView}>
              {eventosPagina.map(evento => (
                <EventCard key={evento.id} event={evento} />
              ))}
            </div>
          ) : (
            <div className={styles.empty}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35" strokeLinecap="round"/>
              </svg>
              <p>No se encontraron eventos</p>
              <span>Intenta con otros filtros o búsqueda</span>
            </div>
          )}

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageBtn}
                onClick={() => setPagina(p => Math.max(1, p - 1))}
                disabled={pagina === 1}
              >‹</button>

              {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(n => (
                <button
                  key={n}
                  className={`${styles.pageBtn} ${n === pagina ? styles.pageBtnActive : ''}`}
                  onClick={() => setPagina(n)}
                >{n}</button>
              ))}

              <button
                className={styles.pageBtn}
                onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                disabled={pagina === totalPaginas}
              >›</button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
