# GESTEK Event OS — Presentación del proyecto

## 1. Resumen ejecutivo

**GESTEK Event OS** es una **plataforma SaaS multi-tenant** de gestión integral de eventos, con **marca blanca** y un **agente de IA propio** ("Gestbot") que ejecuta acciones reales sobre el sistema (no es un chatbot que sugiere: opera). Cubre el ciclo completo: creación del evento, página pública, venta de boletas, asistencia con QR, pagos, equipo con roles, comunicación interna, fidelidad, analítica e integraciones por API.

Es, por diseño, **la primera plataforma de gestión de eventos con IA integrada como mecanismo operativo del producto** — no como capa de "asistente que da consejos", sino como ejecutor con permisos scopeados al organizador.

---

## 2. Problema y propuesta de valor

### Problema
- El stack típico de un organizador hoy combina 4–7 herramientas (Eventbrite + WhatsApp + Google Sheets + Mailchimp + un editor web + un escáner QR + una pasarela), con datos fragmentados, fricción en la operación y comisiones acumuladas.
- La mayoría de plataformas locales no ofrecen white-label real, ni una API pública, ni un canal estructurado equipo↔organizador.
- Las herramientas con IA en el espacio son chatbots que **sugieren**, no **actúan**.

### Propuesta de valor
| Eje | Lo que entrega GESTEK |
|---|---|
| **Concentración** | Una sola plataforma para crear, vender, asistir, cobrar, comunicar y analizar. |
| **Sin comisiones por boleta** | Las ventas pasan **directo a la cuenta del organizador** (MercadoPago); GESTEK no toca el dinero. |
| **IA que opera** | Gestbot ejecuta más de 50 acciones reales sobre el evento, con permisos del usuario. |
| **White-label real** | Logo, colores, fondo, tipografía, redes y footer propios, aplicados en panel y páginas públicas. |
| **Equipo de verdad** | Roles con permisos granulares por evento, chat por canales, sugerencias y mensajes con trazabilidad. |
| **Modelo honesto** | Free permite operar; Pro suma IA, API, auditoría y white-label sin marca. **14 días de prueba sin tarjeta** y **US$ 19.99/mes**. |

---

## 3. Personas y casos de uso

- **Organizador** (PYME o corporativo): crea su evento, cobra, comunica, lidera.
- **Staff / colaborador**: entra a "Mi trabajo", ve sus tareas, escanea boletas, envía sugerencias.
- **Asistente final**: descubre el evento en `/explorar`, compra, recibe su boleta con QR, hace check-in.
- **Admin global** (GESTEK): supervisa, ejecuta runbooks operativos.

Casos de uso concretos: conferencias, workshops, lanzamientos, fiestas, webinars, networking, galas, cursos (las 8 plantillas profesionales del editor).

---

## 4. Mapa de funcionalidades

### 4.1 Núcleo del evento
- CRUD completo de eventos, modalidad (presencial / virtual / híbrido), portada y galería, página pública con **editor visual de bloques** (drag-and-drop) y **8 plantillas profesionales**.
- Tipos de **boleta**: precio, cupo, early-bird, ventana de venta, zonas de acceso.
- **Códigos de descuento** percent / fixed con tope y caducidad.
- **Cortesías** con QR firmado.

### 4.2 Asistencia
- **QR único por boleta** (JWT firmado HS256) + **código corto alfanumérico** de respaldo.
- **Check-in** desde cámara (Html5Qrcode) o código manual. Reglas: rechaza invalido/reembolsado, detecta ya-usada, advierte pago pendiente.
- **Lista de espera** con posición; notificación push cuando se libera cupo.

### 4.3 Pagos
- **MercadoPago Checkout Pro** con dos flujos:
  - **Plan Pro** → paga a la cuenta MP de GESTEK.
  - **Boletas** → paga a la cuenta MP del **organizador** (cada uno conecta su token desde el panel).
- Modo **manual / "BRE-B"** (llave o QR del organizador) para mercados sin MP.
- **Webhook idempotente** con verificación HMAC y registro en `payment_transactions`.

