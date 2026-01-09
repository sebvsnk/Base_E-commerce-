import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import HomePage from "../pages/HomePage";
import CartPage from "../pages/CartPage";
import CheckoutPage from "../pages/CheckoutPage";
import LoginPage from "../pages/LoginPage";
import ProfilePage from "../pages/ProfilePage";
import GuestVerifyPage from "../pages/GuestVerifyPage";
import GuestOrderPage from "../pages/GuestOrderPage";
import RequireRole from "../components/RequireRole";
import AdminProductsPage from "../pages/admin/AdminProductsPage";
import AdminOrdersPage from "../pages/admin/AdminOrdersPage";
import AdminUsersPage from "../pages/admin/AdminUsersPage";
import AdminAuditsPage from "../pages/admin/AdminAuditsPage";
import WebpayReturnPage from "../pages/WebpayReturnPage";

export const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/cart", element: <CartPage /> },
      { path: "/checkout", element: <CheckoutPage /> },
      { path: "/webpay/return", element: <WebpayReturnPage /> },
      { path: "/login", element: <LoginPage /> },
      { path: "/profile", element: <ProfilePage /> },
      { path: "/guest/verify/:orderId", element: <GuestVerifyPage /> },
      { path: "/guest/order/:orderId", element: <GuestOrderPage /> },
      {
        path: "/admin/products",
        element: (
          <RequireRole roles={["ADMIN", "WORKER"]}>
            <AdminProductsPage />
          </RequireRole>
        ),
      },
      {
        path: "/admin/orders",
        element: (
          <RequireRole roles={["ADMIN", "WORKER"]}>
            <AdminOrdersPage />
          </RequireRole>
        ),
      },
      {
        path: "/admin/users",
        element: (
          <RequireRole roles={["ADMIN"]}>
            <AdminUsersPage />
          </RequireRole>
        ),
      },
      {
        path: "/admin/audits",
        element: (
          <RequireRole roles={["ADMIN"]}>
            <AdminAuditsPage />
          </RequireRole>
        ),
      },
    ],
  },
]);
