import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import * as espree from 'espree';

import { split } from '../extract/split.mjs';
import { VARIANTS } from '../extract/sets.mjs';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src');

/** Every name a module exports. */
function exportsOf(text) {
  const names = new Set();
  const own = (node, out = []) => {
    if (!node) return out;
    if (node.type === 'Identifier') out.push(node.name);
    else if (node.type === 'ObjectPattern') node.properties.forEach((p) => own(p.value ?? p.argument, out));
    else if (node.type === 'ArrayPattern') node.elements.forEach((e) => own(e, out));
    else if (node.type === 'RestElement') own(node.argument, out);
    else if (node.type === 'AssignmentPattern') own(node.left, out);
    return out;
  };
  for (const n of espree.parse(text, { ecmaVersion: 'latest', sourceType: 'module' }).body) {
    if (n.type === 'ExportDefaultDeclaration') names.add('default');
    else if (n.type === 'ExportNamedDeclaration') {
      if (n.declaration?.type === 'VariableDeclaration') n.declaration.declarations.forEach((d) => own(d.id).forEach((x) => names.add(x)));
      else if (n.declaration) names.add(n.declaration.id.name);
      n.specifiers.forEach((s) => names.add(s.exported.name));
    }
  }
  return names;
}

/**
 * Whether the engine's `<module>/<set>` is the game's file: its own statements
 * and the core's it takes, and nothing else, are the file's statements, and it
 * exports what the file exports.
 */
export function compareVersion(gameFileText, module, set) {
  const variantText = readFileSync(join(SRC, module, `${set}.js`), 'utf8');
  const coreText = readFileSync(join(SRC, module, 'core.js'), 'utf8');
  const original = split(gameFileText);
  const variant = split(variantText);
  const core = split(coreText);
  const real = (s) => !s.reexport;
  // A statement without the `export` in front of it: the core exports whatever a game takes from it.
  const bare = (s) => {
    const at = s.node.range[0] - s.start;
    return s.text.slice(0, at) + s.text.slice(at).replace(/^export\s+(?!default\b)/, '');
  };

  const declaredInCore = new Map();
  for (const s of core.statements) for (const n of s.names) declaredInCore.set(n, s);
  const need = [];
  for (const i of variant.imports) if (i.source === './core.js') need.push(...i.specifiers.map((x) => x.imported));
  for (const s of variant.statements) if (s.reexport && s.exportSource === './core.js') need.push(...s.exportSpecifiers.map((x) => x.local));
  const taken = new Map();
  const take = (n) => {
    const s = declaredInCore.get(n);
    if (!s || taken.has(s.text)) return;
    taken.set(s.text, s);
    for (const m of s.mentions) if (declaredInCore.has(m)) take(m);
  };
  need.forEach(take);

  const have = new Set([...variant.statements.filter(real).map(bare), ...[...taken.values()].map(bare)]);
  const want = new Set(original.statements.filter(real).map(bare));
  const missing = [...want].filter((t) => !have.has(t));
  const extra = [...have].filter((t) => !want.has(t));
  if (missing.length || extra.length) return { ok: false, detail: `${missing.length} statements of the game's are missing, ${extra.length} are not the game's (${(missing[0] ?? extra[0]).slice(0, 60).replace(/\n/g, ' ')}…)` };

  const a = exportsOf(gameFileText), b = exportsOf(variantText);
  const lost = [...a].filter((n) => !b.has(n)), gained = [...b].filter((n) => !a.has(n));
  if (lost.length || gained.length) return { ok: false, detail: `exports differ: lost ${lost}, gained ${gained}` };
  return { ok: true, statements: want.size, exports: a.size };
}

export { VARIANTS };
