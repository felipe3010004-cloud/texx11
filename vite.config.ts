import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import { generateGroundedChatResponse } from './server/aiService.ts';
import {
  createPagosyaCheckout,
  getPagosyaCheckoutStatus,
  verifyPagosyaWebhookSignature,
  processPagosyaWebhookEvent,
} from './server/pagosyaService.ts';

function apiPlugin(): Plugin {
  return {
    name: 'team-life-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const cleanUrl = req.url ? req.url.split('?')[0].replace(/\/+$/, '') : '';

        // CORS headers
        const isPagosyaRoute =
          cleanUrl.startsWith('/api/pagosya/') ||
          cleanUrl.startsWith('/.netlify/functions/pagosya-') ||
          cleanUrl === '/api/ai/chat';

        if (isPagosyaRoute) {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-PagosYa-Signature');

          if (req.method === 'OPTIONS') {
            res.statusCode = 204;
            res.end();
            return;
          }
        }

        if (cleanUrl === '/api/ai/chat') {
          if (req.method === 'POST') {
            let body = '';
            req.on('data', (chunk) => {
              body += chunk;
            });
            req.on('end', async () => {
              try {
                const parsed = JSON.parse(body || '{}');
                const { prompt, history } = parsed;
                const result = await generateGroundedChatResponse(prompt || '', history);
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 200;
                res.end(JSON.stringify(result));
              } catch (err: any) {
                console.error('[Vite Server Error]:', err);
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 500;
                res.end(JSON.stringify({ 
                  reply: 'Ocurrió un error al procesar tu consulta con la inteligencia artificial. Por favor intenta de nuevo.' 
                }));
              }
            });
            return;
          }
        }

        if (cleanUrl === '/api/pagosya/create-checkout' || cleanUrl === '/.netlify/functions/pagosya-create-checkout') {
          if (req.method === 'POST') {
            let body = '';
            req.on('data', (chunk) => {
              body += chunk;
            });
            req.on('end', async () => {
              try {
                const parsed = JSON.parse(body || '{}');
                const host = req.headers['host'];
                const origin = host ? `http://${host}` : undefined;
                const result = await createPagosyaCheckout(parsed, origin);
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = result.statusCode;
                res.end(JSON.stringify(result.success ? result.data : { error: result.error, detail: result.detail }));
              } catch (err: any) {
                console.error('[Vite PagosYa Server Error]:', err);
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 500;
                res.end(JSON.stringify({ 
                  error: 'Error interno en el servidor dev al generar checkout de PagosYa.',
                  detail: err?.message || String(err)
                }));
              }
            });
            return;
          }
        }

        if (cleanUrl === '/api/pagosya/checkout-status' || cleanUrl === '/.netlify/functions/pagosya-checkout-status') {
          const urlObj = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
          const checkoutId = urlObj.searchParams.get('checkout_id') || urlObj.searchParams.get('checkoutId') || '';
          const statusUrl = urlObj.searchParams.get('status_url') || urlObj.searchParams.get('statusUrl') || '';

          try {
            const result = await getPagosyaCheckoutStatus(checkoutId, statusUrl);
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = result.statusCode;
            res.end(JSON.stringify(result.success ? result.data : { error: result.error, detail: result.detail }));
          } catch (err: any) {
            console.error('[Vite PagosYa Status Error]:', err);
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 500;
            res.end(JSON.stringify({
              error: 'Error interno al consultar estado del checkout.',
              detail: err?.message || String(err),
            }));
          }
          return;
        }

        if (cleanUrl === '/api/pagosya/webhook' || cleanUrl === '/.netlify/functions/pagosya-webhook') {
          if (req.method === 'POST') {
            let rawBody = '';
            req.on('data', (chunk) => {
              rawBody += chunk;
            });
            req.on('end', async () => {
              try {
                const signature = (req.headers['x-pagosya-signature'] || req.headers['X-PagosYa-Signature']) as string;
                if (process.env.PAGOSYA_WEBHOOK_SECRET) {
                  const isValid = verifyPagosyaWebhookSignature(rawBody, signature);
                  if (!isValid) {
                    res.setHeader('Content-Type', 'application/json');
                    res.statusCode = 401;
                    res.end(JSON.stringify({ error: 'Firma inválida (X-PagosYa-Signature).' }));
                    return;
                  }
                }

                const payload = JSON.parse(rawBody || '{}');
                const result = processPagosyaWebhookEvent(payload);
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 200;
                res.end(JSON.stringify(result.success ? { received: true, ...result } : { success: false, message: result.error }));
              } catch (err: any) {
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Payload de webhook inválido.', detail: err?.message || String(err) }));
              }
            });
            return;
          }
        }

        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiPlugin()],
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
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

