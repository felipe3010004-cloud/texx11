import React, { useState } from "react";
import { OrderRecord, OrderStatus, ComprobanteQrRecord } from "../models/types";
import { orderController } from "../controllers/orderController";
import { pagosyaController } from "../controllers/pagosyaController";
import { staticQrController } from "../controllers/staticQrController";
import { ComprobanteReviewModalView } from "./ComprobanteReviewModalView";
import {
  X,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  Clock,
  Phone,
  MapPin,
  User,
  ShoppingBag,
  History,
  QrCode,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  Eye,
} from "lucide-react";

interface OrderDetailModalViewProps {
  isOpen: boolean;
  order: OrderRecord | null;
  onClose: () => void;
  currentUser: {
    uid: string;
    nombre: string;
    email: string;
    role: "admin" | "vendedor";
  };
  onOrderUpdated: () => void;
}

export const OrderDetailModalView: React.FC<OrderDetailModalViewProps> = ({
  isOpen,
  order,
  onClose,
  currentUser,
  onOrderUpdated,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Dialog for confirming, rejecting or canceling
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    targetStatus: OrderStatus;
    title: string;
    actionLabel: string;
    actionStyle: "emerald" | "rose" | "slate";
    requiresReason: boolean;
  } | null>(null);

  const [actionReason, setActionReason] = useState("");
  const [isCheckingPagosya, setIsCheckingPagosya] = useState(false);
  const [selectedVoucherForReview, setSelectedVoucherForReview] = useState<ComprobanteQrRecord | null>(null);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);

  if (!isOpen || !order) return null;

  const currentStatus = order.estado;

  // Validation: Check if the user is authorized to modify this order
  const isVendorOwner = currentUser.role === "admin" || (order.vendedorId && order.vendedorId === currentUser.uid);

  const handleOpenActionDialog = (targetStatus: OrderStatus) => {
    setActionReason("");
    setFeedbackMsg(null);

    if (targetStatus === "confirmado") {
      setConfirmDialog({
        isOpen: true,
        targetStatus: "confirmado",
        title: "¿Confirmar este pedido?",
        actionLabel: "Sí, Confirmar Pedido",
        actionStyle: "emerald",
        requiresReason: false,
      });
    } else if (targetStatus === "rechazado") {
      setConfirmDialog({
        isOpen: true,
        targetStatus: "rechazado",
        title: "Rechazar Pedido",
        actionLabel: "Rechazar Pedido",
        actionStyle: "rose",
        requiresReason: true,
      });
    } else if (targetStatus === "cancelado") {
      setConfirmDialog({
        isOpen: true,
        targetStatus: "cancelado",
        title: "Cancelar Pedido",
        actionLabel: "Cancelar Pedido",
        actionStyle: "slate",
        requiresReason: true,
      });
    }
  };

  const handleExecuteStatusChange = async () => {
    if (!confirmDialog) return;

    if (confirmDialog.requiresReason && !actionReason.trim()) {
      setFeedbackMsg({ text: "Es obligatorio especificar el motivo.", type: "error" });
      return;
    }

    setIsProcessing(true);
    setFeedbackMsg(null);

    try {
      const res = await orderController.updateOrderStatus({
        orderId: order.id!,
        targetStatus: confirmDialog.targetStatus,
        user: currentUser,
        reason: actionReason.trim(),
      });

      setFeedbackMsg({ text: res.message, type: "success" });
      setConfirmDialog(null);
      setActionReason("");
      onOrderUpdated();
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || "Error al actualizar el estado.", type: "error" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckPagosyaStatus = async () => {
    if (!order.pagoPagosya?.checkoutId) return;

    setIsCheckingPagosya(true);
    setFeedbackMsg(null);

    try {
      const res = await pagosyaController.checkStatus(order.pagoPagosya.checkoutId, order.id);
      if (res.status === "completed") {
        setFeedbackMsg({
          text: "¡Pago completado verificado oficialmente por la pasarela PagosYa!",
          type: "success",
        });
      } else {
        setFeedbackMsg({
          text: `Estado en PagosYa verificado: ${(res.status || "pendiente").toUpperCase()}`,
          type: "success",
        });
      }
      onOrderUpdated();
    } catch (err: any) {
      setFeedbackMsg({
        text: `Error al consultar PagosYa: ${err.message || "Error de red"}`,
        type: "error",
      });
    } finally {
      setIsCheckingPagosya(false);
    }
  };

  const handleOpenVoucherReview = () => {
    if (!order.pagoQrEstatico?.ultimoComprobanteUrl && !order.pagoQrEstatico?.ultimoComprobanteId) return;
    const voucherRecord: ComprobanteQrRecord = {
      id: order.pagoQrEstatico.ultimoComprobanteId || `comp-${order.id}`,
      pedidoId: order.id!,
      clienteNombre: order.clienteNombre,
      clienteCelular: order.clienteCelular,
      vendedorId: order.vendedorId || null,
      vendedorNombre: order.vendedorNombre || null,
      monto: order.total,
      nombreArchivo: order.pagoQrEstatico.nombreArchivo || "comprobante",
      rutaAlmacenamiento: "",
      urlArchivo: order.pagoQrEstatico.ultimoComprobanteUrl || "",
      tipoArchivo: order.pagoQrEstatico.tipoArchivo || "image/jpeg",
      tamanoBytes: order.pagoQrEstatico.tamanoBytes || 0,
      fechaEnvio: order.pagoQrEstatico.fechaEnvio || new Date(),
      estado: order.pagoQrEstatico.estado || "PENDIENTE_VERIFICACION",
      revisadoPor: order.pagoQrEstatico.revisadoPor || null,
      fechaRevision: order.pagoQrEstatico.fechaRevision || null,
      motivoRechazo: order.pagoQrEstatico.motivoRechazo,
    };
    setSelectedVoucherForReview(voucherRecord);
    setIsVoucherModalOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl my-6 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden text-slate-800 text-left flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center text-slate-700 font-bold">
              #{order.id?.slice(-4) || "ORD"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-slate-900">
                  Detalle del Pedido #{order.id}
                </h3>
                {currentStatus === "pendiente" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300">
                    <Clock className="w-3 h-3 text-amber-600" />
                    <span>Pendiente</span>
                  </span>
                )}
                {currentStatus === "confirmado" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Confirmado</span>
                  </span>
                )}
                {currentStatus === "rechazado" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-300">
                    <XCircle className="w-3 h-3 text-rose-600" />
                    <span>Rechazado</span>
                  </span>
                )}
                {currentStatus === "cancelado" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
                    <AlertOctagon className="w-3 h-3 text-slate-500" />
                    <span>Cancelado</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Registrado el {new Date(order.fecha).toLocaleString("es-BO")}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback message banner */}
        {feedbackMsg && (
          <div
            className={`px-6 py-2.5 text-xs font-medium flex items-center justify-between ${
              feedbackMsg.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-b border-emerald-200"
                : "bg-rose-50 text-rose-800 border-b border-rose-200"
            }`}
          >
            <span>{feedbackMsg.text}</span>
            <button
              type="button"
              onClick={() => setFeedbackMsg(null)}
              className="text-slate-400 hover:text-slate-700 text-xs ml-2"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          
          {/* Customer & Destination Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Información del Cliente</span>
              </div>
              <div className="font-semibold text-slate-900 text-base">
                {order.clienteNombre}
              </div>
              <div className="flex items-center gap-2 text-slate-600 text-xs">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <a
                  href={`https://wa.me/${order.clienteCelular.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-700 font-medium hover:underline inline-flex items-center gap-1"
                >
                  +{order.clienteCelular.replace(/\+/g, "")}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="flex items-center gap-2 text-slate-600 text-xs">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {order.departamento} ({order.pais || "Bolivia"})
                </span>
              </div>
            </div>

            {/* Seller / Attribution */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                <span>Atribución y Distribuidor</span>
              </div>
              <div className="font-medium text-slate-800 text-sm">
                {order.vendedorNombre || order.vendedorId ? (
                  <span className="text-slate-900 font-semibold">
                    {order.vendedorNombre || `Distribuidor ID: ${order.vendedorId}`}
                  </span>
                ) : (
                  <span className="text-slate-500 italic">Venta directa central (Sin distribuidor asignado)</span>
                )}
              </div>
              <div className="text-xs text-slate-500">
                Última actualización:{" "}
                {order.fechaActualizacion
                  ? new Date(order.fechaActualizacion).toLocaleString("es-BO")
                  : "Sin cambios registrados"}
              </div>
              {order.actualizadoPor && (
                <div className="text-xs text-slate-500">
                  Por: {order.actualizadoPor.nombre} ({order.actualizadoPor.rol})
                </div>
              )}
            </div>
          </div>

          {/* Payment Section - Strict Separation between Order Status and PagosYa Payment Status */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-slate-600" />
                <span className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                  Estado de Pago (Pasarela PagosYa)
                </span>
              </div>

              {order.pagoPagosya ? (
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      order.pagoPagosya.estado === "completed"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                        : order.pagoPagosya.estado === "expired"
                        ? "bg-slate-100 text-slate-700 border border-slate-300"
                        : "bg-amber-50 text-amber-800 border border-amber-300"
                    }`}
                  >
                    {order.pagoPagosya.estado === "completed" && "Pago Confirmado Oficial"}
                    {order.pagoPagosya.estado === "pending" && "Pago Pendiente en Pasarela"}
                    {order.pagoPagosya.estado === "expired" && "Checkout Expirado"}
                    {order.pagoPagosya.estado === "cancelled" && "Checkout Cancelado"}
                  </span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                    {order.pagoPagosya.ambiente || "sandbox"}
                  </span>
                </div>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                  Sin pago QR PagosYa registrado
                </span>
              )}
            </div>

            {/* Note of strict separation */}
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-2 text-xs text-slate-600">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Regla de negocio:</strong> El estado del pedido y el estado del pago son independientes.
                Confirmar un pedido <u>no</u> marca el pago como acreditado. El cobro por PagosYa solo se confirma
                mediante la respuesta verificada del servidor o webhook oficial.
              </span>
            </div>

            {/* PagosYa details and real API verification */}
            {order.pagoPagosya?.checkoutId && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1 text-xs">
                <div>
                  <span className="text-slate-500">ID Checkout:</span>{" "}
                  <code className="font-mono text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                    {order.pagoPagosya.checkoutId}
                  </code>
                  {order.pagoPagosya.fechaPago && (
                    <div className="text-[11px] text-emerald-700 mt-1">
                      Acreditado el: {new Date(order.pagoPagosya.fechaPago).toLocaleString("es-BO")}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {order.pagoPagosya.qrImageUrl && (
                    <a
                      href={order.pagoPagosya.qrImageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium inline-flex items-center gap-1.5 text-xs transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                      <span>Ver QR</span>
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={handleCheckPagosyaStatus}
                    disabled={isCheckingPagosya}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-medium inline-flex items-center gap-1.5 text-xs transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isCheckingPagosya ? "animate-spin" : ""}`} />
                    <span>{isCheckingPagosya ? "Consultando..." : "Consultar API PagosYa"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Static QR Payment Section */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-cyan-800" />
                <span className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                  Estado de Pago (QR Estático Banco Unión / Yasta)
                </span>
              </div>

              {order.pagoQrEstatico ? (
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    order.pagoQrEstatico.estado === "VERIFICADO"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                      : order.pagoQrEstatico.estado === "RECHAZADO"
                      ? "bg-rose-50 text-rose-800 border border-rose-300"
                      : "bg-amber-50 text-amber-800 border border-amber-300"
                  }`}
                >
                  {order.pagoQrEstatico.estado === "VERIFICADO" && "Pago Verificado en Cuenta"}
                  {order.pagoQrEstatico.estado === "RECHAZADO" && "Comprobante Rechazado"}
                  {order.pagoQrEstatico.estado === "PENDIENTE_VERIFICACION" && "Comprobante Pendiente de Verificación"}
                  {order.pagoQrEstatico.estado === "PENDIENTE" && "Esperando Comprobante"}
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                  Sin pago QR Estático registrado
                </span>
              )}
            </div>

            {order.pagoQrEstatico?.ultimoComprobanteUrl ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1 text-xs">
                <div>
                  <span className="text-slate-500">Comprobante enviado:</span>{" "}
                  <strong className="text-slate-800">{order.pagoQrEstatico.nombreArchivo || "comprobante"}</strong>
                  {order.pagoQrEstatico.fechaEnvio && (
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Enviado el:{" "}
                      {new Date(
                        order.pagoQrEstatico.fechaEnvio.toDate?.() || order.pagoQrEstatico.fechaEnvio
                      ).toLocaleString("es-BO")}
                    </div>
                  )}
                  {order.pagoQrEstatico.motivoRechazo && (
                    <div className="text-[11px] text-rose-700 font-medium mt-1">
                      Motivo rechazo: "{order.pagoQrEstatico.motivoRechazo}"
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleOpenVoucherReview}
                  className="px-3 py-1.5 rounded-lg bg-cyan-700 hover:bg-cyan-800 text-white font-semibold inline-flex items-center gap-1.5 text-xs transition-colors cursor-pointer shadow-xs"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Revisar y Verificar Comprobante</span>
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                El cliente aún no ha subido comprobante bancario para este pedido.
              </p>
            )}
          </div>

          {/* Requested Items Table */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
              <span>Productos y Cantidades Solicitadas</span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3.5">Producto / Combo</th>
                    <th className="py-2.5 px-3.5 text-center">Cantidad</th>
                    <th className="py-2.5 px-3.5 text-right">Precio Unitario</th>
                    <th className="py-2.5 px-3.5 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {order.productos && order.productos.length > 0 ? (
                    order.productos.map((prod, idx) => {
                      const subtotal = prod.cantidad * prod.precioUnitario;
                      return (
                        <tr key={idx} className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-3.5 font-medium text-slate-900">
                            {prod.nombre}
                            {prod.isCombo && (
                              <span className="ml-2 px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                Combo
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3.5 text-center font-medium text-slate-700">
                            {prod.cantidad}
                          </td>
                          <td className="py-2.5 px-3.5 text-right text-slate-600">
                            Bs {prod.precioUnitario.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3.5 text-right font-semibold text-slate-900">
                            Bs {subtotal.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-3 px-3.5 text-center text-slate-400 italic">
                        Detalle de productos no especificado
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-slate-50 border-t border-slate-200 font-bold text-slate-900">
                  <tr>
                    <td colSpan={3} className="py-3 px-3.5 text-right uppercase text-xs text-slate-600">
                      Total a Pagar:
                    </td>
                    <td className="py-3 px-3.5 text-right text-base text-slate-900">
                      Bs {order.total.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Action Buttons for Current Status */}
          {isVendorOwner ? (
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Gestión y Acciones del Pedido
                </span>
                <span className="text-xs text-slate-500">
                  Operador: <strong>{currentUser.nombre}</strong> ({currentUser.role})
                </span>
              </div>

              {currentStatus === "pendiente" && (
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleOpenActionDialog("confirmado")}
                    disabled={isProcessing}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirmar Pedido</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenActionDialog("rechazado")}
                    disabled={isProcessing}
                    className="px-4 py-2 rounded-lg bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 font-medium text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Rechazar Pedido</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenActionDialog("cancelado")}
                    disabled={isProcessing}
                    className="px-4 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-medium text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <AlertOctagon className="w-4 h-4" />
                    <span>Cancelar Pedido</span>
                  </button>
                </div>
              )}

              {currentStatus === "confirmado" && (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-emerald-800 font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Este pedido ya fue confirmado y aceptado para despacho.</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenActionDialog("cancelado")}
                    disabled={isProcessing}
                    className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-medium text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <AlertOctagon className="w-4 h-4 text-slate-500" />
                    <span>Cancelar Pedido (con motivo)</span>
                  </button>
                </div>
              )}

              {(currentStatus === "rechazado" || currentStatus === "cancelado") && (
                <div className="p-3 rounded-lg bg-white border border-slate-200 text-xs text-slate-600 space-y-1">
                  <div className="font-semibold text-slate-800">
                    Pedido en estado terminal ({currentStatus.toUpperCase()})
                  </div>
                  <p>
                    {order.ultimoMotivo || order.motivoRechazo || order.motivoCancelacion ? (
                      <>
                        <strong>Motivo registrado:</strong>{" "}
                        <span className="italic text-slate-700">
                          "{order.ultimoMotivo || order.motivoRechazo || order.motivoCancelacion}"
                        </span>
                      </>
                    ) : (
                      "No se registró motivo adicional."
                    )}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Por seguridad e integridad de trazabilidad, los pedidos rechazados o cancelados no pueden ser
                    modificados arbitrariamente.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-xs">
              Solo el administrador o el distribuidor asignado a este pedido pueden cambiar su estado.
            </div>
          )}

          {/* Traceability & State History Timeline */}
          <div className="space-y-3 pt-2">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-slate-400" />
              <span>Historial de Trazabilidad del Pedido</span>
            </div>

            {order.historialEstados && order.historialEstados.length > 0 ? (
              <div className="relative pl-6 space-y-4 border-l-2 border-slate-200 ml-2 text-xs">
                {order.historialEstados.map((item, idx) => (
                  <div key={idx} className="relative">
                    {/* Dot */}
                    <div className="absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-slate-400" />
                    
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 capitalize">
                          {item.estadoNuevo}
                        </span>
                        {item.estadoAnterior !== item.estadoNuevo && (
                          <span className="text-[10px] text-slate-400">
                            (anterior: {item.estadoAnterior})
                          </span>
                        )}
                        <span className="text-slate-400 text-[11px]">·</span>
                        <span className="text-slate-500 text-[11px]">
                          {item.fecha ? new Date(item.fecha).toLocaleString("es-BO") : "Fecha no registrada"}
                        </span>
                      </div>

                      <div className="text-slate-600 text-[11px]">
                        Por: <strong>{item.usuarioNombre}</strong> ({item.usuarioRol || "sistema"}) · {item.usuarioEmail}
                      </div>

                      {item.motivo && (
                        <div className="p-2 rounded bg-slate-50 border border-slate-200 text-slate-700 italic mt-1 text-[11px]">
                          "{item.motivo}"
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                Sin historial de cambios registrado aún.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-medium transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>

        {/* Action Confirmation Dialog Submodal */}
        {confirmDialog && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="font-bold text-slate-900 text-base">{confirmDialog.title}</h4>
                <button
                  type="button"
                  onClick={() => setConfirmDialog(null)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-600">
                ¿Estás seguro de cambiar el estado del pedido #{order.id} a{" "}
                <strong>{confirmDialog.targetStatus.toUpperCase()}</strong>? Esta acción quedará registrada en el
                historial con tu usuario y fecha actual.
              </p>

              {confirmDialog.requiresReason && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Motivo obligatorio: <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    placeholder="Describe detalladamente la razón (ej: Cliente canceló por WhatsApp, producto no disponible, etc.)..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-slate-400 focus:outline-none"
                    autoFocus
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmDialog(null)}
                  disabled={isProcessing}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleExecuteStatusChange}
                  disabled={isProcessing}
                  className={`px-4 py-1.5 rounded-lg text-xs font-medium text-white transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                    confirmDialog.actionStyle === "emerald"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : confirmDialog.actionStyle === "rose"
                      ? "bg-rose-600 hover:bg-rose-700"
                      : "bg-slate-700 hover:bg-slate-800"
                  }`}
                >
                  {isProcessing ? "Guardando..." : confirmDialog.actionLabel}
                </button>
              </div>
            </div>
          </div>
        )}

        {isVoucherModalOpen && selectedVoucherForReview && (
          <ComprobanteReviewModalView
            isOpen={isVoucherModalOpen}
            onClose={() => {
              setIsVoucherModalOpen(false);
              setSelectedVoucherForReview(null);
            }}
            comprobante={selectedVoucherForReview}
            currentUser={currentUser}
            onStatusUpdated={() => {
              onOrderUpdated();
              setIsVoucherModalOpen(false);
              setSelectedVoucherForReview(null);
            }}
          />
        )}
      </div>
    </div>
  );
};
