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
import AdminProductCreatePage from "../pages/admin/AdminProductCreatePage";
import AdminProductEditPage from "../pages/admin/AdminProductEditPage";
import AdminOrdersPage from "../pages/admin/AdminOrdersPage";
import AdminUsersPage from "../pages/admin/AdminUsersPage";
import AdminAuditsPage from "../pages/admin/AdminAuditsPage";
import WebpayReturnPage from "../pages/WebpayReturnPage";
import TagPage from "../pages/TagPage";
import ProductDetailPage from "../pages/ProductDetailPage";

export const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/tag/:tag", element: <TagPage /> },
      { path: "/product/:id", element: <ProductDetailPage /> },
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
        path: "/admin/products/new",
        element: (
          <RequireRole roles={["ADMIN", "WORKER"]}>
            <AdminProductCreatePage />
          </RequireRole>
        ),
      },
      {
        path: "/admin/products/:id/edit",
        element: (
          <RequireRole roles={["ADMIN", "WORKER"]}>
            <AdminProductEditPage />
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
