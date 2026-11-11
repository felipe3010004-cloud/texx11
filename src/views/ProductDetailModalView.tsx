import React, { useState, useRef, useCallback } from "react";
import { Product } from "../models/types";
import { X, ShoppingCart, Heart, CheckCircle2, ShieldCheck, Tag, ZoomIn, Rotate3d, Check } from "lucide-react";

interface ProductDetailModalViewProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  isWishlisted: boolean;
  onToggleWishlist: (productId: string) => void;
  onAddToCart: (productId: string) => void;
  onOpenImageModal: (imgUrl: string) => void;
  onOpen3DViewer?: (product: Product) => void;
}

export const ProductDetailModalView: React.FC<ProductDetailModalViewProps> = ({
  product,
  isOpen,
  onClose,
  isWishlisted,
  onToggleWishlist,
  onAddToCart,
  onOpenImageModal,
  onOpen3DViewer,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotX, setRotX] = useState(0);
  const [rotY, setRotY] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    setRotX(-((y - centerY) / centerY) * 12);
    setRotY(((x - centerX) / centerX) * 14);
  }, []);

  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => {
    setIsHovering(false);
    setRotX(0);
    setRotY(0);
  };

  const handleAdd = () => {
    if (!product) return;
    onAddToCart(product.id);
    setJustAdded(true);
    setTimeout(() => {
      setJustAdded(false);
      onClose();
    }, 1200);
  };

  if (!isOpen || !product) return null;

  const memberPrice = product.memberPrice || Math.round(product.normalPrice * 0.6);
  const savings = product.normalPrice - memberPrice;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-[#082836]/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl rounded-3xl bg-white text-[#082836] border border-[#c8e4ed] shadow-2xl overflow-hidden my-6"
      >
        {/* Header bar */}
        <div className="p-4 sm:p-5 border-b border-[#e2f1f7] bg-[#f0f7fa] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-cyan-800 uppercase tracking-wider">
              {product.category || "Nutrición Celular"}
            </span>
            <span className="text-[#c8e4ed]">·</span>
            <span className="text-xs text-[#0891b2] font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#0891b2]" />
              Certificado Oficial SENASAG 166/2025
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleWishlist(product.id)}
              className={`w-9 h-9 rounded-full border flex items-center justify-center transition-transform hover:scale-110 cursor-pointer shadow-xs ${
                isWishlisted
                  ? "bg-rose-50 border-rose-300 text-rose-500"
                  : "bg-white border-[#c8e4ed] text-slate-500 hover:text-[#082836]"
              }`}
              title={isWishlisted ? "Quitar de favoritos" : "Añadir a favoritos"}
            >
              <Heart className={`w-4 h-4 ${isWishlisted ? "fill-rose-500 text-rose-500" : ""}`} />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white hover:bg-slate-100 text-slate-500 hover:text-[#082836] border border-[#c8e4ed] flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[72vh] overflow-y-auto text-left">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
            {/* Interactive 3D Product Stage */}
            <div
              ref={cardRef}
              onMouseMove={handleMouseMove}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              style={{
                perspective: "1000px",
                transformStyle: "preserve-3d",
              }}
              className="sm:col-span-5 relative h-64 rounded-2xl bg-[#f0f7fa] border border-[#c8e4ed] flex items-center justify-center p-4 cursor-pointer group select-none"
              onClick={() => onOpenImageModal(product.img)}
              title="Toca para ver imagen completa o gira en 3D"
            >
              <div
                style={{
                  transform: `translate3d(${-rotY * 0.8}px, ${rotX * 0.4 + 5}px, -15px)`,
                }}
                className="absolute bottom-4 w-36 h-7 bg-cyan-700/15 rounded-full blur-md pointer-events-none transition-transform duration-75"
              />

              <img
                src={product.img}
                alt={product.name}
                style={{
                  transform: `rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(${isHovering ? 1.06 : 1}, ${
                    isHovering ? 1.06 : 1
                  }, 1) translateZ(40px)`,
                  transition: isHovering ? "none" : "transform 0.4s ease-out",
                }}
                className="max-h-full max-w-full object-contain drop-shadow-[0_12px_24px_rgba(8,145,178,0.2)]"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/assets/aistudio/logo_f976621f.png";
                }}
              />

              <div className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                <ZoomIn className="w-4 h-4" />
              </div>

              <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] text-[#0891b2] font-bold border border-[#c8e4ed] shadow-xs flex items-center gap-1 opacity-80 group-hover:opacity-100">
                <Rotate3d className="w-3 h-3 text-cyan-600" />
                <span>Efecto 3D</span>
              </div>
            </div>

            {/* Product Title and Pricing */}
            <div className="sm:col-span-7 space-y-3">
              <h3 className="font-display font-black text-2xl text-[#082836] leading-tight">
                {product.name}
              </h3>

              <p className="text-xs sm:text-sm text-[#416373] leading-relaxed">
                {product.desc}
              </p>

              {/* Price comparison */}
              <div className="p-4 rounded-2xl bg-[#f0f7fa] border border-[#c8e4ed] space-y-1.5">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-600 font-medium">Precio Público Oficial:</span>
                  <span className="font-display font-bold text-lg text-[#082836]">
                    Bs {product.normalPrice.toFixed(0)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between pt-1 border-t border-[#e2f1f7]">
                  <span className="text-xs font-bold text-cyan-700 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-cyan-700" /> Con Membresía (40% OFF):
                  </span>
                  <span className="font-display font-black text-2xl text-cyan-800">
                    Bs {memberPrice.toFixed(0)}
                  </span>
                </div>
                <div className="text-[11px] text-cyan-700 font-bold text-right">
                  Ahorras Bs {savings.toFixed(0)} de por vida con tu membresía
                </div>
              </div>
            </div>
          </div>

          {/* Presentation & Ingredients */}
          {product.presentation && (
            <div className="p-3.5 rounded-2xl bg-cyan-50 border border-cyan-200 text-xs font-semibold text-cyan-900">
              Presentación: {product.presentation}
            </div>
          )}

          {/* Detailed description */}
          {product.longDesc && (
            <div className="space-y-2 pt-3 border-t border-[#e2f1f7]">
              <h4 className="font-display font-bold text-sm text-[#0891b2] uppercase tracking-wide">
                Información Farmacológica & Nutricional
              </h4>
              <p className="text-xs sm:text-sm text-[#416373] leading-relaxed">
                {product.longDesc}
              </p>
            </div>
          )}

          {/* Ingredients list */}
          {product.ingredients && product.ingredients.length > 0 && (
            <div className="space-y-2 pt-3 border-t border-[#e2f1f7]">
              <h4 className="font-display font-bold text-sm text-[#082836]">
                Fórmula Bioactiva & Composición:
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {product.ingredients.map((ing, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-xl bg-[#f0f7fa] text-xs font-medium text-[#082836] border border-[#c8e4ed]"
                  >
                    {ing}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Benefits list */}
          {product.benefits && product.benefits.length > 0 && (
            <div className="space-y-2 pt-3 border-t border-[#e2f1f7]">
              <h4 className="font-display font-bold text-sm text-[#082836]">
                Beneficios Clínicos y de Salud:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {product.benefits.map((b, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-xs text-[#0891b2] bg-[#f0f7fa] p-2.5 rounded-xl border border-[#c8e4ed] font-medium"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#0891b2] shrink-0" />
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 sm:p-6 border-t border-[#e2f1f7] bg-[#f0f7fa] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 text-center sm:text-left">
            Envíos asegurados a los 9 departamentos de Bolivia.
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {onOpen3DViewer && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpen3DViewer(product);
                }}
                className="px-4 py-3 rounded-2xl bg-white hover:bg-slate-50 text-cyan-700 border border-cyan-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Rotate3d className="w-4 h-4 text-cyan-600" />
                <span>Giro 3D</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleAdd}
              className={`flex-1 sm:flex-none px-6 py-3 rounded-2xl text-white font-display font-bold text-xs sm:text-sm tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/20 hover:scale-102 active:scale-98 transition-all cursor-pointer touch-manipulation min-h-[44px] ${
                justAdded
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-gradient-to-r from-cyan-600 via-teal-600 to-sky-700 hover:from-cyan-500 hover:to-teal-500"
              }`}
            >
              {justAdded ? (
                <>
                  <Check className="w-4 h-4 animate-bounce" />
                  <span>¡Añadido al Carrito!</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  <span>Agregar al Carrito (Bs {product.normalPrice.toFixed(0)})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
