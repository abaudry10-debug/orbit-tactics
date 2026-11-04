import { register } from 'node:module';

// Les sources importent './x.js' (pour le navigateur) : en test, on pointe vers './x.ts'.
register(
  'data:text/javascript,' +
    encodeURIComponent(`
      import { existsSync } from 'node:fs';
      import { fileURLToPath } from 'node:url';
      export async function resolve(spec, ctx, next) {
        if (spec.startsWith('.') && spec.endsWith('.js') && ctx.parentURL) {
          const url = new URL(spec.slice(0, -3) + '.ts', ctx.parentURL);
          if (existsSync(fileURLToPath(url))) return next(url.href, ctx);
        }
        return next(spec, ctx);
      }
    `),
);
