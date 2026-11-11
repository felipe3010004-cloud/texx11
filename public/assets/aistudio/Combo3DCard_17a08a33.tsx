import React, { useState, useRef, useCallback } from "react";
import { Combo } from "../types";
import { Crown, Sparkles, Heart, ZoomIn, Check, Eye, ShoppingCart, Rotate3d, PackageCheck, TrendingUp, DollarSign } from "lucide-react";

interface Combo3DCardProps {
  combo: Combo;
  isWishlisted: boolean;
  onToggleWishlist: (id: string) => void;
  onAddComboToCart: (id: string) => void;
  onOpenDetails: (combo: Combo) => void;
  onOpenImageModal: (url: string) => void;
}

export const Combo3DCard: React.FC<Combo3DCardProps> = ({
  combo,
  isWishlisted,
  onToggleWishlist,
  onAddComboToCart,
  onOpenDetails,
  onOpenImageModal,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50, opacity: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const isKit = combo.id === "kit-de-bienvenida";
  const isBusiness = Boolean(combo.isBusinessCombo || combo.profitPercentage);

  // Mouse move 3D tilt calculation
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = -((y - centerY) / centerY) * 11;
    const rotY = ((x - centerX) / centerX) * 13;

    setRotateX(rotX);
    setRotateY(rotY);

    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;
    setGlarePosition({ x: glareX, y: glareY, opacity: isKit || isBusiness ? 0.45 : 0.3 });
  }, [isKit, isBusiness]);

  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => {
    setIsHovering(false);
    setRotateX(0);
    setRotateY(0);
    setGlarePosition((prev) => ({ ...prev, opacity: 0 }));
  };

  const shadowX = -rotateY * 1.8;
  const shadowY = rotateX * 1.8 + 18;
  const shadowBlur = isHovering ? 50 : 25;

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: "1200px",
        transformStyle: "preserve-3d",
      }}
      className="relative w-full h-full select-none"
    >
      <div
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${isHovering ? 1.02 : 1}, ${
            isHovering ? 1.02 : 1
          }, 1)`,
          boxShadow: `${shadowX}px ${shadowY}px ${shadowBlur}px rgba(8, 145, 178, ${
            isKit ? "0.22" : isBusiness ? "0.20" : "0.12"
          }), 0 0 35px ${isKit ? "rgba(6, 182, 212, 0.28)" : isBusiness ? "rgba(245, 158, 11, 0.22)" : "rgba(2, 132, 199, 0.10)"}`,
          transition: isHovering
            ? "transform 0.1s ease-out, box-shadow 0.15s ease-out"
            : "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.5s ease-out",
        }}
        className={`relative w-full h-full rounded-3xl p-6 flex flex-col justify-between overflow-hidden border transition-colors ${
          isKit
            ? "bg-gradient-to-b from-[#f0fdfa] via-[#ffffff] to-[#ecfeff] border-2 border-cyan-400 ring-2 ring-cyan-400/25"
            : isBusiness
            ? "bg-gradient-to-b from-[#fffbeb] via-[#ffffff] to-[#f0f7fa] border-2 border-amber-300 ring-1 ring-amber-300/30"
            : "bg-white border-[#c8e4ed] hover:border-cyan-400/50"
        }`}
      >
        {/* Dynamic Glare Overlay */}
        <div
          style={{
            background: isKit
              ? `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, rgba(207, 250, 254, 0.7) 0%, rgba(255, 255, 255, 0) 60%)`
              : isBusiness
              ? `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, rgba(254, 243, 199, 0.65) 0%, rgba(255, 255, 255, 0) 60%)`
              : `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, rgba(224, 247, 250, 0.6) 0%, rgba(255, 255, 255, 0) 60%)`,
            opacity: glarePosition.opacity,
            transition: "opacity 0.25s ease",
          }}
          className="absolute inset-0 pointer-events-none z-30 rounded-3xl"
        />

        {/* Ambient Top Glow */}
        <div
          className={`absolute top-0 left-0 right-0 h-36 bg-gradient-to-b pointer-events-none rounded-t-3xl ${
            isKit ? "from-cyan-400/15 to-transparent" : isBusiness ? "from-amber-400/15 to-transparent" : "from-sky-400/10 to-transparent"
          }`}
        />

        {/* Header row (translateZ 30px) */}
        <div style={{ transform: "translateZ(30px)" }} className="relative z-10 flex items-start justify-between gap-3 mb-3">
          {isKit ? (
            <span className="text-[11px] font-black uppercase tracking-wider text-[#0284c7] bg-[#ecfeff] border border-cyan-300 px-3.5 py-1 rounded-xl shadow-xs flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 fill-[#0284c7]" />
              <span>Membresía Oficial · 250 Bs</span>
            </span>
          ) : isBusiness ? (
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-900 bg-amber-100/90 border border-amber-300 px-3 py-1 rounded-xl flex items-center gap-1.5 shadow-xs">
              <TrendingUp className="w-3.5 h-3.5 text-amber-700" />
              <span>{combo.profitPercentage}% Ganancias</span>
            </span>
          ) : (
            <span className="text-[11px] font-black uppercase tracking-wider text-[#0891b2] bg-[#f0f7fa] px-3 py-1 rounded-xl border border-cyan-200 flex items-center gap-1.5 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
              <span>Combo Especial VIP</span>
            </span>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleWishlist(combo.id);
            }}
            className={`w-9 h-9 rounded-full border flex items-center justify-center transition-transform hover:scale-110 active:scale-90 cursor-pointer shadow-xs ${
              isWishlisted
                ? "bg-rose-50 border-rose-300 text-rose-500"
                : "bg-[#f0f7fa] border-[#c8e4ed] text-[#527585] hover:text-[#082836]"
            }`}
            aria-label="Guardar en favoritos"
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? "fill-rose-500 text-rose-500" : ""}`} />
          </button>
        </div>

        {/* 3D Visual Stage with Multi-layered Depth and Floating Shadows */}
        <div
          style={{ transform: "translateZ(50px)" }}
          className="relative z-10 h-48 my-2 rounded-2xl bg-[#f0f7fa] border border-[#c8e4ed] overflow-hidden flex items-center justify-center group/img cursor-pointer p-3"
          onClick={() => onOpenImageModal(combo.img)}
          title="Toca para ampliar imagen en 3D"
        >
          {/* Dynamic 3D Pedestal Shadow in Cyan/Teal/Gold */}
          <div
            style={{
              transform: `translate3d(${-rotateY * 0.8}px, ${rotateX * 0.4 + 4}px, -15px) scale(${
                isHovering ? 1.07 : 0.95
              })`,
              transition: "transform 0.15s ease-out",
            }}
            className={`absolute bottom-2 w-44 h-7 rounded-full blur-md pointer-events-none ${
              isBusiness
                ? "bg-gradient-to-r from-amber-600/20 via-yellow-500/30 to-amber-600/20"
                : "bg-gradient-to-r from-cyan-600/15 via-teal-500/25 to-sky-600/15"
            }`}
          />

          <img
            src={combo.img}
            alt={combo.name}
            className={`max-h-full max-w-full object-contain drop-shadow-[0_12px_24px_rgba(8,145,178,0.20)] transition-all duration-300 ${
              isHovering ? "scale-106 -translate-y-1.5" : "scale-100"
            }`}
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "/src/assets/images/kit_de_bienvenida_1792837488226.jpg";
            }}
          />

          {/* 3D Indicators */}
          <div className="absolute top-2 right-2 opacity-0 group-hover/img:opacity-100 transition-opacity bg-black/60 backdrop-blur-md p-1.5 rounded-full text-white shadow-md">
            <ZoomIn className="w-3.5 h-3.5" />
          </div>

          <div className="absolute bottom-2 left-2 opacity-0 group-hover/img:opacity-100 transition-opacity bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] text-[#0891b2] font-bold border border-[#bce2ee] shadow-xs flex items-center gap-1">
            <Rotate3d className="w-3 h-3 text-cyan-600" />
            <span>Combo 3D</span>
          </div>
        </div>

        {/* Content details with translateZ 35px */}
        <div style={{ transform: "translateZ(35px)" }} className="relative z-10 space-y-3 mt-2 flex-1 flex flex-col justify-between text-left">
          <div>
            <h3 className="font-display font-black text-xl text-[#082836] leading-tight">
              {combo.name}
            </h3>

            <p className="text-xs text-[#416373] mt-1.5 leading-relaxed line-clamp-2">
              {combo.desc}
            </p>

            {/* Business combo extra badge */}
            {combo.commissionable && (
              <div className="mt-2 flex items-center gap-2 text-xs text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-200">
                <DollarSign className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Comisionable: <strong>Bs {combo.commissionable.toLocaleString()}</strong> ({combo.profitPercentage}% Margen)</span>
              </div>
            )}

            {/* Included products breakdown */}
            {combo.includedProducts && combo.includedProducts.length > 0 && (
              <div className="mt-3 pt-2.5 border-t border-[#e2f1f7] space-y-1">
                <div className="text-[11px] font-bold text-[#0891b2] uppercase tracking-wider flex items-center gap-1">
                  <PackageCheck className="w-3.5 h-3.5 text-[#0891b2]" />
                  <span>Contenido del pack:</span>
                </div>
                <div className="space-y-1">
                  {combo.includedProducts.slice(0, 3).map((pName, i) => (
                    <div key={i} className="text-xs text-[#1e4659] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0891b2] shrink-0" />
                      <span className="line-clamp-1">{pName}</span>
                    </div>
                  ))}
                  {combo.includedProducts.length > 3 && (
                    <div className="text-[10px] text-cyan-700 italic pl-3">
                      + {combo.includedProducts.length - 3} productos adicionales
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Key benefits */}
            {combo.benefits && combo.benefits.length > 0 && (
              <div className="mt-2.5 space-y-1">
                {combo.benefits.slice(0, 2).map((b, i) => (
                  <div key={i} className="text-[11px] text-[#0891b2] font-medium flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-[#0891b2]" />
                    <span className="line-clamp-1">{b}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pricing & 3D Actions */}
          <div className="pt-3 border-t border-[#e2f1f7] flex flex-col gap-2.5 mt-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-[#527585] font-semibold">
                {isKit ? "Inversión Membresía" : isBusiness ? "Inversión Empresarial" : "Precio Total Pack"}
              </span>
              <span className="font-display font-black text-2xl text-[#082836]">
                <small className="text-xs font-bold text-[#527585] mr-1 font-sans">Bs</small>
                {combo.comboPrice.toFixed(0)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDetails(combo);
                }}
                className="flex-1 py-2.5 px-3 rounded-2xl bg-[#f0f7fa] hover:bg-[#e2f3f8] text-[#1e4659] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-[#c8e4ed] shadow-xs"
              >
                <Eye className="w-3.5 h-3.5 text-[#0891b2]" />
                <span>Ver detalles</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddComboToCart(combo.id);
                }}
                className={`flex-1 py-2.5 px-3 rounded-2xl font-display font-black text-xs tracking-wide flex items-center justify-center gap-1.5 shadow-md transition-all hover:scale-102 active:scale-98 cursor-pointer whitespace-nowrap ${
                  isKit
                    ? "bg-gradient-to-r from-cyan-600 to-sky-700 hover:from-cyan-500 hover:to-sky-600 text-white shadow-cyan-950/20 border border-cyan-400/40"
                    : isBusiness
                    ? "bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white shadow-amber-950/20"
                    : "bg-gradient-to-r from-teal-600 to-cyan-700 hover:from-teal-500 text-white shadow-teal-950/20"
                }`}
              >
                <ShoppingCart className="w-3.5 h-3.5 fill-white" />
                <span>{isKit ? "Adquirir Kit" : isBusiness ? "Elegir Combo" : "Añadir"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
