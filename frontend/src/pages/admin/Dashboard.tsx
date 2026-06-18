import { useEffect, useState } from "react";
import api from "../../services/api";

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
    <div style={{ padding: "30px" }}>
      <h1>📊 Dashboard Administrateur</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5,1fr)",
          gap: "20px",
          marginTop: "30px"
        }}
      >
        <Card
          title="Utilisateurs"
          value={stats.users}
        />

        <Card
          title="Comptes"
          value={stats.accounts}
        />

        <Card
          title="Banques"
          value={stats.banks}
        />

        <Card
          title="Transactions"
          value={stats.transactions}
        />

        <Card
          title="Liquidité"
          value={`${(stats.balance || 0).toLocaleString()} FCFA`}
        />
      </div>
    </div>
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
        padding: "20px",
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