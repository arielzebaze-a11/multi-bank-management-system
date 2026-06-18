import { useEffect, useState } from "react";
import api from "../../services/api";

export default function Users() {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await api.get("/admin/users");

      setUsers(response.data.utilisateurs || []);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>👥 Utilisateurs</h1>

      <table border={1} cellPadding={10}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nom</th>
            <th>Téléphone</th>
            <th>Rôle</th>
          </tr>
        </thead>

        <tbody>
          {users.map((user: any) => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.nom}</td>
              <td>{user.telephone}</td>
              <td>{user.role}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}