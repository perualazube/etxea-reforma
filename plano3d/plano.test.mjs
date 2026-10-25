import test from 'node:test';
import assert from 'node:assert/strict';
import './plano.js';
const { normalize, deriveWalls, ETXEA } = globalThis.Plano;

test('Etxea sample: 6 rooms, about 95 m2', () => {
  const p = normalize(ETXEA);
  assert.equal(p.rooms.length, 6);
  assert.equal(p.width, 12.2); assert.equal(p.depth, 7.8);
});

test('every Etxea opening lands on a wall', () => {
  const p = normalize(ETXEA); const w = deriveWalls(p);
  assert.equal(w.flatMap(x => x.ops).length, p.openings.length);
});

test('exterior and interior walls get their thickness', () => {
  const w = deriveWalls(normalize(ETXEA));
  assert.equal(w.find(x => x.ax === 'x' && x.c === 0).t, 0.25);
  assert.equal(w.find(x => x.ax === 'z' && x.c === 4.2).t, 0.12);
  assert.equal(w.find(x => x.ax === 'z' && x.c === 4.2).b, 7.8);
});

test('L-shaped house: one line holds exterior and interior stretches', () => {
  const p = normalize({ rooms: [{ x0: 0, x1: 4, z0: 0, z1: 3 }, { x0: 4, x1: 8, z0: 0, z1: 3 }, { x0: 0, x1: 4, z0: 3, z1: 6 }] });
  const line = deriveWalls(p).filter(x => x.ax === 'x' && x.c === 3);
  assert.deepEqual(line.map(x => [x.a, x.b, x.t]), [[0, 4, 0.12], [4, 8, 0.25]]);
});

test('normalize repairs sloppy AI output', () => {
  const p = normalize({ rooms: [{ id: 'a b', name: 'Sala', x0: 5, x1: 1, z0: 2, z1: 6, floor: 'moqueta', now: { wall: 'azul' } }, { x0: 0, x1: 0.2, z0: 0, z1: 1 }],
    openings: [{ room: 'ab', side: 'W', kind: 'puerta', at: 99, w: 0.8 }, { room: 'nope', side: 'N' }], items: [{ x0: 2, x1: 3, z0: 3, z1: 4, now: 'none' }] });
  assert.equal(p.rooms.length, 1);
  assert.deepEqual([p.rooms[0].x0, p.rooms[0].x1, p.rooms[0].z0], [0, 4, 0]);
  assert.equal(p.rooms[0].floor, 'parquet');
  assert.equal(p.openings.length, 1); assert.equal(p.openings[0].side, 'O');
  assert.ok(p.openings[0].at + p.openings[0].w <= 4);
  assert.equal(p.items[0].now, null);
  assert.equal(normalize(JSON.parse(JSON.stringify(p))).items[0].now, null);
});

test('no usable rooms is a readable error', () => {
  assert.throws(() => normalize({ rooms: [] }), /estancia/);
});

test('keeps the proposal floor type and the renovated photo, drops bad ones', () => {
  const photo = 'data:image/jpeg;base64,' + 'A'.repeat(40);
  const p = normalize({ rooms: [{ x0: 0, x1: 4, z0: 0, z1: 3, floor: 'baldosa', floorProp: 'parquet', photo, photoOf: 'Salón' },
    { x0: 4, x1: 8, z0: 0, z1: 3, floorProp: 'moqueta', photo: 'javascript:alert(1)' }] });
  assert.equal(p.rooms[0].floorProp, 'parquet'); assert.equal(p.rooms[0].photo, photo); assert.equal(p.rooms[0].photoOf, 'Salón');
  assert.equal(p.rooms[1].floorProp, undefined); assert.equal(p.rooms[1].photo, undefined);
});
