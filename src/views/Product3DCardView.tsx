import React, { useState, useRef, useCallback } from "react";
import { Product } from "../models/types";
import { ShoppingCart, Heart, Eye, ZoomIn, CheckCircle2, Rotate3d, Sparkles, Check } from "lucide-react";

interface Product3DCardViewProps {
  product: Product;
  isWishlisted: boolean;
  isActive?: boolean;
  onToggleWishlist: (id: string) => void;
  onAddToCart: (id: string) => void;
  onOpenDetails: (product: Product) => void;
  onOpenImageModal: (url: string) => void;
}

export const Product3DCardView: React.FC<Product3DCardViewProps> = ({
  product,
  isWishlisted,
  isActive = true,
  onToggleWishlist,
  onAddToCart,
  onOpenDetails,
  onOpenImageModal,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50, opacity: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isOverButtons, setIsOverButtons] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || isOverButtons) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = -((y - centerY) / centerY) * 10;
    const rotY = ((x - centerX) / centerX) * 12;

    setRotateX(rotX);
    setRotateY(rotY);

    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;
    setGlarePosition({ x: glareX, y: glareY, opacity: 0.35 });
  }, [isOverButtons]);

  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => {
    setIsHovering(false);
    setIsOverButtons(false);
    setRotateX(0);
    setRotateY(0);
    setGlarePosition((prev) => ({ ...prev, opacity: 0 }));
  };

  const handleAddClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onAddToCart(product.id);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  const handleDetailsClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onOpenDetails(product);
  };

  const shadowX = -rotateY * 1.5;
  const shadowY = rotateX * 1.5 + 12;
  const shadowBlur = isHovering ? 40 : 20;

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative w-full h-full select-none"
    >
      <div
        style={{
          transform: isOverButtons
            ? "scale(1.01)"
            : `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${isHovering ? 1.02 : 1})`,
          boxShadow: `${shadowX}px ${shadowY}px ${shadowBlur}px rgba(8, 145, 178, 0.15), 0 2px 10px rgba(2, 132, 199, 0.08)`,
          transition: isHovering && !isOverButtons
            ? "transform 0.1s ease-out, box-shadow 0.15s ease-out"
            : "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease-out",
        }}
        className={`relative w-full h-full rounded-3xl p-4 sm:p-5 flex flex-col justify-between bg-white border transition-colors ${
          isActive
            ? "border-[#bce2ee] ring-1 ring-cyan-500/25 shadow-lg shadow-cyan-950/05"
            : "border-[#c8e4ed] opacity-90 hover:opacity-100"
        }`}
      >
        {/* Specular Glare Background */}
        <div
          style={{
            background: `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, rgba(224, 247, 250, 0.7) 0%, rgba(255, 255, 255, 0) 65%)`,
            opacity: glarePosition.opacity,
            transition: "opacity 0.3s ease",
          }}
          className="absolute inset-0 pointer-events-none z-0 rounded-3xl overflow-hidden"
        />

        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-[#e6f4f8] to-transparent pointer-events-none rounded-t-3xl overflow-hidden" />

        {/* Top Header Row */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#0891b2] bg-[#e0f7fa] border border-cyan-200 px-2.5 py-0.5 rounded-full shadow-xs">
              {product.category || "Team Life"}
            </span>
            {product.isFeatured && (
              <span className="text-[10px] font-black uppercase text-[#0284c7] bg-[#eaf4f8] border border-sky-200 px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-cyan-500" />
                Oficial
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleWishlist(product.id);
            }}
            className={`w-8 h-8 rounded-full border flex items-center justify-center transition-transform hover:scale-110 active:scale-90 cursor-pointer shadow-xs relative z-20 pointer-events-auto touch-manipulation ${
              isWishlisted
                ? "bg-rose-50 border-rose-300 text-rose-500"
                : "bg-[#f0f7fa] border-[#c8e4ed] text-[#527585] hover:text-[#082836]"
            }`}
            title={isWishlisted ? "Quitar de favoritos" : "Guardar en favoritos"}
            aria-label="Favorito"
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? "fill-rose-500 text-rose-500" : ""}`} />
          </button>
        </div>

        {/* 3D Product Float Stage */}
        <div
          className="relative h-[190px] sm:h-[225px] flex items-center justify-center my-1 group/img cursor-pointer z-10"
          onClick={(e) => {
            e.stopPropagation();
            onOpenImageModal(product.img);
          }}
          title="Toca para ampliar imagen"
        >
          {/* Shadow underneath */}
          <div
            style={{
              transform: `translate3d(${-rotateY * 0.8}px, ${rotateX * 0.4 + 4}px, 0px) scale(${
                isHovering ? 1.08 : 0.95
              })`,
              transition: "transform 0.15s ease-out",
            }}
            className="absolute bottom-2 w-36 h-7 bg-gradient-to-r from-cyan-600/15 via-teal-500/25 to-sky-600/15 rounded-full blur-md pointer-events-none"
          />

          <img
            src={product.img}
            alt={product.name}
            className={`max-h-full max-w-[88%] object-contain drop-shadow-[0_15px_30px_rgba(8,145,178,0.20)] transition-all duration-300 ${
              isHovering && !isOverButtons ? "scale-108 -translate-y-2" : "scale-100"
            }`}
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/assets/aistudio/logo_f976621f.png";
            }}
          />

          <div className="absolute top-2 right-2 opacity-0 group-hover/img:opacity-100 transition-opacity bg-black/60 backdrop-blur-md p-1.5 rounded-full text-white shadow-md">
            <ZoomIn className="w-3.5 h-3.5" />
          </div>

          <div className="absolute bottom-2 left-2 opacity-0 group-hover/img:opacity-100 transition-opacity bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] text-[#0891b2] font-bold border border-[#bce2ee] shadow-xs flex items-center gap-1">
            <Rotate3d className="w-3 h-3 text-cyan-600" />
            <span>3D Tilt</span>
          </div>
        </div>

        {/* Product Details & Actions */}
        <div className="relative z-10 space-y-2 text-left">
          <h3 className="font-display font-black text-base sm:text-lg text-[#082836] leading-snug line-clamp-1">
            {product.name}
          </h3>

          <p className="text-xs text-[#416373] leading-relaxed line-clamp-2">
            {product.desc}
          </p>

          <div className="flex items-baseline justify-between pt-2 border-t border-[#e2f1f7]">
            <div>
              <div className="font-display font-black text-xl sm:text-2xl text-[#082836]">
                <span className="text-xs font-bold text-[#527585] mr-1 font-sans">Bs</span>
                {product.normalPrice.toFixed(0)}
              </div>
              <div className="text-[11px] font-bold text-[#0891b2] flex items-center gap-1">
                <span>
                  Socio 40% OFF: Bs{" "}
                  {product.memberPrice
                    ? product.memberPrice.toFixed(0)
                    : (product.normalPrice * 0.6).toFixed(0)}
                </span>
              </div>
            </div>
            <span className="text-[11px] text-[#416373] font-semibold flex items-center gap-1 bg-[#f0f7fa] px-2 py-0.5 rounded-md border border-[#c8e4ed]">
              <CheckCircle2 className="w-3 h-3 text-[#0891b2]" /> En stock
            </span>
          </div>

          {/* Action Buttons Row */}
          <div
            onMouseEnter={() => {
              setIsOverButtons(true);
              setRotateX(0);
              setRotateY(0);
            }}
            onMouseLeave={() => setIsOverButtons(false)}
            className="flex items-center gap-2 pt-1 relative z-30 pointer-events-auto"
          >
            <button
              type="button"
              onClick={handleDetailsClick}
              className="flex-1 py-2.5 px-2 rounded-xl bg-[#f0f7fa] hover:bg-[#e2f3f8] text-[#1e4659] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-[#c8e4ed] shadow-xs pointer-events-auto touch-manipulation min-h-[42px] active:scale-95"
            >
              <Eye className="w-3.5 h-3.5 text-[#0891b2] shrink-0" />
              <span>Detalles</span>
            </button>

            <button
              type="button"
              onClick={handleAddClick}
              className={`flex-1 py-2.5 px-2 rounded-xl text-white font-display font-bold text-xs tracking-wide flex items-center justify-center gap-1.5 shadow-md shadow-cyan-950/20 transition-all hover:scale-102 active:scale-95 cursor-pointer border border-cyan-400/40 pointer-events-auto touch-manipulation min-h-[42px] ${
                justAdded
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-gradient-to-r from-cyan-600 via-teal-600 to-sky-700 hover:from-cyan-500 hover:to-teal-500"
              }`}
            >
              {justAdded ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white animate-bounce shrink-0" />
                  <span>¡Añadido!</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
                  <span>Agregar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
