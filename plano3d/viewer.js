// 3D viewer for any plan produced by Plano.normalize(), plus the "create from sketch" flow through Gemini.
(function () {
'use strict';
const { normalize, deriveWalls, roomAt, area, promptFor, ETXEA } = window.Plano;
const { t, translatePage, LANG } = window.PlanoI18n;
translatePage();
const STORE = 'etxea-plano3d';
const GEM = 'https://generativelanguage.googleapis.com/v1beta';
const $ = id => document.getElementById(id);
const fmt = n => n.toFixed(1).replace('.', ',');
const lsGet = k => { try { return localStorage.getItem(k); } catch { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch {} };

/* ---------- renderer ---------- */
const stage = $('stage');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
stage.appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 300);
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.maxPolarAngle = Math.PI * 0.49; controls.minDistance = 2.5; controls.maxDistance = 60;
scene.add(new THREE.HemisphereLight(0xffffff, 0xb9b2a4, 0.75));
const sun = new THREE.DirectionalLight(0xfff3e2, 0.85);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0006;
scene.add(sun, sun.target);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ color: 0xc9d1c2, roughness: 1 }));
ground.rotation.x = -Math.PI / 2; ground.position.y = -0.26; ground.receiveShadow = true; scene.add(ground);

/* ---------- textures (grey, tinted per room by material colour) ---------- */
function canvasTex(size, draw) { const c = document.createElement('canvas'); c.width = c.height = size; draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return t; }
function rnd(seed) { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
const TEX = {
  parquet: canvasTex(512, (g, S) => { const r = rnd(7), rows = 16, h = S / rows;
    for (let i = 0; i < rows; i++) { let x = -r() * 120; while (x < S) { const L = 70 + r() * 110, v = 190 + Math.floor(r() * 55);
      g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(x, i * h, L, h); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x, i * h, 1.5, h); x += L; }
      g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(0, i * h, S, 1.2); } }),
  baldosa: tileTex(3, 'rgba(80,70,60,.35)'), bano: tileTex(4, 'rgba(120,110,95,.3)'),
  marmol: canvasTex(512, (g, S) => { g.fillStyle = '#3a2526'; g.fillRect(0, 0, S, S); const r = rnd(3);
    for (let i = 0; i < 46; i++) { g.strokeStyle = `rgba(235,225,220,${.15 + r() * .5})`; g.lineWidth = .6 + r() * 1.8; g.beginPath();
      let x = r() * S, y = r() * S; g.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (r() - .5) * 220; y += (r() - .3) * 160; g.lineTo(x, y); } g.stroke(); } }),
  cemento: canvasTex(256, (g, S) => { const r = rnd(11); g.fillStyle = '#d0d0d0'; g.fillRect(0, 0, S, S); for (let i = 0; i < 3000; i++) { g.fillStyle = `rgba(0,0,0,${r() * .08})`; g.fillRect(r() * S, r() * S, 2, 2); } })
};
function tileTex(n, grout) { return canvasTex(512, (g, S) => { const r = rnd(n * 31), s = S / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const v = 225 + Math.floor(r() * 25); g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(i * s, j * s, s, s); }
  g.strokeStyle = grout; g.lineWidth = 4; for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s, S); g.stroke(); g.beginPath(); g.moveTo(0, i * s); g.lineTo(S, i * s); g.stroke(); } }); }
const TILE = { parquet: 1.4, baldosa: 1.0, bano: 1.2, marmol: 1.6, cemento: 2 };

const M = { corte: new THREE.MeshStandardMaterial({ color: 0xf2efe8, roughness: .85 }), fachada: new THREE.MeshStandardMaterial({ color: 0xd9c9a8, roughness: .85 }),
  slab: new THREE.MeshStandardMaterial({ color: 0x8d877c }), door: new THREE.MeshStandardMaterial({ color: 0xe9e3d8, roughness: .5 }),
  glass: new THREE.MeshStandardMaterial({ color: 0xbcd6de, transparent: true, opacity: .28, roughness: .05, metalness: .1, depthWrite: false }) };

