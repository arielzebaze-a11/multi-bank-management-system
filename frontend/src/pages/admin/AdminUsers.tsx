import { useEffect, useState } from "react";
import api from "../../services/api";
import { Box } from "@mui/material";
import UserDialog from "../../components/users/UserDialog";
import CreateUserDialog from "../../components/users/CreateUserDialog";

interface User
{
    id: number;
    nom: string;
    email: string;
    telephone: string;
    role: string;

  comptes: {

    accountId: number;

    userId: number;

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

const [messageModal, setMessageModal] =
  useState(false);

const [messageTitle, setMessageTitle] =
  useState("");

const [messageText, setMessageText] =
  useState("");

const [banks, setBanks] = useState([]);

const [limitModal, setLimitModal] =
    useState(false);

const [selectedAccount, setSelectedAccount] =
    useState<any>(null);

const [newLimit, setNewLimit] =
    useState("");

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
      showMessage(
        "Erreur",
        "Impossible d'effectuer cette opération."
      );
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

const deleteUser = async (user: User) => {
  try {
    const confirmDelete = window.confirm(
      "Voulez-vous vraiment archiver ce compte ?"
    );

    if (!confirmDelete) return;

    await api.delete(
        `/admin/user/${user.id}`,
        {
            data: {
                bankId: user.comptes[0].bankId
            } 
        }
    );

    showMessage(
      "Succès",
      "✅ Compte archivé avec succès"
    );

    loadUsers();

  } catch (error) {
    showMessage(
      "Erreur",
      "❌ Erreur lors de l'archivage du compte"
    );
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

    showMessage(
      "Succès",
      `✅ Nouveau rôle : ${nouveauRole}`
    );

    loadUsers();

  } catch (error) {
    console.error(error);
    showMessage(
      "Erreur",
      "❌ Erreur changement rôle"
    );
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

      showMessage(
        "Erreur",
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

  showMessage(
    "Erreur",
    JSON.stringify(
      error.response?.data,
      null,
      2
    )
  );
}
};

const saveLimit = async ()=>{

    try{

        await api.put(
            "/admin/account/set-limit",
            {

                userId:selectedAccount.userId,

                bankId:selectedAccount.bankId,

                limite:newLimit

            }
        );

        showMessage(
            "Succès",
            "✅ Limite modifiée."
        );

        setLimitModal(false);

        loadUsers();

    }

    catch(error:any){

        showMessage(
            "Erreur",
            error.response?.data?.error ||
            "Impossible de modifier la limite."
        );

    }

};

const createUser = async () => {
  try {

    await api.post(
      "/auth/register",
      newUser
    );
    await loadUsers();

    setCreateModal(false);
    
    showMessage(
      "Succès",
      "✅ Utilisateur créé avec succès"
    );


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
    showMessage(
      "Erreur",
      "❌ Erreur création utilisateur"
    );
  }
};

const showMessage = (
  title: string,
  text: string
) => {

  setMessageTitle(title);

  setMessageText(text);

  setMessageModal(true);

};

  if (loading) {
    return (
      <Box>
        <h2>Chargement...</h2>
      </Box>
    );
  }

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
          BLOQUE
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
          SUPPRIME
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

const limitModalContent =

limitModal && (

<div
style={{
position:"fixed",
inset:0,
background:"rgba(0,0,0,.45)",
display:"flex",
justifyContent:"center",
alignItems:"center",
zIndex:9999
}}
>

<div
style={{
background:"#fff",
width:"420px",
padding:"25px",
borderRadius:"12px"
}}
>

<h2>

💳 Modifier la limite

</h2>

<input

type="number"

value={newLimit}

onChange={(e)=>setNewLimit(e.target.value)}

style={{
width:"100%",
padding:"12px",
marginTop:"20px"
}}

/>

<div
style={{
display:"flex",
justifyContent:"flex-end",
gap:"10px",
marginTop:"20px"
}}
>

<button
onClick={()=>setLimitModal(false)}
>

Annuler

</button>

<button
onClick={saveLimit}
>

Enregistrer

</button>

</div>

</div>

</div>

);


const messageModalContent =
messageModal && (

<div
style={{
position:"fixed",
inset:0,
background:"rgba(0,0,0,.45)",
display:"flex",
justifyContent:"center",
alignItems:"center",
zIndex:99999,
}}
>

<div
style={{
background:"#fff",
width:"420px",
borderRadius:"12px",
padding:"25px",
position:"relative",
boxShadow:"0 10px 30px rgba(0,0,0,.2)"
}}
>

<button

onClick={()=>setMessageModal(false)}

style={{
position:"absolute",
right:"15px",
top:"12px",
border:"none",
background:"none",
fontSize:"20px",
cursor:"pointer"
}}

>

✖

</button>

<h2>

{messageTitle}

</h2>

<hr />

<p
style={{
marginTop:"20px",
lineHeight:"28px"
}}
>

{messageText}

</p>

<div
style={{
display:"flex",
justifyContent:"flex-end",
marginTop:"30px"
}}
>

<button

onClick={()=>setMessageModal(false)}

style={{
padding:"10px 25px",
background:"#2563eb",
color:"white",
border:"none",
borderRadius:"8px",
cursor:"pointer"
}}

>

OK

</button>

</div>

</div>

</div>

);

const blockAccount = async (compte: any) => {

  try {

    await api.put("/admin/account/status", {

      userId: compte.userId,

      bankId: compte.bankId,

      statut: "BLOQUE",

    });

    showMessage(
        "Succès",
        "✅ Compte débloqué."
    );

    loadUsers();

  } catch (error: any) {

    showMessage(
        "Erreur",
        error.response?.data?.error ||
        "Impossible de débloquer."
    );

  }

};

const unblockAccount = async (compte: any) => {

  try {

    await api.put("/admin/account/status", {

      userId: compte.userId,

      bankId: compte.bankId,

      statut: "ACTIF",

    });

    showMessage(
    "Succès",
    "✅ Compte débloqué."
);

    loadUsers();

  } catch (error: any) {

    showMessage(
        "Erreur",
        error.response?.data?.error ||
        "Impossible de débloquer."
    );

  }

};

const archiveAccount = async (compte: any) => {

  try {

    await api.delete(

      `/admin/user/${compte.userId}`,

      {

        data: {

          bankId: compte.bankId,

        },

      }

    );

    showMessage(
        "Succès",
        "✅ Compte archivé."
    );

    loadUsers();

  }

  catch (error: any) {

    showMessage(
        "Erreur",
        error.response?.data?.error ||
        "Erreur d'archivage."
    );

  }

};

const restoreAccount = async (compte: any) => {

    try {

        await api.put("/admin/account/restore", {

            userId: compte.userId,

            bankId: compte.bankId

        });

        showMessage(
            "Succès",
            "♻️ Compte restauré."
        );

        loadUsers();

    }

    catch (error: any) {

        showMessage(
            "Erreur",
            error.response?.data?.error ||
            "Impossible de restaurer."
        );

    }

};

const editLimit = (compte:any)=>{

    setSelectedAccount(compte);

    setNewLimit(
        String(compte.limite_virement)
            .replace(/\s/g, "")
            .replace("FCFA", "")
    );

    setLimitModal(true);

};

const viewHistory = async (compte: any) => {

  try {

    const response = await api.post(

      "/admin/account/report",

      {

        userId: compte.userId,

        bankId: compte.bankId

      },

      {

        responseType: "blob"

      }

    );

    const url = window.URL.createObjectURL(
      new Blob([response.data])
    );

    const link = document.createElement("a");

    link.href = url;

    link.download =
      `Rapport_ACC-${compte.numero}.pdf`;

    document.body.appendChild(link);

    link.click();

    link.remove();

    window.URL.revokeObjectURL(url);

  } catch (error: any) {

    console.error(error);

    showMessage(

      "Erreur",

      error.response?.data?.error ||

      "Impossible de générer le rapport."

    );

  }

};

  return (
    <>
    <Box>
    {limitModalContent}
    {statusModalContent}
    <CreateUserDialog
        open={createModal}
        onClose={() => setCreateModal(false)}
        newUser={newUser}
        setNewUser={setNewUser}
        createUser={createUser}
        banks={banks}
    />
    {messageModalContent}
    
    
    <UserDialog
    open={!!selectedUser}
    user={selectedUser}
    onClose={() => setSelectedUser(null)}
    blockAccount={blockAccount}
    unblockAccount={unblockAccount}
    archiveAccount={archiveAccount}
    restoreAccount={restoreAccount}
    editLimit={editLimit}
    viewHistory={viewHistory}
/>
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
                <th style={th}>Nombre de comptes</th>
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
                      <strong>
                          {user.comptes.length}
                      </strong>
                  </td>

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
    </Box>
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