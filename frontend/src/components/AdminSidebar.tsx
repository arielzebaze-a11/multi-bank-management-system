import { Link } from "react-router-dom";

export default function AdminSidebar() {
  return (
    <div
      style={{
        width: "250px",
        background: "#1e293b",
        color: "white",
        minHeight: "100vh",
        padding: "20px",
      }}
    >
      <h2>SGB Admin</h2>

      <hr />

      <p>
        <Link to="/admin/dashboard">📊 Dashboard</Link>
      </p>

      <p>
        <Link to="/admin/users">👤 Utilisateurs</Link>
      </p>
    </div>
  );
}