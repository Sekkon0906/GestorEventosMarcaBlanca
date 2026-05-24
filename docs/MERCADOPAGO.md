# Mercado Pago — Runbook de producción

Cómo dejar funcionando los **dos flujos** de cobro en producción:

1. **Compra del plan Pro** → paga **a GESTEK** (a ti). Usa una cuenta MP de la plataforma.
2. **Compra de boletas de eventos** → paga **directo al organizador**. Cada organizador conecta su propia cuenta MP desde Configuración → Pagos.

Ambos flujos comparten **el mismo webhook** (`POST /webhooks/mercadopago`).

---

## 1) URLs públicas (requisito previo)

MP necesita poder llegar a tu backend y redirigir al frontend. Define:

- **Backend público (HTTPS)**: ej. `https://api.gestek.io`
- **Frontend público (HTTPS)**: ej. `https://gestek.io`

Si trabajas con un tunnel temporal en dev (cloudflared/ngrok), usa esa URL HTTPS.

---

## 2) Variables de entorno del backend

Edita el `.env` del servidor (no del frontend) con estos valores **de producción**:

```env
# URLs públicas (sin slash final)
FRONTEND_URL=https://gestek.io
API_PUBLIC_URL=https://api.gestek.io

# Credenciales de GESTEK (plataforma) — usadas SOLO para cobrar el plan Pro
MP_PLATFORM_ACCESS_TOKEN=APP_USR-...   # de la cuenta MP DE GESTEK (producción)
MP_PLATFORM_PUBLIC_KEY=APP_USR-...

# Secret del webhook de MP (mismo string que el dashboard MP)
MP_WEBHOOK_SECRET=el_secret_del_panel_mp

# Precio del plan Pro (opcional — defaults razonables)
PLAN_PRO_PRICE=79900           # en COP, monto que MP cobra
PLAN_PRO_PRICE_USD=19.99       # para mostrar en UI
PLAN_PRO_CURRENCY=COP
PLAN_PRO_DURATION_DAYS=30
PLAN_PRO_TRIAL_DAYS=14

# Desactivar la activación dev en prod
ALLOW_DEV_PRO_ACTIVATION=false
```

Después de editar, **reinicia el backend**.

---

## 3) Registrar el webhook en MP

1. Entra a **https://www.mercadopago.com/developers** → tu aplicación.
2. Sección **Webhooks** → **Configurar notificaciones** → modo **Producción**.
3. URL: `https://api.gestek.io/webhooks/mercadopago`
4. Eventos a suscribir: **`payment`** (mínimo). Opcionalmente `merchant_order`.
5. **Copia el "Secret"** que muestra MP y pégalo en `MP_WEBHOOK_SECRET` del backend.
6. **Save / Probar**: MP envía un ping; debe responder **200** con la firma válida.

> Si dejas `MP_WEBHOOK_SECRET` vacío, el backend acepta todos los webhooks (modo dev). En producción **siempre** debe estar configurado: si no, cualquiera podría marcar boletas como pagadas.

---

## 4) Cuenta MP de GESTEK (para el plan Pro)

Solo necesario si vas a cobrar Pro a tus clientes.

1. En la cuenta MP de GESTEK → **Tus integraciones** → crea una aplicación de tipo **Pagos online**.
2. **Credenciales de producción** → copia `Access Token` y `Public Key`.
3. Pégalos en el `.env` del backend en `MP_PLATFORM_ACCESS_TOKEN` y `MP_PLATFORM_PUBLIC_KEY`.

Esto habilita `POST /me/plan/pro/comprar`: el comprador termina en MP, paga a tu cuenta y el webhook activa el plan.

---

## 5) Cuenta MP de cada organizador (para boletas)

Cada organizador conecta su MP **una sola vez** desde la app:

1. Inicia sesión como organizador → **Pagos** (barra izquierda).
2. Sección **Mercado Pago** → pega el **Access Token de producción** de su cuenta MP.
3. (Opcional) Public Key.
4. Botón **Conectar cuenta** → el backend lo guarda cifrado en su perfil.

