# GESTEK EVENTOS — Bitácora Técnica

> Archivo de memoria técnica persistente del proyecto.
> Se actualiza tras cada sesión de trabajo significativa.
> Propósito: evitar releer todo el contexto en cada interacción y reducir consumo de tokens.

---

## Estado actual

**Fecha:** 2026-05-12
**Versión:** 2.1.0 (backend hardened)
**Entorno:** Desarrollo local — Node.js + Express 5 + Supabase + React 18 + Vite

**Estado general:** MVP funcional. Backend con hardening de seguridad aplicado.
Frontend en reestructuración (App.jsx reorganizado por el equipo, páginas públicas pendientes).
Listo para demo interna. **No apto para producción pública aún** (ver TODO).

---

## Módulos implementados

### Backend (`/`)
| Módulo | Archivo(s) | Estado |
|---|---|---|
| Entry point con seguridad | `index.js` | ✅ Hardened |
| Config centralizado | `config/env.js` | ✅ Nuevo |
| Stack de seguridad | `config/security.js` | ✅ Nuevo |
| Auth JWT (login/register/me/patch) | `routes/auth.js` | ✅ Parcheado |
| Middleware JWT obligatorio/opcional | `middleware/auth.js` | ✅ Parcheado |
| RBAC + permisos granulares | `middleware/roles.js` | ✅ Existente |
| Eventos — CRUD + filtros | `routes/eventos*.js` | ✅ Completo |
| Usuarios + gestión de roles | `routes/usuarios.js` | ✅ Completo |
| Notificaciones (memoria) | `services/notification.service.js` | ⚠️ No persistido |
| Sentry (error tracking) | `instrument.js` | ✅ Parcheado |
| Tests parciales | `tests/` | ⚠️ Solo auth/notif/roles |
| Docker | `Dockerfile`, `docker-compose.yml` | ✅ Existente |

### Frontend (`/frontend/src/`)
| Módulo | Estado |
|---|---|
| Design system (tokens.css + global.css) | ✅ Completo |
| AuthContext + ToastContext | ✅ Completo |
| API client (Axios + interceptores) | ✅ Completo |
| AuthPage (login/register panel swap) | ✅ Completo |
| DashboardPage | ✅ Completo |
| EventsListPage, EventCreatePage (wizard), EventDetailPage | ✅ Completo |
| UsersPage, SettingsPage | ✅ Completo |
| PublicLayout, AppLayout, Navbar, Sidebar | ✅ Completo |
| Componentes UI base (Badge, Card, Button, Table, etc.) | ✅ Completo |
| **Páginas públicas** (LandingHomePage, ExplorarPage, etc.) | ❌ NO EXISTEN — app no arranca |

---

## Cambios realizados — 2026-05-12

### Sesión: Security Hardening (backend)

#### 1. Instalación de dependencias de seguridad
```bash
npm install helmet express-rate-limit
```

#### 2. `config/env.js` — CREADO
- Fuente única de verdad para todas las variables de entorno.
- Valida `JWT_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` al arranque.
- En producción (`NODE_ENV=production`): `process.exit(1)` si falta alguna.
- En desarrollo: warning visible pero no abortante (facilita onboarding).
- Exporta todas las vars como constantes tipadas (PORT como int, etc.).

#### 3. `config/security.js` — CREADO
- Centraliza todo el stack de seguridad HTTP.
- **Helmet**: headers de seguridad (CSP, X-Frame-Options, X-Content-Type-Options, HSTS en prod, Referrer-Policy).
- **CORS enterprise**: whitelist por entorno. En producción bloquea peticiones sin `Origin`. Soporta lista de URLs separada por comas en `FRONTEND_URL`.
- **authLimiter**: 10 intentos / 15 min por IP en rutas de auth. `skipSuccessfulRequests: true` — solo cuenta fallos.
- **apiLimiter**: 200 req / 15 min por IP en toda la API.
- **sanitizeBody**: middleware propio que limpia strings del body (trim + strip control chars + truncate a 10k chars). Primera línea de defensa, no sustituye validación de negocio.

#### 4. `middleware/auth.js` — PARCHEADO
- **Eliminado** el fallback hardcodeado `|| 'eventos_marca_blanca_secret'`.
- El `JWT_SECRET` ahora viene exclusivamente de `config/env.js`.
- Añadido mensaje diferenciado para `TokenExpiredError` vs token inválido.

#### 5. `routes/auth.js` — PARCHEADO
- **Eliminado** el segundo `SECRET` hardcodeado (`gestek_secret_change_in_production`).
- Ahora usa `JWT_SECRET` y `JWT_EXPIRES` de `config/env.js`.
- **Registro**: ignora `rol` y `permisos` del body. Todo usuario nace con `rol: 'asistente'`.
- Añadida validación de email (regex) y contraseña mínima (8 chars) en servidor.

