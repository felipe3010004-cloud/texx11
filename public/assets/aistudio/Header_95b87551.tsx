import React, { useState } from "react";
import { ShoppingBag, Bot, User, Menu, X, Sparkles, Shield } from "lucide-react";

interface HeaderProps {
  cartCount: number;
  onOpenCart: () => void;
  onOpenAi: () => void;
  onOpenAuth: () => void;
  onOpenAdmin: () => void;
  onOpenVendor: () => void;
  userRole?: string | null;
}

export const Header: React.FC<HeaderProps> = ({
  cartCount,
  onOpenCart,
  onOpenAi,
  onOpenAuth,
  onOpenAdmin,
  onOpenVendor,
  userRole,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#f0f7fa]/95 backdrop-blur-2xl border-b border-[#c8e4ed] px-4 md:px-8 py-3.5 transition-all shadow-[0_4px_30px_rgba(8,145,178,0.06)]">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
          
          {/* Zone 1: Brand Wordmark (Cyan-Blue & Deep Navy Luxury) */}
          <a
            href="#inicio"
            onClick={(e) => {
              e.preventDefault();
              scrollTo("inicio");
            }}
            className="flex items-center gap-3 whitespace-nowrap shrink-0 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0284c7] via-[#0891b2] to-[#0d9488] p-[1.5px] shadow-md shadow-cyan-900/15 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center overflow-hidden">
                <img
                  src="https://i.ibb.co/Hphn7GnF/logo.png"
                  alt="Team Life Logo"
                  className="w-7 h-7 object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              </div>
            </div>
            <div className="leading-tight">
              <span className="font-display font-black text-xl md:text-2xl tracking-tight bg-gradient-to-r from-[#0284c7] via-[#0891b2] to-[#0d9488] bg-clip-text text-transparent">
                Team Life
              </span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#0891b2] -mt-0.5">
                Equipo Vida S.R.L.
              </span>
            </div>
          </a>

          {/* Zone 2: Navigation Links (Clean Cyan-Blue Tone) */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-semibold text-[#1e4659]">
            <button
              onClick={() => scrollTo("catalogo-3d")}
              className="hover:text-[#0891b2] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Catálogo 3D
            </button>
            <button
              onClick={() => scrollTo("membresia-vip")}
              className="hover:text-[#0284c7] text-[#0891b2] font-bold transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Membresía 40% OFF
            </button>
            <button
              onClick={() => scrollTo("combos-exclusivos")}
              className="hover:text-[#0891b2] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Combos en 3D
            </button>
            <button
              onClick={() => scrollTo("videos-oficiales")}
              className="hover:text-[#0891b2] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Videos
            </button>
            <button
              onClick={() => scrollTo("oportunidad-crecimiento")}
              className="hover:text-[#0891b2] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Redes de Mercadeo
            </button>
          </nav>

          {/* Zone 3: Action points (Single AI Assistant Guide, Portal, Cart) */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Single AI Assistant Guide Trigger */}
            <button
              onClick={onOpenAi}
              className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-[#e2f3f8] border border-[#bce2ee] text-[#0891b2] text-xs font-bold tracking-wide transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
              title="Abrir Asesoría Inteligente con Voz y Búsqueda"
            >
              <Bot className="w-4 h-4 text-[#0891b2] animate-pulse" />
              <span>Guía de Compra IA</span>
            </button>

            {/* Portal Menu or Quick Buttons */}
            {userRole === "admin" ? (
              <button
                onClick={onOpenAdmin}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#ecfeff] hover:bg-[#cffafe] border border-cyan-300 text-cyan-800 text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                <Shield className="w-3.5 h-3.5 text-cyan-600" />
                <span>Panel Admin</span>
              </button>
            ) : userRole === "vendedor" ? (
              <button
                onClick={onOpenVendor}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-[#eaf4f8] border border-[#bce2ee] text-[#082836] text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                <User className="w-3.5 h-3.5 text-[#0891b2]" />
                <span>Mi Panel</span>
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="w-10 h-10 rounded-xl bg-white hover:bg-[#eaf4f8] border border-[#bce2ee] text-[#416373] hover:text-[#0891b2] flex items-center justify-center transition-all cursor-pointer shadow-xs"
                title="Acceso distribuidores y administradores"
                aria-label="Acceder"
              >
                <User className="w-4 h-4" />
              </button>
            )}

            {/* Shopping Cart Button */}
            <button
              onClick={onOpenCart}
              className="relative w-10 h-10 rounded-xl bg-gradient-to-r from-cyan-600 to-sky-700 hover:from-cyan-500 hover:to-sky-600 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-md shadow-cyan-900/25"
              aria-label="Abrir carrito de compras"
            >
              <ShoppingBag className="w-4 h-4 text-cyan-200" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] px-1 bg-amber-500 text-white text-[11px] font-black rounded-full flex items-center justify-center shadow-lg border-2 border-white animate-bounce">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-10 h-10 rounded-xl bg-white border border-[#bce2ee] text-[#416373] flex items-center justify-center cursor-pointer"
              aria-label="Abrir menú de navegación"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-[#f0f7fa]/98 backdrop-blur-2xl pt-24 px-6 flex flex-col gap-4 animate-in fade-in duration-200 shadow-2xl">
          <div className="text-xs font-bold uppercase tracking-wider text-[#416373] mb-2">
            Navegación Oficial
          </div>
          <button
            onClick={() => scrollTo("catalogo-3d")}
            className="text-left py-3 px-4 rounded-xl bg-white border border-[#c8e4ed] text-[#082836] font-semibold text-base transition-colors"
          >
            Catálogo 3D de Productos
          </button>
          <button
            onClick={() => scrollTo("membresia-vip")}
            className="text-left py-3 px-4 rounded-xl bg-[#ecfeff] border border-cyan-200 text-[#0284c7] font-bold text-base transition-colors flex items-center justify-between"
          >
            <span>Membresía 40% de Descuento</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </button>
          <button
            onClick={() => scrollTo("combos-exclusivos")}
            className="text-left py-3 px-4 rounded-xl bg-white border border-[#c8e4ed] text-[#082836] font-semibold text-base transition-colors"
          >
            Combos en 3D
          </button>
          <button
            onClick={() => scrollTo("videos-oficiales")}
            className="text-left py-3 px-4 rounded-xl bg-white border border-[#c8e4ed] text-[#082836] font-semibold text-base transition-colors"
          >
            Videos y Testimonios
          </button>
          <button
            onClick={() => scrollTo("oportunidad-crecimiento")}
            className="text-left py-3 px-4 rounded-xl bg-white border border-[#c8e4ed] text-[#082836] font-semibold text-base transition-colors"
          >
            Redes de Mercadeo & Oportunidad
          </button>
          <div className="pt-4 border-t border-[#c8e4ed] flex flex-col gap-3">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAi();
              }}
              className="py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 via-teal-600 to-sky-700 text-white font-bold text-center flex items-center justify-center gap-2 shadow-lg"
            >
              <Bot className="w-5 h-5 text-cyan-200" />
              <span>Abrir Guía Inteligente con Voz</span>
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAuth();
              }}
              className="py-3 px-4 rounded-xl bg-white border border-[#bce2ee] text-[#416373] font-bold text-center"
            >
              Acceso a Distribuidores & Admin
            </button>
          </div>
        </div>
      )}
    </>
  );
};
