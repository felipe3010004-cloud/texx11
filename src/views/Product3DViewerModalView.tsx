import React, { useState, useRef, useEffect } from "react";
import { Product, Combo } from "../models/types";
import { X, Rotate3d, ShoppingCart, Sparkles, Play, Pause, RotateCcw, Heart, FlaskConical, Package, Check } from "lucide-react";

interface Product3DViewerModalViewProps {
  item: Product | Combo | null;
  isCombo?: boolean;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (id: string, isCombo: boolean) => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (id: string) => void;
}

export const Product3DViewerModalView: React.FC<Product3DViewerModalViewProps> = ({
  item,
  isCombo = false,
  isOpen,
  onClose,
  onAddToCart,
  isWishlisted = false,
  onToggleWishlist,
}) => {
  const [rotX, setRotX] = useState<number>(10);
  const [rotY, setRotY] = useState<number>(0);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [justAdded, setJustAdded] = useState(false);

  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const baseRotRef = useRef<{ rotX: number; rotY: number }>({ rotX: 10, rotY: 0 });

  // Auto-rotate effect
  useEffect(() => {
    if (!autoRotate || isDragging || !isOpen) return;
    const interval = setInterval(() => {
      setRotY((prev) => (prev + 1.2) % 360);
    }, 30);
    return () => clearInterval(interval);
  }, [autoRotate, isDragging, isOpen]);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setAutoRotate(false);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    baseRotRef.current = { rotX, rotY };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;

    const newRotY = (baseRotRef.current.rotY + deltaX * 0.6) % 360;
    const newRotX = Math.max(-35, Math.min(35, baseRotRef.current.rotX - deltaY * 0.4));

    setRotY(newRotY);
    setRotX(newRotX);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  const resetView = () => {
    setRotX(10);
    setRotY(0);
    setAutoRotate(true);
  };

  const handleAdd = () => {
    if (!item) return;
    onAddToCart(item.id, isCombo);
    setJustAdded(true);
    setTimeout(() => {
      setJustAdded(false);
      onClose();
    }, 1200);
  };

  if (!isOpen || !item) return null;

  const normalPrice = isCombo ? (item as Combo).comboPrice : (item as Product).normalPrice;
  const memberPrice = !isCombo ? (item as Product).memberPrice || Math.round(normalPrice * 0.6) : normalPrice;
  const productItem = !isCombo ? (item as Product) : null;
  const comboItem = isCombo ? (item as Combo) : null;

  const lightAngleRad = (rotY * Math.PI) / 180;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-[#082836]/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl rounded-3xl bg-white text-[#082836] border border-[#c8e4ed] shadow-2xl overflow-hidden my-6 flex flex-col"
      >
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 border-b border-[#e2f1f7] flex items-center justify-between bg-gradient-to-r from-[#f0f7fa] to-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-cyan-100 border border-cyan-300 text-[#0891b2] flex items-center justify-center shadow-xs">
              <Rotate3d className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#0891b2] bg-[#ecfeff] px-2 py-0.5 rounded-md border border-cyan-200">
                  {isCombo
                    ? comboItem?.profitPercentage
                      ? `Empresarial ${comboItem.profitPercentage}%`
                      : "Combo 3D"
                    : productItem?.category || "Nutrición Celular"}
                </span>
                <span className="text-[11px] text-[#416373] hidden sm:inline">
                  Inspección Tridimensional 360°
                </span>
              </div>
              <h3 className="font-display font-black text-base sm:text-lg text-[#082836] line-clamp-1">
                {item.name}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {onToggleWishlist && (
              <button
                type="button"
                onClick={() => onToggleWishlist(item.id)}
                className={`w-9 h-9 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
                  isWishlisted
                    ? "bg-rose-50 border-rose-300 text-rose-500"
                    : "bg-[#f0f7fa] border-[#c8e4ed] text-[#527585] hover:text-[#082836]"
                }`}
                title="Favorito"
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? "fill-rose-500 text-rose-500" : ""}`} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-[#f0f7fa] hover:bg-[#e2f3f8] text-[#527585] hover:text-[#082836] border border-[#c8e4ed] flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3D Interactive Canvas Stage */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="relative w-full h-[320px] sm:h-[380px] bg-gradient-to-b from-[#f0f7fa] via-[#e6f4f8] to-[#d8edf4] overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
        >
          {/* Radial Light */}
          <div
            style={{
              background: `radial-gradient(circle at ${50 + Math.sin(lightAngleRad) * 35}% ${
                35 + Math.cos(lightAngleRad) * 20
              }%, rgba(255, 255, 255, 0.95) 0%, rgba(6, 182, 212, 0.15) 50%, transparent 80%)`,
            }}
            className="absolute inset-0 pointer-events-none transition-all duration-75"
          />

          {/* 3D Turntable Platform */}
          <div
            style={{
              perspective: "1000px",
              transformStyle: "preserve-3d",
            }}
            className="absolute bottom-6 flex items-center justify-center pointer-events-none"
          >
            <div
              style={{
                transform: `rotateX(68deg) rotateZ(${rotY}deg)`,
              }}
              className="w-72 h-72 rounded-full border border-cyan-400/35 border-dashed"
            />
            <div
              style={{
                transform: `rotateX(68deg) rotateZ(${-rotY * 0.7}deg)`,
              }}
              className="absolute w-52 h-52 rounded-full border border-sky-400/40"
            />
            <div
              style={{
                transform: "rotateX(68deg)",
              }}
              className="absolute w-36 h-36 rounded-full bg-gradient-to-b from-white/60 to-cyan-200/40 shadow-inner"
            />
          </div>

          {/* 3D Product Container */}
          <div
            style={{
              perspective: "1200px",
              transformStyle: "preserve-3d",
              transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)`,
              transition: isDragging ? "none" : "transform 0.1s ease-out",
            }}
            className="relative flex items-center justify-center pointer-events-none"
          >
            <div
              style={{
                transform: `translate3d(0, 110px, -40px) scale(${1 + Math.abs(rotX) * 0.01})`,
                boxShadow: "0 35px 50px rgba(8, 145, 178, 0.30)",
              }}
              className="absolute w-48 h-12 bg-cyan-900/20 rounded-full blur-lg pointer-events-none"
            />

            <div
              style={{
                transform: "translateZ(30px)",
                filter: `drop-shadow(${Math.sin(lightAngleRad) * -20}px 25px 30px rgba(8, 145, 178, 0.25))`,
              }}
              className="relative max-h-[250px] sm:max-h-[285px] max-w-[270px] flex items-center justify-center"
            >
              <img
                src={item.img}
                alt={item.name}
                className="max-h-[240px] sm:max-h-[280px] object-contain drop-shadow-xl"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/assets/aistudio/logo_f976621f.png";
                }}
              />
            </div>

            <div
              style={{
                transform: `translate3d(140px, -60px, 45px) rotateY(${-rotY}deg)`,
              }}
              className="hidden sm:flex absolute items-center gap-1.5 px-3 py-1 rounded-xl bg-white/95 backdrop-blur-md border border-cyan-200 text-[#0891b2] text-xs font-bold shadow-lg pointer-events-none"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
              <span>Bioactivo</span>
            </div>

            <div
              style={{
                transform: `translate3d(-140px, 50px, 45px) rotateY(${-rotY}deg)`,
              }}
              className="hidden sm:flex absolute items-center gap-1.5 px-3 py-1 rounded-xl bg-[#ecfeff] backdrop-blur-md border border-cyan-300 text-[#0284c7] text-xs font-black shadow-lg pointer-events-none"
            >
              <span>40% OFF Socio</span>
            </div>
          </div>

          <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full border border-cyan-200 text-[11px] text-[#416373] font-medium flex items-center gap-2 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
            <span>Arrastra para girar en 3D</span>
          </div>

          {/* Controls */}
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-white/95 backdrop-blur-md p-1 rounded-2xl border border-cyan-200 shadow-sm">
            <button
              type="button"
              onClick={() => setAutoRotate(!autoRotate)}
              className="px-2.5 py-1 rounded-xl hover:bg-[#e2f3f8] text-[#0891b2] text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              title={autoRotate ? "Pausar giro automático" : "Iniciar giro automático"}
            >
              {autoRotate ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{autoRotate ? "Pausa" : "Auto-Giro"}</span>
            </button>
            <button
              type="button"
              onClick={resetView}
              className="p-1.5 rounded-xl hover:bg-[#e2f3f8] text-[#527585] hover:text-[#082836] transition-colors cursor-pointer"
              title="Restablecer ángulo"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Modal Bottom Sheet */}
        <div className="p-5 sm:p-6 bg-white border-t border-[#e2f1f7] space-y-4 text-left">
          {productItem && (
            <div className="space-y-2">
              {productItem.presentation && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cyan-50 text-cyan-800 text-xs font-semibold border border-cyan-200">
                  <Package className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Presentación: {productItem.presentation}</span>
                </div>
              )}

              {productItem.ingredients && productItem.ingredients.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#0891b2] mb-1.5 flex items-center gap-1">
                    <FlaskConical className="w-3.5 h-3.5 text-cyan-600" />
                    <span>Fórmula Activa & Composición:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {productItem.ingredients.map((ing, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-0.5 rounded-lg bg-[#f0f7fa] text-[#082836] text-[11px] font-medium border border-[#c8e4ed]"
                      >
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {comboItem?.commissionable && (
            <div>
              <span className="px-3 py-1 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold inline-block">
                Monto Comisionable: Bs {comboItem.commissionable.toLocaleString()} ({comboItem.profitPercentage}% Margen de Ganancias)
              </span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 max-w-md">
              <p className="text-xs sm:text-sm text-[#416373] leading-relaxed">
                {item.desc}
              </p>
            </div>

            <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end pt-3 sm:pt-0 border-t sm:border-t-0 border-[#e2f1f7]">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-[#527585] font-semibold">
                  {isCombo ? "Precio Pack" : "Precio Regular"}
                </div>
                <div className="font-display font-black text-2xl text-[#082836]">
                  <span className="text-xs font-bold text-[#527585] mr-1 font-sans">Bs</span>
                  {normalPrice.toFixed(0)}
                </div>
                {!isCombo && (
                  <div className="text-[11px] text-[#0891b2] font-bold">
                    Socio 40% OFF: Bs {memberPrice.toFixed(0)}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleAdd}
                className={`px-6 py-3.5 rounded-2xl text-white font-display font-bold text-xs sm:text-sm tracking-wide flex items-center gap-2 shadow-xl shadow-cyan-950/20 transition-all hover:scale-105 active:scale-95 cursor-pointer border border-cyan-400/40 touch-manipulation min-h-[44px] ${
                  justAdded
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-gradient-to-r from-cyan-600 via-teal-600 to-sky-700 hover:from-cyan-500 hover:to-teal-500"
                }`}
              >
                {justAdded ? (
                  <>
                    <Check className="w-4 h-4 text-white animate-bounce" />
                    <span>¡Agregado al Carrito!</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4" />
                    <span>Agregar al Carrito</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
