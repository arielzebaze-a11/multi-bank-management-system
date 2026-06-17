import AdminSidebar from "../../components/AdminSidebar";

export default function AdminDashboard() {
  const compte = JSON.parse(
    localStorage.getItem("compte") || "{}"
  );

  return (
    <div
      style={{
        display: "flex",
      }}
    >
      <AdminSidebar />

      <div
        style={{
          padding: "30px",
          flex: 1,
        }}
      >
        <h1>🏦 Tableau de bord Administrateur</h1>

        <hr />

        <p><strong>Nom :</strong> {compte.user}</p>

        <p><strong>Rôle :</strong> {compte.role}</p>

        <p><strong>Banque :</strong> {compte.banque}</p>

        <p><strong>Téléphone :</strong> {compte.telephone}</p>

        <p><strong>Solde :</strong> {compte.solde} FCFA</p>
      </div>
    </div>
  );
}