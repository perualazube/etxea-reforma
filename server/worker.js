// Etxea API proxy (Cloudflare Worker).
// Holds the Gemini key server-side, checks the user's access code and charges credits per generation.
// Codes live in the CODES KV namespace under their SHA-256, never in clear: key `code:<sha256 hex>` → {"name":"...","credits":30}.

const GEM = 'https://generativelanguage.googleapis.com';
const COST = { image: 1, video: 10, text: 0 };

const json = (status, obj, cors) => new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store', ...cors } });
const fail = (status, message, cors) => json(status, { error: { message } }, cors);

function corsFor(req, env) {
  const origin = req.headers.get('Origin') || '';
  const allowed = String(env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  const ok = allowed.includes(origin) || allowed.includes('*');
  return ok ? { 'Access-Control-Allow-Origin': origin || '*', 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Max-Age': '86400', 'Vary': 'Origin' } : {};
}

// What a POST /v1beta/interactions costs: the dearer of the requested output type and the model's own kind,
// so a video or image model cannot be called for free by leaving out response_format.
export function costOf(body) {
  const type = String(body?.response_format?.type || 'text').toLowerCase();
  const model = String(body?.model || '').toLowerCase();
  const byModel = /omni|veo/.test(model) ? COST.video : /image|banana|imagen/.test(model) ? COST.image : COST.text;
  return Math.max(COST[type] ?? COST.image, byModel);
}

// Only the fields the app sends reach Google: no tools, agents or other paid extras through our key.
const BODY_FIELDS = ['model', 'input', 'response_format', 'generation_config', 'system_instruction'];
export const cleanBody = body => {
  const out = Object.fromEntries(BODY_FIELDS.filter(k => body?.[k] !== undefined).map(k => [k, body[k]]));
  // Sizes are fixed so a request cannot ask for dearer 4K photos or 1080p videos.
  const rf = out.response_format;
  if (rf && typeof rf === 'object') {
    out.response_format = { ...rf };
    if ('image_size' in rf && !['1K', '2K'].includes(rf.image_size)) out.response_format.image_size = '2K';
    if ('resolution' in rf) out.response_format.resolution = '720p';
  }
  return out;
};

const MAX_BODY = 25 * 1024 * 1024;
// Workers rate-limit bindings (wrangler.toml [[ratelimits]]); missing bindings mean no limit, as in tests.
async function limited(binding, key) {
  if (!binding) return false;
  try { const { success } = await binding.limit({ key }); return !success; } catch { return false; }
}

export async function hashCode(code) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(code));
  return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, '0')).join('');
}
async function account(code, env) {
  if (!code) return null;
  // Codes are issued in upper case; accept them typed in lower case or with spaces.
  const id = 'code:' + await hashCode(code.replace(/\s+/g, '').toUpperCase());
  const raw = await env.CODES.get(id);
  return raw ? { id, ...JSON.parse(raw) } : null;
}

// KV is eventually consistent: good enough for a closed beta, move credits to a database before opening sign-ups.
async function addCredits(acc, delta, env) {
  acc.credits = (acc.credits || 0) + delta;
  const { id, ...rest } = acc;
  await env.CODES.put(id, JSON.stringify(rest));
}

function upstream(path, search, init, env) {
  const u = new URL(GEM + path + search);
  u.searchParams.delete('key');
  const headers = { 'x-goog-api-key': env.GEMINI_KEY };
  if (init.body) headers['Content-Type'] = 'application/json';
  return fetch(u, { ...init, headers });
}

// Launch waiting list from the landing page: one KV entry per email, no account needed.
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,}$/i;
async function waitlist(req, env, cors) {
  let body;
  try { body = await req.json(); } catch { return fail(400, 'Petición no válida', cors); }
  const email = String(body.email || '').trim().toLowerCase();
  if (!EMAIL.test(email)) return fail(400, 'Ese email no parece válido', cors);
  if (body.consent !== true) return fail(400, 'Hace falta aceptar la política de privacidad', cors);
  const key = 'wait:' + email;
  if (!(await env.CODES.get(key))) {
    const who = String(body.profile || '').slice(0, 40);
    await env.CODES.put(key, JSON.stringify({ at: new Date().toISOString(), profile: who, source: String(body.source || '').slice(0, 60) }));
  }
  return json(200, { ok: true }, cors);
}

export default {
  async fetch(req, env) {
    const cors = corsFor(req, env);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    const url = new URL(req.url);
    const path = url.pathname;
    const ip = req.headers.get('CF-Connecting-IP') || 'local';
    if (Number(req.headers.get('Content-Length') || 0) > MAX_BODY) return fail(413, 'Petición demasiado grande', cors);
    if (path === '/' || path === '/health') return json(200, { ok: true }, cors);
    if (path === '/waitlist' && req.method === 'POST') {
      if (await limited(env.RL_IP, 'w:' + ip)) return fail(429, 'Demasiados intentos, prueba en un minuto', cors);
      return waitlist(req, env, cors);
    }
    if (!path.startsWith('/v1beta/')) return fail(404, 'Ruta no encontrada', cors);

    const code = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim().slice(0, 100);
    const acc = await account(code, env);
    if (!acc) {
      // Slow down anyone guessing codes.
      if (await limited(env.RL_IP, 'c:' + ip)) return fail(429, 'Demasiados intentos, prueba en un minuto', cors);
      return fail(401, 'Código de acceso no válido', cors);
    }
    if (acc.disabled) return fail(403, 'Este código está desactivado', cors);
    if (await limited(env.RL_API, code)) return fail(429, 'Demasiadas peticiones seguidas, espera un momento', cors);

    if (path === '/v1beta/credits') return json(200, { name: acc.name || '', credits: acc.credits || 0 }, cors);

    if (req.method === 'POST' && path === '/v1beta/interactions') {
      let body;
      try { body = cleanBody(await req.json()); } catch { return fail(400, 'Petición no válida', cors); }
      const allowed = String(env.ALLOWED_MODELS || '').split(',').map(s => s.trim()).filter(Boolean);
      if (allowed.length && !allowed.includes(String(body.model || ''))) return fail(403, 'Modelo no permitido en este servidor: ' + body.model, cors);
      const cost = costOf(body);
      // Text is free but still needs an account with credits left.
      if ((acc.credits || 0) < Math.max(cost, 1)) return fail(402, 'Sin créditos', cors);
      if (cost) await addCredits(acc, -cost, env);
      const r = await upstream(path, '', { method: 'POST', body: JSON.stringify(body) }, env);
      if (!r.ok && cost) await addCredits(acc, cost, env);
      return new Response(r.body, { status: r.status, headers: { 'Content-Type': r.headers.get('Content-Type') || 'application/json', ...cors } });
    }

    // Read-only calls the app makes: poll an interaction, check or download a file, list models.
    if (req.method === 'GET' && /^\/v1beta\/(interactions\/|files\/|models)/.test(path)) {
      const r = await upstream(path, url.search, { method: 'GET' }, env);
      return new Response(r.body, { status: r.status, headers: { 'Content-Type': r.headers.get('Content-Type') || 'application/octet-stream', ...cors } });
    }
    return fail(404, 'Ruta no encontrada', cors);
  }
};
