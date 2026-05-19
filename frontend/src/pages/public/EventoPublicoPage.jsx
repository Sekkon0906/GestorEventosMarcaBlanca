import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

// ── Mock del evento público ───────────────────────────────
const MOCK = {
  nombre      : 'Tech Summit 2026',
  descripcion : 'El evento de tecnología más importante de Colombia. Tres días de conferencias, workshops y networking con los líderes del sector tech latinoamericano.',
  fecha_inicio: '2026-06-15T09:00:00',
  fecha_fin   : '2026-06-17T18:00:00',
  lugar       : 'Centro de Convenciones Ágora',
  ciudad      : 'Bogotá, Colombia',
  modalidad   : 'Híbrido',
  categoria   : 'Tecnología',
  organizador : 'GestekEventos',
  handle      : '/GestekEventos/tech-summit-2026',
  entradas    : [
    { tipo: 'General',  precio: 45000,  descripcion: 'Acceso a todas las conferencias',    disponibles: 120 },
    { tipo: 'VIP',      precio: 120000, descripcion: 'Acceso VIP + networking privado',     disponibles: 12  },
    { tipo: 'Streaming', precio: 15000,  descripcion: 'Acceso en línea a todas las charlas', disponibles: 500 },
  ],
  agenda: [
    { hora: '09:00', titulo: 'Apertura y bienvenida',       sala: 'Auditorio',  speaker: 'Equipo Gestek' },
    { hora: '09:30', titulo: 'Keynote: El futuro de la IA', sala: 'Auditorio',  speaker: 'Dr. Pablo Ríos' },
    { hora: '11:00', titulo: 'Workshop: React 19',          sala: 'Sala A',     speaker: 'Valentina Torres' },
    { hora: '13:30', titulo: 'Panel: DevOps en 2026',       sala: 'Sala B',     speaker: 'Mesa redonda' },
    { hora: '15:00', titulo: 'Demo: Plataformas Cloud',     sala: 'Auditorio',  speaker: 'Sergio Nava' },
  ],
  speakers: [
    { nombre: 'Dr. Pablo Ríos',      cargo: 'CTO — TechCorp',         avatar: 'PR' },
    { nombre: 'Valentina Torres',    cargo: 'Dev Advocate — Meta',    avatar: 'VT' },
    { nombre: 'Sergio Nava',         cargo: 'Cloud Architect — AWS',  avatar: 'SN' },
    { nombre: 'Camila Ospina',       cargo: 'CEO — StartupHub',       avatar: 'CO' },
  ],
  puntos        : 320,
  referido_code : 'TSUMMIT-A1B2',
  ya_inscrito   : false,
  total_inscritos: 312,
  capacidad     : 500,
};

