import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const FLAGS = fileURLToPath(new URL('./flags.json', import.meta.url));

/** Flags are kept in `flags.json` beside this file (dev server only), so they can be read back and fixed. */
function flagStore() {
  return {
    name: 'flag-store',
    configureServer(server) {
      server.middlewares.use('/__flags', (req, res) => {
        res.setHeader('content-type', 'application/json');
        if (req.method === 'POST') {
          let body = '';
          req.on('data', (c) => { body += c; });
          req.on('end', () => {
            try {
              writeFileSync(FLAGS, `${JSON.stringify(JSON.parse(body), null, 2)}\n`);
              res.end('{"ok":true}');
            } catch (err) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: String(err.message) }));
            }
          });
          return;
        }
        res.end(existsSync(FLAGS) ? readFileSync(FLAGS, 'utf8') : '{}');
      });
    },
  };
}

export default defineConfig({
  plugins: [flagStore()],
  server: { fs: { allow: ['../..'] } },
});
