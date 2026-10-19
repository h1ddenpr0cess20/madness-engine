import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';

const walk = (dir) => readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : [join(dir, f)]));

/** A shader without its comments or the blank lines they leave: what the GPU is given. */
const code = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '').split('\n').map((l) => l.trimEnd()).filter(Boolean).join('\n');

/**
 * Whether every shader file the game has (`.glsl`, `.wgsl`) is, as the engine's
 * module of the same name, the same code, and the engine has none the game
 * doesn't, so nothing is drawn by a shader the game never had.
 */
export async function compareShaders(gameDir, engineDir) {
  const own = walk(gameDir).filter((f) => /\.(glsl|wgsl)$/.test(f));
  for (const file of own) {
    const rel = relative(gameDir, file);
    const { default: text } = await import(pathToFileURL(join(engineDir, `${rel}.js`))).catch(() => ({ default: null }));
    if (text === null || code(text) !== code(readFileSync(file, 'utf8'))) return { ok: false, detail: `${rel}${text === null ? ' is missing from the engine' : ''}` };
  }
  const engine = walk(engineDir).filter((f) => /\.(glsl|wgsl)\.js$/.test(f)).map((f) => relative(engineDir, f).replace(/\.js$/, ''));
  const extra = engine.filter((rel) => !own.some((f) => relative(gameDir, f) === rel));
  if (extra.length) return { ok: false, detail: `the engine has ${extra.join(', ')} and the game doesn't` };
  return { ok: true, files: own.length };
}
