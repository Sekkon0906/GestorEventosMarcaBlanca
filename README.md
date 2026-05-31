# GESTEK Event OS

> **La primera plataforma de gestión de eventos con IA integrada que los automatiza.**
> SaaS white-label end-to-end: creación, ventas, asistencia, pagos, equipo y un asistente IA propio (Gestbot) que ejecuta acciones reales sobre tu evento.

[![status](https://img.shields.io/badge/status-en%20producción-success)]() [![stack](https://img.shields.io/badge/stack-React%20·%20Node%20·%20Supabase-blue)]() [![ai](https://img.shields.io/badge/AI-Groq%20·%20Gemini%20·%20Claude-purple)]() [![pagos](https://img.shields.io/badge/Pagos-MercadoPago-00b1ea)]()

---

## ✨ Características

### Para organizadores
- **Gestbot — asistente IA propio**: criatura/robot conversacional con **60+ acciones reales** (crear/publicar/editar eventos, armar boletas, check-in, recordatorios, equipo, fidelidad…). Acepta lenguaje natural, pide datos con **formularios estructurados** y **analiza PDFs e imágenes**. Motor intercambiable con failover: **Groq** y **Gemini** (capa gratuita) o **Anthropic Claude**.
- **Eventos completos**: títulos, fechas, modalidad, lugar/URL virtual, portada y galería, página pública con **editor visual de bloques** y **8 plantillas profesionales**.
- **Tickets / boletas**: tipos con precio, cupo, ventas, early-bird, zonas. Códigos + QR firmado (JWT) por boleta.
- **Asistentes**: importación CSV, exportación CSV, búsqueda, anulación, cortesías.
- **Check-in** con escáner QR y código manual; otorga puntos de fidelidad.
- **Pagos MercadoPago**: cobro de boletas directo al organizador + plan Pro al de GESTEK. Webhook con HMAC, idempotencia y modo manual (llave/QR).
- **Equipo y roles** por evento con permisos granulares; chat por canales; tareas tipo Kanban con notificaciones.
- **Sugerencias y solicitudes** del equipo hacia el organizador (módulo bidireccional).
- **Agenda** con vistas Lista / **Día (timeline por horas)** / Semana / Mes; speakers y patrocinadores.
- **Fidelidad**: puntos por asistencia/tareas, recompensas canjeables, ranking del equipo y de clientes.
- **Analítica**: visitas, conversión, ingresos por tipo, fuentes de tráfico, serie diaria.
- **White-label** (todos los planes): logo, colores, fondo, tipografía, radio de bordes, tagline, redes y footer — aplicado en panel y páginas públicas. Sin marca GESTEK en Pro.
- **API REST + Webhooks** firmados con HMAC, auditoría de acciones del equipo, lista de espera, código de descuento, recordatorios email (T-7d / T-1d / T-1h) y push (VAPID).

### Para los miembros del equipo
- **Vista de empleado "Mi trabajo"**: tus eventos, tus tareas pendientes, envío de sugerencias y mensajes al organizador.
- Permisos por rol aplicados **end-to-end** (no solo en la UI: también en los endpoints de escritura).

### Para los asistentes
- Página pública del evento con bloques editables, branding del organizador, multilingüe (base).
- Boleta con QR + código corto; portal `mi-ticket/<código>` para revalidar.
- Lista de espera y notificación push cuando hay cupo.

### Modelo comercial
- **Free** — eventos y asistentes ilimitados, QR, agenda, equipo, fidelidad, página pública.
- **Pro** — Gestbot, API + Webhooks, auditoría, white-label sin marca, soporte. **US$ 19.99/mes** con **14 días de prueba gratis** (sin tarjeta).

---

## 🧱 Stack

| Capa | Tecnologías |
|---|---|
| Frontend | **Vite + React 18**, **TailwindCSS**, React Router v6, **html5-qrcode**, **qrcode.react**, **dnd-kit** (editor visual), `lazy()` + code splitting |
| Backend | **Node.js (Express 5)**, autenticación vía **Supabase JWT**, helmet + CORS + rate-limit + sanitización |
| Base de datos | **PostgreSQL (Supabase)** con migraciones SQL versionadas, RLS donde aplica, **pg_cron + pg_net** para recordatorios |
| Storage | **Supabase Storage** (avatars, event-media) con políticas y hardening |
| Realtime | **Supabase Realtime** (postgres_changes) para notificaciones in-app y chat |
| IA | **Anthropic SDK** + adaptadores REST a **Groq** y **Gemini** (failover + esquema de tools "delgado" para no reventar rate limits gratuitos) |
| Pagos | **Mercado Pago Checkout Pro** (boletas y plan Pro), webhook HMAC, idempotencia |
| Email | **Gmail SMTP** o **Resend** (provider-agnóstico) |
| Push | **Web Push** + **VAPID** + Service Worker |
| Anti-bot | **Cloudflare Turnstile** (graceful sin keys) |
| Edge | **Supabase Edge Function** `send-reminders` con `pg_cron` cada hora |

---

## 🏗️ Arquitectura (alto nivel)

```
┌────────────────────────┐        ┌────────────────────────────────────────┐
│ Frontend (Vite/React)  │  HTTPS │ Backend Express (Node 18+)             │
│ Panel admin + público  │ ─────► │ Auth: verifySupabaseJWT (per route)    │
│ Code splitting + PWA   │        │ Routers públicos + autenticados        │
└──────────┬─────────────┘        │ Lib/ : agente, qr, email, push, etc.   │
           │ Auth Supabase         └──────────┬─────────────────────────────┘
           ▼                                  │ service_role
┌────────────────────────┐        ┌──────────▼─────────────────┐
│ Supabase Auth          │        │ Supabase Postgres (RLS)    │
│ (Google + email)       │        │ + Storage + Realtime       │
└────────────────────────┘        └─────────┬──────────────────┘
                                            │ pg_cron + pg_net
                                            ▼
                                  ┌────────────────────────────┐
                                  │ Edge Function send-reminders│
                                  │ (Resend email)              │
                                  └────────────────────────────┘

       Proveedores externos:
       MercadoPago (preferences + webhooks HMAC)
       Groq / Gemini / Anthropic (Gestbot, failover)
       Resend / Gmail SMTP (email)
       VAPID Web Push (notificaciones del navegador)
       Cloudflare Turnstile (captcha en formularios públicos)
```

**Decisiones clave**
- **Multi-proveedor de IA** con failover automático → Gestbot funciona gratis (Groq/Gemini) y sigue operativo si uno se rate-limita.
- **Esquema de herramientas "delgado"** enviado a los modelos (sin descripciones por-parámetro) → cabe en las capas gratuitas con 60+ tools.
- **Auth por ruta** (no `router.use` global) en routers públicos → evita interceptar accidentalmente lo público.
- **Permisos consistentes**: `lib/acceso.js` centraliza `assertPermiso(eventoId, userId, perms[])` y todos los endpoints de escritura lo usan.
- **Webhook MP idempotente** por `payment_id`, con fallback de tokens (plataforma → organizador → todos).
- **Branding scoped**: variables CSS inyectadas por `BrandingProvider` (público) y por `useBranding`/`AppLayout` (panel).

---

## 🚀 Empezar

### Requisitos
- Node.js **18+** (probado con 22)
- Cuenta de Supabase con proyecto creado
- (Opcional) Cuenta de Mercado Pago, claves VAPID, Groq/Gemini API keys

### Instalación
```bash
git clone https://github.com/Sekkon0906/GestorEventosMarcaBlanca.git
cd GestorEventosMarcaBlanca
npm run install:all
```

### Configuración
1. Copia `.env.example` a `.env` y completa las variables que vayas a usar.
2. En Supabase, aplica las migraciones del directorio `db/migrations/` (o el combinado `db/migrations/_all_pendientes.sql` para 0020→0028).

Variables mínimas (resto en `.env.example`):
```env
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
QR_JWT_SECRET=cambia-esto
FRONTEND_URL=http://localhost:5173
```

Variables opcionales clave:
```env
GROQ_API_KEY=gsk_...                # Gestbot gratis (recomendado)
GEMINI_API_KEY=AIza...               # Gestbot gratis (respaldo)
ANTHROPIC_API_KEY=                   # opcional, mejor precisión
MP_PLATFORM_ACCESS_TOKEN=APP_USR-... # cobrar plan Pro a clientes
MP_WEBHOOK_SECRET=...                # verificación HMAC
VAPID_PUBLIC_KEY= / VAPID_PRIVATE_KEY=
GMAIL_USER= / GMAIL_APP_PASSWORD=    # o RESEND_API_KEY=
ALLOW_DEV_PRO_ACTIVATION=true        # solo para dev
```

### Correr en dev
```bash
npm run dev:full     # backend (3000) + frontend (5173) juntos
```
o por separado:
```bash
npm run dev          # solo backend
npm run dev:frontend # solo frontend
```

### Tests
```bash
npm test             # node:test, sin dependencias
```

### Producción (resumen)
- Backend: cualquier host Node con HTTPS público (Render, Railway, Fly, EC2…).
- Frontend: build estático (`cd frontend && npm run build`) servible desde CDN.
- Recordatorios: ver `docs/RECORDATORIOS.md` + `scripts/deploy-reminders.ps1`.
- Mercado Pago: ver `docs/MERCADOPAGO.md` (runbook completo).

---

## 📁 Estructura del repo

```
.
├── index.js                 # Punto de entrada Express
├── routes/                  # Routers por dominio (eventos, tickets, pagos, agente…)
├── lib/                     # Helpers (acceso, qr, email, agente IA, webhooks…)
├── middleware/              # Auth Supabase
├── config/                  # Seguridad (helmet, CORS, rate limit), env
├── db/migrations/           # SQL versionado (0000…0028) + combinado
├── supabase/functions/      # Edge Functions (send-reminders)
├── docs/                    # Runbooks (MercadoPago, Recordatorios, Seguridad)
├── scripts/                 # Despliegues / utilidades
├── test/                    # Tests con node:test
└── frontend/
    ├── src/
    │   ├── pages/           # Páginas (públicas, panel, agente, equipo…)
    │   ├── components/      # UI compartida (Confirm, ui/, agente/, layout/)
    │   ├── context/         # Auth, Toast
    │   ├── hooks/           # usePlan, useBranding, usePush
    │   ├── api/             # Clientes REST por dominio
    │   └── lib/             # i18n, supabase client
    └── public/              # Service worker, manifest, iconos
```

---

## 📚 Documentación adicional

- `docs/MERCADOPAGO.md` — Runbook completo de producción (2 flujos, env vars, webhook, troubleshooting).
- `docs/RECORDATORIOS.md` — Edge Function de recordatorios + cron horario.
- `docs/SEGURIDAD.md` — Endurecimiento (CSP, rate-limit, captcha, JWT rotation).
- `docs/GESTEK-Documentacion.pdf` — Documento técnico extendido.

---

## 🤝 Contribuir

Este es un proyecto desarrollado por el equipo. Para sugerencias, abre un Issue o un PR contra `main`.

---

## 📄 Licencia

Privado / propietario. Todos los derechos reservados.
