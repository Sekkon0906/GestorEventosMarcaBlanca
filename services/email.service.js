const { Resend } = require('resend');

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// ─────────────────────────────────────────────────────────────
// Envía email de confirmación con QR al inscrito
// Si no hay RESEND_API_KEY, muestra en consola (modo dev)
// ─────────────────────────────────────────────────────────────
async function enviarConfirmacionInscripcion({ nombre, email, eventoId, eventoNombre, tipoEntrada, qrImagen }) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; background:#0f172a; color:#f1f5f9; padding:32px;">
      <div style="max-width:500px; margin:0 auto; background:#1e293b; border-radius:16px; padding:32px;">

        <div style="text-align:center; margin-bottom:24px;">
          <h1 style="color:#818cf8; font-size:28px; margin:0;">GESTEK</h1>
          <p style="color:#94a3b8; margin:4px 0 0;">Event OS</p>
        </div>

        <h2 style="color:#f1f5f9; font-size:20px;">¡Inscripción confirmada! 🎉</h2>

        <p style="color:#94a3b8;">Hola <strong style="color:#f1f5f9;">${nombre}</strong>,</p>
        <p style="color:#94a3b8;">Tu inscripción al evento <strong style="color:#818cf8;">${eventoNombre || `Evento #${eventoId}`}</strong> fue exitosa.</p>

        <div style="background:#0f172a; border-radius:12px; padding:16px; margin:20px 0;">
          <p style="margin:4px 0; color:#94a3b8;">🎟️ Tipo de entrada: <strong style="color:#f1f5f9;">${tipoEntrada}</strong></p>
          <p style="margin:4px 0; color:#94a3b8;">📧 Email: <strong style="color:#f1f5f9;">${email}</strong></p>
        </div>

        <p style="color:#94a3b8; text-align:center;">Tu QR de entrada:</p>
        <div style="text-align:center; margin:16px 0;">
          <img src="${qrImagen}" alt="QR de entrada" style="width:200px; height:200px; border-radius:8px; background:white; padding:8px;" />
        </div>

        <p style="color:#64748b; font-size:12px; text-align:center; margin-top:24px;">
          Presenta este QR en la puerta del evento.<br/>
          No lo compartas — es único e intransferible.
        </p>

        <div style="border-top:1px solid #334155; margin-top:24px; padding-top:16px; text-align:center;">
          <p style="color:#64748b; font-size:11px; margin:0;">GESTEK Event OS — Sistema de eventos marca blanca</p>
        </div>
      </div>
    </body>
    </html>
  `;

  if (!resend) {
    // Modo desarrollo — mostrar en consola
    console.log('\n📧 [EMAIL - MODO DEV] ─────────────────────────');
    console.log(`  Para   : ${email}`);
    console.log(`  Nombre : ${nombre}`);
    console.log(`  Evento : ${eventoNombre || `#${eventoId}`}`);
    console.log(`  Entrada: ${tipoEntrada}`);
    console.log('  QR generado ✅ (agrega RESEND_API_KEY al .env para enviar emails reales)');
    console.log('──────────────────────────────────────────────\n');
    return { ok: true, modo: 'dev', mensaje: 'Email simulado en consola (sin RESEND_API_KEY)' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from   : 'GESTEK <noreply@gestek.app>',
      to     : [email],
      subject: `✅ Confirmación de inscripción — ${eventoNombre || `Evento #${eventoId}`}`,
      html,
    });

    if (error) throw error;
    return { ok: true, id: data.id };
  } catch (err) {
    console.error('Error enviando email:', err.message);
    return { ok: false, error: err.message };
  }
}

// ─────────────────────────────────────────────────────────────
// Email de recordatorio 24h antes del evento
// ─────────────────────────────────────────────────────────────
async function enviarRecordatorio({ nombre, email, eventoNombre, fecha }) {
  if (!resend) {
    console.log(`\n📧 [RECORDATORIO DEV] → ${email} | Evento: ${eventoNombre} | Fecha: ${fecha}\n`);
    return { ok: true, modo: 'dev' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from   : 'GESTEK <noreply@gestek.app>',
      to     : [email],
      subject: `⏰ Recordatorio: ${eventoNombre} es mañana`,
      html   : `
        <div style="font-family:Arial,sans-serif;padding:32px;background:#0f172a;color:#f1f5f9;">
          <h2>¡Tu evento es mañana! 🎉</h2>
          <p>Hola ${nombre}, recuerda que <strong>${eventoNombre}</strong> es el ${fecha}.</p>
          <p>No olvides llevar tu QR de entrada.</p>
        </div>
      `,
    });

    if (error) throw error;
    return { ok: true, id: data.id };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

module.exports = { enviarConfirmacionInscripcion, enviarRecordatorio };
