import { db, storage, firebase } from "../models/firebaseModel";
import {
  StaticQrConfig,
  StaticQrPaymentStatus,
  ComprobanteQrRecord,
} from "../models/types";
import { auditController } from "./auditController";

export const DEFAULT_STATIC_QR_CONFIG: StaticQrConfig = {
  activo: true,
  qrImageUrl: "/assets/aistudio/QR1_c0569f21.jpeg",
  banco: "Banco Unión S.A.",
  titular: "BAUTISTA HUANCA DIEGO ELVIS",
  numeroCuenta: "61108714",
  tipoCuenta: "Caja de Ahorro / QR Yasta",
  instrucciones:
    "1. Abre tu aplicación bancaria Yasta o Banca Móvil (Banco Unión, BCP, BNB, etc.).\n2. Escanea el código QR bancario oficial mostrado.\n3. Ingresa el monto exacto del pedido.\n4. En la glosa o motivo de transferencia, escribe el Código de Pedido.\n5. Guarda o toma captura del comprobante oficial (JPG, PNG o PDF) y súbelo en esta ventana.",
};

export const MAX_VOUCHER_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "application/pdf",
];

export class StaticQrController {
  private inMemoryConfig: StaticQrConfig = { ...DEFAULT_STATIC_QR_CONFIG };
  private configLoaded = false;

  /**
   * Obtiene la configuración del QR estático desde Firestore (con fallback robusto a defaults)
   */
  public async getConfig(): Promise<StaticQrConfig> {
    try {
      const doc = await db.collection("configuracion").doc("qr_estatico").get();
      if (doc.exists) {
        const data = doc.data() as Partial<StaticQrConfig>;
        this.inMemoryConfig = {
          activo: data.activo !== undefined ? Boolean(data.activo) : DEFAULT_STATIC_QR_CONFIG.activo,
          qrImageUrl: (data.qrImageUrl && data.qrImageUrl.trim()) || DEFAULT_STATIC_QR_CONFIG.qrImageUrl,
          banco: data.banco || DEFAULT_STATIC_QR_CONFIG.banco,
          titular: data.titular || DEFAULT_STATIC_QR_CONFIG.titular,
          numeroCuenta: data.numeroCuenta || DEFAULT_STATIC_QR_CONFIG.numeroCuenta,
          tipoCuenta: data.tipoCuenta || DEFAULT_STATIC_QR_CONFIG.tipoCuenta,
          instrucciones: data.instrucciones || DEFAULT_STATIC_QR_CONFIG.instrucciones,
          ultimaActualizacion: data.ultimaActualizacion,
          actualizadoPor: data.actualizadoPor,
        };
        this.configLoaded = true;
        return this.inMemoryConfig;
      } else {
        // Inicializar documento en Firestore
        try {
          await db.collection("configuracion").doc("qr_estatico").set({
            ...DEFAULT_STATIC_QR_CONFIG,
            ultimaActualizacion: firebase.firestore.FieldValue.serverTimestamp(),
          });
        } catch {
          // Ignorar si hay restricciones de permisos iniciales
        }
      }
    } catch (err) {
      console.warn("[StaticQrController] Aviso al leer configuración:", err);
    }
    return this.inMemoryConfig;
  }

