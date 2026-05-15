import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

// ── Datos mock para demo ──────────────────────────────────
const MOCK_EVENTO = {
  id: '1',
  nombre: 'Tech Summit 2026',
  fecha_inicio: '2026-06-15T09:00:00',
  lugar: 'Centro de Convenciones Ágora',
  ciudad: 'Bogotá',
  estado: 'publicado',
  capacidad_total: 500,
  asistentes_count: 312,
  vistas: 1840,
  ingresos: 18720000,
  entradas: [
    { tipo: 'General', precio: 45000, vendidas: 280, capacidad: 400 },
    { tipo: 'VIP',     precio: 120000, vendidas: 32,  capacidad: 100 },
  ],
};

const MOCK_ASISTENTES = [
  { id: 1, nombre: 'María García',    email: 'maria@ejemplo.com',  entrada: 'VIP',     estado: 'confirmado', avatar: 'MG' },
  { id: 2, nombre: 'Carlos López',    email: 'carlos@ejemplo.com', entrada: 'General', estado: 'confirmado', avatar: 'CL' },
  { id: 3, nombre: 'Ana Rodríguez',   email: 'ana@ejemplo.com',    entrada: 'General', estado: 'pendiente',  avatar: 'AR' },
  { id: 4, nombre: 'Juan Martínez',   email: 'juan@ejemplo.com',   entrada: 'VIP',     estado: 'confirmado', avatar: 'JM' },
  { id: 5, nombre: 'Laura Sánchez',   email: 'laura@ejemplo.com',  entrada: 'General', estado: 'confirmado', avatar: 'LS' },
];

const MOCK_AGENDA = [
  { id: 1, hora: '09:00', titulo: 'Apertura y bienvenida',         sala: 'Auditorio Principal', duracion: 30,  speaker: 'Equipo organizador' },
  { id: 2, hora: '09:30', titulo: 'Keynote: El futuro de la IA',   sala: 'Auditorio Principal', duracion: 60,  speaker: 'Dr. Pablo Ríos' },
  { id: 3, hora: '10:30', titulo: 'Coffee break / Networking',     sala: 'Lobby',               duracion: 30,  speaker: null },
  { id: 4, hora: '11:00', titulo: 'Workshop: React 19',            sala: 'Sala A',              duracion: 90,  speaker: 'Valentina Torres' },
  { id: 5, hora: '11:00', titulo: 'Panel: DevOps en 2026',         sala: 'Sala B',              duracion: 90,  speaker: 'Mesa redonda' },
  { id: 6, hora: '12:30', titulo: 'Almuerzo',                      sala: 'Restaurante',         duracion: 60,  speaker: null },
  { id: 7, hora: '13:30', titulo: 'Demo: Plataformas Cloud',       sala: 'Auditorio Principal', duracion: 45,  speaker: 'Sergio Nava' },
];

const MOCK_CHAT = [
  { id: 1, canal: 'general',   autor: 'Organizador',  avatar: 'OR', msg: 'Reunión de coordinación en 10 min. Todos al lobby.', hora: '08:45', mio: true },
  { id: 2, canal: 'general',   autor: 'Carlos Staff', avatar: 'CS', msg: 'Recibido, ya vamos para allá.', hora: '08:46', mio: false },
  { id: 3, canal: 'acceso',    autor: 'Staff Puerta', avatar: 'SP', msg: 'Hay cola de ~30 personas en entrada 2, ¿abro la 3?', hora: '08:52', mio: false },
  { id: 4, canal: 'acceso',    autor: 'Organizador',  avatar: 'OR', msg: 'Sí, abre la entrada 3. Sandra te apoya.', hora: '08:53', mio: true },
  { id: 5, canal: 'logistica', autor: 'Técnico AV',   avatar: 'TA', msg: 'Micro del auditorio B con interferencia, revisando.', hora: '08:58', mio: false },
  { id: 6, canal: 'vip',       autor: 'Anfitrión',    avatar: 'AN', msg: 'Los asistentes VIP ya están llegando, sala lista.', hora: '09:02', mio: false },
];

