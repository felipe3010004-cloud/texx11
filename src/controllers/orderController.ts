import { db, firebase } from "../models/firebaseModel";
import { CartItem, OrderRecord, OrderStatus, OrderStateHistoryItem } from "../models/types";
import { auditController } from "./auditController";
import confetti from "canvas-confetti";

export interface OrderData {
  clientName: string;
  clientPhone: string;
  countryCode: string;
  countryName: string;
  department: string | null;
  items: CartItem[];
  total: number;
  vendedorWhatsapp: string;
  referrerId?: string | null;
}

export interface UpdateOrderStatusParams {
  orderId: string;
  targetStatus: OrderStatus;
  user: {
    uid: string;
    nombre: string;
    email: string;
    role: "admin" | "vendedor";
  };
  reason?: string;
}

export interface TransitionValidation {
  allowed: boolean;
  message?: string;
}

export class OrderController {
  /**
   * Valida si la transición de estado es legal según las reglas de negocio
   */
  public validateTransition(currentStatus: OrderStatus, targetStatus: OrderStatus): TransitionValidation {
    if (currentStatus === targetStatus) {
      return { allowed: false, message: `El pedido ya se encuentra en estado "${currentStatus}".` };
    }

    if (currentStatus === "rechazado") {
      return {
        allowed: false,
        message: "Un pedido rechazado es terminal y no puede reactivarse arbitrariamente.",
      };
    }

    if (currentStatus === "cancelado") {
      return {
        allowed: false,
        message: "Un pedido cancelado es terminal y no puede ser modificado.",
      };
    }

    if (currentStatus === "confirmado") {
      if (targetStatus === "cancelado") {
        return { allowed: true };
      }
      return {
        allowed: false,
        message: "Un pedido confirmado únicamente puede ser cancelado por causa justificada.",
      };
    }

    if (currentStatus === "pendiente") {
      if (targetStatus === "confirmado" || targetStatus === "rechazado" || targetStatus === "cancelado") {
        return { allowed: true };
      }
    }

    return {
      allowed: false,
      message: `Transición no autorizada de "${currentStatus}" a "${targetStatus}".`,
    };
  }

  /**
   * Actualiza el estado de un pedido con validación de roles, motivos y registro de trazabilidad
   */
  public async updateOrderStatus(params: UpdateOrderStatusParams): Promise<{ success: boolean; message: string }> {
    const { orderId, targetStatus, user, reason } = params;

    if (!orderId) {
      throw new Error("ID de pedido no especificado.");
    }

    // 1. Obtener pedido actual de Firestore
    const orderRef = db.collection("pedidos").doc(orderId);
    const doc = await orderRef.get();

    if (!doc.exists) {
      throw new Error(`El pedido #${orderId} no fue encontrado en la base de datos.`);
    }

    const orderData = doc.data()!;
    const currentStatus: OrderStatus = orderData.estado || "pendiente";

    // 2. Control de permisos de rol: el vendedor solo puede gestionar sus propios pedidos
    if (user.role === "vendedor") {
      if (orderData.vendedorId && orderData.vendedorId !== user.uid) {
        throw new Error("No tienes autorización para modificar pedidos asignados a otro distribuidor.");
      }
    }

    // 3. Validación de transición
    const validation = this.validateTransition(currentStatus, targetStatus);
    if (!validation.allowed) {
      throw new Error(validation.message || "Transición de estado inválida.");
    }

    // 4. Exigir motivo al rechazar o cancelar
    const trimmedReason = reason?.trim() || "";
    if ((targetStatus === "rechazado" || targetStatus === "cancelado") && !trimmedReason) {
      throw new Error("Es obligatorio ingresar un motivo para rechazar o cancelar el pedido.");
    }

    // 5. Construir registro histórico
    const nowTimestamp = new Date();
    const historyItem: OrderStateHistoryItem = {
      id: `hist-${Date.now()}`,
      estadoAnterior: currentStatus,
      estadoNuevo: targetStatus,
      usuarioId: user.uid,
      usuarioNombre: user.nombre,
      usuarioEmail: user.email,
      usuarioRol: user.role,
      fecha: nowTimestamp.toISOString(),
      motivo: trimmedReason || undefined,
    };

    const existingHistory: OrderStateHistoryItem[] = Array.isArray(orderData.historialEstados)
      ? orderData.historialEstados
      : [];

    const updatedHistory = [...existingHistory, historyItem];

    // 6. Actualizar documento de Firestore
    const updatePayload: Record<string, any> = {
      estado: targetStatus,
      fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp(),
      actualizadoPor: {
        uid: user.uid,
        nombre: user.nombre,
        email: user.email,
        rol: user.role,
      },
      historialEstados: updatedHistory,
    };

    if (targetStatus === "rechazado") {
      updatePayload.motivoRechazo = trimmedReason;
    } else if (targetStatus === "cancelado") {
      updatePayload.motivoCancelacion = trimmedReason;
    }

    await orderRef.update(updatePayload);

    // 7. Registrar en auditoría general de la plataforma
    try {
      await auditController.logEvent(
        `Pedido #${orderId} -> ${targetStatus.toUpperCase()}`,
        "pedidos",
        `Estado cambiado de "${currentStatus}" a "${targetStatus}" por ${user.nombre} (${user.role}). ${
          trimmedReason ? `Motivo: ${trimmedReason}` : ""
        }`,
        user.nombre
      );
    } catch (auditErr) {
      console.warn("Aviso auditoría:", auditErr);
    }

    return {
      success: true,
      message: `El pedido #${orderId} fue marcado como ${targetStatus.toUpperCase()} exitosamente.`,
    };
  }

