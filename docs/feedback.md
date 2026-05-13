# GESTEK EVENTOS — Bitácora Técnica

> Memoria técnica persistente del proyecto. Se actualiza tras cada sesión significativa.
> Propósito: contexto rápido sin releer todo el código. Reduce tokens en cada interacción.

---

## Estado actual

**Fecha última actualización:** 2026-05-12
**Versión backend:** 2.2.0 (service layer parcial)
**Versión frontend:** 2.0.0 (build limpio)
**Tests:** 73/73 passing ✅
**Build frontend:** 0 errores, 0 warnings ✅
**Entorno:** Desarrollo local

**Estado general:** Sistema funcional y estable. Backend con hardening de seguridad y capa de servicio para auth. Frontend completamente implementado por el equipo con Tailwind CSS. Listo para demo.

---

## Arquitectura actual

```
GestorEventosMarcaBlanca/
├── index.js                      ← Entry point — carga env → security → rutas
├── instrument.js                 ← Sentry (debe ser primer require)
│
├── config/
│   ├── env.js                    ← Fuente única de env vars. Exit(1) en prod si faltan
│   └── security.js               ← Helmet + CORS enterprise + rate limiters + sanitize
│
├── middleware/
│   ├── auth.js                   ← JWT verify (usa config/env — sin fallback)
│   └── roles.js                  ← RBAC + permisos granulares
│
├── validators/                   ← NUEVO — validaciones puras sin efectos secundarios
│   ├── auth.validator.js         ← validateRegister / validateLogin / validateUpdateMe
│   └── evento.validator.js       ← validateCrear / validatePublicar / validateActualizar
│
├── services/                     ← NUEVO (parcial) — lógica de negocio desacoplada de HTTP
│   ├── auth.service.js           ← register / login / getProfile / updateProfile
│   └── notification.service.js  ← Singleton en memoria (PENDIENTE migrar a Supabase)
│
├── routes/                       ← Delgadas: parseo → validator → service → respuesta
│   ├── auth.js                   ← Refactorizado: usa auth.service + auth.validator
│   ├── eventos.js                ← Sin refactorizar aún (siguiente fase)
│   ├── eventos_get_lista.js      ← Sin refactorizar
│   ├── eventos_get_detalle.js    ← Sin refactorizar
│   ├── eventos_post.js           ← Sin refactorizar (450 líneas — prioridad alta)
│   ├── eventos_patch_delete.js   ← Sin refactorizar
│   ├── usuarios.js               ← Sin refactorizar
│   ├── notification.routes.js    ← Sin refactorizar
│   └── analytics.js              ← Sin refactorizar
│
├── db/
│   └── supabase.js               ← Cliente Supabase
│
├── tests/
│   ├── setup.js                  ← NUEVO — inyecta env vars antes de todos los tests
│   ├── auth.routes.test.js       ← Actualizado — refleja nuevo comportamiento seguro
│   ├── responsividad.test.js     ← Actualizado — passwords ≥ 8 chars
│   ├── notification.service.test.js
│   └── roles.middleware.test.js
│
└── frontend/src/
    ├── App.jsx                   ← Router principal (modificado por el equipo)
    ├── main.jsx                  ← Entry — importa index.css (Tailwind)
    ├── index.css                 ← Tailwind + utilidades custom + animaciones
    │
    ├── api/                      ← CAPA API UNIFICADA (Axios)
    │   ├── client.js             ← Axios instance + interceptores JWT + 401 handler
    │   ├── auth.js               ← authApi: register/login/me/updateMe
    │   ├── eventos.js            ← eventosApi: CRUD + publicar/cancelar/inscribirse
    │   ├── usuarios.js           ← usuariosApi: list/get/rol/permisos/delete
    │   └── analytics.js         ← analyticsApi: overview
    │
    ├── context/
    │   ├── AuthContext.jsx       ← Estado auth + login/logout/register + permisos
    │   └── ToastContext.jsx      ← Sistema de notificaciones (toast)
    │
    ├── components/layout/
    │   ├── PublicLayout.jsx      ← Navbar + Outlet + Footer para rutas públicas
    │   ├── AppLayout.jsx         ← Sidebar + TopBar + Outlet para app protegida
    │   ├── PublicNavbar.jsx      ← Nav responsivo con menú móvil
    │   ├── PublicFooter.jsx      ← Pie de página
    │   ├── Sidebar.jsx           ← Navegación lateral de la app
    │   └── TopBar.jsx            ← Barra superior con user menu
    │
    ├── pages/public/             ← Todas implementadas con datos mock
    │   ├── LandingHomePage.jsx   ← Hero + marquee + stats + features + pricing
    │   ├── ComoFuncionaPage.jsx
    │   ├── ProductoPage.jsx
    │   ├── ExplorarPage.jsx
    │   ├── EventoPublicoPage.jsx
    │   ├── PlanesPage.jsx
    │   └── FAQPage.jsx
    │
    └── pages/ (protegidas)
        ├── AuthPage.jsx          ← Login + Register con panel-swap animation
        ├── DashboardPage.jsx
        ├── events/               ← EventsListPage, EventCreatePage, EventDetailPage
        ├── users/UsersPage.jsx
        └── settings/SettingsPage.jsx
```

