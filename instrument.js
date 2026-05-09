// Importa Sentry
const Sentry = require("@sentry/node");

Sentry.init({
  dsn: "https://02d62ff34ae19d00244130baf70c0d85@o4511361090060288.ingest.us.sentry.io/4511361101856768",
  // Esta opción envía datos básicos de IP para identificar de dónde vienen los errores
  sendDefaultPii: true,
  // Ajusta el porcentaje de trazas (1.0 significa capturar todo para desarrollo)
  tracesSampleRate: 1.0,
});