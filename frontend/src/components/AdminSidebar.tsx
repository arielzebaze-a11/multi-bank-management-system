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

      <p>📊 Dashboard</p>
      <p>👤 Utilisateurs</p>
      <p>💸 Transactions</p>
      <p>📄 Rapports</p>
      <p>🚪 Déconnexion</p>
    </div>
  );
}