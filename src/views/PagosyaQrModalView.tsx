import React, { useState, useEffect } from "react";
import { PagosyaQrResponse, CartItem } from "../models/types";
import { pagosyaController } from "../controllers/pagosyaController";
import confetti from "canvas-confetti";
import {
  X,
  QrCode,
  ShieldAlert,
  ShieldCheck,
  Clock,
  Copy,
  Check,
  ArrowLeft,
  AlertTriangle,
  Smartphone,
  Info,
  CheckCircle2,
  MessageCircle,
  RefreshCw,
} from "lucide-react";

interface PagosyaQrModalViewProps {
  isOpen: boolean;
  onClose: () => void;
  qrData: PagosyaQrResponse | null;
  orderTotal: number;
  items: CartItem[];
  vendedorWhatsapp: string;
  onBackToCart: () => void;
}

export const PagosyaQrModalView: React.FC<PagosyaQrModalViewProps> = ({
  isOpen,
  onClose,
  qrData,
  orderTotal,
  items,
  vendedorWhatsapp,
  onBackToCart,
}) => {
  const [copiedOrder, setCopiedOrder] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>("30:00");
  const [isExpired, setIsExpired] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>(qrData?.status || "pending");
  const [isChecking, setIsChecking] = useState(false);

  const isProduction = qrData?.environment === "production";

  // Sincronizar estado cuando cambia el prop
  useEffect(() => {
    if (qrData) {
      setCurrentStatus(qrData.status || "pending");
      setIsExpired(false);
    }
  }, [qrData]);

  // Temporizador regresivo de expiración
  useEffect(() => {
    if (!qrData || !isOpen || currentStatus === "completed") return;

    let targetTime: number;
    if (qrData.expires_at) {
      targetTime = new Date(qrData.expires_at).getTime();
    } else {
      // 5 minutos en producción, 30 minutos en sandbox
      const durationMs = isProduction ? 5 * 60 * 1000 : 30 * 60 * 1000;
      targetTime = Date.now() + durationMs;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = targetTime - now;

      if (diff <= 0) {
        setTimeLeft("00:00");
        setIsExpired(true);
        setCurrentStatus((prev) => (prev === "completed" ? "completed" : "expired"));
        clearInterval(interval);
      } else {
        const minutes = Math.floor(diff / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(
          `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
        );
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [qrData, isOpen, isProduction, currentStatus]);

  // Sondeo periódico de estado en Producción o Sandbox si está pendiente
  useEffect(() => {
    if (!isOpen || !qrData || currentStatus === "completed" || isExpired) return;

    const checkoutId = qrData.checkout_id || qrData.id;
    if (!checkoutId) return;

    // Sondear cada 5 segundos
    const pollInterval = setInterval(async () => {
      try {
        const res = await pagosyaController.checkStatus(
          checkoutId,
          qrData.order_id,
          qrData.status_url
        );

        if (res.success && res.status) {
          if (res.status !== currentStatus) {
            setCurrentStatus(res.status);

            if (res.status === "completed") {
              try {
                confetti({
                  particleCount: 120,
                  spread: 80,
                  origin: { y: 0.6 },
                });
              } catch {
                // Ignorar si falla confetti
              }
            }
          }
        }
      } catch (err) {
        // Ignorar fallos de sondeo silenciosos
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [isOpen, qrData, currentStatus, isExpired]);

  if (!isOpen || !qrData) return null;

  // Determinar la mejor fuente para la imagen del QR recibida de PagosYa
  let qrImageSrc = "";
  if (qrData.qr?.data_url && qrData.qr.data_url.trim()) {
    qrImageSrc = qrData.qr.data_url;
  } else if (qrData.qr_image && qrData.qr_image.trim()) {
    qrImageSrc = qrData.qr_image;
  } else if (qrData.qr?.base64 && qrData.qr.base64.trim()) {
    qrImageSrc = qrData.qr.base64.startsWith("data:")
      ? qrData.qr.base64
      : `data:image/png;base64,${qrData.qr.base64}`;
  } else if (qrData.qr_code && qrData.qr_code.trim()) {
    qrImageSrc = qrData.qr_code;
  }

  const handleCopyOrderId = () => {
    if (qrData.order_id) {
      navigator.clipboard.writeText(qrData.order_id);
      setCopiedOrder(true);
      setTimeout(() => setCopiedOrder(false), 2000);
    }
  };

  const handleManualCheckStatus = async () => {
    const checkoutId = qrData.checkout_id || qrData.id;
    if (!checkoutId) return;

    setIsChecking(true);
    try {
      const res = await pagosyaController.checkStatus(
        checkoutId,
        qrData.order_id,
        qrData.status_url
      );
      if (res.success && res.status) {
        setCurrentStatus(res.status);
        if (res.status === "completed") {
          try {
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
          } catch {}
        }
      }
    } finally {
      setIsChecking(false);
    }
  };

  const handleNotifyWhatsapp = () => {
    const summary = items
      .map((i) => `• ${i.quantity}x ${i.name} - Bs ${(i.price * i.quantity).toFixed(0)}`)
      .join("\n");

    const statusLabel =
      currentStatus === "completed"
        ? "Pagado y confirmado"
        : isExpired
        ? "Expirado"
        : isProduction
        ? "Pendiente en Producción"
        : "Pendiente en Sandbox";

    const text = encodeURIComponent(
      `🌿 *Referencia de Pedido PagosYa (${isProduction ? "Producción" : "Sandbox"}) - Team Life* 🌿\n\n` +
      `🆔 *ID de Pedido:* ${qrData.order_id}\n` +
      `💰 *Monto:* Bs ${orderTotal.toFixed(0)} BOB\n` +
      `📋 *Estado:* ${statusLabel}\n\n` +
      `🛒 *Detalle:*\n${summary}\n\n` +
      `He procesado el checkout mediante código QR de PagosYa. Por favor coordinar el despacho oficial a la brevedad.`
    );
    window.open(`https://wa.me/${vendedorWhatsapp}?text=${text}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#082836]/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl bg-white border border-[#c8e4ed] shadow-2xl text-[#082836] p-5 sm:p-7 space-y-4 my-6 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#c8e4ed]">
          <div className="flex items-center gap-2.5 text-left">
            <div className="w-10 h-10 rounded-2xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-700 shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-black text-lg sm:text-xl text-[#082836] flex items-center gap-2">
                <span>Pago mediante QR</span>
                {isProduction ? (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">
                    Producción
                  </span>
                ) : (
                  <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">
                    Sandbox
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500">
                Checkout oficial integrado · Escanea desde cualquier banco boliviano
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-cyan-50 hover:bg-cyan-100 text-slate-500 hover:text-[#082836] flex items-center justify-center cursor-pointer transition-colors border border-[#c8e4ed]"
            title="Cerrar ventana de pago"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ALERTA OBLIGATORIA DE AMBIENTE */}
        {!isProduction ? (
          <div className="p-3.5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-900 text-xs text-left space-y-1 shadow-xs">
            <div className="flex items-center gap-2 font-black text-amber-950 uppercase tracking-wide">
              <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Ambiente de Pruebas PagosYa</span>
            </div>
            <p className="leading-relaxed font-semibold text-[11px] sm:text-xs text-amber-900">
              AMBIENTE DE PRUEBAS: ESTE QR ES FICTICIO Y NO REPRESENTA UN COBRO REAL.
            </p>
            <div className="text-[10px] text-amber-700 flex items-center gap-1 pt-0.5">
              <Info className="w-3 h-3 shrink-0" />
              <span>livemode: false · No se realizarán cargos a cuentas bancarias reales.</span>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs text-left flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              <strong>Ambiente de Producción:</strong> Código QR real con vigencia de 5 minutos según normativa oficial de PagosYa.
            </span>
          </div>
        )}

        {/* Estado Completado / Exitoso */}
        {currentStatus === "completed" ? (
          <div className="p-6 rounded-3xl bg-emerald-50 border-2 border-emerald-300 text-center space-y-3 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="font-display font-black text-xl text-emerald-950">
              ¡Pago Confirmado Oficialmente!
            </h4>
            <p className="text-xs text-emerald-800 leading-relaxed max-w-sm mx-auto">
              El pago de <strong>Bs {orderTotal.toFixed(0)} BOB</strong> para la referencia{" "}
              <code>{qrData.order_id}</code> ha sido validado exitosamente en los servidores de PagosYa.
            </p>
            <div className="text-[11px] text-emerald-700 font-mono bg-white/70 py-1.5 px-3 rounded-xl border border-emerald-200 inline-block">
              Estado: COMPLETED (Confirmado)
            </div>
          </div>
        ) : (
          /* QR Stage & Details */
          <div className="flex flex-col items-center justify-center space-y-3 py-1">
            <div className="relative p-4 rounded-3xl bg-white border-2 border-cyan-500/30 shadow-xl shadow-cyan-900/10 flex flex-col items-center max-w-[260px] sm:max-w-[280px] w-full">
              {/* PagosYa badge */}
              <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-slate-100 text-[10px] text-slate-500 font-semibold">
                <span className="flex items-center gap-1 text-[#0891b2] font-black tracking-wider uppercase">
                  <span className="w-2 h-2 rounded-full bg-[#0891b2] animate-pulse" />
                  PagosYa QR
                </span>
                <span className="bg-cyan-50 px-2 py-0.5 rounded text-cyan-800 font-mono">
                  BOB
                </span>
              </div>

              {/* QR Image Container */}
              <div className="relative w-48 h-48 sm:w-56 sm:h-56 bg-slate-50 rounded-2xl flex items-center justify-center p-2 border border-slate-200 overflow-hidden">
                {isExpired ? (
                  <div className="flex flex-col items-center justify-center text-rose-600 space-y-2 p-3 text-center">
                    <AlertTriangle className="w-10 h-10 text-rose-500" />
                    <span className="font-bold text-xs">Código QR Expirado</span>
                    <span className="text-[10px] text-slate-500">
                      {isProduction
                        ? "El tiempo límite de 5 minutos para este QR ha concluido."
                        : "El tiempo límite para este QR ha concluido."}
                    </span>
                  </div>
                ) : qrImageSrc ? (
                  <img
                    src={qrImageSrc}
                    alt={`Código QR PagosYa para Pedido ${qrData.order_id}`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 space-y-2 text-center p-3">
                    <QrCode className="w-12 h-12 text-slate-300 animate-pulse" />
                    <span className="text-xs font-semibold text-slate-600">
                      Cargando código QR de PagosYa...
                    </span>
                  </div>
                )}
              </div>

              {/* Countdown / Status Bar */}
              <div className="w-full mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 font-semibold text-slate-600">
                  <Clock className="w-3.5 h-3.5 text-cyan-700" />
                  <span>Expira en:</span>
                </span>
                <span
                  className={`font-mono font-bold ${
                    isExpired ? "text-rose-600" : "text-cyan-800"
                  }`}
                >
                  {timeLeft} min
                </span>
              </div>
            </div>

            {/* Estado del Checkout & Monto */}
            <div className="w-full bg-[#f0f7fa] p-3.5 rounded-2xl border border-[#c8e4ed] space-y-2 text-left text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Estado del Checkout:</span>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px] ${
                      currentStatus === "completed"
                        ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                        : currentStatus === "expired"
                        ? "bg-rose-100 text-rose-900 border border-rose-300"
                        : "bg-amber-100 text-amber-900 border border-amber-300"
                    }`}
                  >
                    {currentStatus === "pending"
                      ? isProduction
                        ? "Pendiente (Esperando Pago)"
                        : "Pendiente (Sandbox)"
                      : currentStatus}
                  </span>

                  <button
                    type="button"
                    onClick={handleManualCheckStatus}
                    disabled={isChecking}
                    className="p-1 rounded hover:bg-white text-slate-500 hover:text-cyan-700 transition-colors cursor-pointer"
                    title="Actualizar estado con el servidor"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? "animate-spin text-cyan-600" : ""}`} />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Importe Total:</span>
                <span className="font-display font-black text-xl text-cyan-800">
                  Bs {orderTotal.toFixed(0)} <span className="text-xs font-sans text-slate-500 font-normal">BOB</span>
                </span>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-[#c8e4ed]/70">
                <span className="text-slate-500 font-medium">Referencia de Pedido:</span>
                <div className="flex items-center gap-1.5">
                  <code className="font-mono font-bold text-[11px] text-slate-800 bg-white px-2 py-0.5 rounded border border-[#c8e4ed]">
                    {qrData.order_id}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopyOrderId}
                    className="p-1 rounded hover:bg-white text-slate-600 hover:text-cyan-700 transition-colors cursor-pointer"
                    title="Copiar referencia"
                  >
                    {copiedOrder ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Instrucciones de Escaneo */}
            <div className="w-full text-left space-y-1.5 text-xs text-slate-600 px-1">
              <div className="font-bold text-[#082836] flex items-center gap-1.5 text-xs">
                <Smartphone className="w-3.5 h-3.5 text-cyan-700" />
                <span>Instrucciones para escanear en Bolivia:</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 pl-1">
                <li>Abre la aplicación móvil de tu banco (BCP, BNB, Banco Unión, Mercantil, Bisa, Sol, etc.).</li>
                <li>Ingresa a la opción de <strong>Cobro/Pago con QR</strong> o <strong>Simple</strong>.</li>
                <li>Apunta tu cámara a este código QR para escanearlo.</li>
              </ol>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 border-t border-[#c8e4ed] flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={onBackToCart}
            className="flex-1 py-3 px-4 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-[#082836] font-bold text-xs flex items-center justify-center gap-1.5 border border-[#c8e4ed] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver al Carrito</span>
          </button>

          <button
            type="button"
            onClick={handleNotifyWhatsapp}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/20 transition-all cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5 fill-white text-emerald-700" />
            <span>Coordinar vía WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
