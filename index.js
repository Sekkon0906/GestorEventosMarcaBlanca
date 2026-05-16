require('./instrument.js');
require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const Sentry  = require('@sentry/node');

const app = express();

const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000']
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origen no permitido — ${origin}`));
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

/* DEBUG: log de cada request entrante */
app.use((req, _res, next) => {
  console.log(`[REQ] ${req.method} ${req.originalUrl}`);
  next();
});

/* Rutas */
app.use('/me',               require('./routes/me.js'));
app.use('/categorias',       require('./routes/categorias.js'));
app.use('/eventos/publicos', require('./routes/eventos.publicos.js'));
/* Pagos (MP): define sus propios paths absolutos — /me/mercadopago, /eventos/publicos/.../comprar, /webhooks/mercadopago */
app.use('/',                 require('./routes/pagos.js'));
/* Push: define rutas absolutas /push/vapid-key, /me/push/*, /eventos/:id/push/broadcast */
app.use('/',                 require('./routes/push.js'));
/* Estos dos se montan en /eventos y definen sus paths con :eventoId internamente
   (evita issues con path-to-regexp v6 al usar param en mount path).
   Van ANTES del router general de /eventos para que sus rutas más específicas matcheen primero. */
app.use('/eventos',          require('./routes/equipo.js'));
app.use('/eventos',          require('./routes/roles.js'));
app.use('/eventos',          require('./routes/tickets.js'));
app.use('/eventos',          require('./routes/clientes.js'));
app.use('/eventos',          require('./routes/chat.js'));
app.use('/eventos',          require('./routes/agenda.js'));
app.use('/eventos',          require('./routes/tareas.js'));
app.use('/eventos',          require('./routes/analytics.js'));
app.use('/eventos',          require('./routes/eventos.js'));

app.get('/', (_req, res) => {
  res.json({
    producto: 'GESTEK Event OS',
    version : '0.2.0-fase-a',
    estado  : 'operativo',
    endpoints: {
      privados: [
        'GET    /me',
        'PATCH  /me',
        'GET    /eventos',
        'GET    /eventos/:id',
        'POST   /eventos',
        'PATCH  /eventos/:id',
        'DELETE /eventos/:id',
        'POST   /eventos/:id/estado',
      ],
      publicos: [
        'GET /categorias',
        'GET /eventos/publicos',
        'GET /eventos/publicos/slug/:slug',
      ],
    },
  });
});

app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

if (process.env.NODE_ENV !== 'production') {
  app.get('/debug-sentry', () => { throw new Error('Prueba Sentry'); });
}

Sentry.setupExpressErrorHandler(app);

app.use((req, res) => {
  console.log(`[404] ${req.method} ${req.originalUrl} — NINGUNA RUTA MATCHEA`);
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.path}` });
});

/* Introspección real de las rutas registradas en Express */
function listarRutas() {
  const rutas = [];
  function walk(stack, prefix = '') {
    stack.forEach(layer => {
      if (layer.route) {
        const methods = Object.keys(layer.route.methods).map(m => m.toUpperCase()).join('|');
        rutas.push(`${methods.padEnd(7)} ${prefix}${layer.route.path}`);
      } else if (layer.name === 'router' && layer.handle?.stack) {
        const src = layer.regexp?.source || '';
        const match = src.match(/^\^\\\/([^\\]+(?:\\\/[^\\]+)*)/);
        const mountPrefix = match ? '/' + match[1].replace(/\\\//g, '/') : '';
        walk(layer.handle.stack, prefix + mountPrefix);
      }
    });
  }
  walk(app._router?.stack || app.router?.stack || []);
  return rutas;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n┌──────────────────────────────────────────────────────────┐`);
  console.log(`│  GESTEK API  v0.10.0-mp                                  │`);
  console.log(`│  http://localhost:${PORT}                                    │`);
  console.log(`├──────────────────────────────────────────────────────────┤`);
  console.log(`│  Rutas montadas:                                         │`);
  console.log(`│    GET    /  /health  /categorias                        │`);
  console.log(`│    GET    /me  ·  PATCH /me                              │`);
  console.log(`│    GET    /eventos/publicos                              │`);
  console.log(`│    GET    /eventos/publicos/slug/:slug                   │`);
  console.log(`│    CRUD   /eventos  ·  /eventos/:id  ·  /:id/estado      │`);
  console.log(`│    CRUD   /eventos/:id/equipo  (invitar, listar, etc)    │`);
  console.log(`│    CRUD   /eventos/:id/roles   (definir roles)           │`);
  console.log(`│    CRUD   /eventos/:id/tickets (tipos de boleta)         │`);
  console.log(`│    GET    /eventos/:id/clientes (tickets emitidos)       │`);
  console.log(`│    POST   /eventos/publicos/slug/:slug/reservar          │`);
  console.log(`│    CHAT   /eventos/:id/chat/channels(/messages)          │`);
  console.log(`└──────────────────────────────────────────────────────────┘\n`);

  console.log('[DEBUG] Rutas REALES registradas en Express:');
  const rutas = listarRutas();
  rutas.forEach(r => console.log('  ' + r));
  console.log(`  Total: ${rutas.length}\n`);
});
