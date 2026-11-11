import { cartModel } from "../models/cartModel";
import { productsModel } from "../models/productsModel";
import { combosModel } from "../models/combosModel";
import { CartItem, Product, Combo } from "../models/types";

type ToastCallback = (title: string, message: string, type?: "success" | "info" | "warning") => void;

export class CartController {
  private toastCallback: ToastCallback | null = null;
  private openCartCallback: (() => void) | null = null;

  public setToastCallback(fn: ToastCallback) {
    this.toastCallback = fn;
  }

  public setOpenCartCallback(fn: () => void) {
    this.openCartCallback = fn;
  }

  /**
   * Resuelve el producto por su ID y lo añade al carrito
   */
  public handleAddToCart(productId: string, quantity: number = 1): boolean {
    const product = productsModel.getById(productId);
    if (!product) {
      console.error(`Producto con ID ${productId} no encontrado en el catálogo.`);
      if (this.toastCallback) {
        this.toastCallback("Error", "No se encontró el producto en el catálogo.", "warning");
      }
      return false;
    }

    const item = cartModel.addProduct(product, quantity);

    if (this.toastCallback) {
      this.toastCallback(
        "¡Agregado al Carrito!",
        `${product.name} (Bs ${product.normalPrice.toFixed(0)}) añadido exitosamente.`,
        "success"
      );
    }

    // Feedback táctil en móviles
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(40);
      } catch (e) {
        // Ignorar
      }
    }

    return true;
  }

  /**
   * Resuelve el combo por su ID y lo añade al carrito con isCombo: true
   */
  public handleAddComboToCart(comboId: string, quantity: number = 1): boolean {
    const combo = combosModel.getById(comboId);
    if (!combo) {
      console.error(`Combo con ID ${comboId} no encontrado en el catálogo.`);
      if (this.toastCallback) {
        this.toastCallback("Error", "No se encontró el combo en el catálogo.", "warning");
      }
      return false;
    }

    const item = cartModel.addCombo(combo, quantity);

    if (this.toastCallback) {
      this.toastCallback(
        "¡Combo Agregado!",
        `${combo.name} (Bs ${combo.comboPrice.toFixed(0)}) añadido a tu pedido.`,
        "success"
      );
    }

    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(40);
      } catch (e) {
        // Ignorar
      }
    }

    return true;
  }

  /**
   * Actualiza la cantidad distinguiendo si es combo o producto
   */
  public handleUpdateQuantity(id: string, isCombo: boolean, delta: number) {
    cartModel.updateQuantity(id, isCombo, delta);
  }

  /**
   * Elimina un item del carrito
   */
  public handleRemoveItem(id: string, isCombo: boolean) {
    cartModel.removeItem(id, isCombo);
  }

  /**
   * Vacía el carrito
   */
  public handleClearCart() {
    cartModel.clearCart();
  }

  /**
   * Obtiene todos los items
   */
  public getItems(): CartItem[] {
    return cartModel.getItems();
  }

  /**
   * Obtiene la cuenta total
   */
  public getTotalCount(): number {
    return cartModel.getTotalCount();
  }

  /**
   * Obtiene el monto total
   */
  public getTotalPrice(): number {
    return cartModel.getTotalPrice();
  }

  /**
   * Suscribe a cambios en el carrito
   */
  public subscribe(listener: (items: CartItem[]) => void) {
    return cartModel.subscribe(listener);
  }

  public openCart() {
    if (this.openCartCallback) {
      this.openCartCallback();
    }
  }
}

export const cartController = new CartController();
