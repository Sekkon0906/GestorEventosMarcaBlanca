/**
 * tests/notification.service.test.js — JuanesSosa (QA)
 * Suite de tests unitarios para NotificationService
 *
 * Actualizado 2026-05-12:
 *   - API ahora es async (create/getAll/markAsRead retornan Promise)
 *   - Almacén interno renombrado _store → _memStore
 *   - Supabase mockeado para forzar modo memoria en tests
 *   - Socket.IO usa rooms (io.to(room).emit) en lugar de io.emit global
 */

// ── Mock de Supabase — fuerza fallback a memoria ──────────────
jest.mock('../db/supabase', () => {
  const makeErr = () => ({ data: null, error: new Error('supabase_mock') });
  return {
    from: () => ({
      insert : () => ({ select: () => ({ single: async () => makeErr() }) }),
      update : () => ({ eq: () => ({ select: () => ({ single: async () => makeErr() }) }) }),
      select : () => ({ order: () => ({ limit: async () => makeErr(), eq: () => ({ limit: async () => makeErr() }) }) }),
    }),
  };
});

// ── Aislamos el singleton antes de cada test ──────────────────
beforeEach(() => jest.resetModules());

const getService = () => require('../services/notification.service');

// ── Helper — fuerza modo memoria (evita console.warn en tests) ─
function inMemoryService() {
  const svc = getService();
  svc._useSupabase = false;
  svc._memStore.length = 0;
  return svc;
}

