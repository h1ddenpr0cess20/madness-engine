import { CHARACTERS } from '../src/characters/index.js';
import { bake } from '../src/models/model.js';
import { Skeleton, skin } from '../src/models/rig.js';
const def = CHARACTERS.skaterRiding;
const b = bake(def);
const names = def.bones.map(([n]) => n);
const idx = (n) => names.indexOf(n);
const footBones = new Set(names.map((n, i) => (/foot|toe|ankle|shin/.test(n) ? i : -1)).filter((i) => i >= 0));
const shinI = new Set(names.map((n, i) => (/shin/.test(n) ? i : -1)).filter((i) => i >= 0));
const deckI = idx('deck');
const shoe = [], deck = [];
for (let v = 0; v < b.count; v++) {
  const bi = b.skinIndex[v * 4];
  if (bi === deckI && b.skinWeight[v*4] > 0.99) deck.push(v);
  else if (footBones.has(bi) && !shinI.has(bi) && b.position[v*3+1] < 0.08) shoe.push(v);
}
console.log('shoe verts', shoe.length, 'deck verts', deck.length);
const pos = new Float32Array(b.count * 3), nor = new Float32Array(b.count * 3);
const clips = (process.argv[2] || 'idle,walk,run,jump,leap').split(',');
const G = 0.006;
for (const clip of clips) {
  let worst = 0, bad = 0, frames = 0;
  const samples = [];
  for (let f = 0; f < 60; f++) {
    const t = f / 60, time = 3 + f / 30;
    const k = new Skeleton(def.bones);
    def.animate(k, { clip, t, time, seed: 0, speed: 1 });
    const M = k.compute();
    skin(b, M ?? k.matrices, pos, nor);
    const top = new Map();
    for (const v of deck) {
      const key = Math.round(pos[v*3]/G) + ',' + Math.round(pos[v*3+2]/G);
      const y = pos[v*3+1];
      const c = top.get(key); if (!c) top.set(key, [y, y]); else { c[0] = Math.min(c[0], y); c[1] = Math.max(c[1], y); }
    }
    let n = 0, d = 0, where = null;
    for (const v of shoe) {
      const key = Math.round(pos[v*3]/G) + ',' + Math.round(pos[v*3+2]/G);
      const c = top.get(key); if (!c) continue;
      const depth = c[1] - pos[v*3+1];
      if (depth > 0.003 && pos[v*3+1] > c[0] - 0.003) { n++; if (depth > d) { d = depth; where = [pos[v*3], pos[v*3+1], pos[v*3+2]].map((x) => x.toFixed(3)); } }
    }
    frames++; if (n) { bad++; samples.push(`f${f}:${n}v ${d.toFixed(3)}@${where}`); }
    worst = Math.max(worst, d);
  }
  console.log(clip, `bad frames ${bad}/${frames}, worst depth ${worst.toFixed(3)}`);
  if (samples.length) console.log('  ', samples.slice(0, 8).join(' | '));
}
