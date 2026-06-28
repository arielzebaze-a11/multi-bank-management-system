interface ModalProps {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  width?: string;
}

export default function Modal({
  open,
  title,
  children,
  onClose,
  width = "500px",
}: ModalProps) {
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.45)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
    >
      <div
          style={{
              width,
              maxWidth: "95vw",
              maxHeight: "90vh",
              background: "#fff",
              borderRadius: "14px",
              overflow: "hidden",
              boxShadow: "0 15px 40px rgba(0,0,0,.25)",
              display: "flex",
              flexDirection: "column"
          }}
      >
        <div
          style={{
            padding: "18px 25px",
            borderBottom: "1px solid #eee",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ margin: 0 }}>{title}</h2>

          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              fontSize: 22,
              cursor: "pointer",
            }}
          >
            ✖
          </button>
        </div>

        <div
            style={{
                padding: "25px",
                overflowY: "auto",
                flex: 1
            }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}