import React, { useState, useEffect } from "react";
import {
  X,
  CheckCircle2,
  XCircle,
  FileText,
  Download,
  ZoomIn,
  Clock,
  Phone,
  User,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  History,
  RotateCcw,
} from "lucide-react";
import { ComprobanteQrRecord, OrderRecord } from "../models/types";
import { staticQrController } from "../controllers/staticQrController";
import { db } from "../models/firebaseModel";

interface ComprobanteReviewModalViewProps {
  isOpen: boolean;
  onClose: () => void;
  comprobante: ComprobanteQrRecord | null;
  currentUser: {
    uid: string;
    nombre: string;
    email: string;
    role: "admin" | "vendedor";
  };
  onStatusUpdated: () => void;
}

export const ComprobanteReviewModalView: React.FC<ComprobanteReviewModalViewProps> = ({
  isOpen,
  onClose,
  comprobante,
  currentUser,
  onStatusUpdated,
}) => {
  const [associatedOrder, setAssociatedOrder] = useState<OrderRecord | null>(null);
  const [orderVouchers, setOrderVouchers] = useState<ComprobanteQrRecord[]>([]);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Confirmation dialogs
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // Lightbox Zoom
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    if (!isOpen || !comprobante) {
      setAssociatedOrder(null);
      setOrderVouchers([]);
      setActionFeedback(null);
      return;
    }

    setLoadingOrder(true);
    setActionFeedback(null);

    // Load order data
    db.collection("pedidos")
      .doc(comprobante.pedidoId)
      .get()
      .then((doc) => {
        if (doc.exists) {
          const d = doc.data()!;
          setAssociatedOrder({
            id: doc.id,
            clienteNombre: d.clienteNombre || comprobante.clienteNombre,
            clienteCelular: d.clienteCelular || comprobante.clienteCelular,
            departamento: d.departamento || "Bolivia",
            pais: d.pais || "Bolivia",
            productos: d.productos || [],
            total: Number(d.total) || comprobante.monto,
            vendedorId: d.vendedorId || null,
            vendedorNombre: d.vendedorNombre || null,
            estado: d.estado || "pendiente",
            fecha: d.fecha ? d.fecha.toDate?.() || d.fecha : new Date(),
            historialEstados: d.historialEstados || [],
            pagoQrEstatico: d.pagoQrEstatico,
          });
        }
      })
      .catch((err) => {
        console.warn("[ComprobanteReview] Error cargando pedido:", err);
      })
      .finally(() => {
        setLoadingOrder(false);
      });

    // Load all vouchers for this order
    staticQrController.getComprobantesForOrder(comprobante.pedidoId).then((list) => {
      setOrderVouchers(list);
    });
  }, [isOpen, comprobante]);

  if (!isOpen || !comprobante) return null;

  const isPdf =
    comprobante.tipoArchivo === "application/pdf" ||
    comprobante.nombreArchivo?.toLowerCase().endsWith(".pdf");

  // Check vendor authorization
  const isAuthorized =
    currentUser.role === "admin" ||
    (comprobante.vendedorId && comprobante.vendedorId === currentUser.uid);

  const handleConfirmPayment = async () => {
    setIsProcessing(true);
    setActionFeedback(null);

    try {
      const res = await staticQrController.verifyPayment({
        comprobanteId: comprobante.id,
        orderId: comprobante.pedidoId,
        user: currentUser,
      });

      setActionFeedback({ text: res.message, type: "success" });
      setShowConfirmModal(false);
      onStatusUpdated();
    } catch (err: any) {
      setActionFeedback({
        text: err.message || "Error al verificar el pago.",
        type: "error",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectPayment = async () => {
    const trimmed = rejectReason.trim();
    if (!trimmed) {
      setActionFeedback({
        text: "Es obligatorio ingresar el motivo de rechazo.",
        type: "error",
      });
      return;
    }

    setIsProcessing(true);
    setActionFeedback(null);

    try {
      const res = await staticQrController.rejectPayment({
        comprobanteId: comprobante.id,
        orderId: comprobante.pedidoId,
        reason: trimmed,
        user: currentUser,
      });

      setActionFeedback({ text: res.message, type: "success" });
      setShowRejectModal(false);
      setRejectReason("");
      onStatusUpdated();
    } catch (err: any) {
      setActionFeedback({
        text: err.message || "Error al rechazar el comprobante.",
        type: "error",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!comprobante.urlArchivo) return;
    const a = document.createElement("a");
    a.href = comprobante.urlArchivo;
    a.download = comprobante.nombreArchivo || `comprobante-${comprobante.pedidoId}`;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl my-6 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 text-left flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center font-bold text-slate-700">
              #{comprobante.pedidoId.slice(-4)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-slate-900">
                  Revisión de Comprobante QR
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    comprobante.estado === "VERIFICADO"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                      : comprobante.estado === "RECHAZADO"
                      ? "bg-rose-50 text-rose-800 border border-rose-300"
                      : "bg-amber-50 text-amber-800 border border-amber-300"
                  }`}
                >
                  {comprobante.estado === "VERIFICADO" && "Pago Verificado"}
                  {comprobante.estado === "RECHAZADO" && "Comprobante Rechazado"}
                  {comprobante.estado === "PENDIENTE_VERIFICACION" && "Pendiente de Verificación"}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Pedido #{comprobante.pedidoId} · Enviado el{" "}
                {new Date(comprobante.fechaEnvio).toLocaleString("es-BO")}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Message */}
        {actionFeedback && (
          <div
            className={`px-6 py-2.5 text-xs font-medium flex items-center justify-between ${
              actionFeedback.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-b border-emerald-200"
                : "bg-rose-50 text-rose-800 border-b border-rose-200"
            }`}
          >
            <span>{actionFeedback.text}</span>
            <button
              type="button"
              onClick={() => setActionFeedback(null)}
              className="text-xs font-semibold ml-2 hover:underline"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Content Body: Two columns */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Voucher Preview & Download (7 cols) */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Documento / Captura del Comprobante
                </span>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar Archivo</span>
                </button>
              </div>

              {/* Viewer Container */}
              <div className="relative rounded-2xl border border-slate-200 bg-slate-900/5 overflow-hidden min-h-[320px] max-h-[500px] flex items-center justify-center p-3">
                {isPdf ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center space-y-3">
                    <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center">
                      <FileText className="w-8 h-8" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 text-sm">
                        {comprobante.nombreArchivo}
                      </div>
                      <div className="text-xs text-slate-500">
                        Documento PDF Oficial · {(comprobante.tamanoBytes / 1024).toFixed(1)} KB
                      </div>
                    </div>
                    <a
                      href={comprobante.urlArchivo}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Abrir PDF en pestaña nueva</span>
                    </a>
                  </div>
                ) : (
                  <div className="relative group w-full h-full flex items-center justify-center">
                    <img
                      src={comprobante.urlArchivo}
                      alt="Comprobante de pago"
                      className="max-h-[460px] w-auto object-contain rounded-xl shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setIsZoomed(true)}
                      className="absolute inset-0 bg-slate-900/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 font-bold text-xs backdrop-blur-xs cursor-pointer rounded-xl"
                    >
                      <ZoomIn className="w-5 h-5" />
                      <span>Ampliar imagen completa</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="text-[11px] text-slate-500 flex items-center justify-between px-1">
                <span>Archivo: {comprobante.nombreArchivo}</span>
                <span>Tamaño: {(comprobante.tamanoBytes / 1024).toFixed(1)} KB</span>
              </div>
            </div>

            {/* Right Column: Order Details & Actions (5 cols) */}
            <div className="lg:col-span-5 space-y-4 text-xs">
              {/* Order Info Card */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2.5">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                  Datos del Pedido
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-600">Total Solicitado:</span>
                  <span className="font-display font-black text-xl text-cyan-900">
                    Bs {comprobante.monto.toFixed(2)}
                  </span>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div>
                    <span className="text-slate-500">Cliente:</span>{" "}
                    <strong className="text-slate-900">{comprobante.clienteNombre}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Contacto:</span>{" "}
                    <a
                      href={`https://wa.me/${comprobante.clienteCelular.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-700 font-medium hover:underline inline-flex items-center gap-1"
                    >
                      +{comprobante.clienteCelular.replace(/\+/g, "")}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div>
                    <span className="text-slate-500">Distribuidor:</span>{" "}
                    <span className="text-slate-800 font-medium">
                      {comprobante.vendedorNombre ||
                        (comprobante.vendedorId ? `ID: ${comprobante.vendedorId}` : "Central Team Life")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status & Review Info */}
              {comprobante.revisadoPor && (
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                    Detalle de Revisión
                  </div>
                  <div className="text-slate-700">
                    Por: <strong>{comprobante.revisadoPor.nombre}</strong> ({comprobante.revisadoPor.rol})
                  </div>
                  {comprobante.fechaRevision && (
                    <div className="text-[11px] text-slate-500">
                      Fecha: {new Date(comprobante.fechaRevision).toLocaleString("es-BO")}
                    </div>
                  )}
                  {comprobante.motivoRechazo && (
                    <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs mt-1">
                      <strong>Motivo de rechazo:</strong> "{comprobante.motivoRechazo}"
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons for Authorized Operators */}
              {isAuthorized ? (
                <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
                  <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                    Acciones de Verificación Bancaria
                  </div>

                  <p className="text-[11px] text-slate-500">
                    Verifica el extracto bancario en Banco Unión antes de confirmar. Esta acción quedará auditada con tu usuario.
                  </p>

                  <div className="flex flex-col gap-2 pt-1">
                    <button
                      type="button"
                      disabled={isProcessing || comprobante.estado === "VERIFICADO"}
                      onClick={() => setShowConfirmModal(true)}
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {comprobante.estado === "VERIFICADO" ? "Pago Ya Verificado" : "Confirmar Ingreso en Cuenta"}
                      </span>
                    </button>

                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => setShowRejectModal(true)}
                      className="w-full py-2 px-4 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Rechazar Comprobante (con motivo)</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-xs">
                  Solo el administrador o el distribuidor asignado pueden verificar este pago.
                </div>
              )}

              {/* Strict separation notice */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Separación de Estados:</strong> Confirmar este pago marca el estado del pago como VERIFICADO. No altera el flujo del pedido ni cancelaciones.
                </span>
              </div>
            </div>
          </div>

          {/* History of submissions for this order */}
          {orderVouchers.length > 1 && (
            <div className="pt-2 space-y-2 border-t border-slate-200">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-slate-400" />
                <span>Historial de Envíos de Comprobantes para este Pedido ({orderVouchers.length})</span>
              </div>

              <div className="space-y-1.5">
                {orderVouchers.map((v) => (
                  <div
                    key={v.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                      v.id === comprobante.id
                        ? "border-cyan-300 bg-cyan-50/50"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-500">#{v.id.slice(-6)}</span>
                      <span className="text-slate-800 font-medium">{v.nombreArchivo}</span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-500 text-[11px]">
                        {new Date(v.fechaEnvio).toLocaleString("es-BO")}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          v.estado === "VERIFICADO"
                            ? "bg-emerald-100 text-emerald-800"
                            : v.estado === "RECHAZADO"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {v.estado}
                      </span>
                      {v.motivoRechazo && (
                        <span className="text-slate-500 italic text-[11px]">"{v.motivoRechazo}"</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>

        {/* Explicit Confirmation Dialog Submodal */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-2.5 text-emerald-700">
                <CheckCircle2 className="w-6 h-6" />
                <h4 className="font-bold text-base text-slate-900">
                  ¿Confirmar Ingreso Real en Cuenta?
                </h4>
              </div>

              <p className="text-xs text-slate-600">
                ¿Confirmas que has verificado el extracto de Banco Unión y que el monto de{" "}
                <strong>Bs {comprobante.monto.toFixed(2)}</strong> ingresó efectivamente?
              </p>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div>
                  <span className="text-slate-500">Operador:</span>{" "}
                  <strong>{currentUser.nombre}</strong> ({currentUser.role})
                </div>
                <div>
                  <span className="text-slate-500">Pedido:</span> #{comprobante.pedidoId}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => setShowConfirmModal(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleConfirmPayment}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? "Verificando..." : "Sí, Confirmar Pago"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reject Dialog Submodal with Mandatory Reason */}
        {showRejectModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-2.5 text-rose-700">
                <XCircle className="w-6 h-6" />
                <h4 className="font-bold text-base text-slate-900">
                  Rechazar Comprobante de Pago
                </h4>
              </div>

              <p className="text-xs text-slate-600">
                Por favor explica la razón del rechazo para que el cliente pueda corregir o reenviar su comprobante.
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Motivo obligatorio de rechazo: <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Ej: Monto insuficiente, transferencia no acreditada en extracto, comprobante borroso o duplicado..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-400 focus:outline-none"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => setShowRejectModal(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  disabled={isProcessing || !rejectReason.trim()}
                  onClick={handleRejectPayment}
                  className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? "Rechazando..." : "Rechazar Comprobante"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Zoom Lightbox */}
        {isZoomed && (
          <div
            onClick={() => setIsZoomed(false)}
            className="fixed inset-0 z-60 bg-black/90 flex flex-col items-center justify-center p-4 backdrop-blur-md cursor-zoom-out"
          >
            <div className="relative max-w-3xl max-h-[90vh]">
              <button
                type="button"
                onClick={() => setIsZoomed(false)}
                className="absolute -top-10 right-0 p-2 text-white hover:text-slate-300 cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
              <img
                src={comprobante.urlArchivo}
                alt="Comprobante ampliado"
                className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl bg-white p-2"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
