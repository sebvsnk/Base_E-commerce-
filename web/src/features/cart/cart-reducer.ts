import type { CartAction, CartState } from "./cart-types";

export const initialCartState: CartState = { items: [] };

function getMaxQty(stock?: number) {
  // If stock is unknown, behave like previous implementation.
  if (typeof stock !== "number") return 999;
  return Math.max(0, Math.min(999, stock));
}

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const quantityToAdd = action.payload.qty || 1;
      const existing = state.items.find((i) => i.id === action.payload.id);
      if (existing) {
        const max = getMaxQty(existing.stock ?? action.payload.stock);
        const nextQty = Math.min(existing.qty + quantityToAdd, max || (existing.qty + quantityToAdd));
        return {
          ...state,
          items: state.items.map((i) =>
            i.id === existing.id
              ? { ...i, qty: nextQty, stock: i.stock ?? action.payload.stock }
              : i
          ),
        };
      }
      return {
        ...state,
        items: [...state.items, { ...action.payload, qty: quantityToAdd }],
      };
    }

    case "REMOVE_ITEM":
      return { ...state, items: state.items.filter((i) => i.id !== action.payload.id) };

    case "SET_QTY": {
      const current = state.items.find((i) => i.id === action.payload.id);
      const max = getMaxQty(current?.stock);
      const capped = Math.max(1, Math.min(999, action.payload.qty));
      const qty = max > 0 ? Math.min(capped, max) : capped;
      return {
        ...state,
        items: state.items.map((i) =>
          i.id === action.payload.id ? { ...i, qty } : i
        ),
      };
    }

    case "CLEAR":
      return { items: [] };

    default:
      return state;
  }
}