// ════════════════════════════════════════════════════════════
describe('NotificationService', () => {

  // ── create() ─────────────────────────────────────────────
  describe('create()', () => {
    it('crea una notificación con tipo válido USER_REGISTRATION', async () => {
      const svc   = inMemoryService();
      const notif = await svc.create({ type: 'USER_REGISTRATION', message: 'Usuario Juan registrado', userId: 1 });

      expect(notif).toMatchObject({ type: 'USER_REGISTRATION', message: 'Usuario Juan registrado', userId: 1, read: false });
      expect(notif.id).toMatch(/^ntf_/);
      expect(notif.createdAt).toBeDefined();
    });

    it('crea una notificación con tipo EVENT_UPDATE', async () => {
      const svc   = inMemoryService();
      const notif = await svc.create({ type: 'EVENT_UPDATE', message: 'Evento actualizado' });
      expect(notif.type).toBe('EVENT_UPDATE');
    });

    it('crea una notificación con tipo SYSTEM_ALERT', async () => {
      const svc   = inMemoryService();
      const notif = await svc.create({ type: 'SYSTEM_ALERT', message: 'Alerta del sistema' });
      expect(notif.type).toBe('SYSTEM_ALERT');
    });

    it('lanza error si el tipo es inválido', async () => {
      const svc = inMemoryService();
      await expect(svc.create({ type: 'TIPO_INVALIDO', message: 'test' }))
        .rejects.toThrow('Tipo inválido');
    });

    it('userId es null por defecto', async () => {
      const svc   = inMemoryService();
      const notif = await svc.create({ type: 'SYSTEM_ALERT', message: 'sin user' });
      expect(notif.userId).toBeNull();
    });

    it('asigna un id único a cada notificación', async () => {
      const svc = inMemoryService();
      const n1  = await svc.create({ type: 'SYSTEM_ALERT', message: 'a' });
      const n2  = await svc.create({ type: 'SYSTEM_ALERT', message: 'b' });
      expect(n1.id).not.toBe(n2.id);
    });
  });

  // ── getAll() ─────────────────────────────────────────────
  describe('getAll()', () => {
    it('retorna array vacío al iniciar', async () => {
      const svc = inMemoryService();
      const all = await svc.getAll();
      expect(all).toEqual([]);
    });

    it('retorna las notificaciones en orden más reciente primero', async () => {
      const svc = inMemoryService();
      await svc.create({ type: 'SYSTEM_ALERT', message: 'primera' });
      await svc.create({ type: 'SYSTEM_ALERT', message: 'segunda' });

      const todas = await svc.getAll();
      expect(todas[0].message).toBe('segunda');
      expect(todas[1].message).toBe('primera');
    });

    it('no muta el store interno al llamar getAll()', async () => {
      const svc = inMemoryService();
      await svc.create({ type: 'SYSTEM_ALERT', message: 'test' });

      const resultado = await svc.getAll();
      resultado.pop(); // mutamos el resultado
      expect(svc._memStore.length).toBe(1); // store interno intacto
    });

    it('filtra por userId cuando se pasa', async () => {
      const svc = inMemoryService();
      await svc.create({ type: 'USER_REGISTRATION', message: 'user 1', userId: 1 });
      await svc.create({ type: 'USER_REGISTRATION', message: 'user 2', userId: 2 });
      await svc.create({ type: 'SYSTEM_ALERT', message: 'sistema' });

      const deUser1 = await svc.getAll({ userId: 1 });
      // usuario 1 ve las suyas + las de sistema (userId null)
      expect(deUser1.some(n => n.message === 'user 1')).toBe(true);
      expect(deUser1.some(n => n.message === 'user 2')).toBe(false);
    });
  });

  // ── markAsRead() ─────────────────────────────────────────
  describe('markAsRead()', () => {
    it('marca una notificación como leída', async () => {
      const svc   = inMemoryService();
      const notif = await svc.create({ type: 'SYSTEM_ALERT', message: 'leer esto' });

      const actualizada = await svc.markAsRead(notif.id);
      expect(actualizada.read).toBe(true);
    });

    it('retorna null si el id no existe', async () => {
      const svc       = inMemoryService();
      const resultado = await svc.markAsRead('id_que_no_existe');
      expect(resultado).toBeNull();
    });

    it('no afecta otras notificaciones al marcar una como leída', async () => {
      const svc = inMemoryService();
      const n1  = await svc.create({ type: 'SYSTEM_ALERT', message: 'uno' });
      const n2  = await svc.create({ type: 'SYSTEM_ALERT', message: 'dos' });

      await svc.markAsRead(n1.id);
      expect(n2.read).toBe(false);
    });
  });

  // ── Límite de 100 notificaciones ─────────────────────────
  describe('límite de 100 notificaciones', () => {
    it('no supera 100 notificaciones en el store', async () => {
      const svc = inMemoryService();
      for (let i = 0; i < 110; i++) {
        await svc.create({ type: 'SYSTEM_ALERT', message: `notif ${i}` });
      }
      expect(svc._memStore.length).toBe(100);
    });

    it('descarta la más antigua cuando se supera el límite', async () => {
      const svc = inMemoryService();
      for (let i = 0; i < 100; i++) {
        await svc.create({ type: 'SYSTEM_ALERT', message: `notif ${i}` });
      }
      const primera = svc._memStore[0].message;
      await svc.create({ type: 'SYSTEM_ALERT', message: 'nueva' });

      expect(svc._memStore[0].message).not.toBe(primera);
      expect(svc._memStore[99].message).toBe('nueva');
    });
  });

  // ── Socket.IO scoped ──────────────────────────────────────
  describe('setSocketServer()', () => {
    it('emite a room del usuario cuando userId está presente', async () => {
      const svc     = inMemoryService();
      const mockTo  = jest.fn().mockReturnValue({ emit: jest.fn() });
      svc.setSocketServer({ to: mockTo, emit: jest.fn() });

      await svc.create({ type: 'EVENT_UPDATE', message: 'evento', userId: 42 });

      expect(mockTo).toHaveBeenCalledWith('user:42');
    });

    it('emite a system_alerts cuando no hay userId (alerta global)', async () => {
      const svc     = inMemoryService();
      const mockTo  = jest.fn().mockReturnValue({ emit: jest.fn() });
      svc.setSocketServer({ to: mockTo, emit: jest.fn() });

      await svc.create({ type: 'SYSTEM_ALERT', message: 'alerta global' });

      expect(mockTo).toHaveBeenCalledWith('system_alerts');
    });

    it('no falla si no hay servidor IO configurado', async () => {
      const svc = inMemoryService();
      svc._io   = null;
      await expect(svc.create({ type: 'SYSTEM_ALERT', message: 'sin socket' }))
        .resolves.toBeDefined();
    });
  });
});
