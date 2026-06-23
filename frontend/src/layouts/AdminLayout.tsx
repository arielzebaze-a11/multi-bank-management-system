import AdminSidebar from "../components/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
      }}
    >
      <AdminSidebar />

      <div
        style={{
          flex: 1,
          padding: "20px",
          background: "#f5f5f5",
        }}
      >
        {children}
      </div>
    </div>
  );
}
  