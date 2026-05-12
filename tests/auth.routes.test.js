/**
 * tests/auth.routes.test.js
 * Tests de integración para POST /auth/register, POST /auth/login, GET /auth/me
 *
 * Mockea Supabase y bcryptjs para correr sin base de datos real.
 */

const request = require('supertest');
const express = require('express');

// ── Mocks ──────────────────────────────────────────────────
// La variable debe empezar con 'mock' para que babel-jest no la bloquee en el factory.
const mockUsers = [];

// Mock rápido de bcryptjs (evita el costo de 10 rondas en CI)
jest.mock('bcryptjs', () => ({
  hash   : jest.fn(async (pwd) => `hashed:${pwd}`),
  compare: jest.fn(async (pwd, hash) => hash === `hashed:${pwd}`),
}));

// Mock de Supabase con almacén en memoria
jest.mock('../db/supabase', () => {
  const makeChain = (pendingInsert) => ({
    select: () => {
      if (pendingInsert !== null) {
        // Flujo: insert().select().single()
        return {
          single: async () => {
            const user = { id: Date.now(), ...pendingInsert, created_at: new Date().toISOString() };
            mockUsers.push(user);
            return { data: user, error: null };
          },
        };
      }
      // Flujo: select().eq().maybeSingle() | .single()
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

// Mock del servicio de notificaciones
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

  it('registra un usuario con datos válidos (rol por defecto: asistente)', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ nombre: 'Ana', email: 'ana@test.com', password: '1234' });

    expect(res.status).toBe(201);
    expect(res.body.usuario).toMatchObject({
      nombre  : 'Ana',
      email   : 'ana@test.com',
      rol     : 'asistente',
      permisos: [],
    });
  });

  it('registra un usuario con rol organizador', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ nombre: 'Pedro', email: 'pedro@test.com', password: '1234', rol: 'organizador' });

    expect(res.status).toBe(201);
    expect(res.body.usuario.rol).toBe('organizador');
  });

  it('registra un usuario con rol admin_global', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ nombre: 'Admin', email: 'admin@test.com', password: 'pass', rol: 'admin_global' });

    expect(res.status).toBe(201);
    expect(res.body.usuario.rol).toBe('admin_global');
  });

  it('acepta permisos granulares válidos', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ nombre: 'Carlos', email: 'carlos@test.com', password: '1234', permisos: ['usuarios:ver'] });

    expect(res.status).toBe(201);
    expect(res.body.usuario.permisos).toContain('usuarios:ver');
  });

  it('retorna 400 si falta el nombre', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'x@test.com', password: '1234' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/obligatorios/i);
  });

  it('retorna 400 si falta el email', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ nombre: 'X', password: '1234' });

    expect(res.status).toBe(400);
  });

  it('retorna 400 si falta el password', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ nombre: 'X', email: 'x@test.com' });

    expect(res.status).toBe(400);
  });

  it('retorna 409 si el email ya está registrado', async () => {
    await request(app)
      .post('/auth/register')
      .send({ nombre: 'Ana', email: 'dup@test.com', password: '1234' });

    const res = await request(app)
      .post('/auth/register')
      .send({ nombre: 'Otro', email: 'dup@test.com', password: 'abcd' });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/ya existe/i);
  });

  it('retorna 400 si el rol es inválido', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ nombre: 'X', email: 'x@test.com', password: '1234', rol: 'superusuario' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/rol inválido/i);
    expect(res.body.roles_validos).toBeDefined();
  });

  it('retorna 400 si los permisos contienen valores inválidos', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ nombre: 'X', email: 'x@test.com', password: '1234', permisos: ['permiso:inexistente'] });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/permisos inválidos/i);
  });

  it('ignora permisos si no son un array', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ nombre: 'X', email: 'x2@test.com', password: '1234', permisos: 'no-array' });

    expect(res.status).toBe(201);
    expect(res.body.usuario.permisos).toEqual([]);
  });
});

// ── POST /auth/login ──────────────────────────────────────
describe('POST /auth/login', () => {
  beforeEach(async () => {
    mockUsers.length = 0;
    // Pre-registrar usuario base para los tests de login
    await request(app)
      .post('/auth/register')
      .send({ nombre: 'Luis', email: 'luis@test.com', password: 'pass123', rol: 'organizador' });
  });

  it('hace login exitoso y retorna token JWT', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'luis@test.com', password: 'pass123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.usuario.rol).toBe('organizador');
  });

  it('el JWT contiene rol y permisos', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'luis@test.com', password: 'pass123' });

    const jwt     = require('jsonwebtoken');
    const decoded = jwt.decode(res.body.token);
    expect(decoded.rol).toBe('organizador');
    expect(decoded.permisos).toBeDefined();
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
      .send({ email: 'noexiste@test.com', password: 'pass123' });

    expect(res.status).toBe(401);
  });

  it('retorna 400 si falta el email', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ password: 'pass123' });

    expect(res.status).toBe(400);
  });

  it('retorna 400 si falta el password', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'luis@test.com' });

    expect(res.status).toBe(400);
  });
});
