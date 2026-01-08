import type { CartState } from "./cart-types";

const KEY = "shop_cart_v1";

export function loadCart(): CartState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CartState;
  } catch {
    return null;
  }
}

export function saveCart(state: CartState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // ignorar
  }
}
