import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "../pages/auth/Login";

import AdminLayout from "../layouts/AdminLayout";
import AdminDashboard from "../pages/admin/Dashboard";
import AdminUsers from "../pages/admin/AdminUsers";
import AdminTransactions from "../pages/admin/AdminTransactions";
import AdminReports from "../pages/admin/AdminReports";

import ClientDashboard from "../pages/client/Dashboard";

export default function AppRoutes() {
  return (
    <BrowserRouter>

      <Routes>

        {/* Auth */}
        <Route
          path="/"
          element={<Login />}
        />

        {/* Administration */}
        <Route
          path="/admin"
          element={<AdminLayout />}
        >

          <Route
            path="dashboard"
            element={<AdminDashboard />}
          />

          <Route
            path="users"
            element={<AdminUsers />}
          />

          <Route
            path="transactions"
            element={<AdminTransactions />}
          />

          <Route
            path="reports"
            element={<AdminReports />}
          />

        </Route>

        {/* Client */}
        <Route
          path="/client/dashboard"
          element={<ClientDashboard />}
        />

      </Routes>

    </BrowserRouter>
  );
}