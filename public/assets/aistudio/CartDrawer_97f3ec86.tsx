import React from "react";
import { CartItem } from "../types";
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, ShieldCheck } from "lucide-react";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, isCombo: boolean, delta: number) => void;
  onRemoveItem: (id: string, isCombo: boolean) => void;
  onCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
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

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-[#c8e4ed] text-[#082836] flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
          
          {/* Header */}
          <div className="p-6 border-b border-[#c8e4ed] flex items-center justify-between bg-[#f0f7fa]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-100 border border-cyan-300/60 flex items-center justify-center text-cyan-800 shadow-sm">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-black text-lg text-[#082836]">Mi Pedido</h3>
                <span className="text-xs text-slate-500 font-medium">{totalCount} artículo(s)</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-[#c8e4ed] flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Cerrar carrito"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Items Container */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {items.length === 0 ? (
              <div className="text-center py-20 px-4 space-y-3">
                <div className="w-16 h-16 rounded-3xl bg-cyan-50 flex items-center justify-center mx-auto text-cyan-500">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h4 className="font-display font-bold text-base text-[#082836]">Tu carrito está vacío</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                  Explora nuestra vitrina 3D y añade productos de nutrición celular o combos exclusivos para iniciar tu pedido con 40% OFF.
                </p>
                <button
                  onClick={onClose}
                  className="mt-4 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-[#0284c7] hover:from-cyan-700 hover:to-[#0369a1] text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
                >
                  Continuar explorando
                </button>
              </div>
            ) : (
              items.map((item, index) => (
                <div
                  key={`${item.id}-${item.isCombo ? "combo" : "prod"}-${index}`}
                  className="p-4 rounded-2xl bg-[#f0f7fa] border border-[#c8e4ed] flex items-center justify-between gap-3 group hover:border-cyan-400 transition-all shadow-sm"
                >
                  <div className="space-y-1 flex-1 pr-2">
                    <div className="flex items-center gap-1.5">
                      {item.isCombo && (
                        <span className="text-[9px] font-black uppercase text-amber-900 bg-amber-200/80 px-1.5 py-0.5 rounded">
                          Combo
                        </span>
                      )}
                      <h4 className="font-display font-bold text-sm text-[#082836] line-clamp-1">
                        {item.name}
                      </h4>
                    </div>

                    <div className="text-xs text-cyan-800 font-bold font-mono">
                      Bs {item.price.toFixed(0)} c/u
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-white border border-[#c8e4ed] rounded-xl p-1 shadow-sm">
                      <button
                        onClick={() => onUpdateQuantity(item.id, item.isCombo, -1)}
                        className="w-6 h-6 rounded-lg hover:bg-cyan-50 flex items-center justify-center text-slate-600 cursor-pointer"
                        title="Disminuir"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold font-mono text-[#082836]">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.id, item.isCombo, 1)}
                        className="w-6 h-6 rounded-lg hover:bg-cyan-50 flex items-center justify-center text-slate-600 cursor-pointer"
                        title="Aumentar"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => onRemoveItem(item.id, item.isCombo)}
                      className="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 flex items-center justify-center transition-colors cursor-pointer"
                      title="Eliminar del pedido"
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
            <div className="p-6 border-t border-[#c8e4ed] bg-[#f0f7fa] space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Subtotal ({totalCount} artículos)</span>
                <span className="font-mono font-bold text-[#082836]">Bs {total.toFixed(0)}</span>
              </div>

              <div className="flex items-center justify-between font-display">
                <span className="text-base text-[#082836] font-bold">Total a pagar</span>
                <span className="text-2xl font-black text-cyan-800">
                  <small className="text-xs text-slate-500 mr-1 font-sans">Bs</small>
                  {total.toFixed(0)}
                </span>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-cyan-900 bg-cyan-50 p-2.5 rounded-xl border border-cyan-200">
                <ShieldCheck className="w-4 h-4 shrink-0 text-cyan-700" />
                <span>Pedido formal directo verificado con distribuidor oficial</span>
              </div>

              <button
                onClick={onCheckout}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#082836] via-[#0891b2] to-[#0284c7] hover:from-[#0b3c4f] hover:to-[#0369a1] text-white font-display font-black text-sm tracking-wide flex items-center justify-center gap-2.5 shadow-xl shadow-cyan-900/20 transition-all hover:scale-102 active:scale-98 cursor-pointer"
              >
                <span>Confirmar pedido vía WhatsApp</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
