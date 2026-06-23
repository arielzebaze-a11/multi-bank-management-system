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
    bankId: number;
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

const viewUser = (user: User) => {
  alert(`
Nom : ${user.nom}
Email : ${user.email}
Téléphone : ${user.telephone}
Rôle : ${user.role}

Banque : ${user.comptes?.[0]?.banque || "Aucune"}
Agence : ${user.comptes?.[0]?.code_agence || "Aucune"}
Solde : ${user.comptes?.[0]?.solde || "0 FCFA"}
Statut : ${user.comptes?.[0]?.statut || "N/A"}
  `);
};

const deleteUser = async (id: number) => {
  try {
    const confirmDelete = window.confirm(
      "Voulez-vous vraiment supprimer cet utilisateur ?"
    );

    if (!confirmDelete) return;

    await api.delete(`/admin/user/${id}`);

    alert("✅ Utilisateur supprimé");

    loadUsers();

  } catch (error) {
    console.error(error);
    alert("❌ Erreur suppression utilisateur");
  }
};

const changeRole = async (user: User) => {
  try {

    const nouveauRole =
      user.role === "ADMIN"
        ? "CLIENT"
        : "ADMIN";

    await api.put("/admin/update-role", {
      userId: user.id,
      newRole: nouveauRole,
    });

    alert(`✅ Nouveau rôle : ${nouveauRole}`);

    loadUsers();

  } catch (error) {
    console.error(error);
    alert("❌ Erreur changement rôle");
  }
};

const toggleStatus = async (user: User) => {
  try {

    const compte = user.comptes?.[0];

    if (!compte) {
      alert("Aucun compte trouvé");
      return;
    }

    const action =
      compte.statut === "ACTIF"
        ? "BLOQUER"
        : "DEBLOQUER";

    await api.put("/admin/compte/statut", {
      userId: user.id,
      bankId: compte.bankId,
      action,
    });

    alert("✅ Statut modifié");

    loadUsers();

  } catch (error) {
    console.error(error);
    alert("❌ Erreur modification statut");
  }
};

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
                <th>Actions</th>
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

                  <td>{user.comptes?.[0]?.statut}</td>

                  <td
                    style={{
                      display: "flex",
                      gap: "8px",
                      alignItems: "center",
                      padding: "15px",
                    }}
                  >
                    <button
                        title="Voir les informations"
                        style={actionBtn}
                        onClick={() => viewUser(user)}
                      >
                        👁
                  </button>

                    <button
                      title="Modifier le statut"
                      style={actionBtn}
                      onClick={() => toggleStatus(user)}
                    >
                      🔒
                    </button>

                    <button
                      title="Supprimer l'utilisateur"
                      style={actionBtn}
                      onClick={() => deleteUser(user.id)}
                    >
                      🗑
                    </button>

                    <button
                      title="Changer le rôle"
                      style={actionBtn}
                      onClick={() => changeRole(user)}
                    >
                      👑
                    </button>
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

const actionBtn = {
  border: "none",
  padding: "8px 10px",
  borderRadius: "8px",
  cursor: "pointer",
  background: "#f8fafc",
  boxShadow: "0 1px 3px rgba(0,0,0,.1)",
  transition: "0.2s",
};