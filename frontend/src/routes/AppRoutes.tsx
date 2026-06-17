import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "../pages/auth/Login";
import AdminDashboard from "../pages/admin/Dashboard";
import ClientDashboard from "../pages/client/Dashboard";

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

      </Routes>
    </BrowserRouter>
  );
}