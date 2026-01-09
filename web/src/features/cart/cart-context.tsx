import React, { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import { cartReducer, initialCartState } from "./cart-reducer";
import type { CartAction, CartState } from "./cart-types";
import { loadCart, saveCart } from "./cart-storage";

type CartContextValue = {
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
  totalItems: number;
  totalPrice: number;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const persisted = loadCart();
  const [state, dispatch] = useReducer(cartReducer, persisted ?? initialCartState);

  useEffect(() => {
    saveCart(state);
  }, [state]);

  const totalItems = useMemo(
    () => state.items.reduce((acc, item) => acc + item.qty, 0),
    [state.items]
  );

  const totalPrice = useMemo(
    () => state.items.reduce((acc, item) => acc + item.qty * item.price, 0),
    [state.items]
  );

  const value = useMemo(
    () => ({ state, dispatch, totalItems, totalPrice }),
    [state, totalItems, totalPrice]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return ctx;
}
