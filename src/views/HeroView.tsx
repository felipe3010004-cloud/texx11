import React from "react";
import { Sparkles, ArrowRight, Gift, Bot, ShieldCheck, HeartPulse, Award, CheckCircle, Volume2 } from "lucide-react";

interface HeroViewProps {
  onExploreProducts: () => void;
  onExploreCombos: () => void;
  onOpenAi: () => void;
}

export const HeroView: React.FC<HeroViewProps> = ({
  onExploreProducts,
  onExploreCombos,
  onOpenAi,
}) => {
  return (
    <section id="inicio" className="relative overflow-hidden pt-10 pb-16 md:pt-16 md:pb-24 px-4 md:px-8">
      {/* Background with fresh cyan-blue atmosphere */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#f0f7fa] via-[#f0f7fa]/95 to-[#f0f7fa]/65" />
        <div className="absolute top-8 right-1/4 w-[460px] h-[460px] bg-[#06b6d4]/15 rounded-full blur-[140px]" />
        <div className="absolute bottom-6 left-1/4 w-[420px] h-[420px] bg-[#0284c7]/10 rounded-full blur-[130px]" />
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column */}
          <div className="lg:col-span-7 text-left space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/95 border border-[#bce2ee] text-[#0891b2] text-xs font-bold tracking-wide shadow-xs backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
              <span>Equipo Vida S.R.L. · Nutrición Celular & Liderazgo en Bolivia</span>
            </div>

            <h1 className="font-display font-black text-3xl sm:text-5xl lg:text-6xl text-[#082836] tracking-tight leading-[1.12]">
              Tu bienestar, tu crecimiento,{" "}
              <span className="bg-gradient-to-r from-[#0284c7] via-[#0891b2] to-[#0d9488] bg-clip-text text-transparent underline decoration-[#06b6d4]/50 decoration-4">
                tu mejor versión
              </span>
            </h1>

            <p className="text-[#325261] text-base sm:text-lg max-w-2xl font-normal leading-relaxed">
              Descubre las <strong>5 formulaciones bioactivas</strong> de alta biodisponibilidad y los <strong>3 combos empresariales</strong> de Equipo Vida S.R.L. Con café órganico enriquecido con <strong>Cordyceps Sinensis y Ganoderma</strong>, colágeno hidrolizado y detox intestinal para transformar tu salud en los 9 departamentos de Bolivia.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="px-3 py-1 rounded-xl bg-white border border-[#c8e4ed] text-[#082836] font-bold shadow-xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#0891b2]" />
                5 Productos Bioactivos
              </span>
              <span className="px-3 py-1 rounded-xl bg-white border border-[#c8e4ed] text-[#082836] font-bold shadow-xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#0d9488]" />
                Combos Empresariales (Hasta 87%)
              </span>
              <span className="px-3 py-1 rounded-xl bg-[#ecfeff] border border-cyan-200 text-[#0284c7] font-black shadow-xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                Kit de Bienvenida: 250 Bs (40% OFF)
              </span>
            </div>

            {/* Interactive CTAs */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <button
                onClick={onExploreProducts}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-600 via-teal-600 to-sky-700 hover:from-cyan-500 hover:to-teal-500 text-white font-display font-bold text-sm sm:text-base tracking-wide flex items-center gap-2.5 shadow-xl shadow-cyan-950/20 transition-all hover:scale-105 active:scale-95 cursor-pointer border border-cyan-400/40"
              >
                <span>Explorar catálogo </span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onExploreCombos}
                className="px-6 py-3.5 rounded-2xl bg-white hover:bg-[#eaf4f8] text-[#0284c7] font-display font-bold text-sm sm:text-base tracking-wide flex items-center gap-2.5 transition-all hover:scale-105 active:scale-95 cursor-pointer border border-[#bce2ee] shadow-xs"
              >
                <Gift className="w-4 h-4 text-[#0891b2]" />
                <span>Descubrir los combos</span>
              </button>

              <button
                onClick={onOpenAi}
                className="px-4 py-3.5 rounded-2xl bg-white/95 hover:bg-white text-[#0891b2] text-sm font-bold flex items-center gap-2 transition-all border border-[#bce2ee] hover:border-[#0891b2] cursor-pointer shadow-xs group"
                title="Iniciar la Asesoría de Compra"
              >
                <div className="relative">
                  <Bot className="w-4 h-4 text-[#0891b2] animate-pulse" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#06b6d4] rounded-full" />
                </div>
                <span>Guía de Compra IA</span>
                <Volume2 className="w-3.5 h-3.5 text-cyan-600" />
              </button>
            </div>

            {/* Trust Markers */}
            <div className="pt-6 border-t border-[#c8e4ed]/80 grid grid-cols-3 gap-3 text-[#082836]">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-4 h-4 sm:w-5 sm:h-5 text-[#0891b2] shrink-0" />
                <div>
                  <div className="font-display font-bold text-[#082836] text-xs sm:text-sm">100% Bioactivo</div>
                  <div className="text-[10px] sm:text-xs text-[#527585]">Máxima absorción</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-[#0d9488] shrink-0" />
                <div>
                  <div className="font-display font-bold text-[#082836] text-xs sm:text-sm">9 Departamentos</div>
                  <div className="text-[10px] sm:text-xs text-[#527585]">Envíos asegurados</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 sm:w-5 sm:h-5 text-[#0284c7] shrink-0" />
                <div>
                  <div className="font-display font-bold text-[#082836] text-xs sm:text-sm">40% OFF Vitalicio</div>
                  <div className="text-[10px] sm:text-xs text-[#527585]">Con Membresía Oficial</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column Visual */}
          <div className="lg:col-span-5 relative perspective-1000">
            <div className="relative mx-auto max-w-md lg:max-w-none group">
              <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-cyan-400/25 via-sky-500/20 to-teal-400/25 blur-xl opacity-75 group-hover:opacity-100 transition-opacity" />

              <div className="relative rounded-3xl overflow-hidden border-2 border-[#bce2ee] bg-[#082836] shadow-2xl shadow-cyan-950/15 aspect-[4/3] sm:aspect-[16/10] lg:aspect-[4/3] transform transition-transform duration-500 group-hover:-translate-y-2 flex items-center justify-center">
                <img
                  src="/assets/aistudio/ceo_22d00367.jpeg"
                  alt="Julian Rodriguez y Mery Ruiz - Fundadores Team Life Company S.R.L."
                  className="w-full h-full object-cover object-top transform hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#082836] via-transparent to-transparent opacity-85" />

                <div className="absolute bottom-4 left-4 right-4 p-3.5 rounded-2xl bg-white/95 backdrop-blur-md border border-[#c8e4ed] flex items-center justify-between shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#082836] p-1 border border-cyan-200 flex items-center justify-center shrink-0">
                      <img
                        src="/assets/aistudio/logo_f976621f.png"
                        alt="Team Life Logo"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="text-left">
                      <div className="font-display font-bold text-[#082836] text-sm">Equipo Vida S.R.L.</div>
                      <div className="text-xs text-[#527585]">Julian Rodriguez & Mery Ruiz</div>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-xs text-[#0891b2] bg-[#e0f7fa] px-2.5 py-1 rounded-full border border-cyan-300 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-[#0891b2]" /> Oficial
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