---

## Historial de cambios

### Sesión 2026-05-12 — Fases 1→4

#### FASE 1 — Security Hardening (completada)
- `config/env.js`: validación startup, exit(1) en prod si faltan JWT_SECRET / SUPABASE_*
- `config/security.js`: helmet + CORS enterprise + rate limiters + sanitizeBody
- `middleware/auth.js`: eliminado fallback hardcodeado del JWT_SECRET
- `routes/auth.js`: eliminado segundo SECRET; `rol` y `permisos` del body ignorados
- `index.js`: integrado applySecurity() + authLimiter en /auth
- `instrument.js`: DSN de Sentry a env var; sendDefaultPii: false

#### FASE 2 — Frontend Stabilization (completada — sin trabajo necesario)
- El equipo ya implementó todas las páginas (7 públicas + 5 protegidas)
- Todos los layouts existen (PublicLayout, AppLayout, PublicNavbar, PublicFooter)
- Build Vite: **0 errores, 0 warnings** después de corregir 1 issue
- Fix: `SettingsPage.jsx` — dynamic `import('../../api/auth.js')` → static import
  - Causa: auth.js era importado estáticamente por AuthContext y dinámicamente por Settings
  - Efecto: Vite no podía code-split el módulo (warning, no error)

#### FASE 3 — API Layer (completada — sin trabajo necesario)
- La capa `src/api/` con Axios ya estaba unificada por el equipo
- `src/services/api.js` no existe (era una confusión del análisis inicial)
- 5 módulos limpios: client.js, auth.js, eventos.js, usuarios.js, analytics.js
- No hay fetch nativo — todo es Axios con interceptores

#### FASE 4 — Service Layer Backend (parcialmente completada)
**Implementado:**
- `validators/auth.validator.js`: validateRegister / validateLogin / validateUpdateMe
- `validators/evento.validator.js`: validateCrear / validatePublicar / validateActualizar
- `services/auth.service.js`: register / login / getProfile / updateProfile
- `routes/auth.js`: refactorizado — usa auth.service + auth.validator (route delgada)
- `tests/setup.js`: env vars globales para Jest (elimina warnings en tests)
- `tests/auth.routes.test.js`: actualizado para reflejar comportamiento seguro
- `tests/responsividad.test.js`: passwords actualizados a ≥ 8 chars
- `package.json` jest config: setupFiles + coverageFrom expandido

**Pendiente (próxima sesión):**
- `services/evento.service.js`: extraer lógica de eventos_post.js (450 líneas)
- `services/usuario.service.js`: extraer lógica de usuarios.js
- Refactorizar rutas de eventos y usuarios para usar sus services

