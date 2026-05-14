import { useState, useEffect } from 'react';
import client from '../api/client.js';

const NIVEL_COLORES = {
  Bronze  : 'text-amber-600',
  Silver  : 'text-gray-300',
  Gold    : 'text-yellow-400',
  Platinum: 'text-cyan-300',
};

const NIVEL_BG = {
  Bronze  : 'bg-amber-900/20 border-amber-700',
  Silver  : 'bg-gray-700/20 border-gray-500',
  Gold    : 'bg-yellow-900/20 border-yellow-600',
  Platinum: 'bg-cyan-900/20 border-cyan-600',
};

export default function GamificacionPage() {
  const [perfil,   setPerfil]   = useState(null);
  const [ranking,  setRanking]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [sumando,  setSumando]  = useState(false);
  const [mensaje,  setMensaje]  = useState(null);

  const token = localStorage.getItem('gestek_token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    Promise.all([
      client.get('/gamificacion/mis-puntos', { headers }),
      client.get('/gamificacion/ranking',    { headers }),
    ])
      .then(([r1, r2]) => {
        setPerfil(r1.data);
        setRanking(r2.data.ranking || []);
      })
      .catch(() => setError('No se pudieron cargar los puntos.'))
      .finally(() => setLoading(false));
  }, []);

  const sumarPuntos = async (accion) => {
    setSumando(true);
    setMensaje(null);
    try {
      const { data } = await client.post('/gamificacion/sumar', { accion }, { headers });
      setMensaje(data.mensaje);
      // Recargar perfil
      const r = await client.get('/gamificacion/mis-puntos', { headers });
      setPerfil(r.data);
    } catch (err) {
      setMensaje('Error al sumar puntos.');
    } finally {
      setSumando(false);
      setTimeout(() => setMensaje(null), 3000);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
    </div>
  );

  if (error) return (
    <div className="p-6 text-red-400 bg-red-900/20 rounded-xl">{error}</div>
  );

  const nivel = perfil?.nivel;

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Gamificación 🎮</h1>
        <p className="text-gray-400 text-sm mt-1">Gana puntos participando en eventos</p>
      </div>

      {/* Mensaje flash */}
      {mensaje && (
        <div className="bg-indigo-900/40 border border-indigo-500 rounded-xl p-3 text-indigo-300 text-sm font-medium text-center">
          {mensaje}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Tarjeta de nivel */}
        <div className="lg:col-span-2 space-y-4">
          {nivel && (
            <div className={`rounded-xl border p-6 ${NIVEL_BG[nivel.nombre] || 'bg-gray-800 border-gray-700'}`}>
              <div className="flex items-center gap-4">
                <div className="text-5xl">{nivel.icono}</div>
                <div className="flex-1">
                  <p className="text-gray-400 text-sm">Tu nivel actual</p>
                  <h2 className={`text-3xl font-bold ${NIVEL_COLORES[nivel.nombre] || 'text-white'}`}>
                    {nivel.nombre}
                  </h2>
                  <p className="text-white text-2xl font-bold mt-1">
                    {perfil.puntos} <span className="text-gray-400 text-base font-normal">puntos</span>
                  </p>
                </div>
              </div>

              {/* Barra de progreso */}
              {nivel.siguiente && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>{nivel.nombre}</span>
                    <span>{nivel.siguiente.nombre} ({nivel.puntosParaSiguiente} pts más)</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${nivel.progreso}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1 text-right">{nivel.progreso}% completado</p>
                </div>
              )}
              {!nivel.siguiente && (
                <p className="mt-3 text-cyan-300 text-sm font-medium">🏆 ¡Nivel máximo alcanzado!</p>
              )}
            </div>
          )}

          {/* Cómo ganar puntos */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
            <h3 className="text-white font-semibold mb-3">¿Cómo ganar puntos?</h3>
            <div className="space-y-2">
              {[
                { accion: 'inscripcion', pts: 50,  label: 'Inscribirse a un evento',   emoji: '🎟️' },
                { accion: 'checkin',     pts: 100, label: 'Hacer check-in en el evento', emoji: '✅' },
                { accion: 'referido',    pts: 75,  label: 'Referir a un amigo',          emoji: '👥' },
                { accion: 'encuesta',    pts: 25,  label: 'Completar encuesta post-evento', emoji: '📝' },
              ].map(item => (
                <div key={item.accion} className="flex items-center justify-between bg-gray-700/40 rounded-lg px-4 py-2.5">
                  <span className="text-gray-300 text-sm">{item.emoji} {item.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-indigo-400 font-bold text-sm">+{item.pts} pts</span>
                    <button
                      onClick={() => sumarPuntos(item.accion)}
                      disabled={sumando}
                      className="text-xs bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-2 py-1 rounded-md transition"
                    >
                      +Sumar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Historial */}
          {perfil?.historial?.length > 0 && (
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
              <h3 className="text-white font-semibold mb-3">Últimas acciones</h3>
              <div className="space-y-1">
                {perfil.historial.map((h, i) => (
                  <div key={i} className="flex justify-between text-sm py-1.5 border-b border-gray-700/50 last:border-0">
                    <span className="text-gray-400">{h.accion}</span>
                    <span className="text-indigo-400 font-medium">+{h.puntos} pts</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Ranking */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
          <h3 className="text-white font-semibold mb-4">🏆 Ranking</h3>
          {ranking.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">Nadie en el ranking todavía.<br/>¡Sé el primero!</p>
          ) : (
            <div className="space-y-2">
              {ranking.map((r, i) => (
                <div key={r.user_id} className="flex items-center gap-3 bg-gray-700/30 rounded-lg px-3 py-2">
                  <span className="text-gray-400 text-sm w-5 text-center font-bold">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-medium truncate">{r.user_id}</p>
                    <p className="text-gray-400 text-xs">{r.icono} {r.nivel}</p>
                  </div>
                  <span className="text-indigo-400 font-bold text-sm">{r.puntos}</span>
                </div>
              ))}
            </div>
          )}

          {/* Niveles */}
          <div className="mt-6 pt-4 border-t border-gray-700">
            <p className="text-gray-400 text-xs font-medium mb-2">Niveles</p>
            {[
              { nombre: 'Bronze',   pts: '0',    icono: '🥉' },
              { nombre: 'Silver',   pts: '200',  icono: '🥈' },
              { nombre: 'Gold',     pts: '500',  icono: '🥇' },
              { nombre: 'Platinum', pts: '1000', icono: '💎' },
            ].map(n => (
              <div key={n.nombre} className="flex justify-between text-xs py-1">
                <span className="text-gray-400">{n.icono} {n.nombre}</span>
                <span className="text-gray-500">{n.pts}+ pts</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
