// Plan model shared by the 3D viewer and its tests: validation, wall derivation from rooms, and the Etxea sample.
// Coordinates in metres: x to the right, z downwards on the drawing, origin at the top-left corner.
(function (root) {
'use strict';
const EXT = 0.25, INT = 0.12, EPS = 0.02;
const FLOORS = ['parquet', 'baldosa', 'bano', 'marmol', 'cemento'];
const SIDES = ['N', 'S', 'E', 'O'];
const num = (v, d) => (Number.isFinite(+v) ? +v : d);
const hex = (v, d) => (/^#[0-9a-f]{6}$/i.test(String(v || '')) ? String(v) : d);
const r2 = v => Math.round(v * 100) / 100;

// Cleans whatever the AI or the user wrote into a plan the viewer can draw; throws a readable error when nothing usable is left.
function normalize(raw) {
  if (!raw || typeof raw !== 'object') throw new Error('El plano no es un objeto JSON.');
  const rooms = (Array.isArray(raw.rooms) ? raw.rooms : []).map((r, i) => {
    let x0 = num(r.x0, NaN), x1 = num(r.x1, NaN), z0 = num(r.z0, NaN), z1 = num(r.z1, NaN);
    if (![x0, x1, z0, z1].every(Number.isFinite)) return null;
    if (x1 < x0) [x0, x1] = [x1, x0]; if (z1 < z0) [z0, z1] = [z1, z0];
    if (x1 - x0 < 0.5 || z1 - z0 < 0.5) return null;
    const floor = FLOORS.includes(r.floor) ? r.floor : 'parquet';
    const now = r.now || {}, prop = r.prop || {};
    return { id: String(r.id || 'r' + i).replace(/[^\w-]/g, '') || 'r' + i, name: String(r.name || 'Estancia ' + (i + 1)).slice(0, 40),
      x0: r2(x0), x1: r2(x1), z0: r2(z0), z1: r2(z1), floor,
      now: { wall: hex(now.wall, '#ece6da'), floor: hex(now.floor, '#c9b79c') }, prop: { wall: hex(prop.wall, hex(now.wall, '#eee9df')), floor: hex(prop.floor, hex(now.floor, '#cf9f6c')) } };
  }).filter(Boolean);
  if (!rooms.length) throw new Error('No hay ninguna estancia válida (cada una necesita x0, x1, z0, z1 en metros).');
  const minX = Math.min(...rooms.map(r => r.x0)), minZ = Math.min(...rooms.map(r => r.z0));
  rooms.forEach(r => { r.x0 = r2(r.x0 - minX); r.x1 = r2(r.x1 - minX); r.z0 = r2(r.z0 - minZ); r.z1 = r2(r.z1 - minZ); });
  const ids = new Set(); rooms.forEach(r => { while (ids.has(r.id)) r.id += '_'; ids.add(r.id); });
  const openings = (Array.isArray(raw.openings) ? raw.openings : []).map(o => {
    const room = rooms.find(r => r.id === String(o.room || '').replace(/[^\w-]/g, ''));
    const side = String(o.side || '').toUpperCase().replace('W', 'O');
    if (!room || !SIDES.includes(side)) return null;
    const len = side === 'N' || side === 'S' ? room.x1 - room.x0 : room.z1 - room.z0;
    const kind = ['puerta', 'ventana', 'paso'].includes(o.kind) ? o.kind : 'ventana';
    const w = Math.min(num(o.w, kind === 'puerta' ? 0.8 : 1.2), len - 0.1);
    const at = Math.max(0.05, Math.min(num(o.at, (len - w) / 2), len - w - 0.05));
    const sill = kind === 'ventana' ? num(o.sill, 0.9) : 0;
    const top = num(o.top, kind === 'ventana' ? 2.1 : 2.1);
    return { room: room.id, side, kind, at: r2(at), w: r2(w), sill: r2(sill), top: r2(Math.max(top, sill + 0.3)) };
  }).filter(Boolean);
  const items = (Array.isArray(raw.items) ? raw.items : []).map(it => {
    const x0 = num(it.x0, NaN) - minX, x1 = num(it.x1, NaN) - minX, z0 = num(it.z0, NaN) - minZ, z1 = num(it.z1, NaN) - minZ;
    if (![x0, x1, z0, z1].every(Number.isFinite) || x1 <= x0 || z1 <= z0) return null;
    return { name: String(it.name || '').slice(0, 40), x0: r2(x0), x1: r2(x1), z0: r2(z0), z1: r2(z1), y0: num(it.y0, 0), h: Math.max(0.02, Math.min(num(it.h, 0.8), 2.6)),
      // 'none' hides the piece in that mode (something that only exists in the proposal, or is removed by it).
      now: it.now === 'none' || it.now === null ? null : hex(it.now || it.color, '#9a8f80'), prop: it.prop === 'none' || it.prop === null ? null : hex(it.prop, hex(it.now || it.color, '#9a8f80')) };
  }).filter(Boolean);
  const width = r2(Math.max(...rooms.map(r => r.x1))), depth = r2(Math.max(...rooms.map(r => r.z1)));
  const changes = (Array.isArray(raw.changes) ? raw.changes : []).map(c => String(c).slice(0, 120)).slice(0, 12);
  return { name: String(raw.name || 'Mi casa').slice(0, 60), width, depth, wallHeight: Math.min(Math.max(num(raw.wallHeight, 2.6), 2.2), 4), rooms, openings, items, changes };
}

// Every room edge becomes a wall line; overlapping edges on the same line merge into one wall.
function deriveWalls(plan) {
  const lines = { x: new Map(), z: new Map() };
  const add = (ax, c, a, b) => { const k = r2(c); const m = lines[ax]; if (!m.has(k)) m.set(k, []); m.get(k).push([a, b]); };
  plan.rooms.forEach(r => { add('x', r.z0, r.x0, r.x1); add('x', r.z1, r.x0, r.x1); add('z', r.x0, r.z0, r.z1); add('z', r.x1, r.z0, r.z1); });
  const walls = [];
  for (const ax of ['x', 'z']) for (const [c, iv] of lines[ax]) {
    iv.sort((p, q) => p[0] - q[0]);
    const merged = [];
    iv.forEach(([a, b]) => { const last = merged[merged.length - 1]; if (last && a <= last[1] + EPS) last[1] = Math.max(last[1], b); else merged.push([a, b]); });
    const cuts = [...new Set(plan.rooms.flatMap(r => ax === 'x' ? [r.x0, r.x1] : [r.z0, r.z1]))];
    merged.forEach(([a, b]) => {
      // A stretch is exterior when only one side has a room; cut at room corners so an L-shaped house gets both kinds on one line.
      const pts = [a, ...cuts.filter(v => v > a + EPS && v < b - EPS).sort((p, q) => p - q), b];
      let run = null;
      for (let i = 0; i < pts.length - 1; i++) {
        const mid = (pts[i] + pts[i + 1]) / 2;
        const p1 = ax === 'x' ? roomAt(plan, mid, c - 0.2) : roomAt(plan, c - 0.2, mid);
        const p2 = ax === 'x' ? roomAt(plan, mid, c + 0.2) : roomAt(plan, c + 0.2, mid);
        const t = p1 && p2 ? INT : EXT;
        if (run && run.t === t) run.b = pts[i + 1]; else { run = { ax, c, a: pts[i], b: pts[i + 1], t, ops: [] }; walls.push(run); }
      }
    });
  }
  plan.openings.forEach(o => {
    const room = plan.rooms.find(r => r.id === o.room);
    const ax = o.side === 'N' || o.side === 'S' ? 'x' : 'z';
    const c = o.side === 'N' ? room.z0 : o.side === 'S' ? room.z1 : o.side === 'O' ? room.x0 : room.x1;
    const start = (ax === 'x' ? room.x0 : room.z0) + o.at;
    const wall = walls.find(w => w.ax === ax && Math.abs(w.c - c) < EPS && start >= w.a - EPS && start + o.w <= w.b + EPS);
    if (wall && !wall.ops.some(p => start < p.b && start + o.w > p.a)) wall.ops.push({ a: start, b: start + o.w, y0: o.sill, y1: o.top, kind: o.kind, into: o.side === 'N' || o.side === 'O' ? -1 : 1 });
  });
  walls.forEach(w => w.ops.sort((p, q) => p.a - q.a));
  return walls;
}
function roomAt(plan, x, z) { return plan.rooms.find(r => x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1) || null; }
const area = r => (r.x1 - r.x0) * (r.z1 - r.z0);

// What the AI is asked to return from a sketch. Kept next to normalize() so both describe the same shape.
const PROMPT = `Eres un delineante. Convierte este boceto o plano de una planta de vivienda en un modelo para un visor 3D.
Devuelve SOLO un JSON con esta forma:
{"name":"Planta 1","wallHeight":2.6,
 "rooms":[{"id":"cocina","name":"Cocina","x0":0,"x1":4.2,"z0":1.9,"z1":7.8,"floor":"baldosa","now":{"wall":"#3f6fc2","floor":"#b9ad99"},"prop":{"wall":"#ece6da","floor":"#cfc6b6"}}],
 "openings":[{"room":"cocina","side":"S","kind":"ventana","at":0.6,"w":1.1,"sill":0.9,"top":2.1}],
 "items":[{"name":"Encimera","x0":0.1,"x1":3.5,"z0":7.1,"z1":7.7,"h":0.9,"now":"#b8bbbe","prop":"#8ea58c"}],   (usa "none" en now o prop si el mueble solo existe en uno de los dos estados)
 "changes":["Paredes en blanco roto cálido"]}
Reglas:
- Metros. Origen en la esquina superior izquierda del dibujo; x hacia la derecha, z hacia abajo. Cada estancia es un rectángulo alineado con los ejes.
- Las estancias se tocan sin huecos ni solapes. Usa las cotas escritas; si no hay, estima con tamaños habituales (puerta 0,8 m, dormitorio 3 x 3,5 m).
- floor: parquet, baldosa, bano, marmol o cemento. Colores en #rrggbb: "now" el estado que se ve o se intuye, "prop" una propuesta moderna y cálida.
- openings: side N (arriba), S (abajo), E (derecha) u O (izquierda) de esa estancia; at = distancia en metros desde la esquina izquierda (N/S) o superior (E/O) de ese lado; kind puerta, ventana o paso. Una puerta entre dos estancias se pone una sola vez.
- items: solo los muebles grandes que aparezcan (encimeras, sofá, mesa, cama, bañera), como cajas.
- Nombres en español.`;

// Sample: first floor of Etxea, from Peru's sketch (about 12,2 x 7,8 m).
const ETXEA = {
  name: 'Etxea · Primera planta', wallHeight: 2.6,
  rooms: [
    { id: 'lav', name: 'Sala de lavandería', x0: 0, x1: 4.2, z0: 0, z1: 1.9, floor: 'baldosa', now: { wall: '#eeede7', floor: '#c8c2b6' }, prop: { wall: '#f0ede6', floor: '#d3cdc1' } },
    { id: 'cocina', name: 'Cocina', x0: 0, x1: 4.2, z0: 1.9, z1: 7.8, floor: 'baldosa', now: { wall: '#3f6fc2', floor: '#b9ad99' }, prop: { wall: '#ece6da', floor: '#cfc6b6' } },
    { id: 'bano', name: 'Baño 1', x0: 4.2, x1: 8.2, z0: 0, z1: 2.6, floor: 'bano', now: { wall: '#d8cbb3', floor: '#d7cbb4' }, prop: { wall: '#dcd5c8', floor: '#dcd5c8' } },
    { id: 'recibidor', name: 'Recibidor', x0: 4.2, x1: 8.2, z0: 2.6, z1: 4.7, floor: 'parquet', now: { wall: '#e6c656', floor: '#a4482a' }, prop: { wall: '#eee9df', floor: '#cf9f6c' } },
    { id: 'escalera', name: 'Caja de escalera', x0: 4.2, x1: 8.2, z0: 4.7, z1: 7.8, floor: 'marmol', now: { wall: '#dcc796', floor: '#ffffff' }, prop: { wall: '#eee9df', floor: '#ffffff' } },
    { id: 'salon', name: 'Sala comedor', x0: 8.2, x1: 12.2, z0: 0, z1: 7.8, floor: 'parquet', now: { wall: '#ede2c6', floor: '#a4482a' }, prop: { wall: '#eee9df', floor: '#cf9f6c' } }
  ],
  openings: [
    { room: 'lav', side: 'N', kind: 'ventana', at: 1.0, w: 1.2, sill: 1.0, top: 2.1 },
    { room: 'bano', side: 'N', kind: 'ventana', at: 1.7, w: 0.8, sill: 1.3, top: 2.1 },
    { room: 'salon', side: 'N', kind: 'ventana', at: 1.2, w: 2.0, sill: 0.9, top: 2.2 },
    { room: 'cocina', side: 'S', kind: 'ventana', at: 0.6, w: 1.1, sill: 1.05, top: 2.15 },
    { room: 'escalera', side: 'S', kind: 'ventana', at: 1.8, w: 1.0, sill: 1.1, top: 2.1 },
    { room: 'salon', side: 'S', kind: 'ventana', at: 1.5, w: 1.4, sill: 0.9, top: 2.2 },
    { room: 'cocina', side: 'O', kind: 'ventana', at: 1.1, w: 1.2, sill: 0.9, top: 2.2 },
    { room: 'salon', side: 'E', kind: 'ventana', at: 0.6, w: 2.6, sill: 0, top: 2.3 },
    { room: 'cocina', side: 'E', kind: 'puerta', at: 1.7, w: 0.8 },
    { room: 'lav', side: 'S', kind: 'puerta', at: 2.8, w: 0.8 },
    { room: 'salon', side: 'O', kind: 'puerta', at: 3.2, w: 0.9 },
    { room: 'bano', side: 'S', kind: 'puerta', at: 2.7, w: 0.8 },
    { room: 'recibidor', side: 'S', kind: 'paso', at: 0.4, w: 1.2 }
  ],
  items: [
    { name: 'Encimera', x0: 0.06, x1: 3.55, z0: 7.1, z1: 7.74, h: 0.9, now: '#b8bbbe', prop: '#8ea58c' },
    { name: 'Encimera', x0: 3.55, x1: 4.12, z0: 5.65, z1: 7.74, h: 0.9, now: '#b8bbbe', prop: '#8ea58c' },
    { name: 'Nevera', x0: 3.52, x1: 4.12, z0: 5.0, z1: 5.63, h: 1.85, now: '#c4c7ca', prop: '#c4c7ca' },
    { name: 'Mesa de cocina', x0: 0.15, x1: 1.75, z0: 3.17, z1: 3.97, h: 0.76, now: '#d8c7a6', prop: '#d8c7a6' },
    { name: 'Lavadora', x0: 0.15, x1: 0.75, z0: 0.12, z1: 0.72, h: 0.85, now: '#f6f6f3', prop: '#f6f6f3' },
    { name: 'Bañera', x0: 4.32, x1: 5.9, z0: 0.07, z1: 0.95, h: 0.55, now: '#f6f6f3', prop: '#f6f6f3' },
    { name: 'Mueble de lavabo', x0: 4.27, x1: 4.78, z0: 1.53, z1: 2.47, h: 0.9, now: '#7a4a2c', prop: '#7a4a2c' },
    { name: 'Arcón', x0: 4.6, x1: 5.6, z0: 2.7, z1: 3.1, h: 0.55, now: '#8a5a32', prop: '#8a5a32' },
    { name: 'Escalera', x0: 5.0, x1: 8.12, z0: 5.95, z1: 6.85, h: 1.2, now: '#3a2526', prop: '#3a2526' },
    { name: 'Sofá', x0: 11.2, x1: 12.05, z0: 3.7, z1: 7.1, h: 0.8, now: '#3c3d40', prop: '#3c3d40' },
    { name: 'Sofá', x0: 9.9, x1: 11.2, z0: 6.25, z1: 7.1, h: 0.8, now: '#3c3d40', prop: '#3c3d40' },
    { name: 'Mesa de centro', x0: 9.68, x1: 10.52, z0: 4.38, z1: 5.52, h: 0.45, now: '#c8dde0', prop: '#b88a5a' },
    { name: 'Mesa de comedor', x0: 9.4, x1: 11.4, z0: 0.55, z1: 1.45, h: 0.77, now: '#4a2d1f', prop: '#4a2d1f' },
    { name: 'Aparador', x0: 8.27, x1: 8.72, z0: 4.6, z1: 6.9, h: 0.5, now: '#4a2f22', prop: '#4a2f22' },
    { name: 'Alfombra de yute', x0: 9.2, x1: 11.1, z0: 3.9, z1: 6.2, h: 0.02, now: 'none', prop: '#c9a978' }
  ],
  changes: ['Paredes en blanco roto cálido', 'Parquet acuchillado en tono natural mate', 'Frentes de cocina en verde salvia', 'Mesa de centro de madera y alfombra de yute']
};

root.Plano = { normalize, deriveWalls, roomAt, area, PROMPT, ETXEA, FLOORS };
})(typeof window !== 'undefined' ? window : globalThis);
