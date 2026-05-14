import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import client from '../api/client.js';

const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'];

export default function AnalyticsPage() {
  const [resumen,   setResumen]   = useState(null);
  const [populares, setPopulares] = useState([]);
  const [masVistos, setMasVistos] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('gestek_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    Promise.all([
      client.get('/api/analytics/resumen',           { headers }),
      client.get('/api/analytics/eventos-populares', { headers }),
      client.get('/api/analytics/mas-vistos',        { headers }),
    ])
      .then(([r1, r2, r3]) => {
        setResumen(r1.data.resumen);
        setPopulares(r2.data.eventos_populares || []);
        setMasVistos(r3.data.mas_vistos || []);
      })
      .catch(() => setError('No se pudieron cargar los datos de analytics.'))
      .finally(() => setLoading(false));
  }, []);

  const exportarCSV = () => {
    const token = localStorage.getItem('gestek_token');
    const url = `${client.defaults.baseURL}/api/analytics/exportar-csv`;
    const a = document.createElement('a');
    a.setAttribute('download', 'asistentes-gestek.csv');
    a.href = url + (token ? `?token=${token}` : '');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
    </div>
  );

  if (error) return (
    <div className="p-6 text-red-400 bg-red-900/20 rounded-xl">{error}</div>
  );

  return (
    <div className="p-6 space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-gray-400 text-sm mt-1">Estadisticas de tu plataforma de eventos</p>
        </div>
        <button
          onClick={exportarCSV}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          Exportar CSV
        </button>
      </div>

      {/* Tarjetas resumen */}
      {resumen && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <p className="text-gray-400 text-sm">Total Eventos</p>
            <p className="text-3xl font-bold text-white mt-1">{resumen.total_eventos}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <p className="text-gray-400 text-sm">Total Asistentes</p>
            <p className="text-3xl font-bold text-indigo-400 mt-1">{resumen.total_asistentes}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <p className="text-gray-400 text-sm">Total Vistas</p>
            <p className="text-3xl font-bold text-purple-400 mt-1">{resumen.total_vistas}</p>
          </div>
        </div>
      )}

      {/* Grafica de barras — Eventos populares */}
      {populares.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-white font-semibold mb-4">Eventos mas populares (por asistentes)</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={populares}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="nombre" stroke="#9ca3af" tick={{ fontSize: 11 }} />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
                labelStyle={{ color: '#f9fafb' }}
              />
              <Bar dataKey="asistentes_registrados" fill="#6366f1" radius={[4,4,0,0]} name="Asistentes" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Grafica de pie — Eventos mas vistos */}
      {masVistos.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-white font-semibold mb-4">Eventos mas vistos</h2>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={masVistos}
                  dataKey="vistas"
                  nameKey="nombre"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ nombre, vistas }) => `${nombre}: ${vistas}`}
                >
                  {masVistos.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tabla detalle */}
      {populares.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-white font-semibold mb-4">Detalle de eventos</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-gray-400 border-b border-gray-700">
                  <th className="pb-3 pr-4">Evento</th>
                  <th className="pb-3 pr-4">Fecha</th>
                  <th className="pb-3 pr-4">Asistentes</th>
                  <th className="pb-3 pr-4">Capacidad</th>
                  <th className="pb-3">Ocupacion</th>
                </tr>
              </thead>
              <tbody>
                {populares.map(e => (
                  <tr key={e.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                    <td className="py-3 pr-4 text-white font-medium">{e.nombre}</td>
                    <td className="py-3 pr-4 text-gray-400">{e.fecha}</td>
                    <td className="py-3 pr-4 text-indigo-400">{e.asistentes_registrados}</td>
                    <td className="py-3 pr-4 text-gray-400">{e.capacidad}</td>
                    <td className="py-3">
                      <span className="bg-indigo-900/40 text-indigo-300 px-2 py-1 rounded text-xs">
                        {e.porcentaje_ocupacion}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sin datos */}
      {populares.length === 0 && masVistos.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">No hay datos de analytics todavia.</p>
          <p className="text-sm mt-2">Crea eventos y registra asistentes para ver estadisticas.</p>
        </div>
      )}

    </div>
  );
}
