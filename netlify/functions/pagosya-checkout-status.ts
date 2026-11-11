import { getPagosyaCheckoutStatus } from "../../server/pagosyaService.ts";

export const handler = async (event: any) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers,
      body: "",
    };
  }

  if (event.httpMethod !== "GET" && event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Método no permitido. Se requiere GET o POST." }),
    };
  }

  try {
    let checkoutId = event.queryStringParameters?.checkout_id || event.queryStringParameters?.checkoutId || "";
    let statusUrl = event.queryStringParameters?.status_url || event.queryStringParameters?.statusUrl || "";

    if (!checkoutId && event.body) {
      try {
        const parsed = JSON.parse(event.body);
        checkoutId = parsed.checkout_id || parsed.checkoutId || checkoutId;
        statusUrl = parsed.status_url || parsed.statusUrl || statusUrl;
      } catch {
        // Ignorar error de parseo en body si viene en query
      }
    }

    if (!checkoutId && !statusUrl) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Se requiere 'checkout_id' o 'status_url' para consultar el estado." }),
      };
    }

    const result = await getPagosyaCheckoutStatus(checkoutId, statusUrl);

    return {
      statusCode: result.statusCode,
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(result.success ? result.data : { error: result.error, detail: result.detail }),
    };
  } catch (error: any) {
    console.error("[Netlify Function PagosYa Status Error]:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Error interno al consultar estado del checkout.",
        detail: error?.message || String(error),
      }),
    };
  }
};
