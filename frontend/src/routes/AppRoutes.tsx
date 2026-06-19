import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "../pages/auth/Login";
import AdminDashboard from "../pages/admin/Dashboard";
import ClientDashboard from "../pages/client/Dashboard";
import AdminUsers from "../pages/admin/AdminUsers";
import AdminTransactions from "../pages/admin/AdminTransactions";
import AdminReports from "../pages/admin/AdminReports";


export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        <Route
          path="/"
          element={<Login />}
        />

        <Route
          path="/admin/dashboard"
          element={<AdminDashboard />}
        />

        <Route
          path="/client/dashboard"
          element={<ClientDashboard />}
        />

        <Route
          path="/admin/users"
          element={<AdminUsers />}
        />

      <Route
        path="/admin/transactions"
        element={<AdminTransactions />}
      />

      <Route
        path="/admin/reports"
        element={<AdminReports />}
      />
    

      </Routes>
    </BrowserRouter>
  );
}