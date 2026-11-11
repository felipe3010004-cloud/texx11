import { CartItem, Product, Combo } from "./types";

const STORAGE_KEY = "teamlife_cart_v2";

type CartListener = (items: CartItem[]) => void;

export class CartModel {
  private items: CartItem[] = [];
  private listeners: Set<CartListener> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          this.items = parsed.map((item) => ({
            id: String(item.id),
            name: String(item.name || "Producto"),
            price: Number(item.price) || 0,
            quantity: Math.max(1, Number(item.quantity) || 1),
            isCombo: Boolean(item.isCombo),
            img: item.img || "",
          }));
        }
      }
    } catch (e) {
      console.warn("Error cargando carrito local:", e);
      this.items = [];
    }
  }

  private saveToStorage() {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items));
    } catch (e) {
      console.warn("Error guardando carrito local:", e);
    }
    this.notify();
  }

  public subscribe(listener: CartListener): () => void {
    this.listeners.add(listener);
    listener([...this.items]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const snapshot = [...this.items];
    this.listeners.forEach((fn) => {
      try {
        fn(snapshot);
      } catch (err) {
        console.error("Cart listener error:", err);
      }
    });
  }

  public getItems(): CartItem[] {
    return [...this.items];
  }

  public getTotalCount(): number {
    return this.items.reduce((acc, item) => acc + item.quantity, 0);
  }

  public getTotalPrice(): number {
    return this.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }

  /**
   * Agrega un producto regular del catálogo al carrito
   */
  public addProduct(product: Product, quantity: number = 1): CartItem {
    const qty = Math.max(1, quantity);
    const existingIndex = this.items.findIndex(
      (item) => item.id === product.id && item.isCombo === false
    );

    if (existingIndex >= 0) {
      this.items[existingIndex].quantity += qty;
      this.saveToStorage();
      return this.items[existingIndex];
    } else {
      const newItem: CartItem = {
        id: product.id,
        name: product.name,
        price: product.normalPrice,
        quantity: qty,
        isCombo: false,
        img: product.img,
      };
      this.items.push(newItem);
      this.saveToStorage();
      return newItem;
    }
  }

  /**
   * Agrega un combo o membresía al carrito
   */
  public addCombo(combo: Combo, quantity: number = 1): CartItem {
    const qty = Math.max(1, quantity);
    const existingIndex = this.items.findIndex(
      (item) => item.id === combo.id && item.isCombo === true
    );

    if (existingIndex >= 0) {
      this.items[existingIndex].quantity += qty;
      this.saveToStorage();
      return this.items[existingIndex];
    } else {
      const newItem: CartItem = {
        id: combo.id,
        name: combo.name,
        price: combo.comboPrice,
        quantity: qty,
        isCombo: true,
        img: combo.img,
      };
      this.items.push(newItem);
      this.saveToStorage();
      return newItem;
    }
  }

  /**
   * Actualiza la cantidad de un item distinguiendo si es combo o producto
   */
  public updateQuantity(id: string, isCombo: boolean, delta: number): void {
    const index = this.items.findIndex(
      (item) => item.id === id && Boolean(item.isCombo) === Boolean(isCombo)
    );

    if (index >= 0) {
      const newQty = this.items[index].quantity + delta;
      if (newQty <= 0) {
        this.items.splice(index, 1);
      } else {
        this.items[index].quantity = newQty;
      }
      this.saveToStorage();
    }
  }

  /**
   * Elimina un item del carrito
   */
  public removeItem(id: string, isCombo: boolean): void {
    this.items = this.items.filter(
      (item) => !(item.id === id && Boolean(item.isCombo) === Boolean(isCombo))
    );
    this.saveToStorage();
  }

  /**
   * Vacía el carrito
   */
  public clearCart(): void {
    this.items = [];
    this.saveToStorage();
  }
}

export const cartModel = new CartModel();
