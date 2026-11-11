import React, { useState } from "react";
import { CartItem, PagosyaQrResponse } from "../models/types";
import { orderController } from "../controllers/orderController";
import { pagosyaController } from "../controllers/pagosyaController";
import { X, MessageCircle, Globe2, ShieldCheck, Loader2, QrCode, Sparkles } from "lucide-react";

interface OrderModalViewProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  vendedorWhatsapp: string;
  referrerId: string | null;
  onOrderSuccess: () => void;
  onOpenPagosyaQr?: (data: PagosyaQrResponse, total: number) => void;
  onOpenStaticQr?: (orderData: {
    orderId: string;
    total: number;
    clientName: string;
    clientPhone: string;
    vendedorId?: string | null;
  }) => void;
}

const COUNTRIES = [
  { code: "591", name: "Bolivia", flag: "🇧🇴", length: 8 },
  { code: "54", name: "Argentina", flag: "🇦🇷", length: 10 },
  { code: "55", name: "Brasil", flag: "🇧🇷", length: 11 },
  { code: "56", name: "Chile", flag: "🇨🇱", length: 9 },
  { code: "57", name: "Colombia", flag: "🇨🇴", length: 10 },
  { code: "593", name: "Ecuador", flag: "🇪🇨", length: 9 },
  { code: "595", name: "Paraguay", flag: "🇵🇾", length: 9 },
  { code: "51", name: "Perú", flag: "🇵🇪", length: 9 },
  { code: "598", name: "Uruguay", flag: "🇺🇾", length: 8 },
  { code: "58", name: "Venezuela", flag: "🇻🇪", length: 11 },
];

const BOLIVIA_DEPARTMENTS = [
  "La Paz",
  "Santa Cruz",
  "Cochabamba",
  "Oruro",
  "Potosí",
  "Chuquisaca",
  "Tarija",
  "Beni",
  "Pando",
];

