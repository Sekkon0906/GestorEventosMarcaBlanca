import React, { useState } from 'react'
import styles from './ListaEventos.module.css'

const EVENTOS_MOCK = [
  {
    id: 1,
    nombre: 'Summit Tech Ibagué 2026',
    categoria: 'Conferencia',
    modalidad: 'Presencial',
    fechaInicio: '2026-06-14',
    fechaCierre: '2026-06-16',
    ubicacion: 'Centro de Convenciones Ibagué',
    capacidad: 300,
    inscritos: 214,
    estado: 'activo',
    visibilidad: 'publico',
  },
  {
    id: 2,
    nombre: 'Taller de IA Aplicada',
    categoria: 'Taller',
    modalidad: 'Híbrido',
    fechaInicio: '2026-07-03',
    fechaCierre: '2026-07-03',
    ubicacion: 'Universidad de Ibagué + Zoom',
    capacidad: 60,
    inscritos: 60,
    estado: 'lleno',
    visibilidad: 'publico',
  },
  {
    id: 3,
    nombre: 'Networking Devs Tolima',
    categoria: 'Networking',
    modalidad: 'Presencial',
    fechaInicio: '2026-05-25',
    fechaCierre: '2026-05-25',
    ubicacion: 'Café del Parque, Ibagué',
    capacidad: 40,
    inscritos: 38,
    estado: 'activo',
    visibilidad: 'privado',
  },
  {
    id: 4,
    nombre: 'Hackathon Open Data',
    categoria: 'Otro',
    modalidad: 'Virtual',
    fechaInicio: '2026-08-10',
    fechaCierre: '2026-08-12',
    ubicacion: 'Discord + Gather.town',
    capacidad: 120,
    inscritos: 0,
    estado: 'borrador',
    visibilidad: 'publico',
  },
  {
    id: 5,
    nombre: 'Demo Day Startups Tolima',
    categoria: 'Networking',
    modalidad: 'Presencial',
    fechaInicio: '2026-04-18',
    fechaCierre: '2026-04-18',
    ubicacion: 'Cámara de Comercio Ibagué',
    capacidad: 150,
    inscritos: 142,
    estado: 'finalizado',
    visibilidad: 'publico',
  },
]

const CATEGORIA_COLOR = {
  Conferencia: '#1A1A18',
  Taller:      '#1A1A18',
  Networking:  '#1A1A18',
  Concierto:   '#1A1A18',
  Deporte:     '#1A1A18',
  Otro:        '#1A1A18',
}

const ESTADO_META = {
  activo:     { label: 'Activo',     dot: '#1A1A18' },
  lleno:      { label: 'Lleno',      dot: '#5C5B56' },
  borrador:   { label: 'Borrador',   dot: '#C8C7C1' },
  finalizado: { label: 'Finalizado', dot: '#9B9A94' },
}

const MODALIDAD_ICON = {
  Presencial: (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8 1a5 5 0 0 1 5 5c0 3.5-5 9-5 9S3 9.5 3 6a5 5 0 0 1 5-5z"/>
      <circle cx="8" cy="6" r="1.5"/>
    </svg>
  ),
  Virtual: (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1" y="3" width="14" height="9" rx="2"/>
      <path d="M5 15h6M8 12v3" strokeLinecap="round"/>
    </svg>
  ),
  Híbrido: (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 8h12M8 2v12" strokeLinecap="round"/>
      <circle cx="8" cy="8" r="3"/>
    </svg>
  ),
}

function formatFecha(dateStr) {
  if (!dateStr) return '—'
  const [y, m, d] = dateStr.split('-')
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  return `${parseInt(d)} ${meses[parseInt(m) - 1]}. ${y}`
}

function OcupacionBar({ inscritos, capacidad }) {
  const pct = capacidad > 0 ? Math.min((inscritos / capacidad) * 100, 100) : 0
  return (
    <div className={styles.ocupBar}>
      <div className={styles.ocupTrack}>
        <div className={styles.ocupFill} style={{ width: `${pct}%` }} />
      </div>
      <span className={styles.ocupLabel}>{inscritos}/{capacidad}</span>
    </div>
  )
}

