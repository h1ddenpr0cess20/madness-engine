/**
 * Splits several games' versions of one module into a *core* of what they
 * have in common and, for each game, a *variant* of what is its own.
 *
 * A top-level statement goes into the core when its text is the same in two or
 * more of the versions and everything it refers to at the top level of the
 * module is in the core too, the same text in each of those versions: so what a
 * shared statement does cannot differ from one game to the next. Everything
 * else stays in the variant it came from, in its order. A variant is its
 * imports, the core names it uses, its own statements, and re-exports of what
 * it used to export and now takes from the core.
 */
import { parse } from 'espree';

import { split } from './split.mjs';

const OPTIONS = { ecmaVersion: 'latest', sourceType: 'module' };
const hasName = (s) => s.names.length > 0;
const shareable = (s) => !s.exportDefault && !s.reexport && hasName(s) && s.kind !== 'let' && s.kind !== 'var';

/**
 * @param variants  { name: source text }
 * @returns { core: text, variants: { name: text }, report }
 */
export function dedupe(variants) {
  const parsed = Object.fromEntries(Object.entries(variants).map(([name, text]) => [name, split(text)]));
  const names = Object.keys(parsed);

  // Which statement declares each top-level name, in each variant.
  const declared = {};
  const importedIn = {};
  for (const v of names) {
    declared[v] = new Map();
    for (const s of parsed[v].statements) for (const n of s.names) declared[v].set(n, s);
    importedIn[v] = new Map(parsed[v].imports.flatMap((i) => i.specifiers.map((x) => [x.local, `${i.source}|${x.imported}`])));
  }

  // The texts that occur in two or more variants, and which.
  const where = new Map();
  for (const v of names) {
    for (const s of parsed[v].statements) {
      if (!shareable(s)) continue;
      if (!where.has(s.text)) where.set(s.text, { text: s.text, names: s.names, variants: [], stmts: {} });
      const w = where.get(s.text);
      w.variants.push(v);
      w.stmts[v] = s;
    }
  }
  let core = new Map([...where].filter(([, w]) => w.variants.length > 1));

  // A shared statement may not use anything the variants don't hold in common.
  const mentionsOwn = (w, v) => [...w.stmts[v].mentions].filter((n) => !w.names.includes(n));
  let changed = true;
  while (changed) {
    changed = false;
    // One declaration of each name in the core: the one most variants share.
    const byName = new Map();
    for (const w of [...core.values()].sort((a, b) => b.variants.length - a.variants.length)) {
      for (const n of w.names) {
        if (byName.has(n) && byName.get(n) !== w) { core.delete(w.text); changed = true; break; }
        byName.set(n, w);
      }
    }
    for (const w of [...core.values()]) {
      let ok = true;
      for (const v of w.variants) {
        for (const n of mentionsOwn(w, v)) {
          if (importedIn[v].has(n)) {
            // An import is the game's own unless every game that shares this statement imports the same thing.
            for (const u of w.variants) if (importedIn[u].get(n) !== importedIn[v].get(n)) ok = false;
            if (!ok) break;
            continue;
          }
          const d = declared[v].get(n);
          if (!d) continue; // a global or a local: nothing of the module's
          if (!core.has(d.text) || !core.get(d.text).variants.includes(v)) { ok = false; break; }
          // The same declaration in every variant that has this statement.
          for (const u of w.variants) if (declared[u].get(n)?.text !== d.text) ok = false;
        }
        if (!ok) break;
      }
      if (!ok) { core.delete(w.text); changed = true; }
    }
  }

  // Core order: each statement after what it refers to, otherwise as the variants have them.
  const order = [];
  const placed = new Set();
  const byDeclared = new Map();
  for (const w of core.values()) for (const n of w.names) byDeclared.set(n, w);
  const firstPos = (w) => Math.min(...w.variants.map((v) => parsed[v].statements.indexOf(w.stmts[v]) / parsed[v].statements.length));
  const visit = (w, stack = []) => {
    if (placed.has(w.text)) return;
    if (stack.includes(w)) return; // a cycle of functions: any order does
    for (const n of mentionsOwn(w, w.variants[0])) {
      const dep = byDeclared.get(n);
      if (dep && dep !== w) visit(dep, [...stack, w]);
    }
    placed.add(w.text);
    order.push(w);
  };
  [...core.values()].sort((a, b) => firstPos(a) - firstPos(b)).forEach((w) => visit(w));

  // Core text: every name exported, so any variant can take it.
  const exportTo = (s) => {
    if (s.exported) return s.text;
    const at = s.node.range[0] - s.start;
    return `${s.text.slice(0, at)}export ${s.text.slice(at)}`;
  };
  // What the core imports: whatever its statements use that the games import.
  const coreImports = new Map();
  for (const w of order) {
    const v = w.variants[0];
    for (const n of mentionsOwn(w, v)) {
      for (const imp of parsed[v].imports) {
        for (const sp of imp.specifiers) if (sp.local === n) {
          if (!coreImports.has(imp.source)) coreImports.set(imp.source, new Map());
          coreImports.get(imp.source).set(sp.local, sp.imported);
        }
      }
    }
  }
  const importLine = (source, uses) => {
    const ns = [...uses].find(([, imported]) => imported === '*');
    const def = [...uses].find(([, imported]) => imported === 'default');
    const named = [...uses].filter(([, imported]) => imported !== '*' && imported !== 'default').map(([local, imported]) => (local === imported ? local : `${imported} as ${local}`)).sort();
    if (ns) return `import * as ${ns[0]} from '${source}';`;
    return `import ${[def?.[0], named.length ? `{ ${named.join(', ')} }` : null].filter(Boolean).join(', ')} from '${source}';`;
  };
  const coreHead = [...coreImports].map(([source, uses]) => importLine(source, uses)).join('\n');
  const coreText = order.length ? `${coreHead}${coreHead ? '\n\n' : ''}${order.map((w) => exportTo(w.stmts[w.variants[0]])).join('\n\n')}\n` : '';
  const coreNames = new Set(order.flatMap((w) => w.names));
  parse(coreText, OPTIONS);

  // The variants.
  const out = {};
  const report = { shared: order.length, variants: {} };
  for (const v of names) {
    const { imports, statements, source } = parsed[v];
    const own = statements.filter((s) => !(shareable(s) && core.get(s.text)?.variants.includes(v)));
    const taken = statements.filter((s) => !own.includes(s));
    const takenNames = new Set(taken.flatMap((s) => s.names));
    const used = new Set(), exported = new Set();
    for (const s of own) for (const n of s.mentions) if (takenNames.has(n)) used.add(n);
    for (const s of taken) if (s.exported) for (const n of s.names) exported.add(n);
    // Names re-exported from a list (`export { a, b }`) are mentioned already.
    const lines = [];
    // The imports its own statements still use.
    const stillUsed = new Set();
    for (const st of own) for (const n of st.mentions) stillUsed.add(n);
    for (const i of imports) {
      if (!i.specifiers.length) { lines.push(i.text); continue; }
      const kept = i.specifiers.filter((x) => stillUsed.has(x.local));
      if (kept.length === i.specifiers.length) lines.push(i.text);
      else if (kept.length) lines.push(importLine(i.source, new Map(kept.map((x) => [x.local, x.imported]))));
    }
    if (used.size) lines.push(`import { ${[...used].sort().join(', ')} } from './core.js';`);
    const reexport = [...exported].filter((n) => !used.has(n)).sort();
    if (reexport.length) lines.push(`export { ${reexport.join(', ')} } from './core.js';`);
    const alsoExport = [...exported].filter((n) => used.has(n)).sort();
    if (alsoExport.length) lines.push(`export { ${alsoExport.join(', ')} };`);
    // The file's head — a comment above its first statement — belongs to the variant.
    const first = statements[0];
    const head = first ? source.slice(imports.length ? source.indexOf(imports.at(-1).text) + imports.at(-1).text.length : 0, first.start).trim() : '';
    const body = own.map((s) => s.text).join('\n\n');
    const text = `${lines.join('\n')}${lines.length ? '\n\n' : ''}${head ? `${head}\n\n` : ''}${body}\n`;
    parse(text, OPTIONS);
    out[v] = text;
    report.variants[v] = { own: own.length, taken: taken.length, lines: { own: body.split('\n').length, taken: taken.reduce((n, s) => n + s.text.split('\n').length, 0) } };
  }
  return { core: coreText, variants: out, report, coreNames };
}
