/**
 * tests/auth.routes.test.js
 * Tests de integración para POST /auth/register, POST /auth/login, GET /auth/me
 *
 * Mockea Supabase y bcryptjs para correr sin base de datos real.
 *
 * Actualizado 2026-05-12:
 *   - Passwords mínimo 8 chars (nuevo requisito de seguridad del validator)
 *   - `rol` del body es IGNORADO — siempre se crea con rol 'asistente'
 *   - `permisos` del body es IGNORADO — siempre se crea con permisos []
 *   - Rol inválido ya no retorna 400 (es ignorado silenciosamente)
 */

const request = require('supertest');
const express = require('express');

// ── Mocks ──────────────────────────────────────────────────
const mockUsers = [];

jest.mock('bcryptjs', () => ({
  hash   : jest.fn(async (pwd) => `hashed:${pwd}`),
  compare: jest.fn(async (pwd, hash) => hash === `hashed:${pwd}`),
}));

jest.mock('../db/supabase', () => {
  const makeChain = (pendingInsert) => ({
    select: () => {
      if (pendingInsert !== null) {
        return {
          single: async () => {
            const user = { id: Date.now(), ...pendingInsert, created_at: new Date().toISOString() };
            mockUsers.push(user);
            return { data: user, error: null };
          },
        };
      }
      return {
        eq: (field, value) => {
          const find = () => mockUsers.find(u => String(u[field]) === String(value)) || null;
          return {
            maybeSingle: async () => ({ data: find(), error: null }),
            single     : async () => {
              const u = find();
              return { data: u, error: u ? null : { code: 'PGRST116', message: 'not found' } };
            },
          };
        },
      };
    },
    insert: (data) => makeChain(data),
  });

  return { from: () => makeChain(null) };
});

jest.mock('../services/notification.service', () => ({
  create          : jest.fn(),
  setSocketServer : jest.fn(),
  getAll          : jest.fn(() => []),
}));

// ── App de prueba ──────────────────────────────────────────
const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/auth', require('../routes/auth'));
  return app;
};

const app = buildApp();

// ── POST /auth/register ───────────────────────────────────
describe('POST /auth/register', () => {
  beforeEach(() => { mockUsers.length = 0; });

  it('registra un usuario con datos válidos — rol siempre es asistente', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ nombre: 'Ana Lopez', email: 'ana@test.com', password: '12345678' });

    expect(res.status).toBe(201);
    expect(res.body.usuario).toMatchObject({
      nombre  : 'Ana Lopez',
      email   : 'ana@test.com',
      rol     : 'asistente',
      permisos: [],
    });
  });

  it('ignora rol del body — siempre crea como asistente (seguridad)', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ nombre: 'Pedro Gomez', email: 'pedro@test.com', password: '12345678', rol: 'organizador' });

    expect(res.status).toBe(201);
    // El rol del body es ignorado — usuario nace como asistente
    expect(res.body.usuario.rol).toBe('asistente');
  });

  it('ignora rol admin_global del body — siempre crea como asistente', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ nombre: 'Admin Test', email: 'admin@test.com', password: '12345678', rol: 'admin_global' });

    expect(res.status).toBe(201);
    expect(res.body.usuario.rol).toBe('asistente');
  });

  it('ignora permisos del body — siempre crea con permisos vacíos', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ nombre: 'Carlos Test', email: 'carlos@test.com', password: '12345678', permisos: ['usuarios:ver'] });

    expect(res.status).toBe(201);
    // Permisos del body ignorados
    expect(res.body.usuario.permisos).toEqual([]);
  });

  it('retorna 400 si falta el nombre', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'x@test.com', password: '12345678' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('retorna 400 si nombre tiene menos de 2 caracteres', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ nombre: 'X', email: 'x@test.com', password: '12345678' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/nombre/i);
  });

  it('retorna 400 si falta el email', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ nombre: 'Test User', password: '12345678' });

    expect(res.status).toBe(400);
  });

  it('retorna 400 si el email tiene formato inválido', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ nombre: 'Test User', email: 'notanemail', password: '12345678' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/email/i);
  });

  it('retorna 400 si falta el password', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ nombre: 'Test User', email: 'x@test.com' });

    expect(res.status).toBe(400);
  });

  it('retorna 400 si password tiene menos de 8 caracteres', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ nombre: 'Test User', email: 'x@test.com', password: '1234' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/8 caracteres/i);
  });

  it('retorna 409 si el email ya está registrado', async () => {
    await request(app)
      .post('/auth/register')
      .send({ nombre: 'Ana Lopez', email: 'dup@test.com', password: '12345678' });

    const res = await request(app)
      .post('/auth/register')
      .send({ nombre: 'Otro Usuario', email: 'dup@test.com', password: '87654321' });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/ya existe/i);
  });

  it('rol inválido en body es ignorado — igual registra como asistente', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ nombre: 'Test User', email: 'test@test.com', password: '12345678', rol: 'superusuario' });

    // El rol inválido es ignorado silenciosamente (no se valida — se descarta)
    expect(res.status).toBe(201);
    expect(res.body.usuario.rol).toBe('asistente');
  });

  it('permisos inválidos en body son ignorados — igual registra con permisos vacíos', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ nombre: 'Test User', email: 'x2@test.com', password: '12345678', permisos: ['permiso:inexistente'] });

    expect(res.status).toBe(201);
    expect(res.body.usuario.permisos).toEqual([]);
  });

  it('permisos no-array son ignorados — retorna permisos vacíos', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ nombre: 'Test User', email: 'x3@test.com', password: '12345678', permisos: 'no-array' });

    expect(res.status).toBe(201);
    expect(res.body.usuario.permisos).toEqual([]);
  });
});

// ── POST /auth/login ──────────────────────────────────────
describe('POST /auth/login', () => {
  beforeEach(async () => {
    mockUsers.length = 0;
    // Pre-registrar usuario base para los tests de login
    // Nota: rol es ignorado, se crea como asistente
    await request(app)
      .post('/auth/register')
      .send({ nombre: 'Luis Torres', email: 'luis@test.com', password: 'pass1234' });
  });

  it('hace login exitoso y retorna token JWT', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'luis@test.com', password: 'pass1234' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.usuario.rol).toBe('asistente');
  });

  it('el JWT contiene rol y permisos del usuario', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'luis@test.com', password: 'pass1234' });

    const jwt     = require('jsonwebtoken');
    const decoded = jwt.decode(res.body.token);
    expect(decoded.rol).toBe('asistente');
    expect(decoded.permisos).toBeDefined();
    expect(Array.isArray(decoded.permisos)).toBe(true);
  });

  it('retorna 401 con password incorrecta', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'luis@test.com', password: 'INCORRECTA' });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/incorrectos/i);
  });

  it('retorna 401 con email que no existe', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'noexiste@test.com', password: 'pass1234' });

    expect(res.status).toBe(401);
  });

  it('retorna 400 si falta el email', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ password: 'pass1234' });

    expect(res.status).toBe(400);
  });

  it('retorna 400 si falta el password', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'luis@test.com' });

    expect(res.status).toBe(400);
  });
});
