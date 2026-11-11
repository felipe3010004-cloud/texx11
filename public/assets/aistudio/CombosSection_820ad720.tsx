import React, { useState } from "react";
import { Combo } from "../types";
import { Combo3DCard } from "./Combo3DCard";
import { Gift, Sparkles, X, ShieldCheck, ShoppingCart, Check, Rotate3d, PackageCheck, Crown, Briefcase, TrendingUp } from "lucide-react";

interface CombosSectionProps {
  combos: Combo[];
  wishlist: string[];
  onToggleWishlist: (comboId: string) => void;
  onAddComboToCart: (comboId: string) => void;
  onOpenImageModal: (imgUrl: string) => void;
  onOpenCombo3DViewer?: (combo: Combo) => void;
}

export const CombosSection: React.FC<CombosSectionProps> = ({
  combos,
  wishlist,
  onToggleWishlist,
  onAddComboToCart,
  onOpenImageModal,
  onOpenCombo3DViewer,
}) => {
  const [selectedCombo, setSelectedCombo] = useState<Combo | null>(null);
  const [activeFilter, setActiveFilter] = useState<"todos" | "empresariales" | "consumo">("todos");

  const filteredCombos = combos.filter((combo) => {
    if (activeFilter === "empresariales") return combo.isBusinessCombo || combo.profitPercentage;
    if (activeFilter === "consumo") return !combo.isBusinessCombo && !combo.profitPercentage;
    return true;
  });

  return (
    <section id="combos-exclusivos" className="relative py-16 px-4 md:px-8 max-w-7xl mx-auto">
      {/* Ambient cyan-blue aquatic glow */}
      <div className="absolute top-1/3 right-10 w-[520px] h-[420px] bg-gradient-to-br from-cyan-400/15 via-sky-400/10 to-transparent rounded-full blur-[140px] pointer-events-none" />

      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#bce2ee] text-[#0891b2] text-xs font-bold uppercase tracking-wider shadow-xs">
          <Gift className="w-3.5 h-3.5 text-cyan-500" />
          <span>Membresía Oficial, Packs de Salud & Combos Empresariales 3D</span>
        </div>
        <h2 className="font-display font-black text-3xl sm:text-4xl text-[#082836] tracking-tight">
          Kit de Afiliación & Combos en 3D
        </h2>
        <p className="text-[#416373] text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
          Adquiere tu <strong>Kit de Bienvenida oficial (250 Bs)</strong> para activar tu membresía vitalicia con 40% de descuento, o elige entre nuestros <strong>Combos Empresariales con hasta el 87% de ganancias</strong> y packs familiares en 3D interactivo.
        </p>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-3">
          <button
            onClick={() => setActiveFilter("todos")}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeFilter === "todos"
                ? "bg-[#0891b2] text-white shadow-md shadow-cyan-900/20"
                : "bg-white text-slate-600 hover:bg-cyan-50 border border-[#c8e4ed]"
            }`}
          >
            Todos ({combos.length})
          </button>
          <button
            onClick={() => setActiveFilter("consumo")}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFilter === "consumo"
                ? "bg-[#0891b2] text-white shadow-md shadow-cyan-900/20"
                : "bg-white text-slate-600 hover:bg-cyan-50 border border-[#c8e4ed]"
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-cyan-500" />
            <span>Membresía & Tratamientos</span>
          </button>
          <button
            onClick={() => setActiveFilter("empresariales")}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFilter === "empresariales"
                ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md shadow-amber-900/20"
                : "bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200"
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 text-amber-600" />
            <span>Combos Empresariales (60%, 73%, 87% Ganancias)</span>
          </button>
        </div>
      </div>

      {/* 3D Combos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredCombos.map((combo) => {
          const isWishlisted = wishlist.includes(combo.id);

          return (
            <div key={combo.id} className="h-full min-h-[510px]">
              <Combo3DCard
                combo={combo}
                isWishlisted={isWishlisted}
                onToggleWishlist={onToggleWishlist}
                onAddComboToCart={onAddComboToCart}
                onOpenDetails={(c) => {
                  if (onOpenCombo3DViewer) {
                    onOpenCombo3DViewer(c);
                  } else {
                    setSelectedCombo(c);
                  }
                }}
                onOpenImageModal={onOpenImageModal}
              />
            </div>
          );
        })}
      </div>

      {/* Ver Combo Detail Modal in Light Blue & Cyan Luxury */}
      {selectedCombo && (
        <div
          onClick={() => setSelectedCombo(null)}
          className="fixed inset-0 z-50 bg-[#082836]/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-xl rounded-3xl bg-white text-[#082836] border border-[#c8e4ed] shadow-2xl p-6 sm:p-8 space-y-5 my-8"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#e2f1f7]">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-[#ecfeff] border border-cyan-200 text-[#0284c7] font-bold text-xs">
                  {selectedCombo.id === "kit-de-bienvenida"
                    ? "Membresía Oficial"
                    : selectedCombo.profitPercentage
                    ? `Paquete Empresarial (${selectedCombo.profitPercentage}% Ganancias)`
                    : "Pack Especial VIP"}
                </span>
                <span className="text-xs text-[#0891b2] font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#0891b2]" />
                  Activa 40% OFF Vitalicio
                </span>
              </div>
              <button
                onClick={() => setSelectedCombo(null)}
                className="w-8 h-8 rounded-full bg-[#f0f7fa] hover:bg-[#e2f3f8] text-[#527585] hover:text-[#082836] flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-5 items-center">
              <img
                src={selectedCombo.img}
                alt={selectedCombo.name}
                className="w-36 h-36 object-contain rounded-2xl bg-[#f0f7fa] p-3 border border-[#c8e4ed]"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "/src/assets/images/kit_de_bienvenida_1792837488226.jpg";
                }}
              />
              <div className="space-y-2 flex-1 text-center sm:text-left">
                <h3 className="font-display font-black text-xl text-[#082836]">
                  {selectedCombo.name}
                </h3>
                <p className="text-xs text-[#416373] leading-relaxed">{selectedCombo.desc}</p>
                
                {selectedCombo.commissionable && (
                  <div className="text-xs text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-200 inline-block">
                    Monto Comisionable: <strong>Bs {selectedCombo.commissionable.toLocaleString()}</strong> ({selectedCombo.profitPercentage}% Margen)
                  </div>
                )}

                <div className="font-display font-black text-2xl text-[#082836]">
                  <small className="text-xs font-bold text-[#527585] mr-1">Inversión:</small>
                  Bs {selectedCombo.comboPrice.toFixed(0)}
                </div>
              </div>
            </div>

            {selectedCombo.includedProducts && selectedCombo.includedProducts.length > 0 && (
              <div className="p-4 rounded-2xl bg-[#f0f7fa] border border-[#c8e4ed] space-y-2 text-left">
                <h4 className="font-bold text-xs text-[#0891b2] uppercase tracking-wider flex items-center gap-1.5">
                  <PackageCheck className="w-4 h-4 text-[#0891b2]" />
                  <span>Contenido oficial del combo:</span>
                </h4>
                <div className="space-y-1.5">
                  {selectedCombo.includedProducts.map((p, i) => (
                    <div key={i} className="text-xs text-[#1e4659] flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#0891b2] shrink-0" />
                      <span>{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedCombo.benefits && selectedCombo.benefits.length > 0 && (
              <div className="space-y-1.5 text-left">
                <h4 className="font-bold text-xs text-[#527585] uppercase tracking-wider">
                  Beneficios Verificables:
                </h4>
                <div className="space-y-1">
                  {selectedCombo.benefits.map((b, i) => (
                    <div key={i} className="text-xs text-[#416373] flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[#0891b2] shrink-0" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-[#e2f1f7] flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedCombo(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#527585] hover:text-[#082836] cursor-pointer"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  onAddComboToCart(selectedCombo.id);
                  setSelectedCombo(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0891b2] to-[#0284c7] hover:from-[#0b3c4f] hover:to-[#0369a1] text-white font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Añadir al Pedido</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
