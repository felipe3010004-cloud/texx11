import React, { useState, useEffect, useRef } from "react";
import { Product } from "../models/types";
import { Product3DCardView } from "./Product3DCardView";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Tag,
  Play,
  Pause,
  Rotate3d,
  Sparkles,
  Eye,
  ShoppingCart,
  Check,
} from "lucide-react";

interface Carousel3DViewProps {
  products: Product[];
  wishlist: string[];
  onToggleWishlist: (productId: string) => void;
  onAddToCart: (productId: string) => void;
  onOpenImageModal: (imgUrl: string) => void;
  onOpenProductDetails: (product: Product) => void;
  onOpen3DViewer?: (product: Product) => void;
}

export const Carousel3DView: React.FC<Carousel3DViewProps> = ({
  products,
  wishlist,
  onToggleWishlist,
  onAddToCart,
  onOpenImageModal,
  onOpenProductDetails,
  onOpen3DViewer,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(true);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [spotlightAdded, setSpotlightAdded] = useState(false);
  const [viewportWidth, setViewportWidth] = useState<number>(() =>
    typeof window !== "undefined" ? window.innerWidth : 1200
  );

  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Responsive device classification
  const isSmallMobile = viewportWidth < 420; // 360px, 390px
  const isMobile = viewportWidth < 640;      // 430px
  const isTablet = viewportWidth >= 640 && viewportWidth < 1024; // 768px
  const isDesktop = viewportWidth >= 1024;   // 1366px, 1920px

  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  // Filtering products
  const filteredProducts = products.filter((prod) => {
    const matchesSearch =
      prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (prod.category && prod.category.toLowerCase().includes(searchQuery.toLowerCase()));

    if (selectedCategory === "all") return matchesSearch;
    if (selectedCategory === "favorites") return matchesSearch && wishlist.includes(prod.id);
    return matchesSearch && prod.category === selectedCategory;
  });

  const categories = [
    { id: "all", label: "5 Formulaciones Oficiales" },
    { id: "favorites", label: "Mis Favoritos" },
    { id: "Nutrición Celular", label: "Nutrición Celular" },
    { id: "Digestión & Detox", label: "Digestión & Detox" },
    { id: "Inmunidad & Defensas", label: "Inmunidad" },
    { id: "Energía & Foco", label: "Energía & Foco" },
  ];

  // Auto-play timer
  useEffect(() => {
    if (!isAutoPlaying || isHovered || filteredProducts.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % filteredProducts.length);
    }, 4200);

    return () => clearInterval(interval);
  }, [isAutoPlaying, isHovered, filteredProducts.length]);

  useEffect(() => {
    if (filteredProducts.length > 0 && currentIndex >= filteredProducts.length) {
      setCurrentIndex(0);
    }
  }, [filteredProducts.length, currentIndex]);

  const handleNext = () => {
    if (filteredProducts.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % filteredProducts.length);
  };

  const handlePrev = () => {
    if (filteredProducts.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + filteredProducts.length) % filteredProducts.length);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filteredProducts.length]);

  // Touch handlers with horizontal swipe detection and vertical scroll allowance
  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest?.("button") || target.tagName === "BUTTON") {
      touchStartXRef.current = null;
      touchStartYRef.current = null;
      return;
    }
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const diffX = e.changedTouches[0].clientX - touchStartXRef.current;
    const diffY = e.changedTouches[0].clientY - touchStartYRef.current;
    touchStartXRef.current = null;
    touchStartYRef.current = null;

    // Solo si el desplazamiento horizontal es mayor al vertical (intención de swipe)
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 35) {
      if (diffX > 0) {
        handlePrev();
      } else {
        handleNext();
      }
    }
  };

  const currentProduct = filteredProducts[currentIndex];

  const handleSpotlightAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentProduct) return;
    onAddToCart(currentProduct.id);
    setSpotlightAdded(true);
    setTimeout(() => setSpotlightAdded(false), 1500);
  };

  return (
    <section id="catalogo-3d" className="relative py-14 px-4 md:px-8 max-w-7xl mx-auto">
      {/* Ambient 3D Stage Background Light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[480px] bg-gradient-to-r from-cyan-400/12 via-sky-500/10 to-teal-400/12 rounded-full blur-[140px] pointer-events-none" />

      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#bce2ee] text-[#0891b2] text-xs font-bold uppercase tracking-wider mb-3 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
          <span>Vitrina Interactiva · Profundidad y Sombras Dinámicas</span>
        </div>
        <h2 className="font-display font-black text-3xl sm:text-4xl text-[#082836] tracking-tight">
          Catálogo Oficial de 5 Formulaciones Bioactivas
        </h2>
        <p className="text-[#325261] text-sm sm:text-base mt-2">
          Pasa el cursor o desliza para experimentar la rotación y profundidad con reflejos dinámicos en tonos azul y verde cian.
        </p>

        {/* 3D Motion Status */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
          <button
            type="button"
            onClick={() => setIsAutoPlaying((prev) => !prev)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs border ${
              isAutoPlaying
                ? "bg-white text-[#0891b2] border-[#bce2ee] hover:bg-[#eaf4f8]"
                : "bg-[#e2f1f7] text-[#416373] border-[#bce2ee] hover:bg-[#d6ecf4]"
            }`}
          >
            <Rotate3d
              className={`w-3.5 h-3.5 text-[#0891b2] ${
                isAutoPlaying && !isHovered ? "animate-spin [animation-duration:6s]" : ""
              }`}
            />
            <span>{isAutoPlaying ? "Auto-Rotación: Activa" : "Auto-Rotación: Pausa"}</span>
            {isAutoPlaying ? (
              <Pause className="w-3 h-3 text-[#0891b2]" />
            ) : (
              <Play className="w-3 h-3 text-[#416373]" />
            )}
          </button>

          {currentProduct && onOpen3DViewer && (
            <button
              type="button"
              onClick={() => onOpen3DViewer(currentProduct)}
              className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#ecfeff] text-[#0284c7] hover:bg-[#cffafe] border border-cyan-300 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Rotate3d className="w-3.5 h-3.5 text-cyan-600" />
              <span>Inspección 360° en Estudio 3D</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="mb-8 min-w-0 w-full p-3 sm:p-4 rounded-3xl bg-white/95 backdrop-blur-md border border-[#c8e4ed] shadow-[0_8px_30px_rgba(8,145,178,0.06)] flex flex-col sm:flex-row flex-wrap gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 min-w-0 w-full sm:min-w-[240px]">
          <Search className="w-4 h-4 text-[#0891b2] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentIndex(0);
            }}
            placeholder="Buscar Colágeno, Coffee Life con Cordyceps, Chocokids, Inmune, Fibernat..."
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#f0f7fa] border border-[#c8e4ed] rounded-2xl text-[#082836] placeholder-[#527585] focus:outline-none focus:border-[#0891b2] focus:bg-white transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setSelectedCategory(cat.id);
                setCurrentIndex(0);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? "bg-gradient-to-r from-cyan-600 to-sky-700 text-white shadow-md shadow-cyan-950/20"
                  : "bg-[#f0f7fa] hover:bg-[#e2f3f8] text-[#1e4659] border border-[#c8e4ed]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3D Carousel Stage */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-3xl border border-[#c8e4ed] max-w-md mx-auto shadow-sm">
          <Tag className="w-12 h-12 text-cyan-400/50 mx-auto mb-3" />
          <h3 className="font-display font-bold text-lg text-[#082836]">No se encontraron productos</h3>
          <p className="text-[#527585] text-sm mt-1">Intenta con otra palabra clave o limpia el filtro.</p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
            }}
            className="mt-4 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-sky-700 text-white text-xs font-bold hover:from-cyan-500 hover:to-sky-600 transition-colors cursor-pointer"
          >
            Ver los 5 productos
          </button>
        </div>
      ) : (
        <div
          className="relative"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Nav buttons (Desktop / Tablet floating) */}
          <button
            type="button"
            onClick={handlePrev}            
            className="hidden sm:flex absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 md:w-12 md:h-12 rounded-full bg-white hover:bg-cyan-600 text-[#0891b2] hover:text-white border border-[#bce2ee] hover:border-cyan-600 items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-xl shadow-cyan-950/10 cursor-pointer"
            aria-label="Producto anterior"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="hidden sm:flex absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 md:w-12 md:h-12 rounded-full bg-white hover:bg-cyan-600 text-[#0891b2] hover:text-white border border-[#bce2ee] hover:border-cyan-600 items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-xl shadow-cyan-950/10 cursor-pointer"
            aria-label="Producto siguiente"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* 3D Track con contenedor de ancho seguro anti-overflow */}
          <div
            className={`relative w-full min-w-0 flex items-center justify-center perspective-1200 overflow-x-clip select-none ${
              isSmallMobile
                ? "h-[475px]"
                : isMobile
                ? "h-[495px]"
                : isTablet
                ? "h-[515px]"
                : "h-[545px]"
            }`}
          >
            <div className="absolute bottom-6 w-[min(560px,90%)] h-[70px] bg-gradient-to-r from-transparent via-[#0891b2]/10 to-transparent rounded-full blur-xl pointer-events-none" />

            <div className="relative w-full h-full flex items-center justify-center preserve-3d">
              {filteredProducts.map((prod, index) => {
                let offset = index - currentIndex;
                const total = filteredProducts.length;
                if (offset > total / 2) offset -= total;
                if (offset < -total / 2) offset += total;

                const absOffset = Math.abs(offset);
                const isActive = offset === 0;
                const isWishlisted = wishlist.includes(prod.id);

                if (absOffset > 2) return null;

                // Cálculo dinámico de desplazamiento 3D adaptado a resolución exacta
                let xOffset = 0;
                let zOffset = 0;
                let rotY = 0;
                let scale = 1;
                let opacity = 1;

                if (isSmallMobile) {
                  // 360px, 390px: Una tarjeta protagonista centrada sin ningún desborde horizontal
                  xOffset = offset * 0;
                  zOffset = -absOffset * 80;
                  rotY = 0;
                  scale = isActive ? 1 : 0.85;
                  opacity = isActive ? 1 : 0;
                } else if (isMobile) {
                  // 420px - 640px (ej. 430px): Tarjeta principal con peeks sutiles a los lados
                  xOffset = offset * 90;
                  zOffset = -absOffset * 100;
                  rotY = offset * -15;
                  scale = isActive ? 1 : 0.88;
                  opacity = isActive ? 1 : Math.max(0.2, 0.45 - absOffset * 0.25);
                } else if (isTablet) {
                  // 640px - 1024px (ej. 768px): 2-3 tarjetas visibles con separación equilibrada
                  xOffset = offset * 220;
                  zOffset = -absOffset * 160;
                  rotY = offset * -22;
                  scale = Math.max(0.78, 1 - absOffset * 0.12);
                  opacity = isActive ? 1 : Math.max(0.35, 1 - absOffset * 0.35);
                } else {
                  // Computadoras (1024px, 1366px, 1920px): Varias tarjetas en arco 3D espacioso
                  const step = viewportWidth >= 1440 ? 350 : 300;
                  xOffset = offset * step;
                  zOffset = -absOffset * 220;
                  rotY = offset * -28;
                  scale = Math.max(0.74, 1 - absOffset * 0.12);
                  opacity = isActive ? 1 : Math.max(0.4, 1 - absOffset * 0.3);
                }

                const zIndex = isActive ? 50 : 20 - absOffset * 5;

                const cardDimensionsClass = isSmallMobile
                  ? "w-[min(88vw,285px)] h-[460px]"
                  : isMobile
                  ? "w-[min(82vw,310px)] h-[475px]"
                  : isTablet
                  ? "w-[315px] h-[485px]"
                  : "w-[335px] sm:w-[340px] h-[495px]";

                return (
                  <div
                    key={prod.id}
                    onClick={(e) => {
                      const target = e.target as HTMLElement;
                      if (target.closest?.("button") || target.tagName === "BUTTON") return;
                      if (!isActive) setCurrentIndex(index);
                    }}
                    style={{
                      transform: `translate3d(${xOffset}px, 0, ${zOffset}px) rotateY(${rotY}deg) scale(${scale})`,
                      opacity,
                      zIndex,
                    }}
                    className={`absolute ${cardDimensionsClass} transition-all duration-700 ease-out select-none ${
                      isActive
                        ? "z-50 pointer-events-auto"
                        : "z-20 pointer-events-auto cursor-pointer"
                    }`}
                  >
                    <Product3DCardView
                      product={prod}
                      isWishlisted={isWishlisted}
                      isActive={isActive}
                      onToggleWishlist={onToggleWishlist}
                      onAddToCart={onAddToCart}
                      onOpenDetails={onOpenProductDetails}
                      onOpenImageModal={onOpenImageModal}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dots Indicator & Mobile Controls */}
          <div className="flex justify-center items-center gap-3 sm:gap-2 mt-4">
            <button
              type="button"
              onClick={handlePrev}
              className="sm:hidden w-8 h-8 rounded-full bg-white hover:bg-cyan-50 text-[#0891b2] border border-[#bce2ee] flex items-center justify-center shadow-xs cursor-pointer active:scale-95"
              aria-label="Producto anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5">
              {filteredProducts.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    idx === currentIndex
                      ? "w-8 bg-gradient-to-r from-cyan-600 to-sky-600 shadow-xs"
                      : "w-2 bg-[#c8e4ed] hover:bg-[#b0d8e5]"
                  }`}
                  aria-label={`Ir al producto ${idx + 1}`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={handleNext}
              className="sm:hidden w-8 h-8 rounded-full bg-white hover:bg-cyan-50 text-[#0891b2] border border-[#bce2ee] flex items-center justify-center shadow-xs cursor-pointer active:scale-95"
              aria-label="Producto siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Synchronized Product Spotlight Bar with verified add-to-cart */}
          {currentProduct && (
            <div className="mt-8 p-6 sm:p-7 rounded-3xl bg-white border border-[#c8e4ed] max-w-4xl mx-auto shadow-xl shadow-cyan-950/05 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-1.5 flex-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#0891b2] uppercase tracking-wider">
                    {currentProduct.category || "Formulación Oficial"}
                  </span>
                  <span className="text-[#c8e4ed]">·</span>
                  <span className="text-xs text-[#0284c7] font-bold">Registro Sanitario SENASAG</span>
                </div>
                <h3 className="font-display font-black text-xl sm:text-2xl text-[#082836]">
                  {currentProduct.name}
                </h3>
                <p className="text-xs sm:text-sm text-[#416373] leading-relaxed">
                  {currentProduct.longDesc || currentProduct.desc}
                </p>
                {currentProduct.benefits && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {currentProduct.benefits.map((b, i) => (
                      <span
                        key={i}
                        className="text-[11px] text-[#0891b2] bg-[#f0f7fa] px-2.5 py-0.5 rounded-lg border border-[#c8e4ed] font-medium"
                      >
                        ✓ {b}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 shrink-0 w-full md:w-auto justify-between md:justify-end pt-4 md:pt-0 border-t md:border-t-0 border-[#e2f1f7]">
                <div className="text-left">
                  <div className="text-[11px] uppercase tracking-wider text-[#527585] font-semibold">
                    Precio Regular
                  </div>
                  <div className="font-display font-black text-2xl text-[#082836]">
                    <span className="text-xs font-bold text-[#527585] mr-1">Bs</span>
                    {currentProduct.normalPrice.toFixed(0)}
                  </div>
                  <div className="text-[11px] text-[#0891b2] font-bold">
                    Socio 40% OFF: Bs{" "}
                    {currentProduct.memberPrice
                      ? currentProduct.memberPrice.toFixed(0)
                      : (currentProduct.normalPrice * 0.6).toFixed(0)}
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  {onOpen3DViewer && (
                    <button
                      type="button"
                      onClick={() => onOpen3DViewer(currentProduct)}
                      className="p-3 rounded-2xl bg-[#f0f7fa] hover:bg-[#e2f3f8] text-[#0891b2] border border-[#c8e4ed] transition-colors cursor-pointer shadow-xs"
                      title="Abrir inspección 360°"
                    >
                      <Rotate3d className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onOpenProductDetails(currentProduct)}
                    className="px-4 py-3 rounded-2xl bg-[#f0f7fa] hover:bg-[#e2f3f8] text-[#1e4659] font-bold text-xs flex items-center gap-1.5 border border-[#c8e4ed] transition-colors cursor-pointer shadow-xs"
                  >
                    <Eye className="w-4 h-4 text-[#0891b2]" />
                    <span>Ver detalles</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSpotlightAddToCart}
                    className={`px-6 py-3 rounded-2xl font-display font-bold text-xs sm:text-sm tracking-wide flex items-center gap-1.5 shadow-xl shadow-cyan-950/20 transition-all hover:scale-105 active:scale-95 cursor-pointer text-white ${
                      spotlightAdded
                        ? "bg-emerald-600 hover:bg-emerald-700"
                        : "bg-gradient-to-r from-cyan-600 via-teal-600 to-sky-700 hover:from-cyan-500 hover:to-teal-500"
                    }`}
                  >
                    {spotlightAdded ? (
                      <>
                        <Check className="w-4 h-4 animate-bounce" />
                        <span>¡Añadido!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4" />
                        <span>Añadir</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