const CANALES = [
  { id: 'general',   label: 'General',   color: 'text-primary',  dot: 'bg-primary' },
  { id: 'acceso',    label: 'Acceso',    color: 'text-success',  dot: 'bg-success' },
  { id: 'logistica', label: 'Logística', color: 'text-warning',  dot: 'bg-warning' },
  { id: 'atencion',  label: 'Atención',  color: 'text-accent',   dot: 'bg-accent' },
  { id: 'vip',       label: 'VIP',       color: 'text-yellow-400', dot: 'bg-yellow-400' },
];

// ── Componentes auxiliares ────────────────────────────────
function StatCard({ label, value, sub, color = 'primary', icon }) {
  const colors = {
    primary: 'from-primary/20 to-primary/5 border-primary/20 text-primary',
    success: 'from-success/20 to-success/5 border-success/20 text-success',
    accent : 'from-accent/20  to-accent/5  border-accent/20  text-accent',
    warning: 'from-warning/20 to-warning/5 border-warning/20 text-warning',
  };
  return (
    <div className={`rounded-2xl border bg-gradient-to-br p-4 ${colors[color]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-text-2 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold font-display text-text-1 mt-1">{value}</p>
          {sub && <p className="text-xs text-text-3 mt-0.5">{sub}</p>}
        </div>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-current/10">
          {icon}
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ value, max, color = 'bg-primary' }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-surface-3 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-text-3 w-8 text-right">{pct}%</span>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────
export default function OrganizerDashboardPage() {
  const { usuario } = useAuth();
  const [tab,       setTab]       = useState('metricas');
  const [canal,     setCanal]     = useState('general');
  const [mensaje,   setMensaje]   = useState('');
  const [chats,     setChats]     = useState(MOCK_CHAT);
  const [busqueda,  setBusqueda]  = useState('');

  const e = MOCK_EVENTO;
  const ocupacion = Math.round((e.asistentes_count / e.capacidad_total) * 100);

  const mensajesCanal = chats.filter(c => c.canal === canal);
  const asistentesFiltrados = MOCK_ASISTENTES.filter(a =>
    a.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    a.email.toLowerCase().includes(busqueda.toLowerCase())
  );

  const enviarMensaje = () => {
    if (!mensaje.trim()) return;
    setChats(prev => [...prev, {
      id    : Date.now(),
      canal,
      autor : usuario?.nombre || 'Organizador',
      avatar: (usuario?.nombre || 'OR').slice(0, 2).toUpperCase(),
      msg   : mensaje.trim(),
      hora  : new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      mio   : true,
    }]);
    setMensaje('');
  };

  const TABS = [
    { id: 'metricas',   label: 'Métricas',       icon: <ChartIcon className="w-4 h-4" /> },
    { id: 'asistentes', label: 'Asistentes',      icon: <UsersIcon className="w-4 h-4" /> },
    { id: 'agenda',     label: 'Agenda',          icon: <CalendarIcon className="w-4 h-4" /> },
    { id: 'chat',       label: 'Chat Interno',    icon: <ChatIcon className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-5 animate-[fadeUp_0.4s_ease_both]">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-text-3 mb-1">
            <Link to="/eventos" className="hover:text-text-1 transition-colors">Eventos</Link>
            <span>/</span>
            <span className="text-text-2">{e.nombre}</span>
          </div>
          <h1 className="text-xl font-bold font-display text-text-1">{e.nombre}</h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-text-3">
            <span className="flex items-center gap-1">
              <CalendarIcon className="w-3.5 h-3.5" />
              {new Date(e.fecha_inicio).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
            <span className="flex items-center gap-1">
              <PinIcon className="w-3.5 h-3.5" />
              {e.lugar}, {e.ciudad}
            </span>
            <span className="badge-green badge-dot">Publicado</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link to={`/explorar/${e.id}`} className="btn-secondary btn-sm">
            <EyeIcon className="w-3.5 h-3.5" /> Vista pública
          </Link>
          <Link to={`/eventos/${e.id}`} className="btn-primary btn-sm">
            <EditIcon className="w-3.5 h-3.5" /> Editar
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border pb-0">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-xl transition-all border-b-2 -mb-px
              ${tab === t.id
                ? 'text-primary border-primary bg-primary/5'
                : 'text-text-3 border-transparent hover:text-text-2 hover:border-border'}`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: Métricas ── */}
      {tab === 'metricas' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="Asistentes" value={e.asistentes_count.toLocaleString()}
              sub={`de ${e.capacidad_total} cupos`} color="primary"
              icon={<UsersIcon className="w-4 h-4 text-primary" />} />
            <StatCard label="Ocupación" value={`${ocupacion}%`}
              sub="capacidad total" color="success"
              icon={<TrendIcon className="w-4 h-4 text-success" />} />
            <StatCard label="Vistas" value={e.vistas.toLocaleString()}
              sub="página del evento" color="accent"
              icon={<EyeIcon className="w-4 h-4 text-accent" />} />
            <StatCard label="Ingresos" value={`$${(e.ingresos / 1000000).toFixed(1)}M`}
              sub="COP estimados" color="warning"
              icon={<CashIcon className="w-4 h-4 text-warning" />} />
          </div>

          {/* Entradas */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-semibold text-text-1">Venta por tipo de entrada</h3>
            </div>
            <div className="card-body space-y-4">
              {e.entradas.map((en, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-text-1">{en.tipo}</span>
                      <span className="badge-gray">${en.precio.toLocaleString()} COP</span>
                    </div>
                    <span className="text-text-2 font-mono text-xs">{en.vendidas} / {en.capacidad}</span>
                  </div>
                  <ProgressBar value={en.vendidas} max={en.capacidad}
                    color={i === 0 ? 'bg-primary' : 'bg-accent'} />
                </div>
              ))}
            </div>
          </div>

          {/* Acciones rápidas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Exportar CSV',    icon: <DownloadIcon className="w-4 h-4" />,   color: 'btn-secondary' },
              { label: 'Enviar notif.',   icon: <BellIcon className="w-4 h-4" />,       color: 'btn-secondary' },
              { label: 'Check-in panel',  icon: <QrIcon className="w-4 h-4" />,         color: 'btn-secondary' },
              { label: 'Cancelar evento', icon: <XCircleIcon className="w-4 h-4 text-danger" />, color: 'btn-danger' },
            ].map((a, i) => (
              <button key={i} className={`${a.color} justify-center w-full`}>
                {a.icon} <span className="text-xs">{a.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB: Asistentes ── */}
      {tab === 'asistentes' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3" />
              <input
                className="input pl-9"
                placeholder="Buscar por nombre o email..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
              />
            </div>
            <button className="btn-secondary btn-sm">
              <DownloadIcon className="w-3.5 h-3.5" /> Exportar
            </button>
          </div>

          <div className="card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-text-3 uppercase tracking-wide">Asistente</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-3 uppercase tracking-wide">Entrada</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-3 uppercase tracking-wide">Estado</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-text-3 uppercase tracking-wide">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {asistentesFiltrados.map(a => (
                    <tr key={a.id} className="border-b border-border/50 hover:bg-surface-2/50 transition-colors">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-primary text-xs font-semibold">{a.avatar}</span>
                          </div>
                          <div>
                            <p className="font-medium text-text-1">{a.nombre}</p>
                            <p className="text-xs text-text-3">{a.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={a.entrada === 'VIP' ? 'badge-purple' : 'badge-gray'}>{a.entrada}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={a.estado === 'confirmado' ? 'badge-green badge-dot' : 'badge-yellow badge-dot'}>
                          {a.estado}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button className="btn-ghost btn-sm text-xs">
                          <QrIcon className="w-3.5 h-3.5" /> QR
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: Agenda ── */}
      {tab === 'agenda' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-2">{MOCK_AGENDA.length} actividades programadas</p>
            <button className="btn-secondary btn-sm">
              <PlusIcon className="w-3.5 h-3.5" /> Agregar actividad
            </button>
          </div>

          {/* Timeline */}
          <div className="space-y-2">
            {MOCK_AGENDA.map((act, i) => {
              const isBreak = !act.speaker;
              return (
                <div key={act.id} className={`flex gap-4 p-4 rounded-xl border transition-all
                  ${isBreak ? 'bg-surface/50 border-border/50' : 'card hover:border-border-2'}`}>
                  <div className="w-14 flex-shrink-0 text-center">
                    <span className="text-xs font-mono font-semibold text-primary">{act.hora}</span>
                    <div className="text-xs text-text-3 mt-0.5">{act.duracion}min</div>
                  </div>
                  <div className="w-px bg-border flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-medium ${isBreak ? 'text-text-3' : 'text-text-1'}`}>
                        {act.titulo}
                      </p>
                      <span className="badge-gray text-nowrap">{act.sala}</span>
                    </div>
                    {act.speaker && (
                      <p className="text-xs text-text-3 mt-1 flex items-center gap-1">
                        <UserIcon className="w-3 h-3" /> {act.speaker}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB: Chat Interno ── */}
      {tab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[480px]">
          {/* Sidebar canales */}
          <div className="card p-3 space-y-1 lg:col-span-1">
            <p className="text-xs font-semibold text-text-3 uppercase tracking-wider px-2 mb-2">Canales</p>
            {CANALES.map(c => {
              const count = chats.filter(m => m.canal === c.id && !m.mio).length;
              return (
                <button
                  key={c.id}
                  onClick={() => setCanal(c.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all
                    ${canal === c.id ? 'bg-primary/10 text-primary border border-primary/20' : 'text-text-2 hover:bg-surface-2'}`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${c.dot}`} />
                    <span className="font-medium">{c.label}</span>
                  </div>
                  {count > 0 && (
                    <span className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Área de mensajes */}
          <div className="card flex flex-col lg:col-span-3">
            <div className="card-header">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${CANALES.find(c => c.id === canal)?.dot}`} />
                <span className="text-sm font-semibold text-text-1">
                  #{CANALES.find(c => c.id === canal)?.label}
                </span>
              </div>
              <span className="text-xs text-text-3">{mensajesCanal.length} mensajes</span>
            </div>

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {mensajesCanal.length === 0 ? (
                <div className="flex items-center justify-center h-full text-text-3 text-sm">
                  No hay mensajes en este canal.
                </div>
              ) : mensajesCanal.map(m => (
                <div key={m.id} className={`flex gap-2.5 ${m.mio ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-semibold
                    ${m.mio ? 'bg-primary/20 text-primary' : 'bg-surface-3 text-text-2'}`}>
                    {m.avatar}
                  </div>
                  <div className={`max-w-[75%] ${m.mio ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                    <div className="flex items-center gap-2">
                      {!m.mio && <span className="text-xs font-medium text-text-2">{m.autor}</span>}
                      <span className="text-[10px] text-text-3">{m.hora}</span>
                    </div>
                    <div className={`px-3 py-2 rounded-xl text-sm
                      ${m.mio
                        ? 'bg-primary/15 text-text-1 border border-primary/20 rounded-tr-sm'
                        : 'bg-surface-2 text-text-1 border border-border rounded-tl-sm'}`}>
                      {m.msg}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input mensaje */}
            <div className="p-4 border-t border-border flex gap-2">
              <input
                className="input flex-1"
                placeholder={`Mensaje en #${CANALES.find(c => c.id === canal)?.label}...`}
                value={mensaje}
                onChange={e => setMensaje(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && enviarMensaje()}
              />
              <button
                onClick={enviarMensaje}
                disabled={!mensaje.trim()}
                className="btn-primary btn-sm px-4"
              >
                <SendIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Íconos ────────────────────────────────────────────────
const ChartIcon    = ({className}) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
const UsersIcon    = ({className}) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const CalendarIcon = ({className}) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const ChatIcon     = ({className}) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
const EyeIcon      = ({className}) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;
const TrendIcon    = ({className}) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
const CashIcon     = ({className}) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const SearchIcon   = ({className}) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const DownloadIcon = ({className}) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
const BellIcon     = ({className}) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
const QrIcon       = ({className}) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h2M8 8h.01M8 16h.01M8 4h.01M4 4h4v4H4zm0 12h4v4H4zm12-12h4v4h-4z" /></svg>;
const XCircleIcon  = ({className}) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const PlusIcon     = ({className}) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;
const UserIcon     = ({className}) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const SendIcon     = ({className}) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>;
const EditIcon     = ({className}) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const PinIcon      = ({className}) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