/* ---------- scene state ---------- */
let plan = null, walls = [], group = null, wallGroup = null, mode = 'now', wallH = 2.6, low = false;
let roomMats = {}, itemMeshes = [], labels = [], floorMeshes = [], center = new THREE.Vector3();

function box(x0, x1, y0, y1, z0, z1, mat, parent) { const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), mat);
  m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); m.castShadow = m.receiveShadow = true; parent.add(m); return m; }
function disposeTree(o) { o.traverse(x => { if (x.geometry) x.geometry.dispose(); if (x.material && x.material.map && x.material.map.isCanvasTexture && x.isSprite) x.material.map.dispose(); }); }

function build(p) {
  plan = p; walls = deriveWalls(p); wallH = p.wallHeight;
  if (group) { scene.remove(group); disposeTree(group); }
  group = new THREE.Group(); scene.add(group); roomMats = {}; itemMeshes = []; labels = []; floorMeshes = []; picRoom = null;
  center.set(p.width / 2, 0, p.depth / 2);
  const span = Math.max(p.width, p.depth);
  sun.position.set(center.x + span * .75, 20 + span, center.z + span); sun.target.position.copy(center);
  Object.assign(sun.shadow.camera, { left: -span, right: span, top: span, bottom: -span, near: 1, far: 80 + span * 3 }); sun.shadow.camera.updateProjectionMatrix();
  ground.position.x = center.x; ground.position.z = center.z;
  p.rooms.forEach(r => {
    const wall = new THREE.MeshStandardMaterial({ roughness: .85 });
    const floor = new THREE.MeshStandardMaterial({ map: TEX[r.floor], roughness: r.floor === 'marmol' ? .25 : .55 });
    roomMats[r.id] = { wall, floor };
    box(r.x0, r.x1, -0.25, -0.005, r.z0, r.z1, M.slab, group);
    const pg = new THREE.PlaneGeometry(r.x1 - r.x0, r.z1 - r.z0), uv = pg.attributes.uv, t = TILE[r.floor];
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (r.x1 - r.x0) / t, uv.getY(i) * (r.z1 - r.z0) / t);
    const f = new THREE.Mesh(pg, floor); f.rotation.x = -Math.PI / 2; f.position.set((r.x0 + r.x1) / 2, 0, (r.z0 + r.z1) / 2); f.receiveShadow = true; f.userData.room = r; group.add(f); floorMeshes.push(f);
  });
  p.items.forEach(it => { const mat = new THREE.MeshStandardMaterial({ roughness: .7 }); const m = box(it.x0, it.x1, it.y0, it.y0 + it.h, it.z0, it.z1, mat, group); m.userData.item = it; itemMeshes.push(m); });
  buildWalls(); buildLabels(); buildIndex(); applyMode();
  $('title').textContent = t(p.name); document.title = t(p.name) + ' · ' + t('Plano 3D');
  resize(); camera.position.copy(homePos()); controls.target.copy(home()); controls.update();
}