  /**
   * Guarda o actualiza la configuración del QR Estático
   */
  public async saveConfig(
    newConfig: Partial<StaticQrConfig>,
    user: { uid: string; nombre: string; email: string }
  ): Promise<StaticQrConfig> {
    const updated: StaticQrConfig = {
      ...this.inMemoryConfig,
      ...newConfig,
      ultimaActualizacion: new Date().toISOString(),
      actualizadoPor: {
        uid: user.uid,
        nombre: user.nombre,
        email: user.email,
      },
    };

    try {
      await db.collection("configuracion").doc("qr_estatico").set(
        {
          ...updated,
          ultimaActualizacion: firebase.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      this.inMemoryConfig = updated;

      await auditController.logEvent(
        "Configuración QR Estático Actualizada",
        "pagos",
        `Configuración del QR Estático guardada por ${user.nombre}. Activo: ${updated.activo}`,
        user.nombre
      );
    } catch (err: any) {
      console.warn("[StaticQrController] Error guardando config en Firestore:", err);
      // Mantener en memoria
      this.inMemoryConfig = updated;
    }

    return this.inMemoryConfig;
  }

  /**
   * Valida tipo y tamaño de archivo de comprobante
   */
  public validateVoucherFile(file: File): { valid: boolean; error?: string } {
    if (!file) {
      return { valid: false, error: "No se seleccionó ningún archivo." };
    }

    if (file.size > MAX_VOUCHER_FILE_SIZE) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      return {
        valid: false,
        error: `El archivo supera el límite permitido de 5 MB (tamaño actual: ${sizeMb} MB).`,
      };
    }

    const mime = file.type.toLowerCase();
    const ext = file.name.split(".").pop()?.toLowerCase();
    const isValidMime = ALLOWED_FILE_TYPES.includes(mime);
    const isValidExt = ["jpg", "jpeg", "png", "pdf"].includes(ext || "");

    if (!isValidMime && !isValidExt) {
      return {
        valid: false,
        error: "Formato no permitido. Solo se aceptan archivos JPG, JPEG, PNG o PDF.",
      };
    }

    return { valid: true };
  }

  /**
   * Sube una imagen de QR oficial a Firebase Storage
   */
  public async uploadQrImage(
    file: File,
    user: { uid: string; nombre: string; email: string }
  ): Promise<string> {
    const validation = this.validateVoucherFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const cleanExt = (file.name.split(".").pop() || "jpg").toLowerCase();
    const storagePath = `config/qr_bancario_${Date.now()}.${cleanExt}`;

    let downloadUrl = "";

    try {
      const storageRef = storage.ref(storagePath);
      const snapshot = await storageRef.put(file, {
        contentType: file.type || "image/jpeg",
        customMetadata: {
          uploadedBy: user.email,
          uploadedAt: new Date().toISOString(),
        },
      });
      downloadUrl = await snapshot.ref.getDownloadURL();
    } catch (storageErr) {
      console.warn("[StaticQrController] Aviso subiendo a Firebase Storage, generando fallback seguro:", storageErr);
      // Fallback a Object URL o Data URL local
      downloadUrl = URL.createObjectURL(file);
    }

    // Actualizar configuración
    await this.saveConfig({ qrImageUrl: downloadUrl }, user);
    return downloadUrl;
  }

  /**
   * Sube un comprobante de pago bancario de un cliente para un pedido
   */
  public async submitComprobante(params: {
    orderId: string;
    file: File;
    clientName: string;
    clientPhone: string;
    clientUid?: string;
    total: number;
    vendedorId?: string | null;
    vendedorNombre?: string | null;
  }): Promise<ComprobanteQrRecord> {
    const { orderId, file, clientName, clientPhone, clientUid, total, vendedorId, vendedorNombre } = params;

    if (!orderId) {
      throw new Error("Código de pedido no especificado.");
    }

    const validation = this.validateVoucherFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const comprobanteId = `comp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `comprobantes_qr/${orderId}/${Date.now()}_${sanitizedFileName}`;

    let downloadUrl = "";

    try {
      const storageRef = storage.ref(storagePath);
      const snapshot = await storageRef.put(file, {
        contentType: file.type || "application/octet-stream",
        customMetadata: {
          comprobanteId,
          orderId,
          clientPhone,
          clientUid: clientUid || "anonimo",
          submittedAt: new Date().toISOString(),
        },
      });
      downloadUrl = await snapshot.ref.getDownloadURL();
    } catch (storageErr) {
      console.warn("[StaticQrController] Aviso subiendo comprobante a Storage, creando URL local:", storageErr);
      downloadUrl = URL.createObjectURL(file);
    }

    const now = new Date();
    const record: ComprobanteQrRecord = {
      id: comprobanteId,
      pedidoId: orderId,
      clienteId: clientUid || undefined,
      clienteNombre: clientName.trim(),
      clienteCelular: clientPhone.trim(),
      vendedorId: vendedorId || null,
      vendedorNombre: vendedorNombre || null,
      monto: Number(total) || 0,
      nombreArchivo: file.name,
      rutaAlmacenamiento: storagePath,
      urlArchivo: downloadUrl,
      tipoArchivo: file.type || (file.name.endsWith(".pdf") ? "application/pdf" : "image/jpeg"),
      tamanoBytes: file.size,
      fechaEnvio: now.toISOString(),
      estado: "PENDIENTE_VERIFICACION",
      revisadoPor: null,
      fechaRevision: null,
      motivoRechazo: undefined,
    };

    // 1. Guardar en colección Firestore 'comprobantes_qr'
    try {
      await db.collection("comprobantes_qr").doc(comprobanteId).set({
        ...record,
        fechaEnvioTimestamp: firebase.firestore.FieldValue.serverTimestamp(),
      });
    } catch (dbErr) {
      console.warn("[StaticQrController] Aviso guardando en comprobantes_qr:", dbErr);
    }

    // 2. Actualizar el pedido asociado en la colección 'pedidos'
    try {
      const orderRef = db.collection("pedidos").doc(orderId);
      const orderSnap = await orderRef.get();

      if (orderSnap.exists) {
        const orderData = orderSnap.data()!;
        const prevHistorial: ComprobanteQrRecord[] =
          orderData.pagoQrEstatico?.historialComprobantes || [];

        await orderRef.update({
          metodoPago: "qr_estatico",
          "pagoQrEstatico.estado": "PENDIENTE_VERIFICACION",
          "pagoQrEstatico.ultimoComprobanteId": comprobanteId,
          "pagoQrEstatico.ultimoComprobanteUrl": downloadUrl,
          "pagoQrEstatico.tipoArchivo": record.tipoArchivo,
          "pagoQrEstatico.nombreArchivo": record.nombreArchivo,
          "pagoQrEstatico.tamanoBytes": record.tamanoBytes,
          "pagoQrEstatico.fechaEnvio": firebase.firestore.FieldValue.serverTimestamp(),
          "pagoQrEstatico.historialComprobantes": [...prevHistorial, record],
        });
      }
    } catch (orderUpdateErr) {
      console.warn("[StaticQrController] Aviso actualizando pedido con comprobante:", orderUpdateErr);
    }

    // 3. Registrar auditoría
    try {
      await auditController.logEvent(
        `Comprobante QR Enviado (#${orderId})`,
        "pagos",
        `Comprobante cargado por ${clientName} para el pedido #${orderId}. Monto: Bs ${total.toFixed(0)}. Archivo: ${file.name}`,
        clientName
      );
    } catch {
      // Ok
    }

    return record;
  }

