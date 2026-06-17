export default function AdminDashboard() {
  const compte = JSON.parse(
    localStorage.getItem("compte") || "{}"
  );

  return (
    <div style={{ padding: "30px" }}>
      <h1>🏦 Dashboard Administrateur</h1>

      <hr />

      <p><strong>Nom :</strong> {compte.user}</p>

      <p><strong>Rôle :</strong> {compte.role}</p>

      <p><strong>Banque :</strong> {compte.banque}</p>

      <p><strong>Téléphone :</strong> {compte.telephone}</p>

      <p><strong>Solde :</strong> {compte.solde} FCFA</p>
    </div>
  );
}