---

## Archivos modificados — sesión actual

```
Creados:
  config/env.js
  config/security.js
  validators/auth.validator.js
  validators/evento.validator.js
  services/auth.service.js
  tests/setup.js
  docs/feedback.md

Modificados:
  middleware/auth.js         (eliminado fallback JWT_SECRET)
  routes/auth.js             (refactorizado — service + validator)
  index.js                   (applySecurity + authLimiter)
  instrument.js              (DSN a env var)
  package.json               (deps: helmet/rate-limit; jest: setupFiles + coverage)
  tests/auth.routes.test.js  (comportamiento seguro + passwords ≥8)
  tests/responsividad.test.js (passwords ≥8)
  frontend/src/pages/settings/SettingsPage.jsx (dynamic→static import)
```

---

## Vulnerabilidades corregidas

| # | Vector | Estado |
|---|---|---|
| JWT_SECRET fallback hardcodeado en middleware/auth.js | ✅ Eliminado |
| Segundo JWT_SECRET diferente en routes/auth.js | ✅ Eliminado |
| Registro acepta `rol` y `permisos` del body | ✅ Ignorados. Siempre 'asistente' |
| Sin helmet (sin headers HTTP de seguridad) | ✅ Activo |
| Sin rate limiting en auth | ✅ 10 req/15min en /auth |
| Sentry DSN hardcodeado en código fuente | ✅ Env var SENTRY_DSN |
| sendDefaultPii: true (envía IPs a Sentry) | ✅ false |
| Dynamic import mezclado con static en Settings | ✅ Convertido a static |

---

## Riesgos pendientes

### Altos
| # | Descripción | Ubicación | Impacto |
|---|---|---|---|
| Token JWT en localStorage (XSS) | `frontend/context/AuthContext.jsx` | Session hijacking |
| Socket.IO broadcast global (notif a todos los clientes) | `services/notification.service.js` | Fuga entre usuarios |
| Notificaciones en memoria (se pierden en restart) | `services/notification.service.js` | Pérdida de datos |
| 401 hace redirect duro a /login (pierde estado React) | `frontend/src/api/client.js:24` | UX degradada |

### Medios
| # | Descripción | Ubicación |
|---|---|---|
| Sin refresh tokens (JWT fijo 8h sin revocación) | `services/auth.service.js` |
| Sin Row Level Security en Supabase | Base de datos |
| Sin índices en BD (nombre, fecha_inicio, estado, ciudad) | Supabase |
| GET /eventos/:id/asistentes sin paginación | `routes/eventos_patch_delete.js` |
| eventos_post.js: 450 líneas de negocio en una sola función | `routes/eventos_post.js` |

---

## Decisiones técnicas

| Decisión | Justificación | Fecha |
|---|---|---|
| Validators retornan `{status, error} \| null` | Patrón simple sin excepciones. El route lee el null para continuar o el objeto para responder. Sin overhead de try/catch en lógica de validación. | 2026-05-12 |
| Services retornan `{ok, data} \| {ok, status, error}` | El controller decide el status HTTP. El service no sabe de HTTP. | 2026-05-12 |
| `rol` del body ignorado silenciosamente en register | Más seguro que retornar 400. El usuario no sabe que el campo existe. Menor surface de attack. | 2026-05-12 |
| Tests con setup.js en lugar de .env.test | Centraliza env de test. No depende de archivo externo. Compatible con CI. | 2026-05-12 |
| Frontend usa Tailwind + index.css (no tokens.css) | Decisión del equipo. No forzar design system propio sobre Tailwind ya configurado. Respetar lo existente. | 2026-05-12 |
| `src/api/` como capa única (no src/services/api.js) | El equipo ya lo implementó correctamente. No duplicar. | 2026-05-12 |

---

## Próximos pasos recomendados

