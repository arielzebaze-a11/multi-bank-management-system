import { useEffect, useState } from "react";
import api from "../../services/api";
import AdminLayout from "../../layouts/AdminLayout";

interface User {
  id: number;
  nom: string;
  email: string;
  telephone: string;
  role: string;

  comptes: {
    numero: string;
    banque: string;
    code_agence: string;
    solde: string;
    statut: string;
    limite_virement: string;
  }[];
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    try {
      const response = await api.get("/admin/users");
      setUsers(response.data.utilisateurs);
    } catch (error) {
      console.error(error);
      alert("Erreur chargement utilisateurs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <h2>Chargement...</h2>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div style={{ padding: "20px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h1>👥 Gestion des utilisateurs</h1>

          <button
            style={{
              background: "#2563eb",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            ➕ Nouvel utilisateur
          </button>
        </div>

        <div
          style={{
            background: "white",
            borderRadius: "12px",
            padding: "20px",
            boxShadow: "0 0 10px rgba(0,0,0,.08)",
            overflowX: "auto",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr
                style={{
                  background: "#f1f5f9",
                }}
              >
                <th style={th}>ID</th>
                <th style={th}>Nom</th>
                <th style={th}>Email</th>
                <th style={th}>Téléphone</th>
                <th style={th}>Rôle</th>
                <th style={th}>Banque</th>
                <th style={th}>Agence</th>
                <th style={th}>Solde</th>
                <th style={th}>Statut</th>
              </tr>
            </thead>

            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td style={td}>{user.id}</td>
                  <td style={td}>{user.nom}</td>
                  <td style={td}>{user.email}</td>
                  <td style={td}>{user.telephone}</td>
                  <td style={td}>{user.role}</td>

                  <td style={td}>
                    {user.comptes?.[0]?.banque}
                  </td>

                  <td style={td}>
                    {user.comptes?.[0]?.code_agence}
                  </td>

                  <td
                    style={{
                      ...td,
                      whiteSpace: "nowrap",
                      fontWeight: "bold",
                    }}
                  >
                    {user.comptes?.[0]?.solde}
                  </td>

                  <td style={td}>
                    <span
                      style={{
                        padding: "6px 12px",
                        borderRadius: "20px",
                        fontWeight: "bold",
                        background:
                          user.comptes?.[0]?.statut === "ACTIF"
                            ? "#dcfce7"
                            : "#fee2e2",
                        color:
                          user.comptes?.[0]?.statut === "ACTIF"
                            ? "#166534"
                            : "#991b1b",
                      }}
                    >
                      {user.comptes?.[0]?.statut}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}

const th = {
  padding: "15px",
  textAlign: "left" as const,
  borderBottom: "2px solid #e5e7eb",
};

const td = {
  padding: "15px",
  borderBottom: "1px solid #e5e7eb",
};