export default function EventoPublicoPage() {
  const { slug }          = useParams();
  const { usuario, token } = useAuth();
  const [tabSel,  setTabSel]  = useState('info');
  const [entrada, setEntrada] = useState(0);
  const [copiado, setCopiado] = useState(false);
  const [inscrito, setInscrito] = useState(MOCK.ya_inscrito);
  const [favorito, setFavorito] = useState(false);

  const evento = MOCK;
  const entradaSel = evento.entradas[entrada];
  const ocupacion  = Math.round((evento.total_inscritos / evento.capacidad) * 100);

  const fmt = (d) => new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });

  const copiarReferido = () => {
    navigator.clipboard.writeText(evento.referido_code);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const TABS = [
    { id: 'info',     label: 'Información' },
    { id: 'agenda',   label: 'Agenda' },
    { id: 'speakers', label: 'Speakers' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="grid lg:grid-cols-[1fr_360px] gap-8">

        {/* ── Columna principal ── */}
        <div>
          {/* Portada */}
          <div className="aspect-[16/7] rounded-3xl border border-border bg-gradient-to-br from-primary/30 via-accent/15 to-bg mb-6 overflow-hidden relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 rounded-3xl bg-gradient-primary flex items-center justify-center mx-auto mb-3 shadow-glow">
                  <span className="text-white text-2xl font-bold font-display">TS</span>
                </div>
                <p className="text-text-3 text-sm">{evento.organizador}</p>
              </div>
            </div>
            {/* Badge modalidad */}
            <div className="absolute top-4 left-4">
              <span className="badge-blue">{evento.modalidad}</span>
            </div>
            {/* Botón favorito */}
            <button
              onClick={() => setFavorito(f => !f)}
              className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-surface/80 backdrop-blur-sm border border-border flex items-center justify-center transition-all hover:border-border-2"
            >
              <HeartIcon className={`w-4 h-4 ${favorito ? 'text-red-400 fill-red-400' : 'text-text-3'}`} />
            </button>
          </div>

          {/* Meta */}
          <div className="flex items-center gap-2 text-xs text-text-3 mb-3">
            <span className="badge-purple">{evento.categoria}</span>
            <span>·</span>
            <span>por <span className="text-text-2 font-medium">{evento.organizador}</span></span>
            <span>·</span>
            <span className="font-mono text-primary-light">{evento.handle}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold font-display tracking-tight text-text-1 mb-2">
            {evento.nombre}
          </h1>
          <p className="text-base text-text-2 leading-relaxed mb-6">
            {evento.descripcion}
          </p>

          {/* Info rápida */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Fecha inicio', value: fmt(evento.fecha_inicio), icon: <CalendarIcon className="w-4 h-4 text-primary" /> },
              { label: 'Ciudad',       value: evento.ciudad,            icon: <PinIcon className="w-4 h-4 text-success" /> },
              { label: 'Lugar',        value: evento.lugar,             icon: <BuildingIcon className="w-4 h-4 text-accent" /> },
              { label: 'Inscritos',    value: `${evento.total_inscritos} / ${evento.capacidad}`, icon: <UsersIcon className="w-4 h-4 text-warning" /> },
            ].map((item, i) => (
              <div key={i} className="rounded-2xl border border-border bg-surface/40 px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  {item.icon}
                  <p className="text-[10px] uppercase tracking-widest text-text-3">{item.label}</p>
                </div>
                <p className="text-sm text-text-1 font-medium leading-tight">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Ocupación */}
          <div className="mb-6 p-4 rounded-2xl bg-surface border border-border">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-text-2">Ocupación del evento</span>
              <span className="font-semibold text-text-1">{ocupacion}%</span>
            </div>
            <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${ocupacion > 80 ? 'bg-danger' : ocupacion > 60 ? 'bg-warning' : 'bg-success'}`}
                style={{ width: `${ocupacion}%` }}
              />
            </div>
            <p className="text-xs text-text-3 mt-1.5">{evento.capacidad - evento.total_inscritos} cupos disponibles</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-border mb-5">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTabSel(t.id)}
                className={`px-4 py-2.5 text-sm font-medium rounded-t-xl transition-all border-b-2 -mb-px
                  ${tabSel === t.id ? 'text-primary border-primary bg-primary/5' : 'text-text-3 border-transparent hover:text-text-2'}`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* ── Tab Información ── */}
          {tabSel === 'info' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-surface border border-border">
                <h3 className="text-sm font-semibold text-text-1 mb-2">Sobre el evento</h3>
                <p className="text-sm text-text-2 leading-relaxed">{evento.descripcion}</p>
              </div>
              {/* Mapa placeholder */}
              <div className="rounded-2xl border border-border overflow-hidden">
                <div className="h-48 bg-gradient-to-br from-surface-2 to-surface-3 flex items-center justify-center relative">
                  <div className="text-center">
                    <MapIcon className="w-10 h-10 text-text-3 mx-auto mb-2" />
                    <p className="text-sm text-text-2 font-medium">{evento.lugar}</p>
                    <p className="text-xs text-text-3">{evento.ciudad}</p>
                  </div>
                </div>
                <div className="px-4 py-3 border-t border-border flex items-center justify-between">
                  <span className="text-sm text-text-2">{evento.lugar}</span>
                  <button className="btn-secondary btn-sm">
                    <MapIcon className="w-3.5 h-3.5" /> Cómo llegar
                  </button>
                </div>
              </div>
              {/* Puntos y referidos */}
              {token && (
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-accent/5 border border-accent/20">
                    <div className="flex items-center gap-2 mb-1">
                      <StarIcon className="w-4 h-4 text-accent" />
                      <span className="text-xs font-semibold text-accent uppercase tracking-wide">Puntos acumulados</span>
                    </div>
                    <p className="text-2xl font-bold font-display text-text-1">{evento.puntos}</p>
                    <p className="text-xs text-text-3 mt-0.5">puntos en este evento</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-success/5 border border-success/20">
                    <div className="flex items-center gap-2 mb-1">
                      <ShareIcon className="w-4 h-4 text-success" />
                      <span className="text-xs font-semibold text-success uppercase tracking-wide">Tu código referido</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono text-sm text-text-1 bg-surface-2 px-2 py-1 rounded-lg border border-border">
                        {evento.referido_code}
                      </span>
                      <button onClick={copiarReferido} className="btn-ghost btn-sm">
                        {copiado ? <CheckIcon className="w-3.5 h-3.5 text-success" /> : <CopyIcon className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Tab Agenda ── */}
          {tabSel === 'agenda' && (
            <div className="space-y-2">
              {evento.agenda.map((act, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-xl border border-border bg-surface/40 hover:border-border-2 transition-all">
                  <div className="w-12 flex-shrink-0 text-center">
                    <span className="text-xs font-mono font-semibold text-primary">{act.hora}</span>
                  </div>
                  <div className="w-px bg-border flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-1">{act.titulo}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-text-3">
                      <span className="flex items-center gap-1"><BuildingIcon className="w-3 h-3" />{act.sala}</span>
                      <span className="flex items-center gap-1"><UserIcon className="w-3 h-3" />{act.speaker}</span>
                    </div>
                  </div>
                  <button className="flex-shrink-0 text-xs text-text-3 hover:text-primary transition-colors flex items-center gap-1">
                    <StarIcon className="w-3.5 h-3.5" /> Fav
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* ── Tab Speakers ── */}
          {tabSel === 'speakers' && (
            <div className="grid sm:grid-cols-2 gap-3">
              {evento.speakers.map((s, i) => (
                <div key={i} className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-surface/40 hover:border-border-2 transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary text-sm font-bold">{s.avatar}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-1">{s.nombre}</p>
                    <p className="text-xs text-text-3">{s.cargo}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Sidebar: Boleta ── */}
        <aside className="lg:sticky lg:top-24 h-fit space-y-4">
          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-semibold text-text-1">Obtener entrada</h3>
              {inscrito && <span className="badge-green badge-dot">Inscrito</span>}
            </div>
            <div className="card-body space-y-3">
              {/* Selector de tipo */}
              {evento.entradas.map((en, i) => (
                <button
                  key={i}
                  onClick={() => setEntrada(i)}
                  className={`w-full flex items-start justify-between p-3 rounded-xl border transition-all text-left
                    ${entrada === i ? 'border-primary bg-primary/5' : 'border-border hover:border-border-2'}`}
                >
                  <div>
                    <p className="text-sm font-medium text-text-1">{en.tipo}</p>
                    <p className="text-xs text-text-3 mt-0.5">{en.descripcion}</p>
                    <p className="text-xs text-text-3 mt-0.5">{en.disponibles} disponibles</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-sm font-bold text-text-1">
                      {en.precio === 0 ? 'Gratis' : `$${en.precio.toLocaleString()}`}
                    </p>
                    {en.precio > 0 && <p className="text-xs text-text-3">COP</p>}
                  </div>
                </button>
              ))}

              {/* Precio total */}
              <div className="pt-2 border-t border-border flex items-center justify-between">
                <span className="text-sm text-text-2">Total</span>
                <span className="text-xl font-bold font-display text-text-1">
                  {entradaSel.precio === 0 ? 'Gratis' : `$${entradaSel.precio.toLocaleString()} COP`}
                </span>
              </div>

              {/* Método pago BRE-B */}
              {entradaSel.precio > 0 && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-success/5 border border-success/20 text-xs text-success">
                  <ShieldIcon className="w-4 h-4 flex-shrink-0" />
                  Pago seguro vía BRE-B
                </div>
              )}

              {/* Botón inscripción */}
              {token ? (
                <button
                  onClick={() => setInscrito(v => !v)}
                  className={`w-full py-3 rounded-2xl text-sm font-semibold transition-all
                    ${inscrito
                      ? 'bg-success/10 text-success border border-success/20 hover:bg-success/20'
                      : 'bg-gradient-primary text-white shadow-glow hover:shadow-glow'}`}
                >
                  {inscrito ? (
                    <span className="flex items-center justify-center gap-2">
                      <CheckIcon className="w-4 h-4" /> Inscrito — cancelar
                    </span>
                  ) : (
                    entradaSel.precio === 0 ? 'Reservar mi cupo gratis' : 'Comprar entrada'
                  )}
                </button>
              ) : (
                <Link to="/login" className="block w-full py-3 rounded-2xl text-sm font-semibold text-center bg-gradient-primary text-white shadow-glow hover:shadow-glow transition-all">
                  Inicia sesión para inscribirte
                </Link>
              )}

              {/* QR si inscrito */}
              {inscrito && (
                <div className="text-center p-3 rounded-xl bg-surface-2 border border-border">
                  <div className="w-24 h-24 bg-surface-3 rounded-xl mx-auto mb-2 flex items-center justify-center border border-border">
                    <QrIcon className="w-12 h-12 text-text-3" />
                  </div>
                  <p className="text-xs text-text-3">Tu QR de entrada</p>
                  <button className="btn-secondary btn-sm mt-2 w-full">
                    <DownloadIcon className="w-3.5 h-3.5" /> Descargar QR
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Recordatorio calendario */}
          <div className="card">
            <div className="card-body">
              <p className="text-sm font-semibold text-text-1 mb-3">Agregar a calendario</p>
              <div className="grid grid-cols-2 gap-2">
                <button className="btn-secondary btn-sm justify-center text-xs">Google Cal</button>
                <button className="btn-secondary btn-sm justify-center text-xs">iCal / Outlook</button>
              </div>
            </div>
          </div>

          {/* Compartir */}
          <div className="card">
            <div className="card-body">
              <p className="text-sm font-semibold text-text-1 mb-3">Compartir evento</p>
              <div className="grid grid-cols-3 gap-2">
                {['WhatsApp', 'Twitter', 'Copiar link'].map((r, i) => (
                  <button key={i} className="btn-secondary btn-sm justify-center text-xs">{r}</button>
                ))}
              </div>
            </div>
          </div>

          <Link to="/explorar" className="block text-center text-xs text-text-3 hover:text-text-2 transition-colors py-2">
            ← Volver a explorar
          </Link>
        </aside>
      </div>
    </div>
  );
}

// ── Íconos ────────────────────────────────────────────────
const CalendarIcon = ({className}) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const PinIcon      = ({className}) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const BuildingIcon = ({className}) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>;
const UsersIcon    = ({className}) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const HeartIcon    = ({className}) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>;
const StarIcon     = ({className}) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>;
const MapIcon      = ({className}) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>;
const ShareIcon    = ({className}) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>;
const CopyIcon     = ({className}) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
const CheckIcon    = ({className}) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>;
const ShieldIcon   = ({className}) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
const QrIcon       = ({className}) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h2M8 8h.01M8 16h.01M8 4h.01M4 4h4v4H4zm0 12h4v4H4zm12-12h4v4h-4z" /></svg>;
const DownloadIcon = ({className}) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
const UserIcon     = ({className}) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