const wallMat = (x, z) => { const r = roomAt(plan, x, z); return r ? roomMats[r.id].wall : M.fachada; };
function buildWalls() {
  if (wallGroup) { group.remove(wallGroup); disposeTree(wallGroup); }
  wallGroup = new THREE.Group(); group.add(wallGroup);
  const H = low ? 1.0 : wallH;
  const breaks = { x: [...new Set(plan.rooms.flatMap(r => [r.x0, r.x1]))], z: [...new Set(plan.rooms.flatMap(r => [r.z0, r.z1]))] };
  walls.forEach(w => {
    const ext = w.t / 2;
    // Exterior walls overlap at the corners so the shell closes.
    const a0 = w.a - (w.t > .2 ? ext : -0.06), b0 = w.b + (w.t > .2 ? ext : -0.06);
    const piece = (s, e, y0, y1) => {
      if (e - s <= 0.001 || y1 - y0 <= 0.001) return;
      const cuts = [s, ...breaks[w.ax].filter(v => v > s + 0.001 && v < e - 0.001), e];
      for (let i = 0; i < cuts.length - 1; i++) {
        const s2 = cuts[i], e2 = cuts[i + 1], mid = (s2 + e2) / 2, h = y1 - y0, C = M.corte;
        let geo, mats, pos;
        if (w.ax === 'x') { geo = new THREE.BoxGeometry(e2 - s2, h, w.t); mats = [C, C, C, C, wallMat(mid, w.c + 0.2), wallMat(mid, w.c - 0.2)]; pos = [mid, y0 + h / 2, w.c]; }
        else { geo = new THREE.BoxGeometry(w.t, h, e2 - s2); mats = [wallMat(w.c + 0.2, mid), wallMat(w.c - 0.2, mid), C, C, C, C]; pos = [w.c, y0 + h / 2, mid]; }
        const m = new THREE.Mesh(geo, mats); m.position.set(...pos); m.castShadow = m.receiveShadow = true; wallGroup.add(m);
      }
    };
    let cur = a0;
    w.ops.forEach(o => {
      piece(cur, o.a, 0, H); piece(o.a, o.b, 0, Math.min(o.y0, H)); piece(o.a, o.b, Math.min(o.y1, H), H);
      const top = Math.min(o.y1, H);
      if (o.kind === 'ventana' && top > o.y0 + 0.05) {
        const g = w.ax === 'x' ? new THREE.Mesh(new THREE.BoxGeometry(o.b - o.a, top - o.y0, 0.02), M.glass) : new THREE.Mesh(new THREE.BoxGeometry(0.02, top - o.y0, o.b - o.a), M.glass);
        if (w.ax === 'x') g.position.set((o.a + o.b) / 2, (o.y0 + top) / 2, w.c); else g.position.set(w.c, (o.y0 + top) / 2, (o.a + o.b) / 2);
        wallGroup.add(g);
      }
      if (o.kind === 'puerta') {
        const dw = o.b - o.a, dh = Math.min(2.05, H), s = o.into;
        if (w.ax === 'x') box(o.a + 0.01, o.a + 0.05, 0, dh, w.c + (s > 0 ? 0 : -dw), w.c + (s > 0 ? dw : 0), M.door, wallGroup);
        else box(w.c + (s > 0 ? 0 : -dw), w.c + (s > 0 ? dw : 0), 0, dh, o.a + 0.01, o.a + 0.05, M.door, wallGroup);
      }
      cur = o.b;
    });
    piece(cur, b0, 0, H);
  });
  itemMeshes.forEach(m => { m.scale.y = 1; });
  labels.forEach(l => { l.position.y = H + 0.55; });
}

