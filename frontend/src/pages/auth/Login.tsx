import { useNavigate } from "react-router-dom";
import { useState } from "react";
import api from "../../services/api";

export default function Login() {
  const [telephone, setTelephone] = useState("");
  const [codePin, setCodePin] = useState("");
  const [codeAgence, setCodeAgence] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      const response = await api.post("/auth/login", {
        telephone,
        code_pin: codePin,
        code_agence: codeAgence,
      });

      const data = response.data;
      localStorage.setItem("token", data.token);
      localStorage.setItem("compte", JSON.stringify(data.compte));
      localStorage.setItem("role", data.compte.role || "CLIENT");

      if (data.compte.role === "ADMIN") {
        navigate("/admin/dashboard");
      } else {
        navigate("/client/dashboard");
      }

    } catch (error: any) {
      console.log("Erreur complète :", error);
      console.log("Response :", error?.response);
      console.log("Data :", error?.response?.data);

      alert(
        error?.response?.data?.error ||
        error?.message ||
        "Erreur de connexion"
      );
    }finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <form
        onSubmit={handleLogin}
        style={{
          width: "400px",
          display: "flex",
          flexDirection: "column",
          gap: "15px",
        }}
      >
        <h1>🏦 Connexion SGB</h1>

        <input
          placeholder="Téléphone"
          value={telephone}
          onChange={(e) => setTelephone(e.target.value)}
        />

        <input
          placeholder="PIN"
          type="password"
          value={codePin}
          onChange={(e) => setCodePin(e.target.value)}
        />

        <input
          placeholder="Code Agence"
          value={codeAgence}
          onChange={(e) => setCodeAgence(e.target.value)}
        />

        <button type="submit">
          {loading ? "Connexion..." : "Se connecter"}
        </button>
      </form>
    </div>
  );
}