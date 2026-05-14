import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import client from '../api/client.js';

export default function ScanPage() {
  const [resultado,   setResultado]   = useState(null);
  const [escaneando,  setEscaneando]  = useState(false);
  const [cargando,    setCargando]    = useState(false);
  const [error,       setError]       = useState(null);
  const scannerRef = useRef(null);
  const html5QrRef = useRef(null);

  useEffect(() => {
    return () => {
      // Limpiar scanner al salir
      if (html5QrRef.current) {
        html5QrRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const iniciarScanner = async () => {
    setError(null);
    setResultado(null);
    setEscaneando(true);

    try {
      const html5QrCode = new Html5Qrcode('qr-reader');
      html5QrRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' }, // cámara trasera
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          // QR detectado — detener cámara y verificar
          await html5QrCode.stop();
          setEscaneando(false);
          verificarQR(decodedText);
        },
        () => {} // errores de frame — ignorar
      );
    } catch (err) {
      setEscaneando(false);
      setError('No se pudo acceder a la cámara. Verifica los permisos.');
    }
  };

  const detenerScanner = async () => {
    if (html5QrRef.current) {
      await html5QrRef.current.stop().catch(() => {});
    }
    setEscaneando(false);
  };

  const verificarQR = async (qr_token) => {
    setCargando(true);
    setResultado(null);
    try {
      const token = localStorage.getItem('gestek_token');
      const { data } = await client.post(
        '/qr/verificar',
        { qr_token },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      setResultado(data);
    } catch (err) {
      const msg = err.response?.data?.error || 'Error al verificar el QR.';
      setResultado({ valido: false, estado: 'error', mensaje: `❌ ${msg}`, color: 'rojo' });
    } finally {
      setCargando(false);
    }
  };

  const reiniciar = () => {
    setResultado(null);
    setError(null);
  };

  const colorClases = {
    verde   : 'bg-green-900/40 border-green-500 text-green-300',
    amarillo: 'bg-yellow-900/40 border-yellow-500 text-yellow-300',
    rojo    : 'bg-red-900/40 border-red-500 text-red-300',
    error   : 'bg-red-900/40 border-red-500 text-red-300',
  };

  const iconoColor = {
    verde   : '✅',
    amarillo: '⚠️',
    rojo    : '❌',
    error   : '❌',
  };

  return (
    <div className="p-6 max-w-lg mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Scanner QR</h1>
        <p className="text-gray-400 text-sm mt-1">
          Escanea el QR del asistente para verificar su entrada
        </p>
      </div>

      {/* Resultado */}
      {resultado && (
        <div className={`rounded-xl border p-5 space-y-3 ${colorClases[resultado.color] || colorClases.rojo}`}>
          <p className="text-2xl font-bold text-center">
            {iconoColor[resultado.color]} {resultado.mensaje}
          </p>

          {resultado.asistente && (
            <div className="bg-black/20 rounded-lg p-3 space-y-1 text-sm">
              <p><span className="opacity-60">Nombre:</span> <strong>{resultado.asistente.nombre}</strong></p>
              <p><span className="opacity-60">Email:</span> {resultado.asistente.email}</p>
              {resultado.asistente.tipo_entrada && (
                <p><span className="opacity-60">Entrada:</span> {resultado.asistente.tipo_entrada}</p>
              )}
              {resultado.fecha_checkin && (
                <p><span className="opacity-60">Check-in:</span> {new Date(resultado.fecha_checkin).toLocaleTimeString('es-CO')}</p>
              )}
            </div>
          )}

          <button
            onClick={reiniciar}
            className="w-full bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg text-sm font-medium transition"
          >
            Escanear otro QR
          </button>
        </div>
      )}

      {/* Scanner */}
      {!resultado && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">

          {/* Área de la cámara */}
          <div className="relative">
            <div id="qr-reader" ref={scannerRef} className="w-full" />
            {!escaneando && (
              <div className="flex items-center justify-center h-48 bg-gray-900/50">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
                    </svg>
                  </div>
                  <p className="text-gray-400 text-sm">Cámara apagada</p>
                </div>
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="p-4 space-y-2">
            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}

            {cargando ? (
              <div className="flex justify-center py-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-400" />
              </div>
            ) : !escaneando ? (
              <button
                onClick={iniciarScanner}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Activar cámara y escanear
              </button>
            ) : (
              <button
                onClick={detenerScanner}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold transition"
              >
                Detener cámara
              </button>
            )}

            <p className="text-center text-gray-500 text-xs">
              Apunta la cámara al QR del asistente
            </p>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="grid grid-cols-3 gap-3 text-center text-xs">
        <div className="bg-green-900/20 border border-green-800 rounded-lg p-3">
          <p className="text-green-400 font-bold text-lg">✅</p>
          <p className="text-green-300">Válido</p>
        </div>
        <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-3">
          <p className="text-yellow-400 font-bold text-lg">⚠️</p>
          <p className="text-yellow-300">Ya usado</p>
        </div>
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-3">
          <p className="text-red-400 font-bold text-lg">❌</p>
          <p className="text-red-300">Inválido</p>
        </div>
      </div>

    </div>
  );
}
