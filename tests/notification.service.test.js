/**
 * tests/notification.service.test.js — JuanesSosa (QA)
 * Suite de tests unitarios para NotificationService
 */

// Aislamos el singleton antes de cada test
beforeEach(() => {
  jest.resetModules();
});

const getService = () => require('../services/notification.service');

describe('NotificationService', () => {

  // ── create() ──────────────────────────────────────────────

  describe('create()', () => {
    it('crea una notificación con tipo válido USER_REGISTRATION', () => {
      const service = getService();
      const notif = service.create({
        type   : 'USER_REGISTRATION',
        message: 'Usuario Juan registrado',
        userId : 1,
      });

      expect(notif).toMatchObject({
        type   : 'USER_REGISTRATION',
        message: 'Usuario Juan registrado',
        userId : 1,
        read   : false,
      });
      expect(notif.id).toMatch(/^ntf_/);
      expect(notif.createdAt).toBeDefined();
    });

    it('crea una notificación con tipo EVENT_UPDATE', () => {
      const service = getService();
      const notif = service.create({ type: 'EVENT_UPDATE', message: 'Evento actualizado' });
      expect(notif.type).toBe('EVENT_UPDATE');
    });

    it('crea una notificación con tipo SYSTEM_ALERT', () => {
      const service = getService();
      const notif = service.create({ type: 'SYSTEM_ALERT', message: 'Alerta del sistema' });
      expect(notif.type).toBe('SYSTEM_ALERT');
    });

    it('lanza error si el tipo es inválido', () => {
      const service = getService();
      expect(() =>
        service.create({ type: 'TIPO_INVALIDO', message: 'test' })
      ).toThrow('Tipo inválido');
    });

    it('userId es null por defecto', () => {
      const service = getService();
      const notif = service.create({ type: 'SYSTEM_ALERT', message: 'sin user' });
      expect(notif.userId).toBeNull();
    });

    it('asigna un id único a cada notificación', () => {
      const service = getService();
      const n1 = service.create({ type: 'SYSTEM_ALERT', message: 'a' });
      const n2 = service.create({ type: 'SYSTEM_ALERT', message: 'b' });
      expect(n1.id).not.toBe(n2.id);
    });
  });

  // ── getAll() ──────────────────────────────────────────────

  describe('getAll()', () => {
    it('retorna array vacío al iniciar (sin simulador)', () => {
      const service = getService();
      // El simulador usa setInterval con unref, no dispara en tests
      // Limpiamos manualmente el store interno para aislar
      service._store.length = 0;
      expect(service.getAll()).toEqual([]);
    });

    it('retorna las notificaciones en orden más reciente primero', () => {
      const service = getService();
      service._store.length = 0;
      service.create({ type: 'SYSTEM_ALERT', message: 'primera' });
      service.create({ type: 'SYSTEM_ALERT', message: 'segunda' });

      const todas = service.getAll();
      expect(todas[0].message).toBe('segunda');
      expect(todas[1].message).toBe('primera');
    });

    it('no muta el store interno al llamar getAll()', () => {
      const service = getService();
      service._store.length = 0;
      service.create({ type: 'SYSTEM_ALERT', message: 'test' });

      const resultado = service.getAll();
      resultado.pop(); // modificamos el resultado
      expect(service._store.length).toBe(1); // el store no se afecta
    });
  });

  // ── markAsRead() ──────────────────────────────────────────

  describe('markAsRead()', () => {
    it('marca una notificación como leída', () => {
      const service = getService();
      service._store.length = 0;
      const notif = service.create({ type: 'SYSTEM_ALERT', message: 'leer esto' });

      const actualizada = service.markAsRead(notif.id);
      expect(actualizada.read).toBe(true);
    });

    it('retorna null si el id no existe', () => {
      const service = getService();
      const resultado = service.markAsRead('id_que_no_existe');
      expect(resultado).toBeNull();
    });

    it('no afecta otras notificaciones al marcar una como leída', () => {
      const service = getService();
      service._store.length = 0;
      const n1 = service.create({ type: 'SYSTEM_ALERT', message: 'uno' });
      const n2 = service.create({ type: 'SYSTEM_ALERT', message: 'dos' });

      service.markAsRead(n1.id);
      expect(n2.read).toBe(false);
    });
  });

  // ── Límite de 100 notificaciones ──────────────────────────

  describe('límite de 100 notificaciones', () => {
    it('no supera 100 notificaciones en el store', () => {
      const service = getService();
      service._store.length = 0;

      for (let i = 0; i < 110; i++) {
        service.create({ type: 'SYSTEM_ALERT', message: `notif ${i}` });
      }

      expect(service._store.length).toBe(100);
    });

    it('descarta la más antigua cuando se supera el límite', () => {
      const service = getService();
      service._store.length = 0;

      for (let i = 0; i < 100; i++) {
        service.create({ type: 'SYSTEM_ALERT', message: `notif ${i}` });
      }
      const primera = service._store[0].message;
      service.create({ type: 'SYSTEM_ALERT', message: 'nueva' });

      expect(service._store[0].message).not.toBe(primera);
      expect(service._store[99].message).toBe('nueva');
    });
  });

  // ── Socket.IO (opcional) ──────────────────────────────────

  describe('setSocketServer()', () => {
    it('emite evento socket al crear notificación si hay servidor IO', () => {
      const service = getService();
      service._store.length = 0;

      const mockEmit = jest.fn();
      service.setSocketServer({ emit: mockEmit });

      service.create({ type: 'EVENT_UPDATE', message: 'evento via socket' });

      expect(mockEmit).toHaveBeenCalledWith(
        'notification_received',
        expect.objectContaining({ type: 'EVENT_UPDATE' })
      );
    });

    it('no falla si no hay servidor IO configurado', () => {
      const service = getService();
      service._store.length = 0;
      service._io = null;

      expect(() =>
        service.create({ type: 'SYSTEM_ALERT', message: 'sin socket' })
      ).not.toThrow();
    });
  });
});
