import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

function demoProjectPersistencePlugin(): Plugin {
  const dataFilePath = path.resolve(__dirname, 'src/data/savedDemoData.json');
  return {
    name: 'gobell-demo-persistence',
    configureServer(server) {
      server.middlewares.use('/api/demo-state', (req, res) => {
        if (req.method === 'GET') {
          try {
            const raw = fs.existsSync(dataFilePath)
              ? fs.readFileSync(dataFilePath, 'utf-8')
              : '{}';
            res.setHeader('Content-Type', 'application/json');
            res.end(raw);
          } catch {
            res.statusCode = 500;
            res.end(JSON.stringify({error: 'Failed to read savedDemoData.json'}));
          }
          return;
        }

        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const parsed = JSON.parse(body);
              fs.writeFileSync(dataFilePath, JSON.stringify(parsed, null, 2), 'utf-8');
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ok: true}));
            } catch {
              res.statusCode = 400;
              res.end(JSON.stringify({error: 'Invalid JSON'}));
            }
          });
          return;
        }

        res.statusCode = 405;
        res.end();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), demoProjectPersistencePlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch:
        process.env.DISABLE_HMR === 'true'
          ? null
          : {
              ignored: ['**/savedDemoData.json'],
            },
    },
  };
});