export const OrderModalView: React.FC<OrderModalViewProps> = ({
  isOpen,
  onClose,
  items,
  vendedorWhatsapp,
  referrerId,
  onOrderSuccess,
  onOpenPagosyaQr,
  onOpenStaticQr,
}) => {
  const [clientName, setClientName] = useState("");
  const [selectedCountryCode, setSelectedCountryCode] = useState("591");
  const [clientPhone, setClientPhone] = useState("");
  const [department, setDepartment] = useState("La Paz");
  const [loading, setLoading] = useState(false);
  const [loadingQr, setLoadingQr] = useState(false);
  const [loadingStaticQr, setLoadingStaticQr] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen) return null;

  const currentCountry = COUNTRIES.find((c) => c.code === selectedCountryCode) || COUNTRIES[0];
  const isBolivia = selectedCountryCode === "591";
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, "");
    if (rawVal.length <= currentCountry.length) {
      setClientPhone(rawVal);
      setErrorMessage("");
    }
  };

  const handlePayWithPagosyaQr = async () => {
    if (!clientName.trim()) {
      setErrorMessage("Por favor ingresa tu nombre y apellido para generar el QR oficial");
      return;
    }
    if (clientPhone.length < currentCountry.length) {
      setErrorMessage(
        `El número de teléfono para ${currentCountry.name} debe contener exactamente ${currentCountry.length} dígitos`
      );
      return;
    }
    if (total <= 0) {
      setErrorMessage("El monto total del pedido debe ser mayor a Bs 0");
      return;
    }

    setLoadingQr(true);
    setErrorMessage("");

    try {
      const orderId = pagosyaController.generateOrderId();
      const res = await pagosyaController.createCheckout(
        {
          amount: total,
          currency: "BOB",
          order_id: orderId,
          customer: {
            name: clientName.trim(),
            phone: `+${selectedCountryCode} ${clientPhone}`,
          },
          metadata: {
            source: "team-life-web",
            department: isBolivia ? department : currentCountry.name,
            items_count: items.reduce((acc, curr) => acc + curr.quantity, 0),
          },
          expiration_minutes: 30,
        },
        items
      );

      if (res.success && res.data) {
        if (onOpenPagosyaQr) {
          onOpenPagosyaQr(res.data, total);
        }
        onClose();
      } else {
        setErrorMessage(res.error || "No se pudo generar el código QR con PagosYa Sandbox.");
      }
    } catch (err: any) {
      setErrorMessage("Error al conectar con PagosYa: " + (err?.message || String(err)));
    } finally {
      setLoadingQr(false);
    }
  };

  const handlePayWithStaticQr = async () => {
    if (!clientName.trim()) {
      setErrorMessage("Por favor ingresa tu nombre y apellido para pagar con QR Estático");
      return;
    }
    if (clientPhone.length < currentCountry.length) {
      setErrorMessage(
        `El número de teléfono para ${currentCountry.name} debe contener exactamente ${currentCountry.length} dígitos`
      );
      return;
    }
    if (total <= 0) {
      setErrorMessage("El monto total del pedido debe ser mayor a Bs 0");
      return;
    }

    setLoadingStaticQr(true);
    setErrorMessage("");

    try {
      const fullPhone = `+${selectedCountryCode} ${clientPhone}`;
      const res = await orderController.submitOrder({
        clientName,
        clientPhone,
        countryCode: selectedCountryCode,
        countryName: currentCountry.name,
        department: isBolivia ? department : null,
        items,
        total,
        vendedorWhatsapp,
        referrerId,
      });

      const finalOrderId = res.orderId || `ORD-${Date.now().toString().slice(-6)}`;

      if (onOpenStaticQr) {
        onOpenStaticQr({
          orderId: finalOrderId,
          total,
          clientName: clientName.trim(),
          clientPhone: fullPhone,
          vendedorId: referrerId,
        });
      }
      onOrderSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage("Error al registrar pedido: " + (err?.message || String(err)));
    } finally {
      setLoadingStaticQr(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) {
      setErrorMessage("Por favor ingresa tu nombre y apellido");
      return;
    }
    if (clientPhone.length < currentCountry.length) {
      setErrorMessage(
        `El número de teléfono para ${currentCountry.name} debe contener exactamente ${currentCountry.length} dígitos`
      );
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const res = await orderController.submitOrder({
        clientName,
        clientPhone,
        countryCode: selectedCountryCode,
        countryName: currentCountry.name,
        department: isBolivia ? department : null,
        items,
        total,
        vendedorWhatsapp,
        referrerId,
      });

      window.open(res.waUrl, "_blank");
      onOrderSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage("Aviso: " + (err.message || "Error al procesar pedido"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#082836]/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-white border border-[#c8e4ed] shadow-2xl text-[#082836] space-y-5 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#c8e4ed]">
          <div className="text-left">
            <h3 className="font-display font-black text-xl text-[#082836] flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-cyan-700" />
              <span>Finalizar Pedido Oficial</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Completa tus datos para coordinar el envío directo con un distribuidor autorizado.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-cyan-50 hover:bg-cyan-100 text-slate-500 hover:text-[#082836] flex items-center justify-center cursor-pointer transition-colors border border-[#c8e4ed]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold text-left">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm text-left">
          {/* Nombre completo */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Nombre y Apellido
            </label>
            <input
              type="text"
              required
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Ej. Juan Carlos Pérez"
              className="w-full px-4 py-2.5 bg-cyan-50/40 border border-[#c8e4ed] rounded-xl text-slate-900 focus:outline-none focus:border-cyan-600 focus:bg-white text-sm"
            />
          </div>

          {/* País de Destino */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>País de Destino</span>
              <span className="text-[11px] text-cyan-800 font-semibold">
                {currentCountry.flag} +{currentCountry.code} ({currentCountry.length} dígitos)
              </span>
            </label>
            <select
              value={selectedCountryCode}
              onChange={(e) => {
                setSelectedCountryCode(e.target.value);
                setClientPhone("");
              }}
              className="w-full px-4 py-2.5 bg-cyan-50/40 border border-[#c8e4ed] rounded-xl text-slate-900 focus:outline-none focus:border-cyan-600 focus:bg-white text-sm cursor-pointer"
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.name} (+{c.code})
                </option>
              ))}
            </select>
          </div>

          {/* Celular / WhatsApp */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Número de WhatsApp
            </label>
            <div className="flex gap-2">
              <span className="px-3.5 py-2.5 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-900 font-bold font-mono text-sm flex items-center shrink-0">
                +{selectedCountryCode}
              </span>
              <input
                type="tel"
                required
                value={clientPhone}
                onChange={handlePhoneChange}
                placeholder={`Ej. ${"7".padEnd(currentCountry.length, "1")}`}
                className="flex-1 px-4 py-2.5 bg-cyan-50/40 border border-[#c8e4ed] rounded-xl text-slate-900 focus:outline-none focus:border-cyan-600 focus:bg-white font-mono text-sm"
              />
            </div>
          </div>

          {/* Departamento */}
          {isBolivia ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Departamento en Bolivia
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-4 py-2.5 bg-cyan-50/40 border border-[#c8e4ed] rounded-xl text-slate-900 focus:outline-none focus:border-cyan-600 focus:bg-white text-sm cursor-pointer"
              >
                {BOLIVIA_DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
              <Globe2 className="w-5 h-5 shrink-0 text-amber-700" />
              <span>
                Envío internacional para {currentCountry.name}. Por favor coordina flete y aduana vía WhatsApp.
              </span>
            </div>
          )}

          {/* Total */}
          <div className="pt-3 pb-1 border-t border-[#c8e4ed] flex items-center justify-between text-xs sm:text-sm">
            <span className="text-slate-600 font-medium">Total a pagar:</span>
            <span className="font-display font-black text-2xl text-cyan-800">
              Bs {total.toFixed(0)}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-700" />
            <span>Tus datos están protegidos y solo se usarán para el despacho del pedido.</span>
          </div>

          {/* Submit Options */}
          <div className="pt-2 flex flex-col gap-2.5">
            {/* Opción 1: Pago mediante QR Estático (Banco Unión / Yasta) */}
            <button
              type="button"
              disabled={loading || loadingQr || loadingStaticQr}
              onClick={handlePayWithStaticQr}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#082836] hover:bg-[#0c394c] text-white font-display font-bold text-xs sm:text-sm tracking-wide flex items-center justify-center gap-2 border border-[#082836] shadow-lg transition-all hover:scale-101 active:scale-98 cursor-pointer disabled:opacity-50"
            >
              {loadingStaticQr ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                  <span>Preparando QR Estático Banco Unión...</span>
                </>
              ) : (
                <>
                  <QrCode className="w-4 h-4 text-cyan-400" />
                  <span>PAGO MEDIANTE QR ESTÁTICO</span>
                  <span className="text-[10px] bg-cyan-900/80 text-cyan-200 border border-cyan-700/60 px-2 py-0.5 rounded-full font-sans font-bold">
                    Banco Unión / Yasta
                  </span>
                </>
              )}
            </button>

            {/* Opción 2: Generar QR PagosYa */}
            <button
              type="button"
              disabled={loading || loadingQr || loadingStaticQr}
              onClick={handlePayWithPagosyaQr}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-600 via-teal-600 to-sky-700 hover:from-cyan-500 hover:to-teal-500 text-white font-display font-black text-xs sm:text-sm tracking-wide flex items-center justify-center gap-2 shadow-xl shadow-cyan-950/20 transition-all hover:scale-102 active:scale-98 cursor-pointer disabled:opacity-50"
            >
              {loadingQr ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Conectando con PagosYa Sandbox...</span>
                </>
              ) : (
                <>
                  <QrCode className="w-4 h-4 text-white" />
                  <span>Generar Pago mediante QR (PagosYa)</span>
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-wider font-sans font-bold">
                    Sandbox
                  </span>
                </>
              )}
            </button>

            {/* Opción 2: Enviar por WhatsApp con Distribuidor */}
            <button
              type="submit"
              disabled={loading || loadingQr}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#f0f7fa] hover:bg-[#e2f1f7] text-[#082836] font-display font-bold text-xs sm:text-sm tracking-wide flex items-center justify-center gap-2 border border-[#c8e4ed] shadow-sm transition-all hover:scale-101 active:scale-98 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Registrando pedido oficial...</span>
                </>
              ) : (
                <>
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>Coordinar pedido por WhatsApp</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="py-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors text-center cursor-pointer"
            >
              Cancelar y volver
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