#### 6. `index.js` — REFACTORIZADO
- `config/env.js` se carga primero (validación de vars antes de montar nada).
- `applySecurity(app)` aplica todo el stack: helmet + CORS + apiLimiter + sanitizeBody.
- `authLimiter` aplicado solo en `/auth` (no en toda la API).
- Socket.IO usa `ALLOWED_ORIGINS` del security config (no duplicación).
- Socket.IO ahora tiene soporte de rooms por userId (`socket.join('user:${userId}')`).
- Error handler global añadido para errores CORS.

#### 7. `instrument.js` — PARCHEADO
- DSN de Sentry movido a `SENTRY_DSN` env var. Si no está configurado, Sentry se deshabilita sin crashear.
- `sendDefaultPii: false` (era `true` — violación de privacidad por defecto).
- `tracesSampleRate`: 20% en producción, 100% en desarrollo.

---

## Archivos modificados — 2026-05-12

```
config/env.js              CREADO
config/security.js         CREADO
docs/feedback.md           CREADO
middleware/auth.js         MODIFICADO
routes/auth.js             MODIFICADO
index.js                   MODIFICADO
instrument.js              MODIFICADO
package.json               MODIFICADO (deps: helmet, express-rate-limit)
```

---

## Riesgos detectados

### Críticos (corregidos hoy)
| # | Vulnerabilidad | Ubicación | Estado |
|---|---|---|---|
| 1 | JWT_SECRET con fallback hardcodeado | `middleware/auth.js:2` | ✅ CORREGIDO |
| 2 | Segundo SECRET con fallback diferente | `routes/auth.js:9` | ✅ CORREGIDO |
| 3 | Registro acepta `rol` y `permisos` del body | `routes/auth.js:14` | ✅ CORREGIDO |
| 4 | Sin helmet (sin headers de seguridad) | `index.js` | ✅ CORREGIDO |
| 5 | Sin rate limiting en auth | `index.js` | ✅ CORREGIDO |
| 6 | Sentry DSN hardcodeado en código | `instrument.js` | ✅ CORREGIDO |
| 7 | `sendDefaultPii: true` por defecto | `instrument.js` | ✅ CORREGIDO |

### Altos (pendientes)
| # | Vulnerabilidad | Ubicación | Impacto |
|---|---|---|---|
| 8 | Token JWT en localStorage (XSS) | `frontend/context/AuthContext.jsx` | Session hijacking |
| 9 | Socket.IO broadcast global (todas las notif a todos los clientes) | `services/notification.service.js` | Leak de datos entre usuarios |
| 10 | Sin HTTPS enforcement en producción | Infraestructura | MITM |

### Medios (pendientes)
| # | Vulnerabilidad | Ubicación | Impacto |
|---|---|---|---|
| 11 | Sin refresh tokens (JWT fijo 8h sin revocación) | `routes/auth.js:103` | Token robado válido 8h |
| 12 | Sin Row Level Security en Supabase | Base de datos | Fuga cross-org si hay bug en WHERE |
| 13 | Sin índices en BD (nombre, fecha, estado, ciudad) | Supabase | Full table scan con >50k eventos |
| 14 | GET /eventos/:id/asistentes sin paginación | `routes/eventos_patch_delete.js` | Payload >8MB con 10k asistentes |

---

## Decisiones técnicas

| Decisión | Justificación | Fecha |
|---|---|---|
| `process.exit(1)` solo en producción si falta JWT_SECRET | Permite desarrollo sin .env completo, pero blinda producción. Tradeoff velocidad dev vs seguridad prod. | 2026-05-12 |
| `rol: 'asistente'` siempre en registro, ignorar body | Principio de menor privilegio. Admin asigna roles explícitamente después. | 2026-05-12 |
| Rate limiter solo en `/auth`, no en toda la API | `/auth` es el endpoint de mayor riesgo (brute force). API general tiene límite más alto (200/15min). | 2026-05-12 |
| Sanitización propia (sin express-validator) | Evitar dependencia extra para limpieza básica. express-validator queda para cuando se implemente validación de esquema completa. | 2026-05-12 |
| CORS bloquea peticiones sin Origin en producción | Curl/Postman sin Origin → error en prod. En dev se permiten para facilitar testing. | 2026-05-12 |
| Sentry deshabilitado si no hay SENTRY_DSN | No crashear si no está configurado. Mejor: funciona o no funciona, nunca a medias. | 2026-05-12 |
| localStorage para JWT (frontend) | Decisión del equipo. Aceptable para prototipo. Para producción: migrar a HttpOnly cookie. Requiere cambio en backend + frontend. | 2026-05-12 |

---

