import dotenv from "dotenv";
import crypto from "crypto";

// Load environment variables with override
dotenv.config({ override: true });

export type PagosyaEnvironment = "sandbox" | "production";

export interface PagosyaConfig {
  environment: PagosyaEnvironment;
  isProduction: boolean;
  apiKey: string;
  endpoint: string;
  webhookSecret: string;
}

export interface PagosyaServiceResponse {
  success: boolean;
  statusCode: number;
  data?: any;
  error?: string;
  detail?: any;
}

/**
 * Obtiene la configuración centralizada de PagosYa evaluando variables de entorno.
 * Por defecto el ambiente es SIEMPRE "sandbox" a menos que PAGOSYA_ENV="production"
 * explícitamente y se cuente con la clave PAGOSYA_PRODUCTION_API_KEY.
 */
export function getPagosyaConfig(): PagosyaConfig {
  const rawEnv = (process.env.PAGOSYA_ENV || "sandbox").trim().toLowerCase();
  const isProduction = rawEnv === "production";
  const environment: PagosyaEnvironment = isProduction ? "production" : "sandbox";

  const apiKey = isProduction
    ? (process.env.PAGOSYA_PRODUCTION_API_KEY || "").trim()
    : (process.env.PAGOSYA_API_KEY || "").trim();

  const endpoint = isProduction
    ? "https://nbjwpakpimrqfocsxkda.supabase.co/functions/v1/create-external-checkout"
    : "https://nbjwpakpimrqfocsxkda.supabase.co/functions/v1/sandbox-create-checkout";

  const webhookSecret = (process.env.PAGOSYA_WEBHOOK_SECRET || "").trim();

  return {
    environment,
    isProduction,
    apiKey,
    endpoint,
    webhookSecret,
  };
}

/**
 * Genera una sesión de checkout y código QR con PagosYa (compatible con Sandbox y Producción).
 */
