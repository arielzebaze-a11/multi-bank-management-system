import { useEffect, useState } from "react";
import api from "../../services/api";
import AdminLayout from "../../layouts/AdminLayout";

interface User
{
    id: number;
    nom: string;
    email: string;
    telephone: string;
    role: string;

  comptes: {
    accountId: number;
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

const [statusModal, setStatusModal] =
  useState(false);

const [createModal, setCreateModal] =
  useState(false);

const [banks, setBanks] = useState([]);

const [newUser, setNewUser] = useState({
  nom: "",
  email: "",
  telephone: "",
  code_pin: "",
  code_agence: "",
});

const [newStatus, setNewStatus] =
  useState("");

const [selectedUser, setSelectedUser] =
  useState<User | null>(null);

  const [statusUser, setStatusUser] =
  useState<User | null>(null);

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



const loadBanks = async () => {

  try {
    const response =
      await api.get("/admin/banks");
    setBanks(response.data);
  } catch (error) {
    console.error(error);
  }

};

  useEffect(() => {
  loadUsers();
  loadBanks();
}, []);

const viewUser = (user: User) => {
  setSelectedUser(user);
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

const changeStatus = (user: User) => {

  setStatusUser(user);

  setNewStatus(
    user.comptes?.[0]?.statut || "ACTIF"
  );

  setStatusModal(true);
};

const saveStatus = async () => {
  try {
    const compte =
        statusUser?.comptes?.[0];

    if (!compte) return;
    if (compte.statut === newStatus) {

      setStatusModal(false);

      alert(
        "Le compte possède déjà ce statut"
      );

      return;
    }

    await api.put(
      "/admin/account/status",
      {
        userId: statusUser?.id,
        bankId: compte.bankId,
        statut: newStatus,
      }
    );

    setStatusModal(false);
    setStatusUser(null);

    loadUsers();

  } catch (error: any) {
  console.error(error);

  console.log(
    "REPONSE API =",
    error.response?.data
  );

  alert(
    JSON.stringify(
      error.response?.data,
      null,
      2
    )
  );
}
};

const createUser = async () => {
  try {

    await api.post(
      "/auth/register",
      newUser
    );

    alert(
      "✅ Utilisateur créé avec succès"
    );

    setCreateModal(false);

    setNewUser({
      nom: "",
      email: "",
      telephone: "",
      code_pin: "",
      code_agence: "",
    });

    loadUsers();

  } catch (error) {
    console.error(error);
    alert(
      "❌ Erreur création utilisateur"
    );
  }
};

  if (loading) {
    return (
      <AdminLayout>
        <h2>Chargement...</h2>
      </AdminLayout>
    );
  }

  const userModal =
  selectedUser && (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          width: "500px",
          background: "#fff",
          borderRadius: "12px",
          padding: "25px",
          position: "relative",
        }}
      >
        <button
          onClick={() => setSelectedUser(null)}
          style={{
            position: "absolute",
            right: "15px",
            top: "10px",
            border: "none",
            background: "none",
            fontSize: "22px",
            cursor: "pointer",
          }}
        >
          ✖
        </button>

        <h2>👤 Détails utilisateur</h2>

        <hr />

        <p><strong>Nom :</strong> {selectedUser.nom}</p>

        <p><strong>Email :</strong> {selectedUser.email}</p>

        <p><strong>Téléphone :</strong> {selectedUser.telephone}</p>

        <p><strong>Rôle :</strong> {selectedUser.role}</p>

        <p>
          <strong>Banque :</strong>{" "}
          {selectedUser.comptes?.[0]?.banque}
        </p>

        <p>
          <strong>Agence :</strong>{" "}
          {selectedUser.comptes?.[0]?.code_agence}
        </p>

        <p>
          <strong>Solde :</strong>{" "}
          {selectedUser.comptes?.[0]?.solde}
        </p>

        <p>
          <strong>Statut :</strong>{" "}
          {selectedUser.comptes?.[0]?.statut}
        </p>
      </div>
    </div>
  );

const statusModalContent = (
  statusModal && (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          background: "#fff",
          width: "450px",
          padding: "25px",
          borderRadius: "12px",
        }}
      >
        <h2>🔒 Modifier le statut</h2>

        <label>
          <input
            type="radio"
            value="ACTIF"
            checked={newStatus === "ACTIF"}
            onChange={(e) =>
              setNewStatus(e.target.value)
            }
          />
          ACTIF
        </label>

        <br />
        <br />

        <label>
          <input
            type="radio"
            value="BLOQUE"
            checked={newStatus === "BLOQUE"}
            onChange={(e) =>
              setNewStatus(e.target.value)
            }
          />
          BLOQUÉ
        </label>

        <br />
        <br />

        <label>
          <input
            type="radio"
            value="SUPPRIME"
            checked={newStatus === "SUPPRIME"}
            onChange={(e) =>
              setNewStatus(e.target.value)
            }
          />
          SUPPRIMÉ
        </label>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
            marginTop: "20px",
          }}
        >
          <button
            onClick={() =>
              setStatusModal(false)
            }
          >
            Annuler
          </button>

          <button onClick={saveStatus}>
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
);

const createModalContent =
  createModal && (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background:
          "rgba(0,0,0,.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          width: "500px",
          background: "#fff",
          padding: "25px",
          borderRadius: "12px",
        }}
      >
        <h2>
          ➕ Nouvel utilisateur
        </h2>

        <input
          placeholder="Nom Complet"
          value={newUser.nom}
          onChange={(e) =>
            setNewUser({
              ...newUser,
              nom: e.target.value,
            })
          }
        />

        <br /><br />

        <input
          placeholder="Email"
          value={newUser.email}
          onChange={(e) =>
            setNewUser({
              ...newUser,
              email: e.target.value,
            })
          }
        />

        <br /><br />

        <input
          placeholder="Téléphone"
          value={newUser.telephone}
          onChange={(e) =>
            setNewUser({
              ...newUser,
              telephone: e.target.value,
            })
          }
        />

        <br /><br />

        <input
          placeholder="Code PIN"
          value={newUser.code_pin}
          onChange={(e) =>
            setNewUser({
              ...newUser,
              code_pin: e.target.value,
            })
          }
        />

        <br /><br />

        <select
          value={newUser.code_agence}
          onChange={(e) =>
            setNewUser({
              ...newUser,
              code_agence:
                e.target.value,
            })
          }
        >
          <option value="">
            Choisir une banque
          </option>

          {banks.map((bank: any) => (
            <option
              key={bank.id}
              value={bank.code_agence}
            >
              {bank.nom}
            </option>
          ))}
        </select>

        <br /><br />

        <div
          style={{
            display: "flex",
            justifyContent:
              "flex-end",
            gap: "10px",
          }}
        >
          <button
            onClick={() =>
              setCreateModal(false)
            }
          >
            Annuler
          </button>

          <button
            onClick={createUser}
          >
            Créer
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
    {userModal}
    {statusModalContent}
    {createModalContent}
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
              onClick={() => setCreateModal(true)}
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
                      onClick={() => changeStatus(user)}
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
    </>
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