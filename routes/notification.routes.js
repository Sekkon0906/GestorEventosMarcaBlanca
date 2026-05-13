'use strict';

/**
 * routes/notification.routes.js
 *
 * GET  /api/notifications        — obtener notificaciones (autenticado ve las propias)
 * PATCH /api/notifications/:id/read — marcar como leída
 */

const router              = require('express').Router();
const notificationService = require('../services/notification.service');
const verificarToken      = require('../middleware/auth');

// GET /api/notifications
router.get('/', verificarToken, async (req, res) => {
  try {
    const onlyUnread = req.query.unread === 'true';
    const limit      = Math.min(parseInt(req.query.limit, 10) || 50, 200);

    // Admins ven todas; usuarios ven solo las suyas
    const userId = req.usuario.rol === 'admin_global' ? undefined : req.usuario.id;

    const notifications = await notificationService.getAll({ userId, limit, onlyUnread });

    res.json({
      total  : notifications.length,
      unread : notifications.filter(n => !n.read).length,
      notifications,
    });
  } catch (err) {
    console.error('GET /api/notifications:', err.message);
    res.status(500).json({ error: 'Error al obtener notificaciones.' });
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', verificarToken, async (req, res) => {
  try {
    const notification = await notificationService.markAsRead(req.params.id);
    if (!notification)
      return res.status(404).json({ error: 'Notificación no encontrada.' });
    res.json({ mensaje: 'Notificación marcada como leída.', notification });
  } catch (err) {
    console.error('PATCH /api/notifications/:id/read:', err.message);
    res.status(500).json({ error: 'Error al actualizar notificación.' });
  }
});

module.exports = router;
