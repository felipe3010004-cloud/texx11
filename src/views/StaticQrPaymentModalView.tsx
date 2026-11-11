import React, { useState, useEffect, useRef } from "react";
import {
  X,
  QrCode,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ZoomIn,
  Copy,
  Check,
  RotateCcw,
  Clock,
  ExternalLink,
  ShieldAlert,
  Loader2,
  FileCheck,
} from "lucide-react";
import {
  staticQrController,
  MAX_VOUCHER_FILE_SIZE,
} from "../controllers/staticQrController";
import {
  StaticQrConfig,
  StaticQrPaymentStatus,
  ComprobanteQrRecord,
} from "../models/types";
import { db } from "../models/firebaseModel";

interface StaticQrPaymentModalViewProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  total: number;
  clientName: string;
  clientPhone: string;
  clientUid?: string;
  vendedorId?: string | null;
  vendedorNombre?: string | null;
  onPaymentSubmitted?: () => void;
}

export const StaticQrPaymentModalView: React.FC<StaticQrPaymentModalViewProps> = ({
  isOpen,
  onClose,
  orderId,
  total,
  clientName,
  clientPhone,
  clientUid,
  vendedorId,
  vendedorNombre,
  onPaymentSubmitted,
}) => {
  const [config, setConfig] = useState<StaticQrConfig | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPdf, setIsPdf] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Verification / Status State
  const [paymentStatus, setPaymentStatus] = useState<StaticQrPaymentStatus>("PENDIENTE");
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [historyVouchers, setHistoryVouchers] = useState<ComprobanteQrRecord[]>([]);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Zoom Lightbox
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Copy helper
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load static QR config and listen to order payment status
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoadingConfig(true);

    staticQrController.getConfig().then((cfg) => {
      if (isMounted) {
        setConfig(cfg);
        setLoadingConfig(false);
      }
    });

    // Listen to the order payment state in real time
    if (orderId) {
      const unsub = db
        .collection("pedidos")
        .doc(orderId)
        .onSnapshot(
          (doc) => {
            if (doc.exists) {
              const data = doc.data()!;
              const qrPayment = data.pagoQrEstatico;
              if (qrPayment) {
                if (qrPayment.estado) {
                  setPaymentStatus(qrPayment.estado);
                }
                if (qrPayment.motivoRechazo) {
                  setRejectionReason(qrPayment.motivoRechazo);
                }
                if (Array.isArray(qrPayment.historialComprobantes)) {
                  setHistoryVouchers(qrPayment.historialComprobantes);
                }
                if (qrPayment.estado === "PENDIENTE_VERIFICACION" || qrPayment.estado === "VERIFICADO") {
                  setSubmittedSuccess(true);
                }
              }
            }
          },
          (err) => {
            console.warn("[StaticQrModal] Listener aviso:", err);
          }
        );

      // Load previous vouchers history
      staticQrController.getComprobantesForOrder(orderId).then((vouchers) => {
        if (isMounted && vouchers.length > 0) {
          setHistoryVouchers(vouchers);
          const latest = vouchers[0];
          setPaymentStatus(latest.estado);
          if (latest.motivoRechazo) {
            setRejectionReason(latest.motivoRechazo);
          }
          if (latest.estado === "PENDIENTE_VERIFICACION" || latest.estado === "VERIFICADO") {
            setSubmittedSuccess(true);
          }
        }
      });

      return () => {
        isMounted = false;
        unsub();
      };
    }
  }, [isOpen, orderId]);

  // Clean up object URLs on unmount or file change
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = staticQrController.validateVoucherFile(file);
    if (!validation.valid) {
      setFileError(validation.error || "Archivo no válido.");
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    setSelectedFile(file);
    const isDocPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");
    setIsPdf(isDocPdf);

    if (isDocPdf) {
      setPreviewUrl(null);
    } else {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleClearSelectedFile = () => {
    setSelectedFile(null);
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmitVoucher = async () => {
    if (!selectedFile) {
      setFileError("Por favor selecciona tu comprobante de pago antes de enviar.");
      return;
    }

    setIsSubmitting(true);
    setFileError(null);

    try {
      const result = await staticQrController.submitComprobante({
        orderId,
        file: selectedFile,
        clientName,
        clientPhone,
        clientUid,
        total,
        vendedorId,
        vendedorNombre,
      });

      setSubmittedSuccess(true);
      setPaymentStatus("PENDIENTE_VERIFICACION");
      setHistoryVouchers((prev) => [result, ...prev]);
      handleClearSelectedFile();

      if (onPaymentSubmitted) {
        onPaymentSubmitted();
      }
    } catch (err: any) {
      setFileError(err.message || "Error al enviar comprobante. Intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(orderId);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyAccount = () => {
    if (!config?.numeroCuenta) return;
    navigator.clipboard.writeText(config.numeroCuenta);
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  const formattedOrderCode = `#${orderId.toUpperCase()}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl my-6 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 text-left flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-700 text-white flex items-center justify-center shadow-sm">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-slate-900 leading-tight">
                Pago mediante QR Estático
              </h3>
              <p className="text-xs text-slate-500">
                Banco Unión S.A. & Red Yasta · TEAM LIFE | Equipo Vida S.R.L.
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

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs sm:text-sm">
          {/* Top Info Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-cyan-50/60 border border-cyan-200/80">
            <div>
              <span className="text-[11px] font-bold text-cyan-950/70 uppercase tracking-wider block">
                Monto Exacto a Pagar
              </span>
              <div className="font-display font-black text-2xl text-cyan-900 mt-0.5">
                Bs {total.toFixed(2)}
              </div>
            </div>

            <div>
              <span className="text-[11px] font-bold text-cyan-950/70 uppercase tracking-wider block">
                Código del Pedido
              </span>
              <div className="flex items-center gap-2 mt-1">
                <code className="font-mono font-bold text-sm bg-white px-2.5 py-1 rounded-lg border border-cyan-200 text-slate-800">
                  {formattedOrderCode}
                </code>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="p-1.5 rounded-lg bg-white hover:bg-cyan-100 border border-cyan-200 text-cyan-800 transition-colors cursor-pointer text-xs flex items-center gap-1 font-semibold"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? "Copiado" : "Copiar"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Verification Status Alert Banner */}
          {paymentStatus === "VERIFICADO" && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-sm text-emerald-950">
                  ¡Pago Verificado Exitosamente!
                </div>
                <p className="text-xs text-emerald-800 mt-0.5">
                  El ingreso bancario ha sido confirmado por la administración. Tu pedido se encuentra en preparación para despacho.
                </p>
              </div>
            </div>
          )}

          {paymentStatus === "PENDIENTE_VERIFICACION" && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <div className="font-bold text-sm text-amber-950">
                  Comprobante en Proceso de Verificación
                </div>
                <p className="text-xs text-amber-800 mt-0.5">
                  Tu comprobante fue enviado correctamente. Nuestro equipo verificará el ingreso en la cuenta bancaria y actualizará el estado de tu pedido.
                </p>
              </div>
            </div>
          )}

          {paymentStatus === "RECHAZADO" && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-sm text-rose-950">
                  Comprobante Rechazado
                </div>
                <p className="text-xs text-rose-800 mt-0.5">
                  <strong>Motivo:</strong> {rejectionReason || "El comprobante no pudo verificarse o la imagen es ilegible."}
                </p>
                <p className="text-[11px] text-rose-700 mt-1">
                  Por favor revisa el monto o transferencia y sube un nuevo comprobante legible a continuación.
                </p>
              </div>
            </div>
          )}

          {/* QR Display & Instructions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
            {/* Left: Original Bank QR Display */}
            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
              <div className="relative group rounded-xl overflow-hidden bg-white p-2 border border-slate-200 shadow-sm max-w-[240px]">
                {loadingConfig ? (
                  <div className="w-52 h-64 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                  </div>
                ) : (
                  <>
                    <img
                      src={config?.qrImageUrl || "/assets/aistudio/QR1_c0569f21.jpeg"}
                      alt="Código QR Oficial Banco Unión Yasta"
                      className="w-full h-auto object-contain rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setZoomedImage(config?.qrImageUrl || "/assets/aistudio/QR1_c0569f21.jpeg")}
                      className="absolute inset-0 bg-slate-900/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 font-bold text-xs backdrop-blur-xs cursor-pointer"
                    >
                      <ZoomIn className="w-4 h-4" />
                      <span>Ampliar QR</span>
                    </button>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={() => setZoomedImage(config?.qrImageUrl || "/assets/aistudio/QR1_c0569f21.jpeg")}
                className="inline-flex items-center gap-1.5 text-xs text-cyan-800 hover:text-cyan-900 font-semibold cursor-pointer underline"
              >
                <ZoomIn className="w-3.5 h-3.5" />
                <span>Tocar para ver QR en pantalla completa</span>
              </button>
            </div>

            {/* Right: Bank Account Details & Instructions */}
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                  Datos de la Cuenta Oficial
                </div>
                <div className="space-y-1 text-xs">
                  <div>
                    <span className="text-slate-500">Banco:</span>{" "}
                    <strong className="text-slate-900">{config?.banco || "Banco Unión S.A."}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Titular:</span>{" "}
                    <strong className="text-slate-900">{config?.titular || "BAUTISTA HUANCA DIEGO ELVIS"}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-slate-500">N° de Cuenta:</span>{" "}
                      <strong className="font-mono text-slate-900">{config?.numeroCuenta || "61108714"}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyAccount}
                      className="text-[11px] font-semibold text-cyan-800 hover:underline flex items-center gap-1"
                    >
                      {copiedAccount ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedAccount ? "Copiada" : "Copiar"}</span>
                    </button>
                  </div>
                  <div>
                    <span className="text-slate-500">Tipo:</span>{" "}
                    <span className="text-slate-700">{config?.tipoCuenta || "Caja de Ahorro / QR Yasta"}</span>
                  </div>
                </div>
              </div>

              {/* Instructions steps */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2 text-xs">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <span>Instrucciones de Pago:</span>
                </div>
                <ol className="list-decimal pl-4 space-y-1 text-slate-600">
                  <li>Escanea el código QR desde tu app bancaria Yasta o Banca Móvil.</li>
                  <li>
                    Ingresa el monto exacto: <strong>Bs {total.toFixed(2)}</strong>.
                  </li>
                  <li>
                    En la <strong>glosa / concepto</strong> escribe el código:{" "}
                    <strong className="font-mono">{formattedOrderCode}</strong>.
                  </li>
                  <li>Descarga o toma captura del comprobante y súbelo a continuación.</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Section: Upload Receipt */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <UploadCloud className="w-4 h-4 text-cyan-800" />
                  <span>Carga del Comprobante de Pago</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Formatos permitidos: JPG, JPEG, PNG o PDF (Máximo 5 MB).
                </p>
              </div>

              {paymentStatus === "VERIFICADO" && (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  Verificado
                </span>
              )}
            </div>

            {fileError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{fileError}</span>
              </div>
            )}

            {/* If a file is selected -> Preview card */}
            {selectedFile ? (
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isPdf ? (
                      <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center font-bold">
                        <FileText className="w-6 h-6" />
                      </div>
                    ) : (
                      previewUrl && (
                        <div
                          onClick={() => setZoomedImage(previewUrl)}
                          className="relative group w-14 h-14 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 cursor-pointer shrink-0"
                        >
                          <img
                            src={previewUrl}
                            alt="Vista previa comprobante"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <ZoomIn className="w-4 h-4" />
                          </div>
                        </div>
                      )
                    )}

                    <div className="text-left">
                      <div className="font-semibold text-slate-900 text-xs sm:text-sm truncate max-w-[200px] sm:max-w-xs">
                        {selectedFile.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {(selectedFile.size / 1024).toFixed(1)} KB · {isPdf ? "Documento PDF" : "Imagen"}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleClearSelectedFile}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-xs flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Cambiar archivo</span>
                  </button>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleSubmitVoucher}
                    className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-cyan-700 to-teal-700 hover:from-cyan-600 hover:to-teal-600 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Enviando comprobante oficial...</span>
                      </>
                    ) : (
                      <>
                        <FileCheck className="w-4 h-4" />
                        <span>ENVIAR COMPROBANTE</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* Dropzone input */
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="voucher-file-input"
                />
                <label
                  htmlFor="voucher-file-input"
                  className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 hover:border-cyan-600 rounded-2xl bg-white hover:bg-cyan-50/30 transition-all cursor-pointer group"
                >
                  <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-cyan-700 mb-2 transition-colors" />
                  <span className="font-semibold text-slate-800 text-xs sm:text-sm">
                    Haz clic aquí para seleccionar tu comprobante
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5">
                    Formatos JPG, PNG o PDF (Hasta 5 MB)
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Submission History (if any previous submissions or re-submissions exist) */}
          {historyVouchers.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                Historial de Comprobantes Enviados
              </div>

              <div className="space-y-2">
                {historyVouchers.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <FileCheck className="w-4 h-4 text-slate-400" />
                      <div>
                        <div className="font-medium text-slate-900">{item.nombreArchivo}</div>
                        <div className="text-[10px] text-slate-400">
                          Enviado el {new Date(item.fechaEnvio).toLocaleString("es-BO")}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          item.estado === "VERIFICADO"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                            : item.estado === "RECHAZADO"
                            ? "bg-rose-50 text-rose-800 border border-rose-300"
                            : "bg-amber-50 text-amber-800 border border-amber-300"
                        }`}
                      >
                        {item.estado === "VERIFICADO" && "Verificado"}
                        {item.estado === "RECHAZADO" && "Rechazado"}
                        {item.estado === "PENDIENTE_VERIFICACION" && "Pendiente"}
                      </span>

                      {item.urlArchivo && (
                        <button
                          type="button"
                          onClick={() => {
                            if (item.tipoArchivo?.includes("pdf") || item.nombreArchivo?.endsWith(".pdf")) {
                              window.open(item.urlArchivo, "_blank");
                            } else {
                              setZoomedImage(item.urlArchivo);
                            }
                          }}
                          className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
                          title="Ver archivo"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Tus comprobantes se almacenan de manera privada y protegida en Firebase.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>

        {/* Zoom Lightbox Modal */}
        {zoomedImage && (
          <div
            onClick={() => setZoomedImage(null)}
            className="fixed inset-0 z-60 bg-black/90 flex flex-col items-center justify-center p-4 backdrop-blur-md cursor-zoom-out"
          >
            <div className="relative max-w-2xl max-h-[90vh] flex flex-col items-center">
              <button
                type="button"
                onClick={() => setZoomedImage(null)}
                className="absolute -top-10 right-0 p-2 text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
              <img
                src={zoomedImage}
                alt="Vista ampliada"
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
