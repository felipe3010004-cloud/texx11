import React, { useState } from "react";
import { CartItem } from "../types";
import { db, firebase } from "../lib/firebase";
import { X, MessageCircle, Globe2, ShieldCheck, Loader2 } from "lucide-react";
import confetti from "canvas-confetti";

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  vendedorWhatsapp: string;
  referrerId: string | null;
  onOrderSuccess: () => void;
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

export const OrderModal: React.FC<OrderModalProps> = ({
  isOpen,
  onClose,
  items,
  vendedorWhatsapp,
  referrerId,
  onOrderSuccess,
}) => {
  const [clientName, setClientName] = useState("");
  const [selectedCountryCode, setSelectedCountryCode] = useState("591");
  const [clientPhone, setClientPhone] = useState("");
  const [department, setDepartment] = useState("La Paz");
  const [loading, setLoading] = useState(false);
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

    // Construir mensaje de WhatsApp detallado
    const fullPhone = `+${selectedCountryCode} ${clientPhone}`;
    const destination = isBolivia ? `Bolivia (${department})` : `${currentCountry.name} (+${selectedCountryCode})`;
    
    let itemsText = items
      .map(
        (i) =>
          `• ${i.quantity}x ${i.name} ${i.isCombo ? "(Combo Exclusivo)" : ""} - Bs ${(i.price * i.quantity).toFixed(0)}`
      )
      .join("\n");

    const waText = encodeURIComponent(
      `🌿 *¡Nuevo Pedido Oficial - Equipo Vida S.R.L. / Team Life!* 🌿\n\n` +
      `👤 *Cliente:* ${clientName.trim()}\n` +
      `📱 *Contacto:* ${fullPhone}\n` +
      `📍 *Destino:* ${destination}\n` +
      (referrerId ? `🤝 *Vendedor / Ref:* ${referrerId}\n` : "") +
      `\n🛒 *Detalle del Pedido:*\n${itemsText}\n\n` +
      `💰 *Total a pagar:* Bs ${total.toFixed(0)}\n\n` +
      `Por favor indíquenme las cuentas autorizadas para transferencia bancaria o QR y coordinar el despacho oficial. ¡Muchas gracias!`
    );

    try {
      // 1. Guardar en Firestore colección 'pedidos'
      await db.collection("pedidos").add({
        cliente: clientName.trim(),
        telefono: fullPhone,
        pais: currentCountry.name,
        departamento: isBolivia ? department : null,
        items: items.map((i) => ({
          id: i.id,
          nombre: i.name,
          precio: i.price,
          cantidad: i.quantity,
          isCombo: i.isCombo,
        })),
        total,
        vendedorId: referrerId || null,
        estado: "pendiente",
        fecha: firebase.firestore.FieldValue.serverTimestamp(),
      });

      // 2. Confeti de celebración
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
      });

      // 3. Abrir WhatsApp
      window.open(`https://wa.me/${vendedorWhatsapp}?text=${waText}`, "_blank");

      // 4. Limpiar estado y notificar
      onOrderSuccess();
      onClose();
    } catch (error: any) {
      console.warn("Aviso Firestore al registrar pedido:", error);
      window.open(`https://wa.me/${vendedorWhatsapp}?text=${waText}`, "_blank");
      onOrderSuccess();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#082836]/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-white border border-[#c8e4ed] shadow-2xl text-[#082836] space-y-5 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#c8e4ed]">
          <div>
            <h3 className="font-display font-black text-xl text-[#082836] flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-cyan-700" />
              <span>Finalizar Pedido Oficial</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Completa tus datos para coordinar el envío directo con un distribuidor autorizado.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-cyan-50 hover:bg-cyan-100 text-slate-500 hover:text-[#082836] flex items-center justify-center cursor-pointer transition-colors border border-[#c8e4ed]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
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

          {/* Celular / WhatsApp con prefijo visual */}
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

          {/* Departamento (Bolivia) o Aviso Internacional */}
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

          {/* Resumen de Compra */}
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

          {/* Submit button */}
          <div className="pt-2 flex flex-col gap-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#082836] via-[#0891b2] to-[#0284c7] hover:from-[#0b3c4f] hover:to-[#0369a1] text-white font-display font-black text-sm tracking-wide flex items-center justify-center gap-2 shadow-xl shadow-cyan-950/20 transition-all hover:scale-102 active:scale-98 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Registrando pedido oficial...</span>
                </>
              ) : (
                <>
                  <MessageCircle className="w-4 h-4 fill-white text-cyan-800" />
                  <span>Enviar pedido por WhatsApp</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="py-2 text-xs text-slate-500 hover:text-slate-800 transition-colors text-center cursor-pointer"
            >
              Cancelar y volver
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
