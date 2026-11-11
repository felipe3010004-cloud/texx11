import React, { useState, useEffect, useRef } from "react";
import { Product } from "../types";
import { Product3DCard } from "./Product3DCard";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Tag,
  Play,
  Pause,
  Rotate3d,
  Sparkles,
  CheckCircle2,
  Eye,
  ShoppingCart,
} from "lucide-react";

interface Carousel3DProps {
  products: Product[];
  wishlist: string[];
  onToggleWishlist: (productId: string) => void;
  onAddToCart: (productId: string) => void;
  onOpenImageModal: (imgUrl: string) => void;
  onOpenProductDetails: (product: Product) => void;
  onOpen3DViewer?: (product: Product) => void;
}

export const Carousel3D: React.FC<Carousel3DProps> = ({
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

  // Touch and drag support for interactive 3D rotation
  const touchStartXRef = useRef<number | null>(null);

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
    { id: "all", label: "5 Productos Oficiales" },
    { id: "favorites", label: "Mis Favoritos" },
    { id: "Nutrición Celular", label: "Nutrición Celular" },
    { id: "Digestión & Detox", label: "Digestión & Detox" },
    { id: "Inmunidad & Defensas", label: "Inmunidad" },
    { id: "Energía & Foco", label: "Energía & Foco" },
  ];

  // Auto-play timer for dynamic continuous 3D rotation
  useEffect(() => {
    if (!isAutoPlaying || isHovered || filteredProducts.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % filteredProducts.length);
    }, 3800);

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

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartXRef.current;
    touchStartXRef.current = null;
    if (diff > 45) {
      handlePrev();
    } else if (diff < -45) {
      handleNext();
    }
  };

  const currentProduct = filteredProducts[currentIndex];

  return (
    <section id="catalogo-3d" className="relative py-14 px-4 md:px-8 max-w-7xl mx-auto">
      {/* Ambient 3D Stage Background Light in Cyan & Teal */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[480px] bg-gradient-to-r from-cyan-400/12 via-sky-500/10 to-teal-400/12 rounded-full blur-[140px] pointer-events-none" />

      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#bce2ee] text-[#0891b2] text-xs font-bold uppercase tracking-wider mb-3 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
          <span>Vitrina 3D Interactiva · Profundidad y Sombras Dinámicas</span>
        </div>
        <h2 className="font-display font-black text-3xl sm:text-4xl text-[#082836] tracking-tight">
          Catálogo Oficial de 5 Formulaciones Bioactivas
        </h2>
        <p className="text-[#325261] text-sm sm:text-base mt-2">
          Pasa el cursor o interactúa para experimentar la rotación y profundidad 3D con reflejos dinámicos en tonos azul y verde cian.
        </p>

        {/* 3D Motion Status & Inspection Control Bar */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
          <button
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
              onClick={() => onOpen3DViewer(currentProduct)}
              className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#ecfeff] text-[#0284c7] hover:bg-[#cffafe] border border-cyan-300 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Rotate3d className="w-3.5 h-3.5 text-cyan-600" />
              <span>Inspección 360° en Estudio 3D</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar in Clean Cyan-Blue Luxury */}
      <div className="mb-8 p-3 sm:p-4 rounded-3xl bg-white/95 backdrop-blur-md border border-[#c8e4ed] shadow-[0_8px_30px_rgba(8,145,178,0.06)] flex flex-wrap gap-3 items-center justify-between">
        {/* Search input */}
        <div className="relative flex-1 min-w-[240px]">
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

        {/* Categories segmented buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full">
          {categories.map((cat) => (
            <button
              key={cat.id}
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

      {/* 3D Stage Container */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-3xl border border-[#c8e4ed] max-w-md mx-auto shadow-sm">
          <Tag className="w-12 h-12 text-cyan-400/50 mx-auto mb-3" />
          <h3 className="font-display font-bold text-lg text-[#082836]">No se encontraron productos</h3>
          <p className="text-[#527585] text-sm mt-1">Intenta con otra palabra clave o limpia el filtro.</p>
          <button
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
          {/* Navigation Arrows with 3D Depth */}
          <button
            onClick={handlePrev}
            className="absolute left-1 md:left-6 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-white hover:bg-cyan-600 text-[#0891b2] hover:text-white border border-[#bce2ee] hover:border-cyan-600 flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-xl shadow-cyan-950/10 cursor-pointer"
            aria-label="Producto anterior"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={handleNext}
            className="absolute right-1 md:right-6 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-white hover:bg-cyan-600 text-[#0891b2] hover:text-white border border-[#bce2ee] hover:border-cyan-600 flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-xl shadow-cyan-950/10 cursor-pointer"
            aria-label="Producto siguiente"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* 3D Track Stage with Perspective */}
          <div className="relative w-full h-[520px] sm:h-[555px] flex items-center justify-center perspective-1200 overflow-visible select-none">
            {/* 3D Circular Ambient Pedestal Floor Shadow */}
            <div className="absolute bottom-6 w-[560px] h-[80px] bg-gradient-to-r from-transparent via-[#0891b2]/10 to-transparent rounded-full blur-xl pointer-events-none" />

            <div className="relative w-full h-full flex items-center justify-center preserve-3d">
              {filteredProducts.map((prod, index) => {
                let offset = index - currentIndex;
                const total = filteredProducts.length;
                if (offset > total / 2) offset -= total;
                if (offset < -total / 2) offset += total;

                const absOffset = Math.abs(offset);
                const isActive = offset === 0;
                const isWishlisted = wishlist.includes(prod.id);

                if (absOffset > 2) {
                  return null;
                }

                // Smooth 3D transforms
                const xOffset = offset * (window.innerWidth < 640 ? 155 : 275);
                const zOffset = -absOffset * (window.innerWidth < 640 ? 120 : 160);
                const rotY = offset * -28;
                const scale = Math.max(0.72, 1 - absOffset * 0.12);
                const opacity = Math.max(0.45, 1 - absOffset * 0.25);
                const zIndex = 30 - absOffset * 5;

                return (
                  <div
                    key={prod.id}
                    onClick={() => {
                      if (!isActive) setCurrentIndex(index);
                    }}
                    style={{
                      transform: `translate3d(${xOffset}px, 0, ${zOffset}px) rotateY(${rotY}deg) scale(${scale})`,
                      opacity,
                      zIndex,
                    }}
                    className="absolute w-[300px] sm:w-[335px] h-[465px] sm:h-[495px] transition-all duration-700 ease-out cursor-pointer"
                  >
                    <Product3DCard
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

          {/* Dots Indicator */}
          <div className="flex justify-center items-center gap-2 mt-4">
            {filteredProducts.map((_, idx) => (
              <button
                key={idx}
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

          {/* Synchronized Product Spotlight Bar below carousel with 3D Inspection CTA */}
          {currentProduct && (
            <div className="mt-8 p-6 sm:p-7 rounded-3xl bg-white border border-[#c8e4ed] max-w-4xl mx-auto shadow-xl shadow-cyan-950/05 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-1.5 flex-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#0891b2] uppercase tracking-wider">
                    {currentProduct.category || "Formulación Oficial"}
                  </span>
                  <span className="text-[#c8e4ed]">·</span>
                  <span className="text-xs text-[#0284c7] font-bold">Registro Sanitario en Bolivia</span>
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
                <div>
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
                      onClick={() => onOpen3DViewer(currentProduct)}
                      className="p-3 rounded-2xl bg-[#f0f7fa] hover:bg-[#e2f3f8] text-[#0891b2] border border-[#c8e4ed] transition-colors cursor-pointer shadow-xs"
                      title="Abrir inspección 360°"
                    >
                      <Rotate3d className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => onOpenProductDetails(currentProduct)}
                    className="px-4 py-3 rounded-2xl bg-[#f0f7fa] hover:bg-[#e2f3f8] text-[#1e4659] font-bold text-xs flex items-center gap-1.5 border border-[#c8e4ed] transition-colors cursor-pointer shadow-xs"
                  >
                    <Eye className="w-4 h-4 text-[#0891b2]" />
                    <span>Ver detalles</span>
                  </button>

                  <button
                    onClick={() => onAddToCart(currentProduct.id)}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-600 via-teal-600 to-sky-700 hover:from-cyan-500 hover:to-teal-500 text-white font-display font-bold text-xs sm:text-sm tracking-wide flex items-center gap-1.5 shadow-xl shadow-cyan-950/20 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Añadir</span>
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
