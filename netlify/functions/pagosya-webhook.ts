import {
  verifyPagosyaWebhookSignature,
  processPagosyaWebhookEvent,
} from "../../server/pagosyaService.ts";

export const handler = async (event: any) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-PagosYa-Signature",
  };

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers,
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Método no permitido. Se requiere POST." }),
    };
  }

  const rawBody = event.body || "";
  const signature =
    event.headers?.["x-pagosya-signature"] ||
    event.headers?.["X-PagosYa-Signature"] ||
    "";

  // Verificar firma HMAC-SHA256 si PAGOSYA_WEBHOOK_SECRET está configurado
  if (process.env.PAGOSYA_WEBHOOK_SECRET) {
    const isValid = verifyPagosyaWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.warn("[PagosYa Webhook] Firma HMAC inválida o ausente.");
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: "Firma inválida (X-PagosYa-Signature)." }),
      };
    }
  }

  try {
    const payload = JSON.parse(rawBody || "{}");
    const result = processPagosyaWebhookEvent(payload);

    if (!result.success) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: result.error || "Evento omitido" }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        received: true,
        order_id: result.orderId,
        checkout_id: result.checkoutId,
        status: result.status,
      }),
    };
  } catch (error: any) {
    console.error("[PagosYa Webhook Parse Error]:", error);
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Payload no JSON válido." }),
    };
  }
};
