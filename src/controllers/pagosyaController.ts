import {
  PagosyaCreateCheckoutPayload,
  PagosyaQrResponse,
  CartItem,
  PagosyaCheckoutRecord,
} from "../models/types";
import { db, firebase } from "../models/firebaseModel";

export interface CreatePagosyaCheckoutResult {
  success: boolean;
  data?: PagosyaQrResponse;
  error?: string;
  statusCode?: number;
}

export interface CheckPagosyaStatusResult {
  success: boolean;
  status?: string;
  orderId?: string;
  checkoutId?: string;
  amount?: number;
  completedAt?: string | null;
  error?: string;
  statusCode?: number;
}

export class PagosyaController {
  private inFlightOrderId: string | null = null;
  private cachedCheckouts: Map<string, PagosyaQrResponse> = new Map();

  /**
   * Genera un identificador único de pedido con prefijo oficial Team Life
   */
  public generateOrderId(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `TL-ORD-${timestamp}-${random}`;
  }

  /**
   * Solicita al backend la creación del checkout y generación del código QR en PagosYa
   * (Sandbox o Producción según variable de entorno del backend)
   */
  public async createCheckout(
    payload: PagosyaCreateCheckoutPayload,
    cartItems?: CartItem[]
  ): Promise<CreatePagosyaCheckoutResult> {
    const orderId = payload.order_id;

    // Evitar solicitudes concurrentes duplicadas con el mismo order_id
    if (this.inFlightOrderId === orderId) {
      return {
        success: false,
        statusCode: 409,
        error: "Ya se está procesando una solicitud para esta referencia de pedido. Por favor espera.",
      };
    }

    // Si ya existe un checkout generado para este orderId en memoria, devolverlo
    if (this.cachedCheckouts.has(orderId)) {
      return {
        success: true,
        statusCode: 200,
        data: this.cachedCheckouts.get(orderId),
      };
    }

    this.inFlightOrderId = orderId;

    try {
      let endpoint = "/api/pagosya/create-checkout";
      let response: Response;

      try {
        response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (response.status === 404) {
          endpoint = "/.netlify/functions/pagosya-create-checkout";
          response = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });
        }
      } catch (networkErr: any) {
        endpoint = "/.netlify/functions/pagosya-create-checkout";
        response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      }

      const statusCode = response.status;
      const json = await response.json().catch(() => null);

      if (!response.ok) {
        let errorMsg = json?.error || "Error al generar código QR con PagosYa.";

        if (statusCode === 409) {
          errorMsg = "Referencia de pedido duplicada (DUPLICATE_ORDER_ID). Reintenta generando una nueva referencia.";
        } else if (statusCode === 401) {
          errorMsg =
            json?.error ||
            "Credencial de PagosYa no autorizada o no configurada en las variables de entorno del servidor.";
        }

        return {
          success: false,
          statusCode,
          error: errorMsg,
        };
      }

      const qrData: PagosyaQrResponse = json;
      this.cachedCheckouts.set(orderId, qrData);

      // Registrar intento de checkout en Firestore
      try {
        await db.collection("checkouts_pagosya").doc(orderId).set({
          orderId,
          checkoutId: qrData.checkout_id || qrData.id || "",
          monto: payload.amount,
          moneda: payload.currency || "BOB",
          cliente: payload.customer || null,
          items: cartItems
            ? cartItems.map((i) => ({
                id: i.id,
                nombre: i.name,
                cantidad: i.quantity,
                precio: i.price,
                isCombo: i.isCombo,
              }))
            : [],
          estado: qrData.status || "pending",
          livemode: qrData.livemode === true,
          ambiente: qrData.environment || "sandbox",
          fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
          expiraEn: qrData.expires_at || null,
          statusUrl: qrData.status_url || "",
          checkoutUrl: qrData.checkout_url || "",
        });
      } catch (fireErr) {
        console.warn("Aviso Firestore al registrar checkout PagosYa:", fireErr);
      }