  /**
   * Obtiene todos los pedidos con su información de checkout PagosYa si existe
   */
  public async getAllOrders(): Promise<OrderRecord[]> {
    try {
      const snap = await db.collection("pedidos").orderBy("fecha", "desc").limit(100).get();
      const list: OrderRecord[] = [];

      for (const doc of snap.docs) {
        const d = doc.data();
        const orderId = doc.id;

        // Buscar checkout PagosYa asociado si existe
        let pagoPagosya: OrderRecord["pagoPagosya"] = undefined;
        try {
          const chkDoc = await db.collection("checkouts_pagosya").doc(orderId).get();
          if (chkDoc.exists) {
            const chk = chkDoc.data()!;
            pagoPagosya = {
              checkoutId: chk.checkoutId || chkDoc.id,
              estado: chk.estado || "pending",
              monto: chk.monto || d.total,
              ambiente: chk.ambiente || "sandbox",
              qrImageUrl: chk.qrImageUrl || chk.checkoutUrl,
              fechaPago: chk.fechaConfirmacion ? chk.fechaConfirmacion.toDate?.() || chk.fechaConfirmacion : null,
              verificadoPorApi: Boolean(chk.verificadoPorApi),
            };
          }
        } catch {
          // Ok sin checkout
        }

        list.push({
          id: orderId,
          clienteNombre: d.clienteNombre || "Cliente",
          clienteCelular: d.clienteCelular || "",
          departamento: d.departamento || "Bolivia",
          pais: d.pais || "Bolivia",
          productos: d.productos || [],
          total: Number(d.total) || 0,
          vendedorId: d.vendedorId || null,
          vendedorNombre: d.vendedorNombre || null,
          estado: d.estado || "pendiente",
          fecha: d.fecha ? d.fecha.toDate?.() || new Date(d.fecha) : new Date(),
          historialEstados: d.historialEstados || [],
          ultimoMotivo: d.motivoRechazo || d.motivoCancelacion || d.ultimoMotivo || "",
          motivoRechazo: d.motivoRechazo || "",
          motivoCancelacion: d.motivoCancelacion || "",
          actualizadoPor: d.actualizadoPor || null,
          fechaActualizacion: d.fechaActualizacion ? d.fechaActualizacion.toDate?.() || d.fechaActualizacion : null,
          pagoPagosya,
        });
      }

      return list;
    } catch (err) {
      console.warn("Error cargando pedidos en orderController:", err);
      return [];
    }
  }

