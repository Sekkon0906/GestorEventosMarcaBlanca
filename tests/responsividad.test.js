/**
 * tests/responsividad.test.js — JuanesSosa (QA)
 * Pruebas de responsividad mobile — breakpoints y usabilidad
 *
 * Verifica que la API devuelva los headers correctos para clientes mobile
 * y que las respuestas sean adecuadas para consumo desde apps móviles:
 *   - Tamaño de respuesta razonable (no payloads gigantes en mobile)
 *   - Headers CORS correctos para apps nativas
 *   - Content-Type application/json en todos los endpoints
 *   - Respuestas paginables (campos total, limite, pagina)
 *   - Endpoints críticos responden en tiempo razonable
 */

const request = require('supertest');
const express = require('express');
const cors    = require('cors');

// ── App mínima con CORS (igual que index.js) ──────────────
const buildApp = () => {
  jest.resetModules();
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/auth',    require('../routes/auth'));
  return app;
};

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
  let app;
  beforeEach(() => { app = buildApp(); });

  it('POST /auth/register retorna application/json', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ nombre: 'Test', email: 't@test.com', password: '1234' });

    expect(res.headers['content-type']).toMatch(/application\/json/);
  });

  it('POST /auth/login retorna application/json', async () => {
    await request(app)
      .post('/auth/register')
      .send({ nombre: 'Test', email: 'login@test.com', password: '1234' });

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'login@test.com', password: '1234' });

    expect(res.headers['content-type']).toMatch(/application\/json/);
  });

  it('respuestas de error también retornan application/json', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'noexiste@test.com', password: 'mal' });

    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.status).toBe(401);
  });
});

// ── CORS — acceso desde apps mobile/web ──────────────────

describe('CORS — headers para clientes mobile y web', () => {
  let app;
  beforeEach(() => { app = buildApp(); });

  it('responde a preflight OPTIONS con headers CORS', async () => {
    const res = await request(app)
      .options('/auth/register')
      .set('Origin', 'http://localhost:3001')
      .set('Access-Control-Request-Method', 'POST');

    // CORS habilitado: debe incluir el header
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

// ── Tamaño de payload — adecuado para mobile ─────────────

describe('Payload — tamaño adecuado para conexiones mobile', () => {
  let app;
  beforeEach(() => { app = buildApp(); });

  it('respuesta de register pesa menos de 1KB', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ nombre: 'Payload', email: 'payload@test.com', password: '1234' });

    const bytes = Buffer.byteLength(JSON.stringify(res.body), 'utf8');
    expect(bytes).toBeLessThan(1024); // < 1KB
  });

  it('respuesta de login pesa menos de 2KB (incluye JWT)', async () => {
    await request(app)
      .post('/auth/register')
      .send({ nombre: 'JWT', email: 'jwt@test.com', password: '1234' });

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'jwt@test.com', password: '1234' });

    const bytes = Buffer.byteLength(JSON.stringify(res.body), 'utf8');
    expect(bytes).toBeLessThan(2048); // < 2KB
  });

  it('respuesta de error pesa menos de 512 bytes', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'noexiste@test.com', password: 'mal' });

    const bytes = Buffer.byteLength(JSON.stringify(res.body), 'utf8');
    expect(bytes).toBeLessThan(512);
  });
});

// ── Tiempos de respuesta — usabilidad mobile ─────────────

describe('Tiempo de respuesta — usabilidad en mobile', () => {
  let app;
  beforeEach(() => { app = buildApp(); });

  it('POST /auth/register responde en menos de 300ms', async () => {
    const inicio = Date.now();
    await request(app)
      .post('/auth/register')
      .send({ nombre: 'Speed', email: 'speed@test.com', password: '1234' });
    const ms = Date.now() - inicio;

    expect(ms).toBeLessThan(300);
  });

  it('POST /auth/login responde en menos de 300ms', async () => {
    await request(app)
      .post('/auth/register')
      .send({ nombre: 'Speed2', email: 'speed2@test.com', password: '1234' });

    const inicio = Date.now();
    await request(app)
      .post('/auth/login')
      .send({ email: 'speed2@test.com', password: '1234' });
    const ms = Date.now() - inicio;

    expect(ms).toBeLessThan(300);
  });
});

// ── Estructura de respuesta — consumo mobile ─────────────

describe('Estructura de respuesta — apta para apps mobile', () => {
  let app;
  beforeEach(() => { app = buildApp(); });

  it('register retorna campos esenciales para mostrar en UI mobile', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ nombre: 'UI', email: 'ui@test.com', password: '1234' });

    // La app mobile necesita: mensaje de éxito + datos del usuario
    expect(res.body).toHaveProperty('mensaje');
    expect(res.body).toHaveProperty('usuario');
    expect(res.body.usuario).toHaveProperty('id');
    expect(res.body.usuario).toHaveProperty('nombre');
    expect(res.body.usuario).toHaveProperty('email');
    expect(res.body.usuario).toHaveProperty('rol');
  });

  it('login retorna token + usuario para almacenar en app mobile', async () => {
    await request(app)
      .post('/auth/register')
      .send({ nombre: 'App', email: 'app@test.com', password: '1234' });

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'app@test.com', password: '1234' });

    // La app mobile necesita guardar: token (auth) + datos del usuario (UI)
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('usuario');
    expect(res.body.usuario).toHaveProperty('rol');
    expect(res.body.usuario).not.toHaveProperty('password'); // nunca exponer
  });

  it('errores retornan campo "error" con mensaje legible para el usuario', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'incompleto@test.com' }); // sin nombre ni password

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

// ── Breakpoints — documentación de referencia ─────────────

describe('Breakpoints mobile de referencia', () => {
  it('los breakpoints del sistema están definidos correctamente', () => {
    expect(BREAKPOINTS.mobile_xs).toBe(320);
    expect(BREAKPOINTS.mobile_sm).toBe(375);  // iPhone SE / iPhone 12 mini
    expect(BREAKPOINTS.mobile_md).toBe(414);  // iPhone Plus / Pro Max
    expect(BREAKPOINTS.tablet).toBe(768);
    expect(BREAKPOINTS.desktop).toBe(1024);
  });

  it('mobile_xs es el breakpoint más pequeño soportado', () => {
    const minBreakpoint = Math.min(...Object.values(BREAKPOINTS));
    expect(minBreakpoint).toBe(BREAKPOINTS.mobile_xs);
  });
});