## Arquitectura actual

```
index.js
  ├── instrument.js          (Sentry — debe ser primero)
  ├── config/env.js          (validación de vars — debe ser segundo)
  ├── config/security.js     (helmet + CORS + rate limit + sanitize)
  │     └── applySecurity(app)
  ├── routes/auth.js         (authLimiter aplicado aquí)
  ├── routes/eventos*.js
  ├── routes/usuarios.js
  ├── routes/notification.routes.js
  ├── routes/analytics.js
  └── routes/notificaciones.js

middleware/
  ├── auth.js                (JWT verify — usa config/env.js)
  └── roles.js               (RBAC + permisos granulares)

services/
  └── notification.service.js (singleton en memoria — pendiente migrar a Supabase)

db/
  └── supabase.js
```

**Problema arquitectónico principal**: Todo el negocio sigue en rutas (validators + logic + DB query). Falta capa de servicios.

---

## Próximos pasos

### Prioridad INMEDIATA (antes del próximo demo)
1. **Crear páginas públicas faltantes** — App.jsx importa 7 páginas que no existen. El frontend no arranca.
   - `src/pages/public/LandingHomePage.jsx`
   - `src/pages/public/ComoFuncionaPage.jsx`
   - `src/pages/public/ProductoPage.jsx`
   - `src/pages/public/ExplorarPage.jsx`
   - `src/pages/public/EventoPublicoPage.jsx`
   - `src/pages/public/PlanesPage.jsx`
   - `src/pages/public/FAQPage.jsx`
   - `src/components/layout/PublicNavbar.jsx` (si falta)
   - `src/components/layout/Footer.jsx` (si falta)
2. **Unificar API layer frontend** — existe `src/api/` (Axios) Y `src/services/api.js` (fetch). Elegir uno y borrar el otro.

### Prioridad ALTA (sprint 2)
3. Notificaciones persistidas en Supabase (no memoria)
4. Socket.IO scoped por userId (`io.to('user:${userId}').emit()`)
5. Paginación en GET /eventos/:id/asistentes
6. Índices de BD en Supabase (nombre, fecha_inicio, estado, ciudad)
7. Schema de BD documentado (`docs/schema.md`) con diagrama ER

### Prioridad MEDIA (sprint 3)
8. Refresh tokens (access 15min + refresh 30d HttpOnly cookie)
9. Row Level Security en Supabase
10. Code splitting con React.lazy en App.jsx
11. Tests para rutas de eventos (crear, publicar, inscribir)

### Prioridad BAJA (post-MVP)
12. Capa de servicios (extraer lógica de rutas a `services/`)
13. API versioning `/v1/`
14. Logging estructurado con Pino
15. Message queue con BullMQ para emails y push
16. OpenAPI/Swagger

---

## TODO

- [ ] Crear páginas públicas faltantes (frontend no arranca sin ellas)
- [ ] Unificar `src/api/` vs `src/services/api.js`
- [ ] Configurar `JWT_SECRET` en `.env` de todos los desarrolladores
- [ ] Configurar `SENTRY_DSN` en `.env` (mover del código)
- [ ] Añadir `FRONTEND_URL` en `.env` de producción
- [ ] Migrar notificaciones de memoria a Supabase
- [ ] Scopear Socket.IO por userId
- [ ] Documentar schema de BD en `docs/schema.md`
- [ ] Paginación en endpoint de asistentes
- [ ] Índices en Supabase
- [ ] Tests para endpoints de eventos
- [ ] Refresh token rotation
- [ ] RLS en Supabase

---

## Deuda técnica

| Área | Descripción | Severidad | Esfuerzo |
|---|---|---|---|
| Arquitectura | No hay capa de servicios — lógica en rutas | Alta | 1 semana |
| BD | Sin migraciones versionadas | Alta | 2 días |
| BD | Sin índices | Alta | 4 horas |
| Auth | Sin refresh tokens | Media | 2 días |
| Auth | JWT en localStorage (XSS) | Media | 2 días |
| Notificaciones | En memoria, se pierden en restart | Media | 1 día |
| Frontend | Dos sistemas de API paralelos | Media | 2 horas |
| Frontend | Sin code splitting | Baja | 3 horas |
| Testing | Cobertura <30% — faltan eventos y usuarios | Alta | 3 días |
| Logging | Solo console.error — sin trace IDs | Media | 1 día |
| Multi-tenancy | Sin RLS — aislamiento solo a nivel app | Alta | 2 días |

---

## Variables de entorno requeridas

```env
# OBLIGATORIAS — servidor no arranca en producción sin estas
JWT_SECRET=<cadena_aleatoria_segura_min_32_chars>
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

*Última actualización: 2026-05-12 | Autor: Claude Code + Misael Gallo*
