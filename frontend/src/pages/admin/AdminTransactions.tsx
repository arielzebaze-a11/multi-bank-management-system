import { useEffect, useState } from "react";
import api from "../../services/api";
import AdminLayout from "../../layouts/AdminLayout";

interface Transaction {
  id: number;
  type: string;
  montant: string;
  date: string;
  statut: string;

  expediteur: {
    nom: string;
    telephone: string;
  };

  destinataire: {
    nom: string;
    telephone: string;
  };
}

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTransactions = async () => {
    try {
      const response = await api.get("/admin/transactions");

      console.log(response.data);

      setTransactions(response.data.transactions);
    } catch (error) {
      console.error(error);
      alert("Erreur chargement transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  if (loading) {
    return <h2>Chargement...</h2>;
  }

  return (
    <AdminLayout>
      <div>
        <h1>💸 Transactions du système</h1>

        <table
          style={{
            width: "100%",
            marginTop: "20px",
            borderCollapse: "collapse",
            background: "white",
            borderRadius: "12px",
            overflow: "hidden",
          }}
        >
          <thead>
            <tr
              style={{
                background: "#1e293b",
                color: "white",
              }}
            >
              <th style={th}>ID</th>
              <th style={th}>Date</th>
              <th style={th}>Type</th>
              <th style={th}>Montant</th>
              <th style={th}>Expéditeur</th>
              <th style={th}>Destinataire</th>
              <th style={th}>Statut</th>
            </tr>
          </thead>

          <tbody>
            {transactions.map((transaction) => (
              <tr key={transaction.id}>
                <td style={td}>{transaction.id}</td>
                <td style={td}>{transaction.date}</td>
                <td style={td}>{transaction.type}</td>
                <td style={td}>{transaction.montant}</td>
                <td style={td}>
                  {transaction.expediteur?.nom}
                </td>
                <td style={td}>
                  {transaction.destinataire?.nom}
                </td>
                <td style={td}>
                  {transaction.statut}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}

const th = {
  padding: "15px",
  textAlign: "left" as const,
};

const td = {
  padding: "15px",
  borderBottom: "1px solid #eee",
};