A partir de ahí, los compradores de boletas de sus eventos pagan **directo a su cuenta**.

---

## 6) Verificación end-to-end (5 minutos)

### A) Plan Pro
- Inicia sesión con una cuenta de prueba (no tu cuenta de GESTEK).
- **Pagos** → **Pagar y activar Pro** → debes ir a `mercadopago.com/checkout/...`.
- Paga con tarjeta de **prueba en producción** (montos bajos) o con tarjeta real.
- Tras "Aprobado", el back redirige a `https://gestek.io/configuracion?plan=ok`.
- En 1–3 s, el panel debe mostrar **PRO** y la fecha de vencimiento.

### B) Boleta de evento
- Como organizador, crea un evento con un tipo de boleta de pago > 0.
- Publícalo.
- En modo incógnito abre la página pública del evento → **Reservar** → MP checkout.
- Paga. Vuelves a `https://gestek.io/mi-ticket/<código>` con el QR.
- En el panel del organizador, **Boletas / Clientes** → la boleta aparece como **pagado** y el ingreso suma en Analytics.

Si en cualquier paso queda en **pendiente** o **rechazado**: revisa los logs del backend (`[webhook MP]`) y la sección **Tus notificaciones** del panel MP para ver si entregó y con qué status.

---

## 7) Errores comunes

| Síntoma | Causa probable | Solución |
|---|---|---|
| Botón "Pagar y activar Pro" → 500 / "MP no devolvió link" | Falta `MP_PLATFORM_ACCESS_TOKEN` válido en backend | Pegar el access token de producción de la app de GESTEK y reiniciar |
| "Reservar" en evento público → "Organizador sin MP configurado" | El organizador no conectó MP | Pedirle que vaya a Pagos → Conectar cuenta |
| Paga pero el panel sigue en Free / boleta sigue emitida | Webhook no llega o firma inválida | 1) MP dashboard → Webhooks → ver entregas. 2) Confirmar que `MP_WEBHOOK_SECRET` del backend == secret del dashboard. 3) Confirmar que `https://api.gestek.io/webhooks/mercadopago` es accesible públicamente |
| `auto_return must point to public URL` | back_urls usa `localhost` | Definir `FRONTEND_URL` con un dominio HTTPS público (en dev, el código desactiva auto_return automáticamente) |
| Comprador queda en "pending" cuando ya pagó | MP marcó el pago como `in_process` (revisión manual) | Esperar a que MP lo apruebe (puede tardar minutos a horas en algunos métodos) |

---

## 8) Seguridad

- El **access token del organizador** se guarda en `profiles.mp_access_token` (cifrado al guardar; nunca se devuelve al frontend).
- El **webhook verifica HMAC-SHA256** con `MP_WEBHOOK_SECRET` (manifest `id:<data.id>;request-id:<x-request-id>;ts:<ts>;`). Sin secret válido → 401.
- La compra del Pro y de boletas crea un registro en `payment_transactions` con `status='pending'`; el webhook actualiza a `approved` y dispara el efecto (activar plan / marcar boleta pagada). Idempotente por `payment_id`.

---

## 9) Endpoints del flujo (referencia rápida)

| Método | Path | Para qué |
|---|---|---|
| `POST` | `/me/mercadopago/conectar` | Organizador guarda su access token |
| `GET`  | `/me/mercadopago/test` | Diagnóstico (¿el token funciona?) |
| `DELETE` | `/me/mercadopago` | Desconectar cuenta MP del organizador |
| `GET`  | `/me/plan` | Estado del plan (free/pro, trial, expira) |
| `POST` | `/me/plan/pro/comprar` | Crear preference para pagar Pro |
| `POST` | `/me/plan/pro/trial` | Activar prueba 14 días (una vez) |
| `POST` | `/eventos/publicos/slug/:slug/comprar` | Crear preference para una boleta |
| `POST` | `/webhooks/mercadopago` | Recibir notificaciones de MP |
