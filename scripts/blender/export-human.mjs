#!/usr/bin/env node
/**
 * Writes the human's body and garments, in his rest pose, as Wavefront OBJ
 * files for Blender (scripts/blender/bake_folds.py reads them).
 *
 *     node scripts/blender/export-human.mjs <outDir> [garment ...]
 *
 * Each garment is dressed on its own, so nothing it covers is hidden and
 * every triangle of it is written. Positions are in metres, y up, as the
 * engine has them; UVs are the body's own layout (the shell garments are
 * cut from the skin, so they share it).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import * as GFX from '../../src/gfx/index.js';
import { createHuman } from '../../src/people/index.js';

const [out = 'blender-work', ...names] = process.argv.slice(2);
const garments = names.length ? names : ['tshirt', 'jeans'];
mkdirSync(out, { recursive: true });

function obj(mesh, groups = null) {
  const g = mesh.geometry;
  const P = g.attributes.position.array, N = g.attributes.normal.array, U = g.attributes.uv.array, I = g.index.array;
  const lines = [`# ${mesh.name}`, `o ${mesh.name.replace(/\s+/g, '_')}`];
  for (let i = 0; i < P.length; i += 3) lines.push(`v ${P[i].toFixed(6)} ${P[i + 1].toFixed(6)} ${P[i + 2].toFixed(6)}`);
  for (let i = 0; i < U.length; i += 2) lines.push(`vt ${U[i].toFixed(6)} ${U[i + 1].toFixed(6)}`);
  for (let i = 0; i < N.length; i += 3) lines.push(`vn ${N[i].toFixed(5)} ${N[i + 1].toFixed(5)} ${N[i + 2].toFixed(5)}`);
  const ranges = groups ?? [{ start: 0, count: I.length }];
  for (const { start, count } of ranges) {
    for (let t = start; t < start + count; t += 3) {
      const [a, b, c] = [I[t] + 1, I[t + 1] + 1, I[t + 2] + 1];
      lines.push(`f ${a}/${a}/${a} ${b}/${b}/${b} ${c}/${c}/${c}`);
    }
  }
  return lines.join('\n') + '\n';
}

for (const sex of ['male']) {
  const human = createHuman(GFX, { detail: 1, sex });
  human.dress([]);
  // The skin alone (the first group): the eyes, teeth and lashes are not colliders.
  const skin = human.body.geometry.groups.find((gr) => gr.materialIndex === 0) ?? null;
  writeFileSync(join(out, `body-${sex}.obj`), obj(human.body, skin ? [skin] : null));
  for (const name of garments) {
    human.dress([name]);
    writeFileSync(join(out, `${name}-${sex}.obj`), obj(human.garment(name)));
    console.log('wrote', name, sex, human.garment(name).geometry.attributes.position.count, 'vertices');
  }
}
