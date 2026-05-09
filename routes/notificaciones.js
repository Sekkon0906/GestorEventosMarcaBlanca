const router = require('express').Router();
const webpush = require('web-push');

// Claves VAPID generadas para este proyecto
const VAPID_PUBLIC = 'BPATak7DbzcrvYhwQzgGYlmOHSybwQ5n-Z1TdzE0PLxzaRHcRbcUnMPNVpbij7jJJCsft85rJAjDUrqDaMrjPCU';
const VAPID_PRIVATE = '5-ZNjyXSN1nL4Hhj7tx7dJ6WsXbSR2Rz3U1B_dJADKo';

webpush.setVapidDetails(
  'mailto:cristhian@test.com',
  VAPID_PUBLIC,
  VAPID_PRIVATE
);

// Guardamos las suscripciones en memoria
let suscripciones = [];

// GET /notificaciones/vapid-key — el frontend necesita esta clave
router.get('/vapid-key', (req, res) => {
  res.json({ publicKey: VAPID_PUBLIC });
});

// POST /notificaciones/subscribe — el navegador se suscribe
router.post('/subscribe', (req, res) => {
  const suscripcion = req.body;

  if (!suscripcion || !suscripcion.endpoint) {
    return res.status(400).json({ error: 'Suscripcion invalida' });
  }

  // Evitar duplicados
  const existe = suscripciones.find(s => s.endpoint === suscripcion.endpoint);
  if (!existe) {
    suscripciones.push(suscripcion);
  }

  res.status(201).json({ mensaje: 'Suscripcion registrada exitosamente' });
});

// POST /notificaciones/enviar — enviar notificacion a todos
router.post('/enviar', (req, res) => {
  const { titulo, mensaje } = req.body;

  if (!titulo || !mensaje) {
    return res.status(400).json({ error: 'Titulo y mensaje son obligatorios' });
  }

  const payload = JSON.stringify({
    title: titulo,
    body: mensaje,
    icon: '/icon.png'
  });

  const promesas = suscripciones.map(sub =>
    webpush.sendNotification(sub, payload).catch(err => {
      console.error('Error enviando notificacion:', err.message);
    })
  );

  Promise.all(promesas).then(() => {
    res.json({
      mensaje: `Notificacion enviada a ${suscripciones.length} suscriptores`,
      titulo,
      contenido: mensaje
    });
  });
});

// Funcion para usar desde otros archivos (cuando se registra un asistente)
router.enviarNotificacion = (titulo, mensaje) => {
  const payload = JSON.stringify({ title: titulo, body: mensaje });
  suscripciones.forEach(sub => {
    webpush.sendNotification(sub, payload).catch(() => {});
  });
};

module.exports = router;
