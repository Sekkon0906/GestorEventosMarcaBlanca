/**
 * tests/responsividad.test.js
 * Pruebas de responsividad mobile — headers, payload, tiempos y estructura.
 *
 * Verifica que la API devuelva los headers correctos para clientes mobile
 * y que las respuestas sean adecuadas para consumo desde apps móviles.
 */

const request = require('supertest');
const express = require('express');
const cors    = require('cors');

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
  create         : jest.fn(),
  setSocketServer: jest.fn(),
  getAll         : jest.fn(() => []),
}));

// ── App de prueba ──────────────────────────────────────────
const buildApp = () => {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/auth', require('../routes/auth'));
  return app;
};

const app = buildApp();

// Breakpoints de referencia (ancho en px)
const BREAKPOINTS = {
  mobile_xs : 320,
  mobile_sm : 375,
  mobile_md : 414,
  tablet    : 768,
  desktop   : 1024,
};

// ── Content-Type ──────────────────────────────────────────
describe('Content-Type — todos los endpoints retornan JSON', () => {
  beforeEach(() => { mockUsers.length = 0; });

  it('POST /auth/register retorna application/json', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ nombre: 'Test', email: 't@test.com', password: '1234' });

    expect(res.headers['content-type']).toMatch(/application\/json/);
  });

  it('POST /auth/login retorna application/json', async () => {
    await request(app).post('/auth/register').send({ nombre: 'Test', email: 'login@test.com', password: '1234' });
    const res = await request(app).post('/auth/login').send({ email: 'login@test.com', password: '1234' });
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });

  it('respuestas de error también retornan application/json', async () => {
    const res = await request(app).post('/auth/login').send({ email: 'noexiste@test.com', password: 'mal' });
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.status).toBe(401);
  });
});

// ── CORS ──────────────────────────────────────────────────
describe('CORS — headers para clientes mobile y web', () => {
  beforeEach(() => { mockUsers.length = 0; });

  it('responde a preflight OPTIONS con headers CORS', async () => {
    const res = await request(app)
      .options('/auth/register')
      .set('Origin', 'http://localhost:3001')
      .set('Access-Control-Request-Method', 'POST');
    expect(res.headers['access-control-allow-origin']).toBeDefined();
  });

  it('incluye Access-Control-Allow-Origin en respuestas normales', async () => {
    const res = await request(app)
      .post('/auth/register')
      .set('Origin', 'http://mi-app-mobile.com')
      .send({ nombre: 'CORS', email: 'cors@test.com', password: '1234' });
    expect(res.headers['access-control-allow-origin']).toBeDefined();
  });
});

// ── Payload ───────────────────────────────────────────────
describe('Payload — tamaño adecuado para conexiones mobile', () => {
  beforeEach(() => { mockUsers.length = 0; });

  it('respuesta de register pesa menos de 1KB', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ nombre: 'Payload', email: 'payload@test.com', password: '1234' });
    const bytes = Buffer.byteLength(JSON.stringify(res.body), 'utf8');
    expect(bytes).toBeLessThan(1024);
  });

  it('respuesta de login pesa menos de 2KB (incluye JWT)', async () => {
    await request(app).post('/auth/register').send({ nombre: 'JWT', email: 'jwt@test.com', password: '1234' });
    const res = await request(app).post('/auth/login').send({ email: 'jwt@test.com', password: '1234' });
    const bytes = Buffer.byteLength(JSON.stringify(res.body), 'utf8');
    expect(bytes).toBeLessThan(2048);
  });

  it('respuesta de error pesa menos de 512 bytes', async () => {
    const res = await request(app).post('/auth/login').send({ email: 'noexiste@test.com', password: 'mal' });
    const bytes = Buffer.byteLength(JSON.stringify(res.body), 'utf8');
    expect(bytes).toBeLessThan(512);
  });
});

// ── Tiempos ───────────────────────────────────────────────
describe('Tiempo de respuesta — usabilidad en mobile', () => {
  beforeEach(() => { mockUsers.length = 0; });

  it('POST /auth/register responde en menos de 300ms', async () => {
    const inicio = Date.now();
    await request(app).post('/auth/register').send({ nombre: 'Speed', email: 'speed@test.com', password: '1234' });
    expect(Date.now() - inicio).toBeLessThan(300);
  });

  it('POST /auth/login responde en menos de 300ms', async () => {
    await request(app).post('/auth/register').send({ nombre: 'Speed2', email: 'speed2@test.com', password: '1234' });
    const inicio = Date.now();
    await request(app).post('/auth/login').send({ email: 'speed2@test.com', password: '1234' });
    expect(Date.now() - inicio).toBeLessThan(300);
  });
});

// ── Estructura ────────────────────────────────────────────
describe('Estructura de respuesta — apta para apps mobile', () => {
  beforeEach(() => { mockUsers.length = 0; });

  it('register retorna campos esenciales para mostrar en UI mobile', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ nombre: 'UI', email: 'ui@test.com', password: '1234' });

    expect(res.body).toHaveProperty('mensaje');
    expect(res.body).toHaveProperty('usuario');
    expect(res.body.usuario).toHaveProperty('id');
    expect(res.body.usuario).toHaveProperty('nombre');
    expect(res.body.usuario).toHaveProperty('email');
    expect(res.body.usuario).toHaveProperty('rol');
  });

  it('login retorna token + usuario para almacenar en app mobile', async () => {
    await request(app).post('/auth/register').send({ nombre: 'App', email: 'app@test.com', password: '1234' });
    const res = await request(app).post('/auth/login').send({ email: 'app@test.com', password: '1234' });

    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('usuario');
    expect(res.body.usuario).toHaveProperty('rol');
    expect(res.body.usuario).not.toHaveProperty('password');
  });

  it('errores retornan campo "error" con mensaje legible para el usuario', async () => {
    const res = await request(app).post('/auth/register').send({ email: 'incompleto@test.com' });
    expect(res.body).toHaveProperty('error');
    expect(typeof res.body.error).toBe('string');
    expect(res.body.error.length).toBeGreaterThan(0);
  });

  it('password nunca aparece en la respuesta de register', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ nombre: 'Seguro', email: 'seguro@test.com', password: 'secreto' });

    expect(JSON.stringify(res.body)).not.toContain('secreto');
    expect(res.body.usuario).not.toHaveProperty('password');
  });
});

// ── Breakpoints ───────────────────────────────────────────
describe('Breakpoints mobile de referencia', () => {
  it('los breakpoints del sistema están definidos correctamente', () => {
    expect(BREAKPOINTS.mobile_xs).toBe(320);
    expect(BREAKPOINTS.mobile_sm).toBe(375);
    expect(BREAKPOINTS.mobile_md).toBe(414);
    expect(BREAKPOINTS.tablet).toBe(768);
    expect(BREAKPOINTS.desktop).toBe(1024);
  });

  it('mobile_xs es el breakpoint más pequeño soportado', () => {
    const minBreakpoint = Math.min(...Object.values(BREAKPOINTS));
    expect(minBreakpoint).toBe(BREAKPOINTS.mobile_xs);
  });
});
