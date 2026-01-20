import { createBrowserRouter, Navigate } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import RequireRole from "../components/RequireRole";
import AdminLayout from "../components/AdminLayout";
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import AdminProductsPage from "../pages/admin/AdminProductsPage";
import AdminProductCreatePage from "../pages/admin/AdminProductCreatePage";
import AdminProductEditPage from "../pages/admin/AdminProductEditPage";
import AdminOrdersPage from "../pages/admin/AdminOrdersPage";
import AdminUsersPage from "../pages/admin/AdminUsersPage";
import AdminAuditsPage from "../pages/admin/AdminAuditsPage";
import AdminMultimediaPage from "../pages/admin/AdminMultimediaPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    element: <AdminLayout />,
    children: [
      {
        path: "/admin/dashboard",
        element: (
          <RequireRole roles={["ADMIN", "WORKER"]}>
            <AdminDashboardPage />
          </RequireRole>
        ),
      },
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
      {
        path: "/admin/multimedia",
        element: (
          <RequireRole roles={["ADMIN"]}>
            <AdminMultimediaPage />
          </RequireRole>
        ),
      },
    ],
  },
]);
