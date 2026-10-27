import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

function sheetsProxyPlugin() {
  return {
    name: 'sheets-proxy-plugin',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (req.url && req.url.startsWith('/api/sheets-proxy')) {
          try {
            const urlObj = new URL(req.url, 'http://localhost:3000');
            const sheetId = urlObj.searchParams.get('sheetId') || '1X7xtW4YrjEv43t1byX6CjMFxh4UKsZft00KQJuXEroc';
            const targetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
            const resp = await fetch(targetUrl);
            if (!resp.ok) {
              res.statusCode = resp.status;
              res.end('Failed to fetch from Google Sheets');
              return;
            }
            const csv = await resp.text();
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(csv);
          } catch (err: any) {
            res.statusCode = 500;
            res.end(err.message || 'Error proxying sheet');
          }
          return;
        }
        next();
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), sheetsProxyPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
