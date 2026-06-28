import api from "../../services/api";

export default function AdminReports() {

  const downloadReport = async () => {
    try {
      const response = await api.get(
        "/admin/reports/global",
        {
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(
        new Blob([response.data])
      );

      const link = document.createElement("a");

      link.href = url;
      link.download = "Rapport_SGB.pdf";

      document.body.appendChild(link);

      link.click();

      link.remove();

    } catch (error) {
      console.error(error);
      alert("Erreur téléchargement PDF");
    }
  };

  return (
    <div>
      <h1>📑 Rapports</h1>

      <button onClick={downloadReport}>
        Télécharger le rapport PDF
      </button>
    </div>
  );
}