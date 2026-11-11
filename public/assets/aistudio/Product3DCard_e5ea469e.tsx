import React, { useState, useRef, useCallback } from "react";
import { Product } from "../types";
import { ShoppingCart, Heart, Eye, ZoomIn, CheckCircle2, Rotate3d, Sparkles } from "lucide-react";

interface Product3DCardProps {
  product: Product;
  isWishlisted: boolean;
  isActive?: boolean;
  onToggleWishlist: (id: string) => void;
  onAddToCart: (id: string) => void;
  onOpenDetails: (product: Product) => void;
  onOpenImageModal: (url: string) => void;
}

export const Product3DCard: React.FC<Product3DCardProps> = ({
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

  // Smooth mouse move 3D tilt calculation
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = -((y - centerY) / centerY) * 12;
    const rotY = ((x - centerX) / centerX) * 14;

    setRotateX(rotX);
    setRotateY(rotY);

    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;
    setGlarePosition({ x: glareX, y: glareY, opacity: 0.35 });
  }, []);

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setRotateX(0);
    setRotateY(0);
    setGlarePosition((prev) => ({ ...prev, opacity: 0 }));
  };

  const shadowX = -rotateY * 1.8;
  const shadowY = rotateX * 1.8 + 15;
  const shadowBlur = isHovering ? 45 : 22;
  const shadowSpread = isHovering ? 2 : 0;

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
          boxShadow: `${shadowX}px ${shadowY}px ${shadowBlur}px ${shadowSpread}px rgba(8, 145, 178, 0.15), 0 2px 10px rgba(2, 132, 199, 0.08)`,
          transition: isHovering
            ? "transform 0.1s ease-out, box-shadow 0.15s ease-out"
            : "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.5s ease-out",
        }}
        className={`relative w-full h-full rounded-3xl p-5 flex flex-col justify-between overflow-hidden bg-white border transition-colors ${
          isActive
            ? "border-[#bce2ee] ring-1 ring-cyan-500/25 shadow-lg shadow-cyan-950/05"
            : "border-[#c8e4ed] opacity-80"
        }`}
      >
        {/* Dynamic Specular Lighting Glare Overlay */}
        <div
          style={{
            background: `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, rgba(224, 247, 250, 0.7) 0%, rgba(255, 255, 255, 0) 65%)`,
            opacity: glarePosition.opacity,
            transition: "opacity 0.3s ease",
          }}
          className="absolute inset-0 pointer-events-none z-30 rounded-3xl"
        />

        {/* Ambient Top Subtle Luminous Tint */}
        <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-[#e6f4f8] to-transparent pointer-events-none rounded-t-3xl" />

        {/* Top Floating Row */}
        <div
          style={{ transform: "translateZ(30px)" }}
          className="flex items-center justify-between z-10"
        >
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
            onClick={(e) => {
              e.stopPropagation();
              onToggleWishlist(product.id);
            }}
            className={`w-8 h-8 rounded-full border flex items-center justify-center transition-transform hover:scale-110 active:scale-90 cursor-pointer shadow-xs ${
              isWishlisted
                ? "bg-rose-50 border-rose-300 text-rose-500"
                : "bg-[#f0f7fa] border-[#c8e4ed] text-[#527585] hover:text-[#082836]"
            }`}
            title={isWishlisted ? "Quitar de favoritos" : "Guardar en favoritos"}
            aria-label="Favorito"
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? "fill-rose-500" : ""}`} />
          </button>
        </div>

        {/* 3D Product Float Stage with Parallax Depth and Pedestal Reflection */}
        <div
          style={{ transform: "translateZ(55px)" }}
          className="relative h-[215px] sm:h-[235px] flex items-center justify-center my-1 group/img cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onOpenImageModal(product.img);
          }}
          title="Toca para ampliar imagen en 3D"
        >
          {/* 3D Dynamic Bottle Shadow underneath in cyan-teal tone */}
          <div
            style={{
              transform: `translate3d(${-rotateY * 0.9}px, ${rotateX * 0.5 + 4}px, -20px) scale(${
                isHovering ? 1.08 : 0.95
              })`,
              transition: "transform 0.15s ease-out",
            }}
            className="absolute bottom-2 w-36 h-7 bg-gradient-to-r from-cyan-600/15 via-teal-500/25 to-sky-600/15 rounded-full blur-md pointer-events-none"
          />

          {/* Floating Product Image */}
          <img
            src={product.img}
            alt={product.name}
            className={`max-h-full max-w-[88%] object-contain drop-shadow-[0_15px_30px_rgba(8,145,178,0.20)] transition-all duration-300 ${
              isHovering ? "scale-108 -translate-y-2" : "scale-100"
            }`}
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "/src/assets/images/colageno_marino_bottle_1792117476491.jpg";
            }}
          />

          {/* Hover Zoom & 3D Indicator */}
          <div className="absolute top-2 right-2 opacity-0 group-hover/img:opacity-100 transition-opacity bg-black/60 backdrop-blur-md p-1.5 rounded-full text-white shadow-md">
            <ZoomIn className="w-3.5 h-3.5" />
          </div>

          <div className="absolute bottom-2 left-2 opacity-0 group-hover/img:opacity-100 transition-opacity bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] text-[#0891b2] font-bold border border-[#bce2ee] shadow-xs flex items-center gap-1">
            <Rotate3d className="w-3 h-3 text-cyan-600" />
            <span>3D Tilt</span>
          </div>
        </div>

        {/* Product Details & Actions */}
        <div style={{ transform: "translateZ(35px)" }} className="z-10 space-y-2 text-left">
          <h3 className="font-display font-black text-base sm:text-lg text-[#082836] leading-snug line-clamp-1">
            {product.name}
          </h3>

          <p className="text-xs text-[#416373] leading-relaxed line-clamp-2">
            {product.desc}
          </p>

          {/* Strict Official Pricing with Member Discount Highlight */}
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

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetails(product);
              }}
              className="flex-1 py-2.5 px-2 rounded-xl bg-[#f0f7fa] hover:bg-[#e2f3f8] text-[#1e4659] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-[#c8e4ed] shadow-xs"
            >
              <Eye className="w-3.5 h-3.5 text-[#0891b2]" />
              <span>Detalles</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(product.id);
              }}
              className="flex-1 py-2.5 px-2 rounded-xl bg-gradient-to-r from-cyan-600 via-teal-600 to-sky-700 hover:from-cyan-500 hover:to-teal-500 text-white font-display font-bold text-xs tracking-wide flex items-center justify-center gap-1.5 shadow-md shadow-cyan-950/20 transition-all hover:scale-103 active:scale-98 cursor-pointer border border-cyan-400/40"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Agregar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
