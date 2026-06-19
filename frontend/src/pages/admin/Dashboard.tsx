import { useEffect, useState } from "react";
import api from "../../services/api";
import AdminLayout from "../../layouts/AdminLayout";

export default function Dashboard() {

  const [stats, setStats] = useState({
    users: 0,
    accounts: 0,
    banks: 0,
    transactions: 0,
    balance: 0
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await api.get("/admin/dashboard");

      console.log("STATUS :", response.status);
      console.log("URL :", response.request?.responseURL);
      console.log("DATA :", response.data);

      setStats(response.data);

    } catch (error) {
      console.error(error);
    }
  };

  return (
    <AdminLayout>
      <div style={{ padding: "30px" }}>
        <h1
          style={{
            fontSize: "42px",
            marginBottom: "40px",
            lineHeight: 1.2,
          }}
        >
          📊 Dashboard Administrateur
        </h1>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "20px",
            width: "100%",
            marginTop: "30px"
          }}
        >
          <Card title="Utilisateurs" value={stats.users} />
          <Card title="Comptes" value={stats.accounts} />
          <Card title="Banques" value={stats.banks} />
          <Card title="Transactions" value={stats.transactions} />
          <Card
            title="Liquidité"
            value={`${(stats.balance || 0).toLocaleString()} FCFA`}
          />
        </div>
      </div>
    </AdminLayout>
  );
}

function Card({
  title,
  value
}: {
  title: string;
  value: any;
}) {
  return (
    <div
      style={{
        padding: "30px",
        minHeight: "150px",
        borderRadius: "10px",
        boxShadow: "0 0 10px rgba(0,0,0,.1)",
        background: "#fff"
      }}
    >
      <h3>{title}</h3>
      <h2>{value}</h2>
    </div>
  );
}