function label(text, sub, x, z) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 168; const g = c.getContext('2d');
  g.font = '700 54px "Familjen Grotesk", Arial, sans-serif'; const w1 = g.measureText(text).width;
  g.font = '500 38px "IBM Plex Mono", monospace'; const w2 = g.measureText(sub).width;
  const bw = Math.min(500, Math.max(w1, w2) + 56), bx = (512 - bw) / 2;
  g.fillStyle = 'rgba(24,30,26,.84)'; g.beginPath(); if (g.roundRect) g.roundRect(bx, 8, bw, 152, 26); else g.rect(bx, 8, bw, 152); g.fill();
  g.fillStyle = '#f4f6f1'; g.textAlign = 'center'; g.font = '700 54px "Familjen Grotesk", Arial, sans-serif'; g.fillText(text, 256, 76, 480);
  g.fillStyle = '#b9d6c4'; g.font = '500 38px "IBM Plex Mono", monospace'; g.fillText(sub, 256, 130);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true }));
  s.scale.set(2.3, 0.755, 1); s.position.set(x, (low ? 1 : wallH) + 0.55, z); s.renderOrder = 10; group.add(s); labels.push(s);
}
function buildLabels() { labels.splice(0).forEach(s => { group.remove(s); s.material.map.dispose(); }); plan.rooms.forEach(r => label(t(r.name), fmt(area(r)) + ' m²', (r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2)); }

function buildIndex() {
  const el = $('rooms'); el.textContent = '';
  plan.rooms.forEach(r => { const b = document.createElement('button'); b.className = 'room';
    const n = document.createElement('span'); n.textContent = t(r.name); const a = document.createElement('span'); a.className = 'm2'; a.textContent = fmt(area(r)) + ' m²';
    b.append(n, a); b.addEventListener('click', () => focusRoom(r)); el.appendChild(b); });
  $('tot').textContent = fmt(plan.rooms.reduce((s, r) => s + area(r), 0)) + ' m²';
  const ch = $('changes'); ch.textContent = ''; plan.changes.forEach(c => { const li = document.createElement('li'); li.textContent = t(c); ch.appendChild(li); });
}

function applyMode() {
  plan.rooms.forEach(r => { const c = r[mode], fm = roomMats[r.id].floor, t = TEX[mode === 'prop' && r.floorProp || r.floor];
    roomMats[r.id].wall.color.set(c.wall); fm.color.set(c.floor); if (fm.map !== t) { fm.map = t; fm.needsUpdate = true; } });
  itemMeshes.forEach(m => { const c = m.userData.item[mode]; m.visible = !!c; if (c) m.material.color.set(c); });
  $('changes').hidden = mode !== 'prop' || !plan.changes.length;
  showPic(mode === 'prop' ? picRoom : null);
}

/* ---------- renovated photo of the focused room ---------- */
let picRoom = null;
function showPic(r) {
  const el = $('pic');
  if (!r || !r.photo || mode !== 'prop') { el.hidden = true; return; }
  $('pic-img').src = r.photo; $('pic-img').alt = t('Foto reformada') + ': ' + r.photoOf; $('pic-t').textContent = t('Tu reforma') + ' · ' + r.photoOf; el.hidden = false;
}
$('pic-x').onclick = () => { picRoom = null; showPic(null); };

/* ---------- camera ---------- */
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let anim = null;
function moveTo(pos, tgt) { if (reduce) { camera.position.copy(pos); controls.target.copy(tgt); return; } anim = { p0: camera.position.clone(), t0: controls.target.clone(), p1: pos, t1: tgt, start: performance.now(), dur: 750 }; }
const home = () => { const t = center.clone(); if (stage.clientWidth > 640) t.x -= Math.max(plan.width, 8) * 0.1; return t; };
// Fit the whole plan (as a sphere) inside the narrower of the two fields of view.
const homePos = () => { const radius = Math.hypot(plan.width, plan.depth) / 2 + 0.8, v = THREE.MathUtils.degToRad(camera.fov) / 2, h = Math.atan(Math.tan(v) * camera.aspect);
  return home().add(new THREE.Vector3(6.5, 16.5, 12).normalize().multiplyScalar(radius / Math.sin(Math.min(v, h)))); };
function focusRoom(r) { const c = new THREE.Vector3((r.x0 + r.x1) / 2, 0.6, (r.z0 + r.z1) / 2), s = Math.max(r.x1 - r.x0, r.z1 - r.z0);
  moveTo(new THREE.Vector3(c.x + s * .55, 2.4 + s * .9, c.z + s * 1.05), c); press('v', '');
  picRoom = r; showPic(r); }
// A tap (not a drag) on a floor focuses that room.
const ray = new THREE.Raycaster(); let downAt = null;
renderer.domElement.addEventListener('pointerdown', e => { downAt = [e.clientX, e.clientY]; });
renderer.domElement.addEventListener('pointerup', e => {
  if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 6) return; downAt = null;
  const b = renderer.domElement.getBoundingClientRect();
  ray.setFromCamera({ x: (e.clientX - b.left) / b.width * 2 - 1, y: -(e.clientY - b.top) / b.height * 2 + 1 }, camera);
  const hit = ray.intersectObjects(floorMeshes)[0]; if (hit) focusRoom(hit.object.userData.room);
});

