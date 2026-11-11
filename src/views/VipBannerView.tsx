import React, { useState } from "react";
import { Crown, MessageCircle, Sparkles, CheckCircle2, ArrowRight, ShoppingCart, Check } from "lucide-react";

interface VipBannerViewProps {
  vendedorWhatsapp: string;
  onAddKitToCart: () => void;
}

export const VipBannerView: React.FC<VipBannerViewProps> = ({ vendedorWhatsapp, onAddKitToCart }) => {
  const [justAdded, setJustAdded] = useState(false);

  const handleAddKit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAddKitToCart();
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  const handleWhatsAppInquiry = () => {
    const text = encodeURIComponent(
      "¡Hola Team Life! Deseo adquirir mi Membresía Oficial mediante el Kit de Bienvenida (250 Bs) para afiliarme a Equipo Vida S.R.L. y activar mi descuento permanente del 40% en toda la línea de productos. ¿Me podrían indicar los pasos para completar mi afiliación?"
    );
    window.open(`https://wa.me/${vendedorWhatsapp}?text=${text}`, "_blank");
  };

  return (
    <section id="membresia-vip" className="py-12 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="relative rounded-3xl p-6 sm:p-10 md:p-14 overflow-hidden bg-gradient-to-r from-[#0c4a6e] via-[#0891b2] to-[#0d9488] text-white border-2 border-cyan-300/70 shadow-[0_20px_50px_-15px_rgba(8,145,178,0.35),0_0_40px_rgba(6,182,212,0.25)] transition-all hover:border-cyan-200">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-300/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-sky-600/30 rounded-full blur-3xl pointer-events-none" />

        {/* Top ribbon badge */}
        <div className="absolute top-0 right-6 sm:right-10 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-300 text-[#082836] font-display font-black text-xs uppercase tracking-widest px-5 py-1.5 rounded-b-xl shadow-lg shadow-cyan-950/30 flex items-center gap-1.5">
          <Crown className="w-3.5 h-3.5 fill-[#082836]" />
          <span>Membresía Oficial</span>
        </div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Content */}
          <div className="lg:col-span-8 space-y-4 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/25 text-cyan-100 text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Afiliación Oficial Equipo Vida S.R.L. · Bolivia</span>
            </div>

            <h2 className="font-display font-black text-2xl sm:text-4xl text-white tracking-tight leading-snug">
              Activa tu{" "}
              <span className="px-3 py-1 rounded-2xl bg-gradient-to-r from-amber-300 to-amber-400 text-[#082836] font-black inline-block shadow-lg shadow-cyan-950/30">
                40% de descuento
              </span>{" "}
              adquiriendo la Membresía Oficial con tu{" "}
              <span className="text-cyan-100 font-extrabold underline decoration-cyan-300/80">
                Kit de Bienvenida (250 Bs)
              </span>
            </h2>

            <p className="text-sm sm:text-base text-cyan-50 leading-relaxed font-normal">
              <strong>Aclaración importante:</strong> El 40% de descuento no se activa por compras acumuladas ordinarias, sino <strong>adquiriendo la membresía oficial</strong> a través del <strong>Kit de Bienvenida</strong> por solo <strong>250 Bs</strong> (o al adquirir cualquiera de nuestros 3 combos especiales). Al integrarte, obtienes tu código de socio, acceso inmediato a precio mayorista de laboratorio de por vida, material físico y asesoría médica continua.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs sm:text-sm text-cyan-50">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-200 shrink-0" />
                <span>Kit físico + Código de Socio</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-200 shrink-0" />
                <span>40% OFF permanente en toda la línea</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-200 shrink-0" />
                <span>Capacitaciones y envíos a los 9 dptos.</span>
              </div>
            </div>
          </div>

          {/* Action & Mini Kit Card */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center gap-4 bg-black/25 p-5 rounded-2xl border border-white/20 backdrop-blur-md">
            <div className="relative w-44 h-36 rounded-xl overflow-hidden border-2 border-cyan-300/80 shadow-xl group bg-white">
              <img
                src="/assets/aistudio/kit-basico_6d3d0c57.jpeg"
                alt="Kit de Bienvenida - Membresía Oficial"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <span className="absolute bottom-1 right-1 bg-gradient-to-r from-amber-400 to-amber-500 text-[#082836] font-black text-[10px] px-2 py-0.5 rounded shadow">
                250 Bs
              </span>
            </div>

            <div className="text-center">
              <div className="font-display font-black text-sm text-white">Kit de Bienvenida</div>
              <div className="text-[11px] text-cyan-100">Incluye membresía vitalicia con 40% OFF</div>
            </div>

            <button
              type="button"
              onClick={handleAddKit}
              className={`w-full px-6 py-3.5 sm:py-4 rounded-2xl font-display font-black text-xs sm:text-sm tracking-wide flex items-center justify-center gap-2.5 shadow-2xl shadow-cyan-950/40 hover:scale-105 active:scale-95 transition-all cursor-pointer border touch-manipulation min-h-[48px] ${
                justAdded
                  ? "bg-emerald-500 text-white border-emerald-400"
                  : "bg-gradient-to-r from-amber-300 via-amber-400 to-amber-300 hover:from-amber-200 hover:to-amber-300 text-[#082836] border-amber-300"
              }`}
            >
              {justAdded ? (
                <>
                  <Check className="w-4 h-4 text-white animate-bounce" />
                  <span>¡Kit Agregado al Carrito!</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4 text-[#082836]" />
                  <span>Añadir Kit al Carrito (250 Bs)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleWhatsAppInquiry}
              className="text-center text-xs text-cyan-200 hover:text-white flex items-center gap-1 cursor-pointer underline"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>O consultar por WhatsApp antes de afiliarse</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