      return {
        success: true,
        statusCode,
        data: qrData,
      };
    } catch (err: any) {
      console.error("[PagosYa Controller Error]:", err);
      return {
        success: false,
        statusCode: 500,
        error: "No se pudo conectar con el servidor de PagosYa. Verifica tu conexión.",
      };
    } finally {
      this.inFlightOrderId = null;
    }
  }

  /**
   * Consulta el estado del checkout en PagosYa mediante el backend oficial y actualiza Firestore
   */
  public async checkStatus(
    checkoutId: string,
    orderId?: string,
    statusUrl?: string
  ): Promise<CheckPagosyaStatusResult> {
    try {
      const params = new URLSearchParams();
      if (checkoutId) params.append("checkout_id", checkoutId);
      if (statusUrl) params.append("status_url", statusUrl);
      if (orderId) params.append("order_id", orderId);

      let endpoint = `/api/pagosya/checkout-status?${params.toString()}`;
      let response: Response;

      try {
        response = await fetch(endpoint);
        if (response.status === 404) {
          endpoint = `/.netlify/functions/pagosya-checkout-status?${params.toString()}`;
          response = await fetch(endpoint);
        }
      } catch {
        endpoint = `/.netlify/functions/pagosya-checkout-status?${params.toString()}`;
        response = await fetch(endpoint);
      }

      const statusCode = response.status;
      const json = await response.json().catch(() => null);

      if (!response.ok) {
        return {
          success: false,
          statusCode,
          error: json?.error || "No se pudo consultar el estado del checkout.",
        };
      }

      const status = json.status || "pending";
      const resolvedOrderId = orderId || json.order_id;

      // Si el estado es "completed", actualizar Firestore de manera autoritativa
      if (status === "completed" && resolvedOrderId) {
        try {
          await db.collection("checkouts_pagosya").doc(resolvedOrderId).set(
            {
              estado: "completed",
              fechaConfirmacion: firebase.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );

          // Sincronizar en colección pedidos
          const snap = await db.collection("checkouts_pagosya").doc(resolvedOrderId).get();
          if (snap.exists) {
            const data = snap.data();
            await db.collection("pedidos").add({
              referenciaOrden: resolvedOrderId,
              checkoutId: checkoutId || data?.checkoutId,
              clienteNombre: data?.cliente?.name || "Cliente Team Life",
              clienteCelular: data?.cliente?.phone || "",
              pais: "Bolivia",
              departamento: "Bolivia",
              productos: (data?.items || []).map((i: any) => ({
                nombre: i.nombre || i.name,
                cantidad: i.cantidad || i.quantity,
                precioUnitario: i.precio || i.price,
                isCombo: Boolean(i.isCombo),
              })),
              total: data?.monto || 0,
              estado: "confirmado",
              metodoPago: "PagosYa QR",
              ambiente: data?.ambiente || "production",
              fecha: firebase.firestore.FieldValue.serverTimestamp(),
            });
          }
        } catch (syncErr) {
          console.warn("Aviso al sincronizar pedido completado en Firestore:", syncErr);
        }
      } else if ((status === "expired" || status === "cancelled") && resolvedOrderId) {
        try {
          await db.collection("checkouts_pagosya").doc(resolvedOrderId).set(
            {
              estado: status,
              fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
        } catch (syncErr) {
          console.warn("Aviso al actualizar estado de checkout:", syncErr);
        }
      }

      return {
        success: true,
        statusCode,
        status,
        orderId: resolvedOrderId,
        checkoutId: json.checkout_id || checkoutId,
        amount: json.amount,
        completedAt: json.completed_at,
      };
    } catch (err: any) {
      console.error("[PagosYa checkStatus Error]:", err);
      return {
        success: false,
        statusCode: 500,
        error: "Error de red al consultar el estado de PagosYa.",
      };
    }
  }

  /**
   * Obtiene todos los registros de checkouts de Firestore para el Panel Administrativo
   */
  public async getAllCheckouts(): Promise<PagosyaCheckoutRecord[]> {
    try {
      const snap = await db
        .collection("checkouts_pagosya")
        .orderBy("fechaCreacion", "desc")
        .limit(100)
        .get();

      const list: PagosyaCheckoutRecord[] = [];
      snap.forEach((doc) => {
        const d = doc.data();
        list.push({
          orderId: d.orderId || doc.id,
          checkoutId: d.checkoutId || "",
          monto: d.monto || 0,
          moneda: d.moneda || "BOB",
          cliente: d.cliente || {},
          items: d.items || [],
          estado: d.estado || "pending",
          livemode: Boolean(d.livemode),
          ambiente: d.ambiente || "sandbox",
          fechaCreacion: d.fechaCreacion?.toDate?.() || d.fechaCreacion || new Date(),
          expiraEn: d.expiraEn?.toDate?.() || d.expiraEn || null,
          fechaConfirmacion: d.fechaConfirmacion?.toDate?.() || d.fechaConfirmacion || null,
        });
      });
      return list;
    } catch (err) {
      console.warn("Error leyendo checkouts_pagosya de Firestore:", err);
      return [];
    }
  }

  /**
   * Limpia el checkout en caché si el usuario decide cancelar o reiniciar el pedido
   */
  public clearCachedCheckout(orderId: string) {
    this.cachedCheckouts.delete(orderId);
  }
}

export const pagosyaController = new PagosyaController();
