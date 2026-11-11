import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { generateGroundedChatResponse } from './server/aiService.ts';
import {
  createPagosyaCheckout,
  getPagosyaCheckoutStatus,
  verifyPagosyaWebhookSignature,
  processPagosyaWebhookEvent,
} from './server/pagosyaService.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Preservar rawBody para verificación criptográfica HMAC en webhooks
app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf.toString();
    },
  })
);

// CORS Middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-PagosYa-Signature');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// API Endpoint for Gemini AI chat
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { prompt, history } = req.body || {};
    const result = await generateGroundedChatResponse(prompt || '', history);
    res.json(result);
  } catch (err: any) {
    console.error('Error in /api/ai/chat endpoint:', err);
    res.status(500).json({ 
      reply: 'Ocurrió un error al procesar tu consulta con la inteligencia artificial. Por favor intenta de nuevo.' 
    });
  }
});

// API Endpoint for PagosYa Checkout Creation (Multi-environment)
app.post(['/api/pagosya/create-checkout', '/.netlify/functions/pagosya-create-checkout'], async (req, res) => {
  try {
    const origin = `${req.protocol}://${req.get('host')}`;
    const result = await createPagosyaCheckout(req.body, origin);
    res.status(result.statusCode).json(result.success ? result.data : { error: result.error, detail: result.detail });
  } catch (err: any) {
    console.error('Error in /api/pagosya/create-checkout endpoint:', err);
    res.status(500).json({
      error: 'Error interno en el servidor al generar checkout con PagosYa.',
      detail: err?.message || String(err),
    });
  }
});

// API Endpoint for PagosYa Checkout Status Query
app.get(['/api/pagosya/checkout-status', '/.netlify/functions/pagosya-checkout-status'], async (req, res) => {
  try {
    const checkoutId = String(req.query.checkout_id || req.query.checkoutId || '');
    const statusUrl = String(req.query.status_url || req.query.statusUrl || '');

    const result = await getPagosyaCheckoutStatus(checkoutId, statusUrl);
    res.status(result.statusCode).json(result.success ? result.data : { error: result.error, detail: result.detail });
  } catch (err: any) {
    console.error('Error in /api/pagosya/checkout-status endpoint:', err);
    res.status(500).json({
      error: 'Error interno al consultar estado del checkout.',
      detail: err?.message || String(err),
    });
  }
});

// API Endpoint for PagosYa Webhook (checkout.completed with HMAC verification)
app.post(['/api/pagosya/webhook', '/.netlify/functions/pagosya-webhook'], async (req: any, res) => {
  try {
    const rawBody = req.rawBody || JSON.stringify(req.body || {});
    const signature = req.get('x-pagosya-signature') || req.get('X-PagosYa-Signature');

    if (process.env.PAGOSYA_WEBHOOK_SECRET) {
      const isValid = verifyPagosyaWebhookSignature(rawBody, signature);
      if (!isValid) {
        console.warn('[PagosYa Webhook Server] Firma HMAC inválida o ausente.');
        return res.status(401).json({ error: 'Firma inválida (X-PagosYa-Signature).' });
      }
    }

    const result = processPagosyaWebhookEvent(req.body);
    if (!result.success) {
      return res.status(200).json({ message: result.error || 'Evento omitido' });
    }

    return res.status(200).json({
      success: true,
      received: true,
      order_id: result.orderId,
      checkout_id: result.checkoutId,
      status: result.status,
    });
  } catch (err: any) {
    console.error('Error in /api/pagosya/webhook endpoint:', err);
    res.status(400).json({
      error: 'Error al procesar notificación de webhook.',
      detail: err?.message || String(err),
    });
  }
});

// Serve static frontend assets in production
app.use(express.static(path.join(__dirname, 'dist')));

// Fallback to index.html for SPA routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Team Life Server running on http://0.0.0.0:${PORT}`);
});
