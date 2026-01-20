import { apiFetch } from "./http";

export type CartOrderItem = { productId: string; qty: number };

export type OrderStatus = "PENDING" | "PAID" | "CANCELLED";

export type OrderItem = { 
  qty: number; 
  priceSnapshot: number; 
  productId: string;
  product?: { id: string; name: string; image: string } 
};

export type Order = {
  id: string;
  status: OrderStatus;
  total: number;
  customerEmail: string;
  createdAt: string;
  items: OrderItem[];
};

export async function createGuestOrder(customerEmail: string, items: CartOrderItem[], shippingAddress?: any) {
  return apiFetch<{ orderId: string; message: string }>("/orders/guest", {
    method: "POST",
    body: JSON.stringify({ customerEmail, items, shippingAddress }),
  });
}

export async function resendGuestOtp(orderId: string, email: string) {
  return apiFetch<{ message: string }>("/orders/guest/resend", {
    method: "POST",
    body: JSON.stringify({ orderId, email }),
  });
}

export async function verifyGuestOtp(orderId: string, email: string, code: string) {
  return apiFetch<{ token: string }>("/orders/guest/verify", {
    method: "POST",
    body: JSON.stringify({ orderId, email, code }),
  });
}

export async function getGuestOrder(orderId: string, guestToken: string) {
  // no apiFetch because we want to pass a different token than auth
  const API_URL = ((import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL) ?? "/api";

  const res = await fetch(`${API_URL.replace(/\/$/, "")}/orders/guest/${orderId}`, {
    headers: { Authorization: `Bearer ${guestToken}` },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || res.statusText);
  }
  return (await res.json()) as Order;
}

export async function cancelGuestOrder(orderId: string, guestToken: string) {
  // no apiFetch because we want to pass a different token than auth
  const API_URL = ((import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL) ?? "/api";

  const res = await fetch(`${API_URL.replace(/\/$/, "")}/orders/guest/${orderId}/cancel`, {
    method: "POST",
    headers: { Authorization: `Bearer ${guestToken}` },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || res.statusText);
  }
  return (await res.json()) as Order;
}

export async function createAuthedOrder(items: CartOrderItem[], shippingAddress?: any) {
  return apiFetch<Order>("/orders", {
    method: "POST",
    body: JSON.stringify({ items, shippingAddress }),
  });
}

export async function listMyOrders() {
  return apiFetch<Order[]>("/orders/me");
}

export async function cancelMyOrder(id: string) {
  return apiFetch<Order>(`/orders/${id}/cancel`, { method: "POST" });
}


export type AdminOrder = Order & { 
  user?: { run: string; email: string; role: string } | null;
  webpayToken?: string;
  paymentStatus?: string;
  shippingAddress?: any;
};

export async function listAdminOrders() {
  const response = await apiFetch<{ data: AdminOrder[], meta: any }>("/orders");
  return response.data || response as any;
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  return apiFetch<AdminOrder>(`/orders/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}
