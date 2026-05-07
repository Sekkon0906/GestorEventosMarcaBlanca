const router = require('express').Router();
const notificationService = require('../services/notification.service');

// GET /api/notifications — obtener todas
router.get('/', (req, res) => {
  const notifications = notificationService.getAll();
  res.json({
    total: notifications.length,
    unread: notifications.filter(n => !n.read).length,
    notifications,
  });
});

// PATCH /api/notifications/:id/read — marcar como leída
router.patch('/:id/read', (req, res) => {
  const notification = notificationService.markAsRead(req.params.id);
  if (!notification) {
    return res.status(404).json({ error: 'Notificación no encontrada.' });
  }
  res.json({ mensaje: 'Notificación marcada como leída.', notification });
});

module.exports = router;