  /**
   * Obtiene exclusivamente los pedidos pertenecientes a un vendedor
   */
  public async getOrdersByVendor(vendorUid: string): Promise<OrderRecord[]> {
    if (!vendorUid) return [];

    try {
      const snap = await db
        .collection("pedidos")
        .where("vendedorId", "==", vendorUid)
        .limit(80)
        .get();

      const list: OrderRecord[] = [];

      for (const doc of snap.docs) {
        const d = doc.data();
        const orderId = doc.id;

        let pagoPagosya: OrderRecord["pagoPagosya"] = undefined;
        try {
          const chkDoc = await db.collection("checkouts_pagosya").doc(orderId).get();
          if (chkDoc.exists) {
            const chk = chkDoc.data()!;
            pagoPagosya = {
              checkoutId: chk.checkoutId || chkDoc.id,
              estado: chk.estado || "pending",
              monto: chk.monto || d.total,
              ambiente: chk.ambiente || "sandbox",
              qrImageUrl: chk.qrImageUrl || chk.checkoutUrl,
              fechaPago: chk.fechaConfirmacion ? chk.fechaConfirmacion.toDate?.() || chk.fechaConfirmacion : null,
              verificadoPorApi: Boolean(chk.verificadoPorApi),
            };
          }
        } catch {
          // Ok sin checkout
        }

        list.push({
          id: orderId,
          clienteNombre: d.clienteNombre || "Cliente",
          clienteCelular: d.clienteCelular || "",
          departamento: d.departamento || "Bolivia",
          pais: d.pais || "Bolivia",
          productos: d.productos || [],
          total: Number(d.total) || 0,
          vendedorId: vendorUid,
          vendedorNombre: d.vendedorNombre || null,
          estado: d.estado || "pendiente",
          fecha: d.fecha ? d.fecha.toDate?.() || new Date(d.fecha) : new Date(),
          historialEstados: d.historialEstados || [],
          ultimoMotivo: d.motivoRechazo || d.motivoCancelacion || d.ultimoMotivo || "",
          motivoRechazo: d.motivoRechazo || "",
          motivoCancelacion: d.motivoCancelacion || "",
          actualizadoPor: d.actualizadoPor || null,
          fechaActualizacion: d.fechaActualizacion ? d.fechaActualizacion.toDate?.() || d.fechaActualizacion : null,
          pagoPagosya,
        });
      }

      // Ordenar descendente en memoria si la query no usa índice compuesto
      return list.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    } catch (err) {
      console.warn("Error cargando pedidos del vendedor:", err);
      return [];
    }
  }

  /**
   * Registro de un nuevo pedido desde el carrito de compras
   */
  public async submitOrder(data: OrderData): Promise<{ success: boolean; waUrl: string; orderId?: string }> {
    const fullPhone = `+${data.countryCode} ${data.clientPhone}`;
    const destination =
      data.countryCode === "591"
        ? `Bolivia (${data.department || "La Paz"})`
        : `${data.countryName} (+${data.countryCode})`;

    const itemsSummary = data.items
      .map(
        (item) =>
          `• ${item.quantity}x ${item.name} ${item.isCombo ? "(Combo Exclusivo)" : ""} - Bs ${(
            item.price * item.quantity
          ).toFixed(0)}`
      )
      .join("\n");

    const message = encodeURIComponent(
      `🌿 *¡Nuevo Pedido Oficial - Equipo Vida S.R.L. / Team Life!* 🌿\n\n` +
        `👤 *Cliente:* ${data.clientName.trim()}\n` +
        `📱 *Contacto:* ${fullPhone}\n` +
        `📍 *Destino:* ${destination}\n` +
        (data.referrerId ? `🤝 *Vendedor / Ref:* ${data.referrerId}\n` : "") +
        `\n🛒 *Detalle del Pedido:*\n${itemsSummary}\n\n` +
        `💰 *Total a pagar:* Bs ${data.total.toFixed(0)}\n\n` +
        `Por favor indíquenme las cuentas autorizadas para transferencia bancaria o QR y coordinar el despacho oficial. ¡Muchas gracias!`
    );

    const waUrl = `https://wa.me/${data.vendedorWhatsapp}?text=${message}`;
    let createdOrderId: string | undefined = undefined;

    // 1. Guardar en Firestore colección 'pedidos' con historial inicial
    try {
      const initialHistory: OrderStateHistoryItem = {
        id: `hist-init-${Date.now()}`,
        estadoAnterior: "pendiente",
        estadoNuevo: "pendiente",
        usuarioId: "cliente",
        usuarioNombre: data.clientName.trim(),
        usuarioEmail: fullPhone,
        usuarioRol: "vendedor",
        fecha: new Date().toISOString(),
        motivo: "Creación del pedido desde la tienda online",
      };

      const docRef = await db.collection("pedidos").add({
        clienteNombre: data.clientName.trim(),
        clienteCelular: fullPhone,
        pais: data.countryName,
        departamento: data.department || "Bolivia",
        productos: data.items.map((i) => ({
          nombre: i.name,
          cantidad: i.quantity,
          precioUnitario: i.price,
          isCombo: i.isCombo,
        })),
        total: data.total,
        vendedorId: data.referrerId || null,
        estado: "pendiente",
        fecha: firebase.firestore.FieldValue.serverTimestamp(),
        historialEstados: [initialHistory],
      });
      createdOrderId = docRef.id;
    } catch (err) {
      console.warn("Aviso Firestore al registrar pedido:", err);
    }

    // 2. Confeti festivo
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch (e) {
      // Ignorar si falla
    }

    return { success: true, waUrl, orderId: createdOrderId };
  }
}

export const orderController = new OrderController();