export async function createPagosyaCheckout(
  payload: any,
  originHeader?: string
): Promise<PagosyaServiceResponse> {
  const config = getPagosyaConfig();

  // 1. Validar presencia y formato de API Key según el ambiente activo
  if (!config.apiKey) {
    if (config.isProduction) {
      return {
        success: false,
        statusCode: 401,
        error:
          "El ambiente de PRODUCCIÓN está activado (PAGOSYA_ENV=production), pero no se encontró la clave PAGOSYA_PRODUCTION_API_KEY. Por seguridad la transacción real ha sido bloqueada.",
      };
    } else {
      return {
        success: false,
        statusCode: 401,
        error:
          "No se encontró la variable PAGOSYA_API_KEY en el servidor para el ambiente Sandbox. Configura tu clave de pruebas 'sk_test_...' en el archivo .env o en el panel de Netlify.",
      };
    }
  }

  if (config.isProduction && !config.apiKey.startsWith("sk_live_")) {
    return {
      success: false,
      statusCode: 401,
      error:
        "La clave de PagosYa configurada para Producción no es válida. En Producción la credencial debe iniciar con el prefijo 'sk_live_'.",
    };
  }

  if (!config.isProduction && !config.apiKey.startsWith("sk_test_")) {
    return {
      success: false,
      statusCode: 401,
      error:
        "La clave de PagosYa configurada no es válida para el ambiente Sandbox. En Sandbox la credencial debe iniciar con 'sk_test_'.",
    };
  }

  // 2. Validar monto positivo
  const amount = Number(payload.amount);
  if (isNaN(amount) || amount <= 0) {
    return {
      success: false,
      statusCode: 400,
      error: "El monto a cobrar debe ser un número positivo mayor a cero.",
    };
  }

  // 3. Validar identificador único de pedido (order_id)
  const orderId =
    typeof payload.order_id === "string" ? payload.order_id.trim() : "";
  if (!orderId) {
    return {
      success: false,
      statusCode: 400,
      error: "El campo 'order_id' es obligatorio y debe ser un texto único.",
    };
  }
  if (orderId.length > 120) {
    return {
      success: false,
      statusCode: 400,
      error: "El campo 'order_id' no debe exceder los 120 caracteres.",
    };
  }

  // 4. Validar minutos de expiración según la normativa oficial de PagosYa:
  // En Producción la vigencia máxima oficial es de 5 minutos.
  // En Sandbox se permite un rango entre 5 y 1440 minutos (predeterminado 30).
  let expirationMinutes = Number(payload.expiration_minutes);
  if (config.isProduction) {
    // Máximo 5 minutos en producción según documentación
    expirationMinutes = Math.min(5, Math.max(1, isNaN(expirationMinutes) ? 5 : expirationMinutes));
  } else {
    if (isNaN(expirationMinutes) || expirationMinutes < 5 || expirationMinutes > 1440) {
      expirationMinutes = 30;
    }
  }

  // 5. Determinar URLs de retorno
  const baseUrl = originHeader || "https://teamlife.bo";
  const successUrl =
    typeof payload.success_url === "string" && payload.success_url.trim()
      ? payload.success_url
      : `${baseUrl}/pago/exitoso`;
  const cancelUrl =
    typeof payload.cancel_url === "string" && payload.cancel_url.trim()
      ? payload.cancel_url
      : `${baseUrl}/pago/cancelado`;

  // 6. Preparar cuerpo de solicitud con nombres exactos de propiedades
  const requestBody: Record<string, any> = {
    amount: Math.round(amount * 100) / 100,
    currency: payload.currency || "BOB",
    order_id: orderId,
    success_url: successUrl,
    cancel_url: cancelUrl,
    expiration_minutes: expirationMinutes,
    customer: {
      name: payload.customer?.name?.slice(0, 100) || "Cliente Team Life",
      email: payload.customer?.email?.slice(0, 100) || undefined,
      phone: payload.customer?.phone?.slice(0, 30) || undefined,
    },
    metadata: {
      source: "team-life-web",
      app: "Equipo Vida S.R.L.",
      environment: config.environment,
      items_count: payload.metadata?.items_count || 1,
      ...(payload.metadata || {}),
    },
  };

  try {
    const response = await fetch(config.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    const statusCode = response.status;
    let responseData: any;
    try {
      responseData = await response.json();
    } catch {
      responseData = { message: "Respuesta no JSON recibida de PagosYa" };
    }

    if (!response.ok) {
      console.error(`[PagosYa ${config.environment.toUpperCase()} Error] HTTP ${statusCode}:`, responseData);

      let friendlyError = "Error al comunicarse con la pasarela de pagos PagosYa.";
      if (statusCode === 400) {
        friendlyError =
          responseData?.message ||
          responseData?.error ||
          `Datos inválidos enviados a PagosYa (${config.environment}).`;
      } else if (statusCode === 401) {
        friendlyError = config.isProduction
          ? "Credenciales de PagosYa Producción no autorizadas (verifica tu API key 'sk_live_...')."
          : "Credenciales de PagosYa Sandbox no autorizadas (verifica tu API key 'sk_test_...').";
      } else if (statusCode === 409) {
        friendlyError =
          "Conflicto: Ya existe un checkout creado previamente con esta misma referencia de pedido (DUPLICATE_ORDER_ID).";
      } else if (statusCode === 429) {
        friendlyError =
          "Límite de solicitudes alcanzado en PagosYa. Por favor espera unos momentos.";
      } else if (statusCode >= 500) {
        friendlyError =
          "El servicio de PagosYa experimentó un error temporal. Intenta de nuevo en unos momentos.";
      }

      return {
        success: false,
        statusCode,
        error: friendlyError,
        detail: responseData,
      };
    }

    // Respuesta exitosa
    const qrObj = responseData?.qr || {};
    const sanitizedData = {
      checkout_id: responseData?.checkout_id || responseData?.id || "",
      order_id: responseData?.order_id || orderId,
      status: responseData?.status || "pending",
      livemode: responseData?.livemode === true, // true solo en producción real
      qr_code: responseData?.qr_code || "",
      qr_image: responseData?.qr_image || "",
      embedded_enabled: responseData?.embedded_enabled ?? true,
      qr: {
        data_url: qrObj.data_url || responseData?.qr_image || responseData?.qr?.data_url || "",
        base64: qrObj.base64 || responseData?.qr?.base64 || "",
        branded: qrObj.branded ?? true,
      },
      expires_at: responseData?.expires_at || "",
      environment: responseData?.environment || config.environment,
      warning:
        config.isProduction
          ? undefined
          : (responseData?.warning ||
            "AMBIENTE DE PRUEBAS: ESTE QR ES FICTICIO Y NO REPRESENTA UN COBRO REAL"),
      checkout_url: responseData?.checkout_url || "",
      status_url: responseData?.status_url || "",
    };

    return {
      success: true,
      statusCode,
      data: sanitizedData,
    };
  } catch (networkError: any) {
    console.error("[PagosYa Network Error]:", networkError);
    return {
      success: false,
      statusCode: 503,
      error:
        `No se pudo establecer conexión de red con el servicio de PagosYa (${config.environment}). Verifica tu conexión.`,
      detail: networkError?.message || String(networkError),
    };
  }
}

// Alias de compatibilidad hacia atrás
export const createPagosyaSandboxCheckout = createPagosyaCheckout;

/**
 * Consulta el estado oficial de un checkout en PagosYa mediante su status_url o id.
 * Solo el estado 'completed' confirma un pago verificado.
 */
export async function getPagosyaCheckoutStatus(
  checkoutId: string,
  statusUrl?: string
): Promise<PagosyaServiceResponse> {
  const config = getPagosyaConfig();

  if (!config.apiKey) {
    return {
      success: false,
      statusCode: 401,
      error: "Credenciales de PagosYa no configuradas en el servidor.",
    };
  }

  if (!checkoutId && !statusUrl) {
    return {
      success: false,
      statusCode: 400,
      error: "Se requiere checkoutId o statusUrl para consultar el estado.",
    };
  }

  // Determinar URL de consulta oficial
  const targetUrl =
    statusUrl && statusUrl.startsWith("http")
      ? statusUrl
      : `https://nbjwpakpimrqfocsxkda.supabase.co/functions/v1/checkout-status?checkout_id=${encodeURIComponent(
          checkoutId
        )}`;

  try {
    const response = await fetch(targetUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
    });

    const statusCode = response.status;
    let responseData: any;
    try {
      responseData = await response.json();
    } catch {
      responseData = { message: "Respuesta no JSON" };
    }

    if (!response.ok) {
      return {
        success: false,
        statusCode,
        error: responseData?.message || responseData?.error || "Error al consultar estado en PagosYa.",
        detail: responseData,
      };
    }

    return {
      success: true,
      statusCode,
      data: {
        checkout_id: responseData.checkout_id || checkoutId,
        order_id: responseData.order_id || "",
        status: responseData.status || "pending",
        amount: responseData.amount || 0,
        currency: responseData.currency || "BOB",
        livemode: responseData.livemode === true,
        completed_at: responseData.completed_at || null,
        environment: responseData.environment || config.environment,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 503,
      error: "No se pudo conectar con el endpoint de estado de PagosYa.",
      detail: error?.message || String(error),
    };
  }
}

/**
 * Valida la firma HMAC-SHA256 del webhook recibido de PagosYa con el secreto PAGOSYA_WEBHOOK_SECRET.
 */
export function verifyPagosyaWebhookSignature(
  rawBody: string,
  signatureHeader: string | null | undefined
): boolean {
  const secret = process.env.PAGOSYA_WEBHOOK_SECRET?.trim();
  if (!secret || !signatureHeader || !rawBody) {
    return false;
  }

  try {
    const computedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    const cleanHeader = signatureHeader.replace(/^sha256=/, "").trim();

    // Comparación en tiempo constante para mitigar timing attacks
    const sigBufferA = Buffer.from(computedSignature, "hex");
    const sigBufferB = Buffer.from(cleanHeader, "hex");

    if (sigBufferA.length !== sigBufferB.length) {
      return false;
    }

    return crypto.timingSafeEqual(sigBufferA, sigBufferB);
  } catch (err) {
    console.error("[PagosYa Signature Verification Error]:", err);
    return false;
  }
}

/**
 * Procesa un evento de webhook de PagosYa (checkout.completed) de forma segura.
 */
export function processPagosyaWebhookEvent(payload: any): {
  success: boolean;
  orderId?: string;
  checkoutId?: string;
  amount?: number;
  status?: string;
  error?: string;
} {
  if (!payload || typeof payload !== "object") {
    return { success: false, error: "Cuerpo de webhook inválido." };
  }

  const eventType = payload.event || payload.type;
  if (eventType !== "checkout.completed") {
    return {
      success: false,
      error: `Evento ignorado: "${eventType}". Solo se procesa "checkout.completed".`,
    };
  }

  const data = payload.data || payload;
  const orderId = data.order_id || data.orderId;
  const checkoutId = data.checkout_id || data.id;
  const amount = Number(data.amount);
  const status = data.status;

  if (!orderId || !checkoutId) {
    return {
      success: false,
      error: "Faltan order_id o checkout_id en la carga del webhook.",
    };
  }

  if (status !== "completed") {
    return {
      success: false,
      error: `Estado no completado en webhook: "${status}".`,
    };
  }

  return {
    success: true,
    orderId,
    checkoutId,
    amount,
    status: "completed",
  };
}