export default function ListaEventos({ onCrear }) {
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [filtroModalidad, setFiltroModalidad] = useState('todas')
  const [vista, setVista] = useState('grid') // 'grid' | 'lista'

  const eventosFiltrados = EVENTOS_MOCK.filter(ev => {
    const coincideBusqueda =
      ev.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      ev.categoria.toLowerCase().includes(busqueda.toLowerCase())
    const coincideEstado = filtroEstado === 'todos' || ev.estado === filtroEstado
    const coincideModalidad = filtroModalidad === 'todas' || ev.modalidad === filtroModalidad
    return coincideBusqueda && coincideEstado && coincideModalidad
  })

  const stats = {
    total: EVENTOS_MOCK.length,
    activos: EVENTOS_MOCK.filter(e => e.estado === 'activo').length,
    inscritos: EVENTOS_MOCK.reduce((s, e) => s + e.inscritos, 0),
  }

  return (
    <div className={styles.page}>

      {/* Navbar */}
      <nav className={styles.navbar}>
        <div className={styles.logo}>SEMB</div>
        <div className={styles.navRight}>
          <div className={styles.avatar} />
          <span className={styles.userName}>Nombre de usuario</span>
        </div>
      </nav>

      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Mis eventos</h1>
          <p className={styles.subtitle}>Gestiona y supervisa todos tus eventos</p>
        </div>
        <button className={styles.btnCrear} onClick={onCrear}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 2v12M2 8h12" strokeLinecap="round"/>
          </svg>
          Crear evento
        </button>
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statNum}>{stats.total}</span>
          <span className={styles.statLbl}>Total eventos</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNum}>{stats.activos}</span>
          <span className={styles.statLbl}>Activos</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNum}>{stats.inscritos}</span>
          <span className={styles.statLbl}>Inscritos</span>
        </div>
      </div>

      {/* Controles */}
      <div className={styles.controles}>

        {/* Búsqueda */}
        <div className={styles.searchWrap}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="6.5" cy="6.5" r="4.5"/>
            <path d="M10 10l3.5 3.5" strokeLinecap="round"/>
          </svg>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Buscar eventos..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
          {busqueda && (
            <button className={styles.clearBtn} onClick={() => setBusqueda('')}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>

        {/* Filtros */}
        <div className={styles.filtros}>
          <select
            className={styles.filtroSelect}
            value={filtroEstado}
            onChange={e => setFiltroEstado(e.target.value)}
          >
            <option value="todos">Estado: Todos</option>
            <option value="activo">Activo</option>
            <option value="lleno">Lleno</option>
            <option value="borrador">Borrador</option>
            <option value="finalizado">Finalizado</option>
          </select>

          <select
            className={styles.filtroSelect}
            value={filtroModalidad}
            onChange={e => setFiltroModalidad(e.target.value)}
          >
            <option value="todas">Modalidad: Todas</option>
            <option value="Presencial">Presencial</option>
            <option value="Virtual">Virtual</option>
            <option value="Híbrido">Híbrido</option>
          </select>
        </div>

        {/* Toggle vista */}
        <div className={styles.vistaToggle}>
          <button
            className={`${styles.vistaBtn} ${vista === 'grid' ? styles.vistaBtnActive : ''}`}
            onClick={() => setVista('grid')}
            title="Vista cuadrícula"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/>
              <rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/>
            </svg>
          </button>
          <button
            className={`${styles.vistaBtn} ${vista === 'lista' ? styles.vistaBtnActive : ''}`}
            onClick={() => setVista('lista')}
            title="Vista lista"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M1 4h14M1 8h14M1 12h14" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

      </div>

      {/* Contador resultados */}
      <div className={styles.resultCount}>
        {eventosFiltrados.length === EVENTOS_MOCK.length
          ? `${EVENTOS_MOCK.length} eventos`
          : `${eventosFiltrados.length} de ${EVENTOS_MOCK.length} eventos`}
      </div>

      {/* Eventos */}
      {eventosFiltrados.length === 0 ? (
        <div className={styles.empty}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35" strokeLinecap="round"/>
          </svg>
          <p>No se encontraron eventos</p>
          <span>Prueba ajustar los filtros o la búsqueda</span>
        </div>
      ) : (
        <div className={vista === 'grid' ? styles.gridEvento : styles.listaEvento}>
          {eventosFiltrados.map(ev => (
            <EventoCard key={ev.id} ev={ev} vista={vista} />
          ))}
        </div>
      )}

    </div>
  )
}

