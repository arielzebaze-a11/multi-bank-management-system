import { Link } from "react-router-dom";

export default function AdminSidebar() {
  return (
    <div
      style={{
        width: "260px",
        
        position: "fixed",
        left: 0,
        top: 0,
        height: "100vh",
        zIndex: 1000,

        background: "#17223b",
        color: "white",
        padding: "25px",
        boxSizing: "border-box",
      }}
    >
      <h1
        style={{
          textAlign: "center",
          marginBottom: "40px",
        }}
      >
        🏦 SGB
      </h1>

      <nav
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "15px",
        }}
      >
        <Link
          to="/admin/dashboard"
          style={linkStyle}
        >
          📊 Dashboard
        </Link>

        <Link
          to="/admin/users"
          style={linkStyle}
        >
          👥 Utilisateurs
        </Link>

        <Link
          to="/admin/transactions"
          style={linkStyle}
        >
          💸 Transactions
        </Link>

        <Link
          to="/admin/reports"
          style={linkStyle}
        >
          📑 Rapports
        </Link>
      </nav>
    </div>
  );
}

const linkStyle = {
  color: "white",
  textDecoration: "none",
  padding: "12px 15px",
  borderRadius: "8px",
  background: "#243b55",
  fontWeight: "bold",
};