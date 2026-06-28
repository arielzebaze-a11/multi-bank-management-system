export default function useAuth() {

    const compte = JSON.parse(
        localStorage.getItem("compte") || "{}"
    );

    const nom = compte.user || "";

    const initiales = nom
        .trim()
        .split(/\s+/)
        .map((mot: string) => mot.charAt(0))
        .join("")
        .slice(0, 2)
        .toUpperCase();

    return {
        nom,
        role: compte.role || "",
        telephone: compte.telephone || "",
        banque: compte.banque || "",
        initiales
    };
}