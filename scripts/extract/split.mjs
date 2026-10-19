/**
 * Splits a module into its top-level statements, each with the comment above
 * it, and says what each one declares and what it refers to.
 */
import * as espree from 'espree';

const OPTIONS = { ecmaVersion: 'latest', sourceType: 'module', range: true, comment: true, tokens: false };

/** The names a pattern (`a`, `{ a, b: [c] }`, `...rest`) declares. */
function patternNames(node, out = []) {
  if (!node) return out;
  switch (node.type) {
    case 'Identifier': out.push(node.name); break;
    case 'ObjectPattern': node.properties.forEach((p) => patternNames(p.value ?? p.argument, out)); break;
    case 'ArrayPattern': node.elements.forEach((e) => patternNames(e, out)); break;
    case 'RestElement': patternNames(node.argument, out); break;
    case 'AssignmentPattern': patternNames(node.left, out); break;
  }
  return out;
}

/**
 * Every identifier a statement refers to anywhere, declared inside it or not
 * (over-counting is safe: it only keeps things apart). A name that is only a
 * property — `a.name`, `{ name: 1 }`, a method's name — is not a reference.
 */
function mentions(node, out = new Set()) {
  if (!node || typeof node !== 'object') return out;
  if (Array.isArray(node)) { node.forEach((n) => mentions(n, out)); return out; }
  if (node.type === 'Identifier') out.add(node.name);
  for (const [k, v] of Object.entries(node)) {
    if (k === 'range' || k === 'loc' || !v || typeof v !== 'object') continue;
    if (node.type === 'MemberExpression' && k === 'property' && !node.computed) continue;
    if ((node.type === 'Property' || node.type === 'MethodDefinition' || node.type === 'PropertyDefinition') && k === 'key' && !node.computed) {
      // A shorthand `{ a }` names the variable by its value.
      if (!(node.type === 'Property' && node.shorthand)) continue;
    }
    mentions(v, out);
  }
  return out;
}

/**
 * @returns { imports, statements, source }: the imports, and each other
 *   top-level statement with its text (and the comments above it), the names
 *   it declares, what it mentions, and how it is exported.
 */
export function split(source) {
  const ast = espree.parse(source, OPTIONS);
  const comments = ast.comments;
  const imports = [];
  const statements = [];
  let prevEnd = 0;
  for (const node of ast.body) {
    // The comments directly above it (only whitespace between), and the statement's own start.
    let start = node.range[0];
    for (let i = comments.length - 1; i >= 0; i--) {
      const c = comments[i];
      if (c.range[1] <= start && c.range[0] >= prevEnd && /^\s*$/.test(source.slice(c.range[1], start))) start = c.range[0];
    }
    const text = source.slice(start, node.range[1]);
    prevEnd = node.range[1];
    if (node.type === 'ImportDeclaration') {
      imports.push({ text: source.slice(node.range[0], node.range[1]), source: node.source.value, specifiers: node.specifiers.map((s) => ({ imported: s.type === 'ImportSpecifier' ? s.imported.name : s.type === 'ImportDefaultSpecifier' ? 'default' : '*', local: s.local.name })) });
      continue;
    }
    const decl = node.type.startsWith('Export') ? node.declaration : node;
    let names = [], kind = node.type;
    if (decl?.type === 'FunctionDeclaration' || decl?.type === 'ClassDeclaration') { names = [decl.id.name]; kind = decl.type; }
    else if (decl?.type === 'VariableDeclaration') { names = decl.declarations.flatMap((d) => patternNames(d.id)); kind = `${decl.kind}`; }
    statements.push({
      text, start, end: node.range[1],
      names, kind,
      exported: node.type.startsWith('Export'),
      exportDefault: node.type === 'ExportDefaultDeclaration',
      reexport: node.type === 'ExportNamedDeclaration' && !node.declaration,
      exportSource: node.type === 'ExportNamedDeclaration' && !node.declaration ? node.source?.value ?? null : null,
      exportSpecifiers: node.type === 'ExportNamedDeclaration' && !node.declaration ? node.specifiers.map((x) => ({ local: x.local.name, exported: x.exported.name })) : [],
      mentions: mentions(decl ?? node),
      node,
    });
  }
  return { imports, statements, source };
}