/* ---------- controls ---------- */
function press(prefix, id) { document.querySelectorAll(`.seg [id^="${prefix}-"]`).forEach(b => b.setAttribute('aria-pressed', String(b.id === id))); }
$('m-now').onclick = () => { mode = 'now'; press('m', 'm-now'); applyMode(); };
$('m-prop').onclick = () => { mode = 'prop'; press('m', 'm-prop'); applyMode(); };
$('w-high').onclick = () => { low = false; press('w', 'w-high'); buildWalls(); };
$('w-low').onclick = () => { low = true; press('w', 'w-low'); buildWalls(); };
$('v-3d').onclick = () => { press('v', 'v-3d'); picRoom = null; showPic(null); moveTo(homePos(), home()); };
$('v-top').onclick = () => { press('v', 'v-top'); moveTo(new THREE.Vector3(center.x, Math.max(plan.width, plan.depth) * 1.45, center.z + 0.01), center.clone()); };
const show = (id, on) => { $(id).hidden = !on; };
$('open-create').onclick = () => { show('data', false); show('create', $('create').hidden); };
$('close-create').onclick = () => show('create', false);
$('open-data').onclick = () => { show('create', false); $('json').value = JSON.stringify(plan, null, 1); $('data-msg').textContent = ''; show('data', $('data').hidden); };
$('close-data').onclick = () => show('data', false);
$('sample').onclick = () => { $('json').value = JSON.stringify(normalize(ETXEA), null, 1); };
$('apply').onclick = () => {
  const m = $('data-msg'); m.className = 'msg';
  try { const p = normalize(JSON.parse($('json').value)); build(p); save(); m.textContent = t('Plano actualizado.'); }
  catch (e) { m.className = 'msg err'; m.textContent = e instanceof SyntaxError ? t('El texto no es JSON válido:') + ' ' + e.message : e.message; }
};
$('download').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(plan, null, 1)], { type: 'application/json' })); a.download = (plan.name || 'plano').replace(/[^\w-]+/g, '-') + '.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); };
function save() { lsSet(STORE, JSON.stringify(plan)); }

/* ---------- create from sketch ---------- */
let sketch = null;
$('file').addEventListener('change', async e => {
  const f = e.target.files[0]; if (!f) return;
  sketch = await shrink(f, 1600);
  const img = document.createElement('img'); img.src = 'data:image/jpeg;base64,' + sketch; img.alt = t('Boceto elegido');
  $('drop').replaceChildren(img, $('file')); $('gen').disabled = false; $('gen-msg').textContent = '';
});
function shrink(file, max) {
  return new Promise((res, rej) => { const u = URL.createObjectURL(file), im = new Image();
    im.onload = () => { const k = Math.min(1, max / Math.max(im.width, im.height)); const c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
      const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(u); res(c.toDataURL('image/jpeg', .88).split(',')[1]); };
    im.onerror = () => rej(new Error(t('No se pudo leer la imagen.'))); im.src = u; });
}
// Same settings as the main app (same origin): own Gemini key, or the Etxea server with an access code.
function api() {
  let s = {}; try { s = JSON.parse(lsGet('etxea-settings') || '{}') || {}; } catch {}
  const srv = String(s.server || '').trim().replace(/\/+$/, '');
  if (!s.key) return null;
  return { base: srv ? srv + '/v1beta' : GEM, h: srv ? { Authorization: 'Bearer ' + s.key } : { 'x-goog-api-key': s.key }, model: s.textModel || 'gemini-3.8-flash' };
}
function textOf(j) { const out = []; (function walk(o) { if (!o || typeof o !== 'object') return; if (Array.isArray(o)) return o.forEach(walk);
  if (typeof o.text === 'string') out.push(o.text); Object.keys(o).forEach(k => { if (k !== 'text') walk(o[k]); }); })(j); return out.join('\n'); }
