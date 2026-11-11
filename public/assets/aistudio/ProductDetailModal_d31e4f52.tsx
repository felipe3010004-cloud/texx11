import React, { useState, useRef, useCallback } from "react";
import { Product } from "../types";
import { X, ShoppingCart, Heart, CheckCircle2, Sparkles, ShieldCheck, Tag, ZoomIn, Rotate3d } from "lucide-react";

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  isWishlisted: boolean;
  onToggleWishlist: (productId: string) => void;
  onAddToCart: (productId: string) => void;
  onOpenImageModal: (imgUrl: string) => void;
  onOpen3DViewer?: (product: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
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

  if (!isOpen || !product) return null;

  const memberPrice = product.memberPrice || Math.round(product.normalPrice * 0.6);
  const savings = product.normalPrice - memberPrice;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl rounded-3xl bg-white text-[#12281e] border border-[#e5ded0] shadow-2xl overflow-hidden my-6"
      >
        {/* Header bar */}
        <div className="p-4 sm:p-5 border-b border-[#f0ece2] bg-[#faf8f3] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#8a5d20] uppercase tracking-wider">
              {product.category || "Nutrición Celular"}
            </span>
            <span className="text-[#ded5c2]">·</span>
            <span className="text-xs text-[#093d2a] font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#093d2a]" />
              Certificado Oficial Team Life
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleWishlist(product.id)}
              className={`w-9 h-9 rounded-full border flex items-center justify-center transition-transform hover:scale-110 cursor-pointer shadow-xs ${
                isWishlisted
                  ? "bg-rose-50 border-rose-300 text-rose-500"
                  : "bg-white border-[#ded5c2] text-[#807768] hover:text-[#12281e]"
              }`}
              title={isWishlisted ? "Quitar de favoritos" : "Añadir a favoritos"}
            >
              <Heart className={`w-4 h-4 ${isWishlisted ? "fill-rose-500 text-rose-500" : ""}`} />
            </button>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white hover:bg-[#ede6d8] text-[#5e574b] hover:text-[#0e261d] border border-[#ded5c2] flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[72vh] overflow-y-auto">
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
              className="sm:col-span-5 relative h-64 rounded-2xl bg-[#faf8f3] border border-[#e5ded0] flex items-center justify-center p-4 cursor-pointer group select-none"
              onClick={() => onOpenImageModal(product.img)}
              title="Toca para ver imagen completa o gira en 3D"
            >
              {/* Dynamic 3D shadow */}
              <div
                style={{
                  transform: `translate3d(${-rotY * 0.8}px, ${rotX * 0.4 + 5}px, -15px)`,
                }}
                className="absolute bottom-4 w-36 h-7 bg-[#093d2a]/15 rounded-full blur-md pointer-events-none transition-transform duration-75"
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
                className="max-h-full max-w-full object-contain drop-shadow-[0_12px_24px_rgba(20,40,25,0.18)]"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "/src/assets/images/colageno_marino_bottle_1792117476491.jpg";
                }}
              />

              <div className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                <ZoomIn className="w-4 h-4" />
              </div>

              <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] text-[#093d2a] font-bold border border-[#ded5c2] shadow-xs flex items-center gap-1 opacity-80 group-hover:opacity-100">
                <Rotate3d className="w-3 h-3 text-[#c89b53]" />
                <span>Efecto 3D</span>
              </div>
            </div>

            {/* Product Title and Pricing */}
            <div className="sm:col-span-7 space-y-3 text-left">
              <h3 className="font-display font-black text-2xl text-[#0e261d] leading-tight">
                {product.name}
              </h3>

              <p className="text-xs sm:text-sm text-[#5e574b] leading-relaxed">
                {product.desc}
              </p>

              {/* Price comparison */}
              <div className="p-4 rounded-2xl bg-[#faf8f3] border border-[#e5ded0] space-y-1.5">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-[#736a5c] font-medium">Precio Público Oficial:</span>
                  <span className="font-display font-bold text-lg text-[#0e261d]">
                    Bs {product.normalPrice.toFixed(0)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between pt-1 border-t border-[#f0ece2]">
                  <span className="text-xs font-bold text-[#093d2a] flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-[#093d2a]" /> Con Membresía (40% OFF):
                  </span>
                  <span className="font-display font-black text-2xl text-[#c89b53]">
                    Bs {memberPrice.toFixed(0)}
                  </span>
                </div>
                <div className="text-[11px] text-[#093d2a] font-bold text-right">
                  Ahorras Bs {savings.toFixed(0)} de por vida con tu membresía
                </div>
              </div>
            </div>
          </div>

          {/* Detailed description */}
          {product.longDesc && (
            <div className="space-y-2 pt-3 border-t border-[#f0ece2] text-left">
              <h4 className="font-display font-bold text-sm text-[#093d2a] uppercase tracking-wide">
                Información Farmacológica & Nutricional
              </h4>
              <p className="text-xs sm:text-sm text-[#5e574b] leading-relaxed">
                {product.longDesc}
              </p>
            </div>
          )}

          {/* Benefits list */}
          {product.benefits && product.benefits.length > 0 && (
            <div className="space-y-2 pt-3 border-t border-[#f0ece2] text-left">
              <h4 className="font-display font-bold text-sm text-[#0e261d]">
                Beneficios Clínicos y de Salud:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {product.benefits.map((b, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-xs text-[#093d2a] bg-[#faf6ee] p-2.5 rounded-xl border border-[#e8d7ae] font-medium"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#093d2a] shrink-0" />
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 sm:p-6 border-t border-[#f0ece2] bg-[#faf8f3] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-[#5e574b] text-center sm:text-left">
            Envíos asegurados a los 9 departamentos de Bolivia.
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {onOpen3DViewer && (
              <button
                onClick={() => {
                  onClose();
                  onOpen3DViewer(product);
                }}
                className="px-4 py-3 rounded-2xl bg-white hover:bg-[#ede6d8] text-[#8a5d20] border border-[#e8d7ae] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Rotate3d className="w-4 h-4 text-[#c89b53]" />
                <span>Giro 3D</span>
              </button>
            )}

            <button
              onClick={() => {
                onAddToCart(product.id);
                onClose();
              }}
              className="flex-1 sm:flex-none px-6 py-3 rounded-2xl bg-gradient-to-r from-[#093d2a] via-[#0d4f36] to-[#124d36] hover:from-[#0d4f36] hover:to-[#175d42] text-white font-display font-bold text-sm tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-[#093d2a]/20 hover:scale-102 active:scale-98 transition-all cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Agregar al Carrito (Bs {product.normalPrice.toFixed(0)})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
