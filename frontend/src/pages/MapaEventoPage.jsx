import { useState } from 'react';

export default function MapaEventoPage() {
  const [busqueda,   setBusqueda]   = useState('');
  const [lugar,      setLugar]      = useState(null);
  const [cargando,   setCargando]   = useState(false);

  // Lugares de ejemplo para demo
  const lugaresDemo = [
    { nombre: 'Auditorio Nacional de Bogotá',  ciudad: 'Bogotá, Colombia',    query: 'Auditorio+Nacional+Bogota+Colombia' },
    { nombre: 'Plaza Mayor Medellín',           ciudad: 'Medellín, Colombia',  query: 'Plaza+Mayor+Medellin+Colombia' },
    { nombre: 'Centro de Convenciones Cartagena', ciudad: 'Cartagena, Colombia', query: 'Centro+Convenciones+Cartagena+Colombia' },
    { nombre: 'Movistar Arena',                 ciudad: 'Bogotá, Colombia',    query: 'Movistar+Arena+Bogota' },
  ];

  const buscarLugar = (e) => {
    e.preventDefault();
    if (!busqueda.trim()) return;
    setCargando(true);
    const query = encodeURIComponent(busqueda.trim());
    setTimeout(() => {
      setLugar({ nombre: busqueda, query });
      setCargando(false);
    }, 500);
  };

  const seleccionarDemo = (demo) => {
    setBusqueda(demo.nombre);
    setLugar({ nombre: demo.nombre, ciudad: demo.ciudad, query: demo.query });
  };

  const abrirGoogleMaps = () => {
    if (!lugar) return;
    window.open(`https://www.google.com/maps/search/${lugar.query}`, '_blank');
  };

  const abrirWaze = () => {
    if (!lugar) return;
    window.open(`https://waze.com/ul?q=${lugar.query}`, '_blank');
  };

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Ubicación del Evento 📍</h1>
        <p className="text-gray-400 text-sm mt-1">Mapa interactivo con la ubicación exacta del evento</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Panel izquierdo */}
        <div className="space-y-4">

          {/* Buscador */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
            <h3 className="text-white font-semibold mb-3 text-sm">🔍 Buscar lugar</h3>
            <form onSubmit={buscarLugar} className="space-y-2">
              <input
                type="text"
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Ej: Auditorio Nacional Bogotá"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={cargando}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium transition"
              >
                {cargando ? 'Buscando...' : 'Ver en mapa'}
              </button>
            </form>
          </div>

          {/* Lugares demo */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
            <h3 className="text-white font-semibold mb-3 text-sm">📌 Lugares populares</h3>
            <div className="space-y-2">
              {lugaresDemo.map((demo, i) => (
                <button
                  key={i}
                  onClick={() => seleccionarDemo(demo)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition border ${
                    lugar?.query === demo.query
                      ? 'bg-indigo-900/40 border-indigo-500 text-indigo-300'
                      : 'bg-gray-700/40 border-gray-600 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <p className="font-medium">{demo.nombre}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{demo.ciudad}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Botones de navegación */}
          {lugar && (
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 space-y-2">
              <h3 className="text-white font-semibold mb-2 text-sm">🧭 Cómo llegar</h3>
              <button
                onClick={abrirGoogleMaps}
                className="w-full flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                Abrir en Google Maps
              </button>
              <button
                onClick={abrirWaze}
                className="w-full flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                </svg>
                Abrir en Waze
              </button>
            </div>
          )}
        </div>

        {/* Mapa */}
        <div className="lg:col-span-2">
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden" style={{ height: '500px' }}>
            {lugar ? (
              <div className="relative h-full">
                {/* Info del lugar */}
                <div className="absolute top-3 left-3 right-3 z-10 bg-gray-900/90 backdrop-blur rounded-lg px-4 py-2.5 flex items-center gap-2">
                  <span className="text-red-400 text-lg">📍</span>
                  <div>
                    <p className="text-white text-sm font-semibold">{lugar.nombre}</p>
                    {lugar.ciudad && <p className="text-gray-400 text-xs">{lugar.ciudad}</p>}
                  </div>
                </div>

                {/* iframe de Google Maps (sin API key) */}
                <iframe
                  title="mapa-evento"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://maps.google.com/maps?q=${lugar.query}&output=embed&z=15`}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-gray-700 flex items-center justify-center">
                  <svg className="w-10 h-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-400 font-medium">Selecciona un lugar</p>
                  <p className="text-gray-600 text-sm mt-1">Busca o elige un lugar de la lista para ver el mapa</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
