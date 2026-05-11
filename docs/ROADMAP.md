# GESTEK — Roadmap de desarrollo (rama MedinaDesarrollo)

Documento maestro de funcionalidades acordadas. Las casillas marcadas son lo que ya está implementado en el repo; el resto se construye fase por fase.

---

## Fase 1 — Setup y limpieza

- [x] Crear rama `MedinaDesarrollo` desde `main`
- [x] Configurar git local con `Sekkon0906 <medinapipe123@gmail.com>` (sin Claude como co-autor)
- [x] Eliminar todos los emojis del código fuente
- [x] Colocar logo real (GESTEK — Manage. Automate. Scale.) en `frontend/src/assets/`
- [x] Roadmap publicado (este archivo)
- [ ] (Opcional) `git filter-repo` sobre commits viejos en `main` y `push --force` — requiere ejecución manual del usuario por riesgo de reescribir historia pública

## Fase 2 — Rediseño visual (estilo Apple / Anthropic, minimalista)

- [ ] **Navbar** estilo píldora flotante: logo izquierda + `Inicio · Cómo funciona · Producto · Explorar · Planes · FAQ` + `Iniciar sesión` + `Registrarse` a la derecha
- [ ] Tipografía y espaciados estilo wireframes SEMB (sans-serif moderno, jerarquía clara, mucho aire)
- [ ] Paleta más sobria (menos gradientes neon)
- [ ] **Landing pública** rediseñada (estilo Eventtia hero negro, claim grande)
- [ ] **Página de registro** estilo foto 3: hero a la izquierda + formulario en card a la derecha
- [ ] **Página de login** rediseñada, llamativa pero limpia
- [ ] **Responsive mobile** completo en todas las vistas
- [ ] **Loaders / spinners** unificados en cada acción asíncrona (login, registro, submit de formularios, etc.)
- [ ] Animaciones suaves de transición entre rutas

## Fase 3 — Auth (Supabase)

- [ ] Registro en **2 pasos**:
  - Paso 1: nombre, email empresarial, teléfono, contexto del evento/empresa, contraseña
  - Paso 2: foto de perfil, ocupación, datos del organizador
- [ ] Todos los clientes nuevos = rol `organizador`
- [ ] Login funcional contra Supabase Auth
- [ ] Recuperación de contraseña por email (Supabase SMTP)
- [x] Confirmación de cuenta por email (`/confirmar`)
- [x] Sesión persistente + refresh tokens (Supabase PKCE)
- [x] Botones "Acceder" e "Iniciar sesión" unificados a la misma ruta `/login`
- [x] Cliente Supabase JS instalado y configurado
- [x] AuthContext refactorizado a Supabase (login, register, logout, reset, update, resend)
- [x] Página `/recuperar` para solicitar reset por email
- [x] Página `/restablecer` para definir nueva contraseña
- [x] Documentación en `docs/SUPABASE_SETUP.md`

## Fase 4 — Rutas y páginas públicas

- [ ] `/` — Inicio (landing rediseñada)
- [ ] `/como-funciona` — explicación del flujo
- [ ] `/producto` — features completas (lo bueno que ofrece GESTEK)
- [ ] `/explorar` — listado público de eventos de todos los organizadores
- [ ] `/explorar/:slug` — página individual del evento (compra de boletas, info, interacción)
- [ ] `/planes` — pricing rediseñado (Free vs Pro)
- [ ] `/faq` — preguntas frecuentes
- [ ] `/login` y `/register` rediseñadas

## Fase 5 — Módulo Eventos (FREE — todo lo principal)

Estas funciones van **todas** en el plan gratuito:

- [ ] CRUD completo de eventos (crear / editar / publicar / archivar)
- [ ] Flujo de creación tipo wizard de 4 pasos (info general, espacios y accesos, identidad y marca, revisión y publicar) — inspirado en wireframe foto 5
- [ ] Página pública individual por evento (`/explorar/:slug`) con compra de boletas e interacción
- [ ] Generación de **QR de asistencia** + escáner check-in / check-out
- [ ] **Recordatorios por email** a los inscritos (Supabase + cron)
- [ ] **Gamificación**: puntos por asistencia, badges, ranking
- [ ] Inscripciones e invitaciones
- [ ] Exportar asistentes a CSV
- [ ] Notificaciones in-app

## Fase 6 — API, webhooks y pagos (FREE)

- [ ] **API pública** completa con auth por API key
- [ ] **Webhooks** para eventos del sistema (inscripción, pago, check-in)
- [ ] **Pasarela BRE-B**: el organizador puede pegar su llave o subir su QR para recibir pagos de boletas
- [ ] Recibos / facturas básicas
- [ ] Manejo de reembolsos manuales

## Fase 7 — Plan Pro (comodidad y branding)

- [ ] **Agente IA** para crear/editar eventos con lenguaje natural y generar bloques iniciales según contexto
- [ ] **Personalización completa**: colores, tipografía, dominio
- [ ] **White-label**: quitar marca "GESTEK", poner logo y nombre del organizador
- [ ] Analytics avanzados
- [ ] Soporte prioritario
- [ ] Para que el organizador pague Pro: usa la pasarela BRE-B con la llave/QR del dueño de GESTEK

## Mejoras a lo ya implementado (sugerencias para iterar)

- **Landing actual** está cargada de gradientes y glows neon — bajar saturación, aumentar aire blanco/negro tipo Apple
- **Iconos custom inline** (`BoltIcon`, etc.) → migrar a una librería consistente (lucide-react) para reducir verbosidad
- **Mockup de dashboard en el hero** funciona pero pesa visualmente — considerar imagen estática optimizada o usar el wireframe SEMB como referencia
- **Toast/Alert** ya existe (`ToastContext`) — extender para los nuevos loaders
- **Estructura de carpetas**: `pages/` mezcla archivos sueltos (`LoginPage.jsx`) con subcarpetas (`events/`) — uniformar todo en subcarpetas

---

## Riesgos y decisiones abiertas

- `git filter-repo` sobre commits viejos: **NO ejecutado**. Requiere `push --force` a main, riesgoso. Pendiente ejecución manual del usuario si lo desea.
- BRE-B: sin credenciales sandbox propias, el módulo se construye como integración genérica donde el cliente pega su llave/QR.
- Auth0: descartado. Solo Supabase Auth.
