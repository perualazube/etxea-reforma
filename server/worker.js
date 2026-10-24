// Etxea API proxy (Cloudflare Worker).
// Holds the Gemini key server-side, checks the user's access code and charges credits per generation.
// Codes live in the CODES KV namespace: key `code:<code>` → {"name":"...","credits":30}.

const GEM = 'https://generativelanguage.googleapis.com';
const COST = { image: 1, video: 10, text: 0 };

const json = (status, obj, cors) => new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', ...cors } });
const fail = (status, message, cors) => json(status, { error: { message } }, cors);

function corsFor(req, env) {
  const origin = req.headers.get('Origin') || '';
  const allowed = String(env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  const ok = allowed.includes(origin) || allowed.includes('*');
  return ok ? { 'Access-Control-Allow-Origin': origin || '*', 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Max-Age': '86400', 'Vary': 'Origin' } : {};
}

// What a POST /v1beta/interactions costs, from the requested output type.
export function costOf(body) {
  const type = String(body?.response_format?.type || 'text').toLowerCase();
  return COST[type] ?? COST.image;
}

async function account(code, env) {
  if (!code) return null;
  const raw = await env.CODES.get('code:' + code);
  return raw ? JSON.parse(raw) : null;
}

// KV is eventually consistent: good enough for a closed beta, move credits to a database before opening sign-ups.
async function addCredits(code, acc, delta, env) {
  acc.credits = (acc.credits || 0) + delta;
  await env.CODES.put('code:' + code, JSON.stringify(acc));
}

function upstream(path, search, init, env) {
  const u = new URL(GEM + path + search);
  u.searchParams.delete('key');
  const headers = { 'x-goog-api-key': env.GEMINI_KEY };
  if (init.body) headers['Content-Type'] = 'application/json';
  return fetch(u, { ...init, headers });
}

export default {
  async fetch(req, env) {
    const cors = corsFor(req, env);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    const url = new URL(req.url);
    const path = url.pathname;
    if (path === '/' || path === '/health') return json(200, { ok: true }, cors);
    if (!path.startsWith('/v1beta/')) return fail(404, 'Ruta no encontrada', cors);

    const code = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim();
    const acc = await account(code, env);
    if (!acc) return fail(401, 'Código de acceso no válido', cors);

    if (path === '/v1beta/credits') return json(200, { name: acc.name || '', credits: acc.credits || 0 }, cors);

    if (req.method === 'POST' && path === '/v1beta/interactions') {
      let body;
      try { body = await req.json(); } catch { return fail(400, 'Petición no válida', cors); }
      const allowed = String(env.ALLOWED_MODELS || '').split(',').map(s => s.trim()).filter(Boolean);
      if (allowed.length && !allowed.includes(String(body.model || ''))) return fail(403, 'Modelo no permitido en este servidor: ' + body.model, cors);
      const cost = costOf(body);
      if ((acc.credits || 0) < cost) return fail(402, 'Sin créditos', cors);
      if (cost) await addCredits(code, acc, -cost, env);
      const r = await upstream(path, '', { method: 'POST', body: JSON.stringify(body) }, env);
      if (!r.ok && cost) await addCredits(code, acc, cost, env);
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