### 4.4 Equipo y comunicación
- **Roles por evento** con permisos del catálogo central (`editar_evento`, `gestionar_tickets`, `checkin`, `ver_clientes`, `ver_pagos`, `ver_analytics`, `editar_pagina_publica`…).
- **Invitar / cambiar rol / quitar** miembro con notificación.
- **Chat** por canales por evento con subscripción Realtime.
- **Sugerencias / solicitudes / mensajes** del staff → organizador, con estado y respuesta (módulo bidireccional).
- **Tareas** tipo Kanban (estado, prioridad, asignado a usuario o rol), comentarios, gamificación al completar.

### 4.5 Agenda y contenido
- Vistas **Lista / Día (timeline por horas) / Semana / Mes**.
- **Speakers** y **patrocinadores** (gold / silver / bronze).
- Sesiones con track, ubicación, vínculo a speaker.

### 4.6 Fidelidad
- **Puntos** por acciones (asistencia, tareas, check-ins operados).
- **Recompensas** que el organizador define, canjeables por puntos.
- **Ranking** por evento y por organizador (clientes y staff).
- **Badges** plataforma como capa secundaria.

### 4.7 Comunicaciones
- **Recordatorios email** a asistentes en **T-7d / T-1d / T-1h** vía Edge Function (Supabase) con `pg_cron`.
- **Notificaciones in-app** con suscripción Realtime; campana en TopBar.
- **Web push** (VAPID + Service Worker) para asistentes y organizadores.

### 4.8 Analítica
- Visitas a la página pública, **visitantes únicos** (hash), **conversión**, **tasa de asistencia**.
- Ingresos por **tipo de boleta** y por **proveedor de pago**.
- **Fuentes de tráfico** (orgánico, social, email, directo, referrer).
- **Serie diaria** de visitas y tickets.

### 4.9 Plataforma extendida
- **White-label** para todos los planes: marca, colores, fondo, tipografía, radio de bordes, tagline, redes (web/IG/WhatsApp) y footer. Aplicado en panel y en páginas públicas.
- **API REST v1** (Pro): tokens `gtk_live_*` con firma HMAC; endpoints scopeados al owner.
- **Webhooks salientes** (Pro): `evento.publicado`, `boleta.pagada`, etc., firmados con HMAC y reintento.
- **Auditoría** (Pro): registro de quién hizo qué en cada evento.
- **Multi-idioma base** (i18n con `es`/`en`, extensible).

### 4.10 Gestbot — el agente IA
- **Motor intercambiable** con failover automático:
  1. **Groq** (Llama 3.3 70B, capa gratuita)
  2. **Gemini** (Gemini 2.5 Flash Lite, capa gratuita)
  3. **Anthropic Claude** (opcional, mejor precisión)
- **60+ acciones reales** scopeadas a `owner_id`: crear/editar/publicar/duplicar eventos, tipos de boleta, asistentes (ver/anular/exportar CSV), check-in, lista de espera, equipo (invitar/quitar/roles), tareas, fidelidad/recompensas, sugerencias, auditoría, agenda (speakers/sesiones), patrocinadores, códigos de descuento, ingresos por proveedor, comparativas, búsqueda, etc.
- **Formularios estructurados**: cuando faltan datos, el bot envía un formulario con campos en orden; el frontend lo renderiza y los valores vuelven como mensaje.
- **Adjuntos**: analiza **PDF e imágenes** usando Gemini multimodal.
- **Persistencia de chats**: historial por conversación en localStorage.
- **Vista previa del evento** que se está creando en vivo.
- **Visual**: criatura/robot con moods (idle / thinking-con-portátil / talking / happy / error) y animaciones CSS.

---

## 5. Arquitectura técnica

### 5.1 Diagrama de capas