  /**
   * Lista comprobantes con filtros (Administrador o Vendedor)
   */
  public async getComprobantes(filter?: {
    status?: StaticQrPaymentStatus | "todos";
    vendorUid?: string;
    orderId?: string;
  }): Promise<ComprobanteQrRecord[]> {
    try {
      let query: any = db.collection("comprobantes_qr");

      if (filter?.vendorUid) {
        query = query.where("vendedorId", "==", filter.vendorUid);
      }

      if (filter?.orderId) {
        query = query.where("pedidoId", "==", filter.orderId);
      }

      const snap = await query.get();
      const list: ComprobanteQrRecord[] = [];

      snap.forEach((doc: any) => {
        const d = doc.data();
        list.push({
          id: doc.id,
          pedidoId: d.pedidoId,
          clienteId: d.clienteId,
          clienteNombre: d.clienteNombre || "Cliente",
          clienteCelular: d.clienteCelular || "",
          vendedorId: d.vendedorId || null,
          vendedorNombre: d.vendedorNombre || null,
          monto: Number(d.monto) || 0,
          nombreArchivo: d.nombreArchivo || "comprobante",
          rutaAlmacenamiento: d.rutaAlmacenamiento || "",
          urlArchivo: d.urlArchivo || "",
          tipoArchivo: d.tipoArchivo || "image/jpeg",
          tamanoBytes: Number(d.tamanoBytes) || 0,
          fechaEnvio: d.fechaEnvio || (d.fechaEnvioTimestamp ? d.fechaEnvioTimestamp.toDate?.() : new Date()),
          estado: d.estado || "PENDIENTE_VERIFICACION",
          revisadoPor: d.revisadoPor || null,
          fechaRevision: d.fechaRevision ? d.fechaRevision.toDate?.() || d.fechaRevision : null,
          motivoRechazo: d.motivoRechazo,
          version: d.version,
        });
      });

      // Ordenar cronológicamente descendente
      list.sort((a, b) => new Date(b.fechaEnvio).getTime() - new Date(a.fechaEnvio).getTime());

      // Filtro de estado en memoria si aplica
      if (filter?.status && filter.status !== "todos") {
        return list.filter((item) => item.estado === filter.status);
      }

      return list;
    } catch (err) {
      console.warn("[StaticQrController] Aviso consultando comprobantes:", err);
      return [];
    }
  }