function parseJSON(t) { const s = String(t).replace(/```(?:json)?/g, ''); const a = s.indexOf('{'), b = s.lastIndexOf('}'); if (a < 0 || b < a) throw new Error(t('La IA no devolvió un plano. Prueba con una foto más nítida.')); return JSON.parse(s.slice(a, b + 1)); }
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function askAI(a, b64) {
  const body = { model: a.model, input: [{ type: 'image', mime_type: 'image/jpeg', data: b64 }, { type: 'text', text: promptFor(LANG) }] };
  let r = await fetch(a.base + '/interactions', { method: 'POST', headers: { 'Content-Type': 'application/json', ...a.h }, body: JSON.stringify(body) });
  let j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(r.status === 402 ? t('No te quedan créditos.') : r.status === 401 ? t('El código de acceso no es válido.') : t('La IA respondió con un error:') + ' ' + (j.error?.message || r.status));
  for (let i = 0; i < 60 && (j.id || j.name) && /progress|pending|running|queued|processing|created/i.test(String(j.status || j.state || '')); i++) {
    await sleep(3000);
    r = await fetch(a.base + '/' + (String(j.id || j.name).includes('/') ? j.id || j.name : 'interactions/' + encodeURIComponent(j.id || j.name)), { headers: a.h });
    j = await r.json().catch(() => j);
  }
  return parseJSON(textOf(j.outputs || j.output || j));
}
$('gen').onclick = async () => {
  const m = $('gen-msg'), btn = $('gen'); m.className = 'msg';
  const a = api();
  if (!a) { m.className = 'msg err'; m.innerHTML = `${t('Falta el código de acceso. Ponlo en')} <a href="../app/">${t('la app')}</a>${t(', en Ajustes.')}`; return; }
  btn.disabled = true; m.textContent = t('La IA está leyendo el boceto. Tarda unos 20 segundos...');
  try { const p = normalize(await askAI(a, sketch)); build(p); save(); m.textContent = t('Listo: {0} estancias, {1} m². Revisa las medidas en «Datos».', p.rooms.length, fmt(p.rooms.reduce((s, r) => s + area(r), 0))); }
  catch (e) { m.className = 'msg err'; m.textContent = e.message || t('No se pudo generar el plano.'); }
  finally { btn.disabled = false; }
};

/* ---------- theme & boot ---------- */
function applyTheme() { const cs = getComputedStyle(document.documentElement);
  scene.background = new THREE.Color(cs.getPropertyValue('--scene').trim() || '#dfe4dc'); ground.material.color.set(cs.getPropertyValue('--ground').trim() || '#c9d1c2'); }
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
function resize() { const w = stage.clientWidth, h = stage.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / Math.max(h, 1); camera.updateProjectionMatrix(); }
new ResizeObserver(resize).observe(stage);
// ?demo: the landing page embed always shows Etxea and flips between now and proposal until someone touches it.
const DEMO = new URLSearchParams(location.search).has('demo');
if (DEMO) document.body.classList.add('demo');
let start; try { start = DEMO ? normalize(ETXEA) : normalize(JSON.parse(lsGet(STORE) || 'null')); } catch { start = normalize(ETXEA); }
applyTheme(); build(start);
// ?prop: opened from the app after painting the plan with the renovated photos.
if (!DEMO && new URLSearchParams(location.search).has('prop')) $('m-prop').click();
if (document.fonts && document.fonts.ready) document.fonts.ready.then(buildLabels);
const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
renderer.setAnimationLoop(() => {
  if (anim) { const k = Math.min(1, (performance.now() - anim.start) / anim.dur), e = ease(k); camera.position.lerpVectors(anim.p0, anim.p1, e); controls.target.lerpVectors(anim.t0, anim.t1, e); if (k >= 1) anim = null; }
  controls.update(); renderer.render(scene, camera);
});
if (DEMO && !reduce) {
  const flip = setInterval(() => { (mode === 'now' ? $('m-prop') : $('m-now')).click(); }, 3500);
  const stop = () => clearInterval(flip);
  ['pointerdown', 'wheel', 'keydown'].forEach(ev => window.addEventListener(ev, stop, { once: true, capture: true }));
}
window.__plano = { get plan() { return plan; }, build };
})();