```
┌──────────────────────────────────────────────────────────┐
│  Frontend (Vite + React 18, TailwindCSS, React Router)   │
│  • SPA con code-splitting (React.lazy + Suspense)         │
│  • PWA (manifest + service worker)                        │
│  • Contextos: Auth, Toast, Confirm (modal global)         │
│  • Hooks: usePlan, useBranding, usePush, useT, useReveal  │
└────────────────┬─────────────────────────────────────────┘
                 │ HTTPS · JWT Supabase en Authorization
┌────────────────▼─────────────────────────────────────────┐
│  Backend Express 5 (Node 18+)                            │
│  • middleware/auth: verifySupabaseJWT(Optional)          │
│  • config/security: helmet (CSP), CORS, rate-limit       │
│  • routes/ por dominio (eventos, tickets, agente, …)     │
│  • lib/: acceso (permisos), agente (motor IA + tools),   │
│    qr (JWT), email, webhooks, gamificacion, auditar      │
└────┬───────────────────┬──────────────────────────────────┘
     │ supabase-js        │ outbound: MP / Email / Webhooks
     │ (service_role)     │ Groq / Gemini / Anthropic
┌────▼────────────┐  ┌────▼────────────────────────────────┐
│ Supabase        │  │  Proveedores externos               │
│ • Postgres + RLS│  │  • MercadoPago (Checkout + Webhook) │
│ • Auth (Google) │  │  • Resend / Gmail SMTP              │
│ • Storage       │  │  • Web Push (VAPID)                 │
│ • Realtime      │  │  • Cloudflare Turnstile (captcha)   │
│ • Edge Functions│  │  • Groq / Gemini / Anthropic        │
│ • pg_cron       │  └─────────────────────────────────────┘
└─────────────────┘
```

### 5.2 Flujo de datos típico (compra de boleta)

```
Comprador → Página pública del evento
        │
        ▼  POST /eventos/publicos/slug/:slug/comprar  (verify Turnstile)
Backend ── crea Preference en MP (token del organizador) ──► Mercado Pago
        ◄── init_point  ──
Redirige a MP Checkout
        ▼
Comprador paga
        ▼  POST /webhooks/mercadopago  (firma HMAC verificada)
Backend ── consulta el pago, actualiza payment_transactions,
           marca el ticket como pagado, firma QR, notifica
        ▼
Asistente recibe email + URL /mi-ticket/<código> con QR válido
```

### 5.3 Flujo de Gestbot (agéntico)

```
Usuario habla en el chat → POST /me/agente/chat { mensajes, archivos? }
        │  (gate: plan Pro vigente)
Dispatcher elige proveedor (Groq → Gemini → Anthropic) según keys + failover
        ▼
Loop agéntico (máx 6 iteraciones):
  1. Modelo decide texto o tool_use
  2. Si pide solicitar_formulario → corta loop, devuelve form spec a UI
  3. Si ejecuta tool real → executor scoped a owner_id → resultado
  4. Realimenta y vuelve
        ▼
Respuesta: { reply, mood, acciones[], formulario? }
Frontend renderiza con mood (criatura), chips de acciones, vista previa
```

### 5.4 Seguridad

- **Autenticación**: JWT de Supabase Auth verificado por petición (`verifySupabaseJWT` o `verifySupabaseJWTOptional` según público/privado).
- **Autorización**: `lib/acceso.js` centraliza `assertPermiso(eventoId, userId, perms[])` aplicado **end-to-end** en todos los endpoints de escritura (tickets, agenda, clientes, equipo, roles, analytics, etc.).
- **Webhook MP**: firma HMAC-SHA256 obligatoria con `MP_WEBHOOK_SECRET`; sin secret válido, 401.
- **Sanitización**: `sanitizeBody` antes de los handlers; validación de **URLs de imagen** (`lib/urls.js`) para evitar `javascript:` / data ejecutables.
- **Rate limit** por IP (express-rate-limit) y `authLimiter` específico en rutas sensibles.
- **CSP** (helmet en API + meta en el SPA) con `frame-src 'self'` para el preview público.
- **Captcha** Cloudflare Turnstile en reservar / waitlist / comprar — *graceful*: si no hay site key, no se exige.
- **Storage hardening** (migración `0026_storage_hardening.sql`).
- **Tokens API** propios (`gtk_live_*`) con hash + firma HMAC por organización.

### 5.5 Modelos de datos clave

(ver `db/migrations/` para los CREATE TABLE detallados)

- `profiles`, `eventos`, `event_members`, `event_roles`, `tickets`, `ticket_types`, `discount_codes`
- `agenda_sessions`, `speakers`, `sponsors`
- `chat_channels`, `chat_messages`
- `tareas`, `tarea_log`
- `notificaciones`, `recordatorios`
- `points_log`, `puntos_balance`, `recompensas`, `canjes`, `user_badges`
- `event_waitlist`
- `payment_transactions`, `event_views`
- `audit_log`
- `event_requests` (sugerencias del equipo, **migración 0028**)
- `api_tokens`, `api_token_log`, `webhooks`, `webhook_deliveries`
- `push_subscriptions`