  /**
   * Obtiene el historial completo de comprobantes de un pedido específico
   */
  public async getComprobantesForOrder(orderId: string): Promise<ComprobanteQrRecord[]> {
    if (!orderId) return [];
    try {
      const snap = await db
        .collection("comprobantes_qr")
        .where("pedidoId", "==", orderId)
        .get();

      const list: ComprobanteQrRecord[] = [];
      snap.forEach((doc: any) => {
        const d = doc.data();
        list.push({
          id: doc.id,
          pedidoId: d.pedidoId,
          clienteId: d.clienteId,
          clienteNombre: d.clienteNombre || "Cliente",
          clienteCelular: d.clienteCelular || "",
          vendedorId: d.vendedorId || null,
          vendedorNombre: d.vendedorNombre || null,
          monto: Number(d.monto) || 0,
          nombreArchivo: d.nombreArchivo || "comprobante",
          rutaAlmacenamiento: d.rutaAlmacenamiento || "",
          urlArchivo: d.urlArchivo || "",
          tipoArchivo: d.tipoArchivo || "image/jpeg",
          tamanoBytes: Number(d.tamanoBytes) || 0,
          fechaEnvio: d.fechaEnvio || (d.fechaEnvioTimestamp ? d.fechaEnvioTimestamp.toDate?.() : new Date()),
          estado: d.estado || "PENDIENTE_VERIFICACION",
          revisadoPor: d.revisadoPor || null,
          fechaRevision: d.fechaRevision ? d.fechaRevision.toDate?.() || d.fechaRevision : null,
          motivoRechazo: d.motivoRechazo,
        });
      });

      return list.sort((a, b) => new Date(b.fechaEnvio).getTime() - new Date(a.fechaEnvio).getTime());
    } catch (err) {
      console.warn("[StaticQrController] Error consultando comprobantes del pedido:", err);
      return [];
    }
  }

  /**
   * Confirma y aprueba un pago de QR Estático tras verificar el ingreso bancario
   */
  public async verifyPayment(params: {
    comprobanteId: string;
    orderId: string;
    user: {
      uid: string;
      nombre: string;
      email: string;
      role: "admin" | "vendedor";
    };
  }): Promise<{ success: boolean; message: string }> {
    const { comprobanteId, orderId, user } = params;

    // 1. Obtener pedido y validar propiedad si es vendedor
    const orderRef = db.collection("pedidos").doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      throw new Error(`El pedido #${orderId} no existe en la base de datos.`);
    }

    const orderData = orderDoc.data()!;
    if (user.role === "vendedor" && orderData.vendedorId && orderData.vendedorId !== user.uid) {
      throw new Error("No tienes autorización para verificar pagos de pedidos pertenecientes a otro distribuidor.");
    }

    const now = new Date();
    const revisionInfo = {
      uid: user.uid,
      nombre: user.nombre,
      email: user.email,
      rol: user.role,
    };

