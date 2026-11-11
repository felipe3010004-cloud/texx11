import { createPagosyaCheckout } from "../../server/pagosyaService.ts";

export const handler = async (event: any) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
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

  try {
    let payload: any = {};
    if (event.body) {
      try {
        payload = JSON.parse(event.body);
      } catch {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "El cuerpo de la petición debe ser JSON válido." }),
        };
      }
    }

    const host = event.headers?.["host"] || event.headers?.["Host"] || "";
    const protocol = event.headers?.["x-forwarded-proto"] || "https";
    const origin = host ? `${protocol}://${host}` : undefined;

    const result = await createPagosyaCheckout(payload, origin);

    return {
      statusCode: result.statusCode,
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(result.success ? result.data : { error: result.error, detail: result.detail }),
    };
  } catch (error: any) {
    console.error("[Netlify Function PagosYa Error]:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Error interno al procesar la solicitud con PagosYa.",
        detail: error?.message || String(error),
      }),
    };
  }
};