function EventoCard({ ev, vista }) {
  const estado = ESTADO_META[ev.estado] || ESTADO_META.borrador
  const catColor = CATEGORIA_COLOR[ev.categoria] || '#5C5B56'

  if (vista === 'lista') {
    return (
      <div className={styles.listaItem}>
        <div className={styles.listaLeft}>
          <div className={styles.listaFecha}>
            <span className={styles.listaFechaDia}>
              {ev.fechaInicio ? parseInt(ev.fechaInicio.split('-')[2]) : '—'}
            </span>
            <span className={styles.listaFechaMes}>
              {ev.fechaInicio
                ? ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'][parseInt(ev.fechaInicio.split('-')[1]) - 1]
                : ''}
            </span>
          </div>
          <div>
            <div className={styles.listaHeader}>
              <span className={styles.listaNombre}>{ev.nombre}</span>
              <span className={styles.badge}>{ev.categoria}</span>
              <span
                className={styles.badgeEstado}
                style={{ '--dot': estado.dot }}
              >
                {estado.label}
              </span>
            </div>
            <div className={styles.listaMeta}>
              <span className={styles.metaItem}>
                {MODALIDAD_ICON[ev.modalidad]}
                {ev.modalidad}
              </span>
              <span className={styles.metaSep} />
              <span className={styles.metaItem}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M8 1a5 5 0 0 1 5 5c0 3.5-5 9-5 9S3 9.5 3 6a5 5 0 0 1 5-5z"/>
                  <circle cx="8" cy="6" r="1.5"/>
                </svg>
                {ev.ubicacion}
              </span>
            </div>
          </div>
        </div>
        <div className={styles.listaRight}>
          <OcupacionBar inscritos={ev.inscritos} capacidad={ev.capacidad} />
          <div className={styles.listaAcciones}>
            <button className={styles.btnIcono} title="Ver">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z"/>
                <circle cx="8" cy="8" r="2"/>
              </svg>
            </button>
            <button className={styles.btnIcono} title="Editar">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M11 2l3 3-9 9H2v-3l9-9z" strokeLinejoin="round"/>
              </svg>
            </button>
            <button className={styles.btnIcono} title="Más opciones">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="8" cy="3" r="1" fill="currentColor"/><circle cx="8" cy="8" r="1" fill="currentColor"/><circle cx="8" cy="13" r="1" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.card}>
      {/* Top strip */}
      <div className={styles.cardStrip} />

      <div className={styles.cardBody}>
        {/* Header */}
        <div className={styles.cardHeader}>
          <span className={styles.badge}>{ev.categoria}</span>
          <span className={styles.badgeEstado} style={{ '--dot': estado.dot }}>
            {estado.label}
          </span>
        </div>

        {/* Nombre */}
        <h3 className={styles.cardNombre}>{ev.nombre}</h3>

        {/* Meta */}
        <div className={styles.cardMeta}>
          <div className={styles.metaItem}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="1" y="3" width="14" height="11" rx="2"/>
              <path d="M5 1v3M11 1v3M1 7h14" strokeLinecap="round"/>
            </svg>
            {formatFecha(ev.fechaInicio)}
            {ev.fechaInicio !== ev.fechaCierre && ` → ${formatFecha(ev.fechaCierre)}`}
          </div>
          <div className={styles.metaItem}>
            {MODALIDAD_ICON[ev.modalidad]}
            {ev.modalidad}
          </div>
          <div className={styles.metaItem}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 1a5 5 0 0 1 5 5c0 3.5-5 9-5 9S3 9.5 3 6a5 5 0 0 1 5-5z"/>
              <circle cx="8" cy="6" r="1.5"/>
            </svg>
            <span className={styles.metaTrunc}>{ev.ubicacion}</span>
          </div>
        </div>

        {/* Ocupación */}
        <div className={styles.cardOcup}>
          <span className={styles.ocupTitle}>Inscritos</span>
          <OcupacionBar inscritos={ev.inscritos} capacidad={ev.capacidad} />
        </div>
      </div>

      {/* Footer */}
      <div className={styles.cardFooter}>
        <span className={styles.visib}>
          {ev.visibilidad === 'publico' ? (
            <><svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="7"/><path d="M8 1c-2 3-2 9 0 14M1 8h14" strokeLinecap="round"/></svg> Público</>
          ) : (
            <><svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="7" width="10" height="7" rx="1.5"/><path d="M5 7V5a3 3 0 0 1 6 0v2" strokeLinecap="round"/></svg> Privado</>
          )}
        </span>
        <div className={styles.cardAcciones}>
          <button className={styles.btnIcono} title="Ver evento">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z"/>
              <circle cx="8" cy="8" r="2"/>
            </svg>
          </button>
          <button className={styles.btnIcono} title="Editar">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M11 2l3 3-9 9H2v-3l9-9z" strokeLinejoin="round"/>
            </svg>
          </button>
          <button className={styles.btnIcono} title="Más opciones">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="8" cy="3" r="1" fill="currentColor"/>
              <circle cx="8" cy="8" r="1" fill="currentColor"/>
              <circle cx="8" cy="13" r="1" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
