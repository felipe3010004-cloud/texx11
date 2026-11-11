/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { ShoppingBag } from "lucide-react";
import { productsModel } from "./models/productsModel";
import { combosModel } from "./models/combosModel";
import { cartModel } from "./models/cartModel";
import { cartController } from "./controllers/cartController";
import { authController } from "./controllers/authController";
import { COMPANY_INFO, OFFICIAL_VIDEOS, OFFICIAL_TESTIMONIALS } from "./models/companyModel";
import { CartItem, Product, Combo, ToastMessage, PagosyaQrResponse } from "./models/types";

// Views
import { ToastView } from "./views/ToastView";
import { HeaderView } from "./views/HeaderView";
import { HeroView } from "./views/HeroView";
import { Carousel3DView } from "./views/Carousel3DView";
import { VipBannerView } from "./views/VipBannerView";
import { CombosSectionView } from "./views/CombosSectionView";
import { BenefitsView } from "./views/BenefitsView";
import { NetworkMarketingView } from "./views/NetworkMarketingView";
import { VideosView } from "./views/VideosView";
import { TestimonialsView } from "./views/TestimonialsView";
import { CartDrawerView } from "./views/CartDrawerView";
import { OrderModalView } from "./views/OrderModalView";
import { PagosyaQrModalView } from "./views/PagosyaQrModalView";
import { ProductDetailModalView } from "./views/ProductDetailModalView";
import { Product3DViewerModalView } from "./views/Product3DViewerModalView";
import { ImageModalView } from "./views/ImageModalView";
import { UnifiedAiAssistantView } from "./views/UnifiedAiAssistantView";
import { LoginModalView } from "./views/LoginModalView";
import { VendorPanelView } from "./views/VendorPanelView";
import { AdminPanelView } from "./views/AdminPanelView";
import { StaticQrPaymentModalView } from "./views/StaticQrPaymentModalView";

