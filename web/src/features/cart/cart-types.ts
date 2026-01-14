export type CartItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  qty: number;
  stock?: number;
};

export type CartState = {
  items: CartItem[];
};

export type CartAction =
  | { type: "ADD_ITEM"; payload: Omit<CartItem, "qty"> & { qty?: number } }
  | { type: "REMOVE_ITEM"; payload: { id: string } }
  | { type: "SET_QTY"; payload: { id: string; qty: number } }
  | { type: "CLEAR" };
