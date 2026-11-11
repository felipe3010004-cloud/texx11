import React from "react";
import { CartItem } from "../models/types";
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, ShieldCheck, QrCode } from "lucide-react";

interface CartDrawerViewProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, isCombo: boolean, delta: number) => void;
  onRemoveItem: (id: string, isCombo: boolean) => void;
  onCheckout: () => void;
  onPayWithPagosya?: () => void;
}

export const CartDrawerView: React.FC<CartDrawerViewProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  onPayWithPagosya,
}) => {
  if (!isOpen) return null;

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-[#082836]/60 backdrop-blur-sm transition-opacity"
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-0 sm:pl-6">
        <div className="w-screen max-w-full sm:max-w-md bg-white border-l border-[#c8e4ed] text-[#082836] flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 h-full">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-[#c8e4ed] flex items-center justify-between bg-[#f0f7fa]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-100 border border-cyan-300/60 flex items-center justify-center text-cyan-800 shadow-sm shrink-0">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h3 className="font-display font-black text-base sm:text-lg text-[#082836]">Mi Pedido</h3>
                <span className="text-xs text-slate-500 font-medium">{totalCount} artículo(s)</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-[#c8e4ed] flex items-center justify-center transition-colors cursor-pointer touch-manipulation"
              aria-label="Cerrar carrito"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Items Container */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 text-left overscroll-contain">
            {items.length === 0 ? (
              <div className="text-center py-16 px-4 space-y-3">
                <div className="w-16 h-16 rounded-3xl bg-cyan-50 flex items-center justify-center mx-auto text-cyan-500">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h4 className="font-display font-bold text-base text-[#082836]">Tu carrito está vacío</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                  Explora nuestra vitrina 3D y añade productos de nutrición celular o combos exclusivos para iniciar tu pedido con 40% OFF.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-4 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-[#0284c7] hover:from-cyan-700 hover:to-[#0369a1] text-white text-xs font-bold transition-colors cursor-pointer shadow-sm touch-manipulation"
                >
                  Continuar explorando
                </button>
              </div>
            ) : (
              items.map((item, index) => (
                <div
                  key={`${item.id}-${item.isCombo ? "combo" : "prod"}-${index}`}
                  className="p-3 sm:p-4 rounded-2xl bg-[#f0f7fa] border border-[#c8e4ed] flex items-center justify-between gap-3 group hover:border-cyan-400 transition-all shadow-xs"
                >
                  {/* Thumbnail */}
                  {item.img && (
                    <div className="w-12 h-12 rounded-xl bg-white border border-[#c8e4ed] p-1 flex items-center justify-center shrink-0">
                      <img
                        src={item.img}
                        alt={item.name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/assets/aistudio/logo_f976621f.png";
                        }}
                      />
                    </div>
                  )}

                  <div className="space-y-0.5 flex-1 min-w-0 pr-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {item.isCombo && (
                        <span className="text-[9px] font-black uppercase text-amber-900 bg-amber-200/80 px-1.5 py-0.5 rounded">
                          Combo
                        </span>
                      )}
                      <h4 className="font-display font-bold text-xs sm:text-sm text-[#082836] truncate">
                        {item.name}
                      </h4>
                    </div>

                    <div className="text-xs text-[#0891b2] font-bold font-mono">
                      Bs {item.price.toFixed(0)} <span className="text-[10px] text-slate-400 font-sans font-normal">c/u</span>
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center bg-white border border-[#c8e4ed] rounded-xl p-0.5 shadow-xs">
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.id, item.isCombo, -1)}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg hover:bg-cyan-50 flex items-center justify-center text-slate-600 active:scale-90 cursor-pointer touch-manipulation"
                        title="Disminuir"
                        aria-label="Disminuir cantidad"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-7 sm:w-8 text-center text-xs font-bold font-mono text-[#082836]">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.id, item.isCombo, 1)}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg hover:bg-cyan-50 flex items-center justify-center text-slate-600 active:scale-90 cursor-pointer touch-manipulation"
                        title="Aumentar"
                        aria-label="Aumentar cantidad"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.id, item.isCombo)}
                      className="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 flex items-center justify-center transition-colors cursor-pointer active:scale-90 touch-manipulation"
                      title="Eliminar del pedido"
                      aria-label="Eliminar ítem"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Summary & Checkout */}
          {items.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-[#c8e4ed] bg-[#f0f7fa] space-y-3 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Subtotal ({totalCount} artículos)</span>
                <span className="font-mono font-bold text-[#082836]">Bs {total.toFixed(0)}</span>
              </div>

              <div className="flex items-center justify-between font-display">
                <span className="text-sm sm:text-base text-[#082836] font-bold">Total a pagar</span>
                <span className="text-xl sm:text-2xl font-black text-[#0891b2]">
                  <small className="text-xs text-slate-500 mr-1 font-sans">Bs</small>
                  {total.toFixed(0)}
                </span>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-cyan-900 bg-cyan-50 p-2 sm:p-2.5 rounded-xl border border-cyan-200 text-left">
                <ShieldCheck className="w-4 h-4 shrink-0 text-cyan-700" />
                <span>Pedido formal directo verificado con distribuidor oficial</span>
              </div>

              <div className="space-y-2 pt-1">
                {onPayWithPagosya && (
                  <button
                    type="button"
                    onClick={onPayWithPagosya}
                    className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-cyan-600 via-teal-600 to-sky-700 hover:from-cyan-500 hover:to-teal-500 text-white font-display font-black text-xs sm:text-sm tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/20 transition-all hover:scale-102 active:scale-98 cursor-pointer touch-manipulation"
                  >
                    <QrCode className="w-4 h-4 text-white" />
                    <span>Pagar con QR (PagosYa Sandbox)</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onCheckout}
                  className="w-full py-3 px-5 rounded-2xl bg-[#082836] hover:bg-[#0b3c4f] text-white font-display font-bold text-xs sm:text-sm tracking-wide flex items-center justify-center gap-2 shadow-md transition-all hover:scale-101 active:scale-98 cursor-pointer touch-manipulation"
                >
                  <span>Finalizar y coordinar vía WhatsApp</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
