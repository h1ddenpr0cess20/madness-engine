#!/usr/bin/env node
/**
 * Writes the human's body, and every garment that drapes, as the engine cuts
 * them, as Wavefront OBJ files for Blender (scripts/blender/bake_drape.py
 * drapes them).
 *
 *     node scripts/blender/export-human.mjs <outDir> [garment ...]
 *
 * Every garment is cut on him (hers too: her wardrobe is cut on him and
 * carried onto her), so all of them drape on his body. Each is written as
 * built on its own, at full detail, in his rest pose: metres, y up. Only its
 * cloth is written (its pieces of at least PIECE points that are not trims;
 * the trims, cuffs, collars and hardware follow the cloth nearest them), one
 * object a piece. `<sex>-<garment>.obj` for each, and `body-male.obj`.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import * as GFX from '../../src/gfx/index.js';
import { createHuman } from '../../src/people/index.js';
import { garmentsFor } from '../../src/people/human/outfits.js';
import { DRAPED } from '../../src/people/human/drape.js';

const PIECE = 2000;
/** Pieces that are trims however big: they follow the cloth beside them. */
const TRIMS = new Set(['waistband', 'zip tapes', 'cuffs', 'collar', 'welts', 'lapels']);
const [out = 'blender-work', ...only] = process.argv.slice(2);
mkdirSync(out, { recursive: true });

/** A Wavefront OBJ of `pieces` ({ name, pos, idx }), each its own object, positions only. */
function obj(pieces) {
  const lines = [];
  let base = 1;
  for (const { name, pos, idx } of pieces) {
    lines.push(`o ${name.replace(/\s+/g, '_')}`);
    for (let i = 0; i < pos.length; i += 3) lines.push(`v ${pos[i].toFixed(6)} ${pos[i + 1].toFixed(6)} ${pos[i + 2].toFixed(6)}`);
    for (let t = 0; t < idx.length; t += 3) lines.push(`f ${idx[t] + base} ${idx[t + 1] + base} ${idx[t + 2] + base}`);
    base += pos.length / 3;
  }
  return lines.join('\n') + '\n';
}

// His body, the skin alone (the eyes, teeth and lashes are not in the cloth's way).
const human = createHuman(GFX, { detail: 1 });
human.dress([]);
const g = human.body.geometry;
const skin = g.groups.find((gr) => gr.materialIndex === 0);
const I = g.index.array.slice(skin.start, skin.start + skin.count);
writeFileSync(join(out, 'body-male.obj'), obj([{ name: 'body', pos: g.attributes.position.array, idx: I }]));

for (const sex of ['male', 'female']) {
  const wardrobe = garmentsFor(sex);
  for (const name of DRAPED) {
    if (!wardrobe[name] || (only.length && !only.includes(name))) continue;
    const parts = wardrobe[name].build(1, { sex }).filter((p) => p.count >= PIECE && p.material !== 'metal' && !TRIMS.has(p.name));
    writeFileSync(join(out, `${sex}-${name}.obj`), obj(parts.map((p, k) => ({ name: `${p.name}_${k}`, pos: p.pos, idx: p.idx }))));
    console.log(`${sex} ${name}: ${parts.map((p) => `${p.name} ${p.count}`).join(', ')}`);
  }
}
