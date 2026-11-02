/**
 * The viewer's baker, off the page's thread: a big model takes seconds to
 * sculpt and mesh, and baked on the page it would freeze it (the browser asks
 * whether to kill it). { id, path, key, sub, detail } comes in, naming a
 * definition as the catalogue found it (its file, its export, and the entry
 * in that export if it is a table of them, and `colours`, if a person is wanted in others); the mesh's arrays go back, handed
 * over rather than copied, or { id, error }.
 */
import { bake } from '../../../src/models/model.js';

const sculpted = import.meta.glob('../../../src/{characters,props,scenery}/**/*.js');
const ARRAYS = ['position', 'normal', 'color', 'skinIndex', 'skinWeight', 'index'];
// As the catalogue has it: a still prop with no skeleton gets one bone, the root.
const rooted = (def) => (def.bones ? def : { ...def, bones: [['root', null, [0, 0, 0]]] });

self.onmessage = async ({ data: { id, path, key, sub, detail, colours } }) => {
  try {
    const mod = await sculpted[path]();
    const base = rooted(sub ? mod[key][sub] : mod[key]);
    // A person in other colours, as the page has them (characters/person.js `variant`).
    const def = colours && Object.keys(colours).length && typeof base.variant === 'function' ? base.variant(colours) : base;
    const data = { ...bake(def, { detail }) };
    const moved = [];
    for (const k of ARRAYS) if (data[k]) { data[k] = data[k].slice(); moved.push(data[k].buffer); }
    self.postMessage({ id, data }, moved);
  } catch (err) {
    self.postMessage({ id, error: err?.message ?? String(err) });
  }
};