### 5.6 Decisiones de diseño relevantes

1. **Multi-proveedor de IA con failover**: Gestbot funciona sin costo y resiste rate-limits de capas gratuitas.
2. **Tool-schema "delgado"** (sin descripciones por parámetro): reduce drásticamente tokens enviados → 60+ herramientas caben en las capas gratuitas.
3. **Auth por ruta vs router-level**: routers que requieren auth global se montan **después** de los públicos para no interceptar `/eventos/publicos` y `/categorias`.
4. **`assertPermiso` unificado**: una sola fuente de verdad para acceso/escritura por permiso de rol.
5. **Webhook idempotente** con fallback de tokens (plataforma → owner → todos los conectados) y respuesta 200 inmediata.
6. **Branding aplicado real**: variables CSS + scoped overrides para que el white-label tenga efecto sin tocar Tailwind.
7. **`confirmDialog` y `alertDialog`** globales: cero diálogos nativos del navegador.
8. **Optimizaciones de scroll**: eliminados `background-attachment: fixed` y orbes blurreados animados (causa #1 de jank); reemplazados por gradientes radiales estáticos en capa compositada.

---

## 6. Stack completo

| Categoría | Herramientas |
|---|---|
| Lenguajes | JavaScript (ES2022+), JSX, SQL |
| Frontend | Vite, React 18, React Router v6, TailwindCSS, axios, qrcode.react, html5-qrcode, dnd-kit |
| Backend | Node.js (18/22), Express 5 |
| BBDD | PostgreSQL (Supabase), pg_cron, pg_net |
| Auth | Supabase Auth (Google + email) |
| Storage | Supabase Storage |
| Realtime | Supabase Realtime (postgres_changes) |
| Edge | Supabase Edge Functions (Deno) |
| IA | Anthropic SDK; Groq y Gemini vía REST con failover propio |
| Pagos | Mercado Pago Checkout Pro |
| Email | Nodemailer (Gmail SMTP) / Resend |
| Push | web-push (VAPID) + Service Worker |
| Anti-bot | Cloudflare Turnstile |
| Seguridad | helmet, cors, express-rate-limit, sanitización propia |
| Observabilidad | Sentry (instrumentación opcional), logs estructurados |
| Tests | node:test (sin dependencias adicionales) |
| Tooling | npm scripts, concurrently, dotenv |

---

## 7. Estado del proyecto

- **En producción**.
- **Tests** automáticos para librerías puras (`npm test` → 5/5 verde).
- **CI build**: `vite build` verde, `node -c` para todos los archivos del backend.
- **Auditoría end-to-end** realizada: tres bugs reales corregidos (página pública por slug, cambiar rol de miembro, permisos de escritura `PATCH /eventos/:id`).
- **PR principal**: rama `MedinaDesarrollo` lista para merge en `main`.

## 8. Roadmap próximo (no bloqueante)

1. **Editor visual con columnas / sidebar** para que el organizador pueda poner info a los lados en la página pública.
2. **i18n completo** (hoy: infraestructura + ejemplo).
3. **MercadoPago E2E** verificado en producción con credenciales reales.
4. **Más cobertura de tests** (integración + e2e con Playwright).
5. **Métricas operativas** (dashboard interno de uso de Gestbot, costos, errores).

---

## 9. Equipo y contribución

Proyecto desarrollado de manera colaborativa (Juan Medina y equipo). El histórico de commits refleja la evolución por fases: Fase 1 (núcleo de eventos), Fase 2 (pagos + público), Fase 3 (equipo + chat), Fase 4 (fidelidad + realtime + waitlist + white-label), Fase 5 (Gestbot + permisos + auditoría + API + trial Pro + mejoras de UX y rendimiento).

---

## 10. Por qué importa

Hoy, organizar eventos profesionales sigue siendo una cadena de herramientas desconectadas con comisiones acumuladas. GESTEK consolida ese stack en una sola plataforma honesta, con un agente de IA que pasa de "asistente decorativo" a **coorganizador funcional**. La hipótesis del producto: cuando la IA puede **ejecutar**, el organizador pasa más tiempo creando experiencia y menos tiempo operando software.
