import test from 'node:test';
import assert from 'node:assert/strict';
import worker, { costOf, hashCode } from './worker.js';

function kv(init = {}) { const m = new Map(Object.entries(init)); return { get: async k => m.get(k) ?? null, put: async (k, v) => { m.set(k, v); }, m }; }
const ORIGIN = 'https://perualazube.github.io';
function env(credits = 5) { return { GEMINI_KEY: 'SECRET', ALLOWED_ORIGINS: ORIGIN, ALLOWED_MODELS: 'img-model,txt-model', CODES: kv({ [H]: JSON.stringify({ name: 'Ana', credits }) }) }; }
const req = (path, init = {}) => new Request('https://api.test' + path, { ...init, headers: { Origin: ORIGIN, ...(init.headers || {}) } });
const auth = { Authorization: 'Bearer ABC' };
const credits = e => JSON.parse(e.CODES.m.get(H)).credits;
const H = 'code:b5d4045c3f466fa91fe2cc6abe79232a1a57cdf104f7a26e716e0a1e2789df78';
let calls = [];
function mockFetch(status = 200, body = { id: 'x' }) { calls = []; globalThis.fetch = async (u, init) => { calls.push({ u: String(u), init }); return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }); }; }

test('cost by output type', () => {
  assert.equal(costOf({ response_format: { type: 'image' } }), 1);
  assert.equal(costOf({ response_format: { type: 'video' } }), 10);
  assert.equal(costOf({}), 0);
});

test('rejects missing or unknown code', async () => {
  mockFetch();
  assert.equal((await worker.fetch(req('/v1beta/credits'), env())).status, 401);
  assert.equal((await worker.fetch(req('/v1beta/credits', { headers: { Authorization: 'Bearer NOPE' } }), env())).status, 401);
});

test('reports credits with CORS', async () => {
  const r = await worker.fetch(req('/v1beta/credits', { headers: auth }), env(7));
  assert.equal(r.status, 200);
  assert.equal((await r.json()).credits, 7);
  assert.equal(r.headers.get('Access-Control-Allow-Origin'), ORIGIN);
});

test('image generation charges 1 credit and uses the server key', async () => {
  mockFetch(); const e = env(5);
  const r = await worker.fetch(req('/v1beta/interactions', { method: 'POST', headers: auth, body: JSON.stringify({ model: 'img-model', response_format: { type: 'image' } }) }), e);
  assert.equal(r.status, 200);
  assert.equal(credits(e), 4);
  assert.equal(calls[0].init.headers['x-goog-api-key'], 'SECRET');
  assert.ok(!calls[0].u.includes('ABC'));
});

test('no credits → 402 and Google is not called', async () => {
  mockFetch(); const e = env(0);
  const r = await worker.fetch(req('/v1beta/interactions', { method: 'POST', headers: auth, body: JSON.stringify({ model: 'img-model', response_format: { type: 'image' } }) }), e);
  assert.equal(r.status, 402); assert.equal(calls.length, 0);
});

test('Google error refunds the credit', async () => {
  mockFetch(500, { error: { message: 'boom' } }); const e = env(5);
  const r = await worker.fetch(req('/v1beta/interactions', { method: 'POST', headers: auth, body: JSON.stringify({ model: 'img-model', response_format: { type: 'image' } }) }), e);
  assert.equal(r.status, 500); assert.equal(credits(e), 5);
});

test('blocks models outside the allow list', async () => {
  mockFetch(); const e = env(5);
  const r = await worker.fetch(req('/v1beta/interactions', { method: 'POST', headers: auth, body: JSON.stringify({ model: 'expensive', response_format: { type: 'image' } }) }), e);
  assert.equal(r.status, 403); assert.equal(credits(e), 5);
});

test('download strips any key from the query and adds the server key', async () => {
  mockFetch();
  const r = await worker.fetch(req('/v1beta/files/abc:download?alt=media&key=LEAK', { headers: auth }), env());
  assert.equal(r.status, 200);
  assert.ok(!calls[0].u.includes('LEAK')); assert.ok(calls[0].u.includes('alt=media'));
});

test('unknown origin gets no CORS header', async () => {
  const r = await worker.fetch(new Request('https://api.test/v1beta/credits', { headers: { Origin: 'https://evil.test', ...auth } }), env());
  assert.equal(r.headers.get('Access-Control-Allow-Origin'), null);
});

test('waitlist stores a valid email once, with consent', async () => {
  const e = env();
  const post = body => worker.fetch(req('/waitlist', { method: 'POST', body: JSON.stringify(body) }), e);
  assert.equal((await post({ email: 'no-es-email', consent: true })).status, 400);
  assert.equal((await post({ email: 'ana@ejemplo.com' })).status, 400);
  const r = await post({ email: ' Ana@Ejemplo.com ', consent: true, profile: 'particular' });
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('Access-Control-Allow-Origin'), ORIGIN);
  const saved = JSON.parse(e.CODES.m.get('wait:ana@ejemplo.com'));
  assert.equal(saved.profile, 'particular');
  await post({ email: 'ana@ejemplo.com', consent: true, profile: 'otro' });
  assert.equal(JSON.parse(e.CODES.m.get('wait:ana@ejemplo.com')).profile, 'particular');
});

test('model kind sets the minimum cost', () => {
  assert.equal(costOf({ model: 'gemini-omni-1.1-flash' }), 10);
  assert.equal(costOf({ model: 'gemini-nano-banana-2.1', response_format: { type: 'text' } }), 1);
  assert.equal(costOf({ model: 'gemini-3.8-flash' }), 0);
});

test('only known fields are forwarded to Google', async () => {
  mockFetch(); const e = env(5);
  await worker.fetch(req('/v1beta/interactions', { method: 'POST', headers: auth, body: JSON.stringify({ model: 'txt-model', input: 'hola', tools: [{ google_search: {} }], agent: 'x' }) }), e);
  const sent = JSON.parse(calls[0].init.body);
  assert.deepEqual(Object.keys(sent).sort(), ['input', 'model']);
});

test('text needs credits left even though it is free', async () => {
  mockFetch(); const e = env(0);
  const r = await worker.fetch(req('/v1beta/interactions', { method: 'POST', headers: auth, body: JSON.stringify({ model: 'txt-model', input: 'hola' }) }), e);
  assert.equal(r.status, 402); assert.equal(calls.length, 0);
});

test('rate limit and disabled codes', async () => {
  mockFetch(); const e = env(5); e.RL_API = { limit: async () => ({ success: false }) };
  assert.equal((await worker.fetch(req('/v1beta/credits', { headers: auth }), e)).status, 429);
  const d = env(5); d.CODES.m.set(H, JSON.stringify({ credits: 5, disabled: true }));
  assert.equal((await worker.fetch(req('/v1beta/credits', { headers: auth }), d)).status, 403);
});

test('codes are stored hashed, never in clear', async () => {
  assert.equal(await hashCode('ABC'), H.slice(5));
  const e = env(5); e.CODES.m.set('code:ABC', JSON.stringify({ credits: 5 })); e.CODES.m.delete(H);
  assert.equal((await worker.fetch(req('/v1beta/credits', { headers: auth }), e)).status, 401);
});

test('accepts the code typed in lower case or with spaces', async () => {
  const r = await worker.fetch(req('/v1beta/credits', { headers: { Authorization: 'Bearer a bc' } }), env(3));
  assert.equal(r.status, 200);
  assert.equal((await r.json()).credits, 3);
});
