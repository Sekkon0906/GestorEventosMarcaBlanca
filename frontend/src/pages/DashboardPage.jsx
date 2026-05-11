import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { eventosApi } from '../api/eventos.js';
import StatCard from '../components/ui/StatCard.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import { EstadoBadge, ModalidadBadge } from '../components/ui/Badge.jsx';

export default function DashboardPage() {
  const { usuario } = useAuth();
  const [eventos,  setEventos]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [stats,    setStats]    = useState({ total: 0, publicados: 0, borradores: 0, asistentes: 0 });

  useEffect(() => {
    eventosApi.list({ limit: 50 })
      .then(data => {
        const list = data.eventos || [];
        setEventos(list.slice(0, 6));
        setStats({
          total      : data.total || list.length,
          publicados : list.filter(e => e.estado === 'publicado').length,
          borradores : list.filter(e => e.estado === 'borrador').length,
          asistentes : list.reduce((s, e) => s + (e.asistentes_count || 0), 0),
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const hora    = new Date().getHours();
  const saludo  = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches';
  const nombre  = usuario?.nombre?.split(' ')[0] || 'Usuario';

  return (
    <div className="space-y-6 animate-[fadeUp_0.4s_ease_both]">
      {/* Hero header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-text-2 text-sm mb-0.5">{saludo},</p>
          <h1 className="text-2xl font-bold font-display text-text-1">
            {nombre} <span className="text-gradient">👋</span>
          </h1>
          <p className="text-sm text-text-2 mt-1">Aquí tienes el resumen de tu operación de eventos.</p>
        </div>
        <Link to="/eventos/nuevo" className="btn-gradient hidden sm:inline-flex">
          <PlusIcon className="w-4 h-4" />
          Crear evento
        </Link>
      </div>

      {/* Stats grid */}
      {loading ? (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-2xl" style={{ animationDelay: `${i * 100}ms` }} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard label="Total eventos"    value={stats.total}      icon={CalendarIcon} color="blue"   />
          <StatCard label="Publicados"       value={stats.publicados}  icon={CheckIcon}    color="green"  />
          <StatCard label="Borradores"       value={stats.borradores}  icon={DraftIcon}    color="yellow" />
          <StatCard label="Total asistentes" value={stats.asistentes} icon={UsersIcon}    color="purple" />
        </div>
      )}

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent events */}
        <div className="card lg:col-span-2">
          <div className="card-header">
            <h3 className="text-sm font-semibold text-text-1">Eventos recientes</h3>
            <Link to="/eventos" className="text-xs text-primary hover:text-primary-light transition-colors">
              Ver todos →
            </Link>
          </div>

          {loading ? (
            <div className="divide-y divide-border">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-6 py-4">
                  <div className="skeleton h-8 w-8 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="skeleton h-3 w-40 rounded" />
                    <div className="skeleton h-2 w-24 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : eventos.length === 0 ? (
            <div className="card-body text-center py-12">
              <div className="w-12 h-12 rounded-2xl bg-surface-2 flex items-center justify-center mx-auto mb-3">
                <CalendarIcon className="w-6 h-6 text-text-3" />
              </div>
              <p className="text-sm text-text-2">Aún no hay eventos.</p>
              <Link to="/eventos/nuevo" className="btn-primary btn-sm mt-4 inline-flex">
                Crear primer evento
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {eventos.map(ev => (
                <Link
                  key={ev.id}
                  to={`/eventos/${ev.id}`}
                  className="flex items-center gap-3 px-6 py-3.5 hover:bg-surface-2/50 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-primary/10 border border-primary/15 flex items-center justify-center flex-shrink-0 text-primary text-xs font-bold font-display">
                    {ev.nombre?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-1 truncate group-hover:text-primary transition-colors">
                      {ev.nombre}
                    </p>
                    <p className="text-xs text-text-3 mt-0.5">
                      {ev.fecha_inicio
                        ? new Date(ev.fecha_inicio).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
                        : 'Sin fecha'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <ModalidadBadge modalidad={ev.modalidad} />
                    <EstadoBadge    estado={ev.estado} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Quick actions */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-semibold text-text-1">Acciones rápidas</h3>
            </div>
            <div className="card-body space-y-2">
              <Link to="/eventos/nuevo" className="btn-gradient w-full justify-start">
                <PlusIcon className="w-4 h-4" />
                Crear evento
              </Link>
              <Link to="/eventos" className="btn-secondary w-full justify-start">
                <CalendarIcon className="w-4 h-4" />
                Ver eventos
              </Link>
              <Link to="/configuracion" className="btn-ghost w-full justify-start">
                <SettingsIcon className="w-4 h-4" />
                Configuración
              </Link>
            </div>
          </div>

          {/* System status */}
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-60" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success" />
              </span>
              <p className="text-xs font-semibold text-text-1">Todos los sistemas operativos</p>
            </div>
            <div className="space-y-1.5">
              {[
                { label: 'API Backend',   ok: true },
                { label: 'Base de datos', ok: true },
                { label: 'Auth service',  ok: true },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="text-xs text-text-2">{s.label}</span>
                  <span className={`text-[10px] font-medium ${s.ok ? 'text-success' : 'text-danger'}`}>
                    {s.ok ? 'OK' : 'Error'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Tip */}
          <div className="card p-4 border-primary/20 bg-primary/5">
            <p className="text-xs font-semibold text-primary-light mb-1">💡 Pro tip</p>
            <p className="text-xs text-text-2 leading-relaxed">
              Publica tus eventos para que sean visibles al público y empezar a recibir inscripciones.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CalendarIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
}
function CheckIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}
function DraftIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
}
function UsersIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
}
function PlusIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;
}
function SettingsIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
}