export default function App() {
  // State from Models
  const [products, setProducts] = useState<Product[]>(() => productsModel.getAll());
  const [combos] = useState<Combo[]>(() => combosModel.getAll());
  const [cartItems, setCartItems] = useState<CartItem[]>(() => cartModel.getItems());
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("teamlife_wishlist");
      return saved ? JSON.parse(saved) : ["tl-colageno", "tl-coffeelife"];
    } catch {
      return ["tl-colageno", "tl-coffeelife"];
    }
  });

  // User & Distributor Attribution State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [referrerId, setReferrerId] = useState<string | null>(null);
  const [vendedorWhatsapp, setVendedorWhatsapp] = useState<string>(COMPANY_INFO.defaultWhatsapp);

  // Modal & Drawer Visibility States
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isVendorOpen, setIsVendorOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isAiExpanded, setIsAiExpanded] = useState(false);

  // PagosYa QR State
  const [pagosyaQrData, setPagosyaQrData] = useState<PagosyaQrResponse | null>(null);
  const [isPagosyaQrOpen, setIsPagosyaQrOpen] = useState(false);
  const [pagosyaOrderTotal, setPagosyaOrderTotal] = useState(0);

  // Static QR State
  const [staticQrModalData, setStaticQrModalData] = useState<{
    orderId: string;
    total: number;
    clientName: string;
    clientPhone: string;
    vendedorId?: string | null;
  } | null>(null);
  const [isStaticQrOpen, setIsStaticQrOpen] = useState(false);

  // Inspection & Detail States
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [viewerItem, setViewerItem] = useState<{ item: Product | Combo; isCombo: boolean } | null>(null);
  const [imageModalUrl, setImageModalUrl] = useState<string | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (title: string, message: string, type: "success" | "info" | "warning" = "success") => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: ToastMessage = {
      id,
      title,
      message,
      type,
      actionLabel: "Ver Carrito",
      onAction: () => setIsCartOpen(true),
    };
    setToasts((prev) => [...prev.slice(-3), newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Connect cartController to toast notification & open cart
  useEffect(() => {
    cartController.setToastCallback(addToast);
    cartController.setOpenCartCallback(() => setIsCartOpen(true));
  }, []);

  // Listen for Firebase Auth persistent session
  useEffect(() => {
    const unsubscribe = authController.onAuthStateChanged((user, role) => {
      if (user) {
        setCurrentUser(user);
        setUserRole(role);
      } else {
        setCurrentUser(null);
        setUserRole(null);
      }
    });
    return unsubscribe;
  }, []);

  // Subscribe to Cart Model reactive updates
  useEffect(() => {
    const unsubscribe = cartModel.subscribe((items) => {
      setCartItems(items);
    });
    return unsubscribe;
  }, []);

  // Parse Distributor Affiliate Parameter (?ref=...) and verify authorization
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get("ref");
      if (ref) {
        authController.getSellerById(ref).then((seller) => {
          if (seller) {
            if (seller.status === "autorizado") {
              setReferrerId(seller.nombreCompleto || seller.id);
              if (seller.phone) {
                setVendedorWhatsapp(seller.phone);
              }
              addToast(
                "Distribuidor Autorizado",
                `Estás en la vitrina de ${seller.nombreCompleto}. Tus pedidos y consultas serán atendidos directamente por su WhatsApp oficial.`,
                "info"
              );
            } else {
              setVendedorWhatsapp(COMPANY_INFO.defaultWhatsapp);
              setReferrerId(null);
              addToast(
                "Aviso Oficial Team Life",
                `El distribuidor enlazado actualmente no se encuentra activo o autorizado (${seller.status}). Tus pedidos serán atendidos directamente por la Central Oficial de Team Life con garantía y factura fiscal.`,
                "warning"
              );
            }
          }
        });
      }
    }
  }, []);

  // Save wishlist changes
  useEffect(() => {
    try {
      localStorage.setItem("teamlife_wishlist", JSON.stringify(wishlist));
    } catch {
      // Ignorar
    }
  }, [wishlist]);

  // Wishlist handler
  const handleToggleWishlist = (id: string) => {
    setWishlist((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Cart Handlers via CartController
  const handleAddToCart = (productId: string) => {
    cartController.handleAddToCart(productId);
    setIsCartOpen(true);
  };

  const handleAddComboToCart = (comboId: string) => {
    cartController.handleAddComboToCart(comboId);
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (id: string, isCombo: boolean, delta: number) => {
    cartController.handleUpdateQuantity(id, isCombo, delta);
  };

  const handleRemoveItem = (id: string, isCombo: boolean) => {
    cartController.handleRemoveItem(id, isCombo);
  };

  const handleCheckout = () => {
    setIsCartOpen(false);
    setIsOrderModalOpen(true);
  };

  const handleOrderSuccess = () => {
    cartController.handleClearCart();
    addToast(
      "¡Pedido Iniciado con Éxito!",
      "Tu orden oficial ha sido registrada y enviada a WhatsApp.",
      "success"
    );
  };

  // Auth Handlers
  const handleLoginSuccess = (user: any, role: string) => {
    setCurrentUser(user);
    setUserRole(role);
    if (role === "admin") {
      setIsAdminOpen(true);
    } else {
      setIsVendorOpen(true);
    }
    addToast("¡Bienvenido!", `Sesión iniciada correctamente como ${role}.`, "success");
  };

  const handleLogout = async () => {
    await authController.logout();
    setCurrentUser(null);
    setUserRole(null);
    setIsAdminOpen(false);
    setIsVendorOpen(false);
    addToast("Sesión Cerrada", "Has salido del portal oficial.", "info");
  };

  const handleRefreshProducts = () => {
    setProducts(productsModel.getAll());
  };

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="min-h-screen bg-[#f0f7fa] text-[#082836] font-sans flex flex-col selection:bg-cyan-600 selection:text-white">
      {/* Toast Notifications */}
      <ToastView toasts={toasts} onDismiss={removeToast} />

      {/* Top Header Navigation */}
      <HeaderView
        cartCount={cartCount}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAi={() => {
          setIsAiOpen(true);
          setIsAiExpanded(true);
        }}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenVendor={() => setIsVendorOpen(true)}
        userRole={userRole}
      />

      {/* Main Page Views */}
      <main className="flex-1">
        {/* 1. Hero View */}
        <HeroView
          onExploreProducts={() => scrollTo("catalogo-3d")}
          onExploreCombos={() => scrollTo("combos-exclusivos")}
          onOpenAi={() => {
            setIsAiOpen(true);
            setIsAiExpanded(true);
          }}
        />

        {/* 2. 3D Carousel View for 5 Products */}
        <Carousel3DView
          products={products}
          wishlist={wishlist}
          onToggleWishlist={handleToggleWishlist}
          onAddToCart={handleAddToCart}
          onOpenImageModal={(url) => setImageModalUrl(url)}
          onOpenProductDetails={(prod) => setDetailProduct(prod)}
          onOpen3DViewer={(prod) => setViewerItem({ item: prod, isCombo: false })}
        />

        {/* 3. VIP Membership 40% OFF Banner */}
        <VipBannerView
          vendedorWhatsapp={vendedorWhatsapp}
          onAddKitToCart={() => handleAddComboToCart("kit-de-bienvenida")}
        />

        {/* 4. 3D Combos & Business Packs Section */}
        <CombosSectionView
          combos={combos}
          wishlist={wishlist}
          onToggleWishlist={handleToggleWishlist}
          onAddComboToCart={handleAddComboToCart}
          onOpenImageModal={(url) => setImageModalUrl(url)}
          onOpenCombo3DViewer={(comb) => setViewerItem({ item: comb, isCombo: true })}
        />

        {/* 5. Pillars & Benefits */}
        <BenefitsView />

        {/* 6. Network Marketing & Founders Info (Julian Rodriguez & Mery Ruiz, Legalidad) */}
        <NetworkMarketingView vendedorWhatsapp={vendedorWhatsapp} />

        {/* 7. Videos Gallery */}
        <VideosView videos={OFFICIAL_VIDEOS} />

        {/* 8. Verified Testimonials in Bolivia */}
        <TestimonialsView testimonials={OFFICIAL_TESTIMONIALS} />
      </main>

      {/* Footer */}
      <footer className="bg-[#082836] text-white py-14 px-4 md:px-8 border-t border-cyan-900/50">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 text-left">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-600 flex items-center justify-center font-bold text-sm">
                TL
              </div>
              <span className="font-display font-black text-xl text-white">Team Life</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {COMPANY_INFO.name} ({COMPANY_INFO.commercialName}). Empresa boliviana líder en nutrición celular, liderazgo y bienestar integral.
            </p>
            <div className="text-[11px] text-cyan-300 font-mono">
              NIT: {COMPANY_INFO.nit} · SENASAG 166/2025
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="font-bold text-white uppercase tracking-wider text-sm mb-2 text-cyan-400">
              Enlaces Rápidos
            </div>
            <div>
              <button onClick={() => scrollTo("catalogo-3d")} className="hover:text-cyan-300 cursor-pointer">
                Catálogo 3D Oficial
              </button>
            </div>
            <div>
              <button onClick={() => scrollTo("membresia-vip")} className="hover:text-cyan-300 cursor-pointer">
                Membresía 40% OFF
              </button>
            </div>
            <div>
              <button onClick={() => scrollTo("combos-exclusivos")} className="hover:text-cyan-300 cursor-pointer">
                Combos Empresariales (Hasta 87%)
              </button>
            </div>
            <div>
              <button onClick={() => scrollTo("oportunidad-crecimiento")} className="hover:text-cyan-300 cursor-pointer">
                Plan de Compensación
              </button>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="font-bold text-white uppercase tracking-wider text-sm mb-2 text-cyan-400">
              Cobertura en Bolivia
            </div>
            <p className="text-slate-400 leading-relaxed">
              Despachos asegurados con guía a La Paz, Santa Cruz, Cochabamba, Oruro, Potosí, Chuquisaca, Tarija, Beni y Pando.
            </p>
            <div className="text-slate-400">
              Líderes Fundadores: <span className="text-white font-semibold">{COMPANY_INFO.founders}</span>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="font-bold text-white uppercase tracking-wider text-sm mb-2 text-cyan-400">
              Atención Directa
            </div>
            <p className="text-slate-400">
              ¿Deseas atención 1 a 1 para compra o afiliación?
            </p>
            <button
              onClick={() => {
                const msg = encodeURIComponent("¡Hola! Deseo contactarme con un asesor oficial de Team Life.");
                window.open(`https://wa.me/${vendedorWhatsapp}?text=${msg}`, "_blank");
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-[#0284c7] hover:from-cyan-500 hover:to-[#0369a1] text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              Contactar por WhatsApp
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-cyan-900/40 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            © {new Date().getFullYear()} {COMPANY_INFO.name}. Todos los derechos reservados.
          </div>
          <div className="text-cyan-400/80 font-mono text-[11px]">
            Juntos Todo Es Posible
          </div>
        </div>
      </footer>

      {/* MODALS & DRAWERS */}

      {/* Cart Drawer */}
      <CartDrawerView
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={handleCheckout}
        onPayWithPagosya={() => {
          setIsCartOpen(false);
          setIsOrderModalOpen(true);
        }}
      />

      {/* Order Modal (Final Checkout via WhatsApp or PagosYa QR) */}
      <OrderModalView
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        items={cartItems}
        vendedorWhatsapp={vendedorWhatsapp}
        referrerId={referrerId}
        onOrderSuccess={handleOrderSuccess}
        onOpenPagosyaQr={(data, total) => {
          setPagosyaQrData(data);
          setPagosyaOrderTotal(total);
          setIsPagosyaQrOpen(true);
          addToast(
            "Código QR Generado (Sandbox)",
            `Se ha generado el QR para el pedido ${data.order_id}. Recuerda que es un QR ficticio de prueba.`,
            "info"
          );
        }}
        onOpenStaticQr={(orderData) => {
          setStaticQrModalData(orderData);
          setIsStaticQrOpen(true);
          addToast(
            "Pago mediante QR Estático",
            `Pedido #${orderData.orderId} registrado. Escanea el QR oficial de Banco Unión y sube tu comprobante.`,
            "info"
          );
        }}
      />

      {/* Static QR Bank Payment Modal */}
      {staticQrModalData && (
        <StaticQrPaymentModalView
          isOpen={isStaticQrOpen}
          onClose={() => setIsStaticQrOpen(false)}
          orderId={staticQrModalData.orderId}
          total={staticQrModalData.total}
          clientName={staticQrModalData.clientName}
          clientPhone={staticQrModalData.clientPhone}
          clientUid={currentUser?.uid}
          vendedorId={staticQrModalData.vendedorId}
          vendedorNombre={referrerId}
          onPaymentSubmitted={() => {
            addToast(
              "Comprobante Enviado Correctamente",
              "Tu comprobante está en verificación. Revisaremos el ingreso bancario para preparar tu pedido.",
              "success"
            );
          }}
        />
      )}

      {/* PagosYa QR Checkout Modal (Embedded Sandbox) */}
      <PagosyaQrModalView
        isOpen={isPagosyaQrOpen}
        onClose={() => setIsPagosyaQrOpen(false)}
        qrData={pagosyaQrData}
        orderTotal={pagosyaOrderTotal}
        items={cartItems}
        vendedorWhatsapp={vendedorWhatsapp}
        onBackToCart={() => {
          setIsPagosyaQrOpen(false);
          setIsCartOpen(true);
        }}
      />

      {/* Product Detail Modal */}
      <ProductDetailModalView
        product={detailProduct}
        isOpen={Boolean(detailProduct)}
        onClose={() => setDetailProduct(null)}
        isWishlisted={detailProduct ? wishlist.includes(detailProduct.id) : false}
        onToggleWishlist={handleToggleWishlist}
        onAddToCart={handleAddToCart}
        onOpenImageModal={(url) => setImageModalUrl(url)}
        onOpen3DViewer={(prod) => {
          setDetailProduct(null);
          setViewerItem({ item: prod, isCombo: false });
        }}
      />

      {/* 360° 3D Turntable Modal */}
      <Product3DViewerModalView
        item={viewerItem?.item || null}
        isCombo={viewerItem?.isCombo || false}
        isOpen={Boolean(viewerItem)}
        onClose={() => setViewerItem(null)}
        onAddToCart={(id, isCombo) => {
          if (isCombo) {
            handleAddComboToCart(id);
          } else {
            handleAddToCart(id);
          }
        }}
        isWishlisted={viewerItem ? wishlist.includes(viewerItem.item.id) : false}
        onToggleWishlist={handleToggleWishlist}
      />

      {/* Image Zoom Modal */}
      <ImageModalView
        imgUrl={imageModalUrl}
        onClose={() => setImageModalUrl(null)}
      />

      {/* Unified AI Assistant with Voice */}
      <UnifiedAiAssistantView
        products={products}
        combos={combos}
        isOpen={isAiOpen}
        isExpanded={isAiExpanded}
        onClose={() => setIsAiOpen(false)}
        onOpen={() => {
          setIsAiOpen(true);
          setIsAiExpanded(false);
        }}
        onToggleExpand={() => setIsAiExpanded((prev) => !prev)}
        onAddToCart={handleAddToCart}
        onAddComboToCart={handleAddComboToCart}
        vendedorWhatsapp={vendedorWhatsapp}
      />

      {/* Login Modal */}
      <LoginModalView
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Vendor Panel */}
      {currentUser && (
        <VendorPanelView
          isOpen={isVendorOpen}
          onClose={() => setIsVendorOpen(false)}
          vendorUid={currentUser.uid}
          vendorEmail={currentUser.email || "distribuidor@teamlife.com"}
          onLogout={handleLogout}
        />
      )}

      {/* Admin Panel */}
      <AdminPanelView
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        products={products}
        onRefreshProducts={handleRefreshProducts}
        onLogout={handleLogout}
        currentUser={currentUser}
      />
      {/* Floating Mobile Cart Pill */}
      {cartCount > 0 && !isCartOpen && !isAiOpen && (
        <aside
          aria-label="Carrito flotante"
          className="fixed bottom-5 left-4 z-40 sm:hidden animate-in fade-in slide-in-from-bottom-3 duration-300"
        >
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-cyan-600 via-teal-600 to-[#0284c7] text-white font-display font-bold text-xs shadow-2xl shadow-cyan-950/40 border-2 border-white/90 cursor-pointer active:scale-95 transition-all touch-manipulation"
          >
            <div className="relative">
              <ShoppingBag className="w-4 h-4 text-white" />
              <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-400 text-[#082836] font-black text-[10px] flex items-center justify-center border border-white">
                {cartCount}
              </span>
            </div>
            <span>
              Ver Carrito · Bs {cartItems.reduce((acc, i) => acc + i.price * i.quantity, 0).toFixed(0)}
            </span>
          </button>
        </aside>
      )}
    </div>
  );
}