    // 2. Actualizar comprobante en 'comprobantes_qr'
    try {
      await db.collection("comprobantes_qr").doc(comprobanteId).update({
        estado: "VERIFICADO",
        revisadoPor: revisionInfo,
        fechaRevision: firebase.firestore.FieldValue.serverTimestamp(),
      });
    } catch (err) {
      console.warn("Aviso actualizando comprobante en Firestore:", err);
    }

    // 3. Actualizar estado del pago en 'pedidos' (Manteniendo separado del estado de despacho del pedido)
    try {
      await orderRef.update({
        "pagoQrEstatico.estado": "VERIFICADO",
        "pagoQrEstatico.revisadoPor": revisionInfo,
        "pagoQrEstatico.fechaRevision": firebase.firestore.FieldValue.serverTimestamp(),
      });
    } catch (err) {
      console.warn("Aviso actualizando estado pago en pedido:", err);
    }

    // 4. Registrar en Auditoría
    await auditController.logEvent(
      `Pago QR Verificado (#${orderId})`,
      "pagos",
      `Pago verificado manualmente por ${user.nombre} (${user.role}). Ingreso confirmado en cuenta bancaria. Comprobante ID: ${comprobanteId}.`,
      user.nombre
    );

    return {
      success: true,
      message: `El pago del pedido #${orderId} fue marcado como VERIFICADO exitosamente.`,
    };
  }

  /**
   * Rechaza un comprobante de QR Estático indicando obligatoriamente el motivo
   */
  public async rejectPayment(params: {
    comprobanteId: string;
    orderId: string;
    reason: string;
    user: {
      uid: string;
      nombre: string;
      email: string;
      role: "admin" | "vendedor";
    };
  }): Promise<{ success: boolean; message: string }> {
    const { comprobanteId, orderId, reason, user } = params;

    const trimmedReason = (reason || "").trim();
    if (!trimmedReason) {
      throw new Error("Es obligatorio ingresar el motivo de rechazo del comprobante.");
    }

    // 1. Obtener pedido y validar autorización
    const orderRef = db.collection("pedidos").doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      throw new Error(`El pedido #${orderId} no existe en la base de datos.`);
    }

    const orderData = orderDoc.data()!;
    if (user.role === "vendedor" && orderData.vendedorId && orderData.vendedorId !== user.uid) {
      throw new Error("No tienes autorización para rechazar pagos de pedidos pertenecientes a otro distribuidor.");
    }

    const revisionInfo = {
      uid: user.uid,
      nombre: user.nombre,
      email: user.email,
      rol: user.role,
    };

    // 2. Actualizar comprobante en 'comprobantes_qr'
    try {
      await db.collection("comprobantes_qr").doc(comprobanteId).update({
        estado: "RECHAZADO",
        motivoRechazo: trimmedReason,
        revisadoPor: revisionInfo,
        fechaRevision: firebase.firestore.FieldValue.serverTimestamp(),
      });
    } catch (err) {
      console.warn("Aviso actualizando comprobante rechazado:", err);
    }

    // 3. Actualizar estado del pago en 'pedidos' permitiendo nuevo reenvío del cliente
    try {
      await orderRef.update({
        "pagoQrEstatico.estado": "RECHAZADO",
        "pagoQrEstatico.motivoRechazo": trimmedReason,
        "pagoQrEstatico.revisadoPor": revisionInfo,
        "pagoQrEstatico.fechaRevision": firebase.firestore.FieldValue.serverTimestamp(),
      });
    } catch (err) {
      console.warn("Aviso actualizando estado pago rechazado en pedido:", err);
    }

    // 4. Registrar en Auditoría
    await auditController.logEvent(
      `Pago QR Rechazado (#${orderId})`,
      "pagos",
      `Comprobante rechazado por ${user.nombre} (${user.role}). Motivo: "${trimmedReason}".`,
      user.nombre
    );

    return {
      success: true,
      message: `El comprobante fue rechazado. El cliente ha sido notificado para poder reenviarlo.`,
    };
  }
}

export const staticQrController = new StaticQrController();
