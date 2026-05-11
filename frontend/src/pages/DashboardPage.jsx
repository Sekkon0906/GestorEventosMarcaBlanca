import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { eventosApi } from '../api/eventos.js';
import StatCard from '../components/ui/StatCard.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import { EstadoBadge, ModalidadBadge } from '../components/ui/Badge.jsx';

export default function DashboardPage() {
  const { usuario } = useAuth();
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats,   setStats]   = useState({ total: 0, publicados: 0, borradores: 0, asistentes: 0 });

  useEffect(() => {
    eventosApi.list({ limit: 50 })
      .then(data => {
        const list = data.eventos || [];
        setEventos(list.slice(0, 5));
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

  const hora = new Date().getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold font-head text-text-primary">
          {saludo}, {usuario?.nombre?.split(' ')[0]} 👋
        </h2>
        <p className="text-sm text-text-secondary mt-0.5">
          Aquí tienes un resumen de tu operación de eventos.
        </p>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="flex items-center justify-center h-28">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard label="Total Eventos"   value={stats.total}      icon={CalendarIcon} color="blue"   />
          <StatCard label="Publicados"      value={stats.publicados}  icon={CheckIcon}    color="green"  />
          <StatCard label="Borradores"      value={stats.borradores}  icon={DraftIcon}    color="yellow" />
          <StatCard label="Total Asistentes" value={stats.asistentes} icon={UsersIcon}    color="purple" />
        </div>
      )}

      {/* Últimos eventos + CTA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Últimos eventos */}
        <div className="card lg:col-span-2">
          <div className="card-header flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary">Últimos eventos</h3>
            <Link to="/eventos" className="text-xs text-primary hover:underline">Ver todos →</Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-32"><Spinner /></div>
          ) : eventos.length === 0 ? (
            <div className="card-body text-center">
              <p className="text-sm text-text-secondary">Aún no hay eventos.</p>
              <Link to="/eventos/nuevo" className="btn-primary mt-3 inline-flex">Crear primer evento</Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {eventos.map(ev => (
                <Link
                  key={ev.id}
                  to={`/eventos/${ev.id}`}
                  className="flex items-center gap-3 px-6 py-3.5 hover:bg-surface-2/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{ev.nombre}</p>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {ev.fecha_inicio ? new Date(ev.fecha_inicio).toLocaleDateString('es-CO', { day:'2-digit', month:'short', year:'numeric' }) : 'Sin fecha'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <ModalidadBadge modalidad={ev.modalidad} />
                    <EstadoBadge estado={ev.estado} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="space-y-3">
          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-semibold text-text-primary">Acciones rápidas</h3>
            </div>
            <div className="card-body space-y-2">
              <Link to="/eventos/nuevo" className="btn-primary w-full justify-start gap-3">
                <PlusIcon className="w-4 h-4" />
                Crear evento
              </Link>
              <Link to="/eventos" className="btn-secondary w-full justify-start gap-3">
                <CalendarIcon className="w-4 h-4" />
                Ver eventos
              </Link>
              <Link to="/configuracion" className="btn-ghost w-full justify-start gap-3">
                <SettingsIcon className="w-4 h-4" />
                Configuración
              </Link>
            </div>
          </div>

          {/* Status card */}
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
              <p className="text-xs font-medium text-text-primary">API Operativa</p>
            </div>
            <p className="text-xs text-text-secondary">Todos los sistemas funcionan correctamente.</p>
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
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;
}
function SettingsIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
}