### Prioridad inmediata (próxima sesión)
1. **`services/evento.service.js`** — Extraer lógica de `routes/eventos_post.js` (450 líneas en 1 función). Mayor ROI de la refactorización.
2. **Scopear Socket.IO por userId** — `io.emit()` → `io.to('user:${userId}').emit()`. Fix de 5 líneas con impacto alto.
3. **Migrar notificaciones a Supabase** — `services/notification.service.js` guarda en memoria. Tabla `notifications` en Supabase. Incluye marcado de leída persistente.

### Prioridad alta (sprint 2)
4. Schema de BD documentado — `docs/schema.md` con ER diagram
5. Índices PostgreSQL — nombre, fecha_inicio, estado, ciudad
6. Paginación en GET /eventos/:id/asistentes
7. Soft-delete en eventos y usuarios
8. Tests para eventos y usuarios (coverage actual ~40%)

### Prioridad media (sprint 3)
9. Refresh tokens (access 15min + refresh 30d)
10. Row Level Security en Supabase
11. Code splitting con React.lazy en App.jsx
12. `services/usuario.service.js`

---

## TODO pendiente

- [ ] `services/evento.service.js` — refactorizar eventos_post.js
- [ ] Socket.IO rooms por userId (`io.to('user:${id}').emit()`)
- [ ] Migrar notificaciones de memoria a Supabase
- [ ] Documentar schema BD en `docs/schema.md`
- [ ] Índices Supabase (nombre, fecha_inicio, estado, ciudad)
- [ ] Paginación en endpoint de asistentes
- [ ] Tests para rutas de eventos (crear, publicar, inscribir)
- [ ] Configurar `JWT_SECRET` en .env de todos los devs (mínimo 32 chars)
- [ ] Configurar `SENTRY_DSN` en .env (mover del código)
- [ ] Añadir `FRONTEND_URL` en .env de producción

---

## Deuda técnica

| Área | Descripción | Severidad | Esfuerzo estimado |
|---|---|---|---|
| Backend | eventos_post.js: 450 líneas de negocio en ruta | Alta | 1 día |
| Backend | Sin capa service para eventos y usuarios | Alta | 2 días |
| BD | Sin migraciones versionadas | Alta | 2 días |
| BD | Sin índices | Alta | 4 horas |
| Auth | Sin refresh tokens | Media | 2 días |
| Auth | JWT en localStorage (XSS) | Media | 2 días |
| Notificaciones | En memoria, se pierden en restart | Media | 1 día |
| Testing | Coverage <40% — faltan eventos y usuarios | Alta | 3 días |
| Multi-tenancy | Sin RLS — solo filtros de aplicación | Alta | 2 días |
| Frontend | Sin code splitting (1 bundle ~386KB) | Baja | 3 horas |

---

## Variables de entorno

```env
# OBLIGATORIAS en producción (exit(1) si faltan)
JWT_SECRET=<cadena aleatoria mínimo 32 chars>
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=<service_role_key>

# RECOMENDADAS
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://tu-dominio.com
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
JWT_EXPIRES=8h

# OPCIONALES
ENABLE_SOCKETS=true
RATE_LIMIT_AUTH_MAX=10
RATE_LIMIT_AUTH_WINDOW=15
RATE_LIMIT_API_MAX=200
RATE_LIMIT_API_WINDOW=15
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:admin@gestek.com
```

---

## Resumen de cobertura de tests

| Suite | Tests | Estado |
|---|---|---|
| auth.routes.test.js | 17 | ✅ Todos pasan |
| responsividad.test.js | 13 | ✅ Todos pasan |
| notification.service.test.js | 16 | ✅ Todos pasan |
| roles.middleware.test.js | 27 | ✅ Todos pasan |
| **Total** | **73** | **✅ 73/73** |

Cobertura NOT cubierta: eventos CRUD, usuarios, analytics, validators.

---

*Última actualización: 2026-05-12 | Responsable: Claude Code + Misael Gallo*
