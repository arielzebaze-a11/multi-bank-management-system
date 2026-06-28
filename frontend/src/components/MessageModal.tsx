import Modal from "./Modal";

interface Props {
  open: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

export default function MessageModal({
  open,
  title,
  message,
  onClose,
}: Props) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      width="450px"
    >
      <p
        style={{
          fontSize: "17px",
          textAlign: "center",
          marginBottom: "25px",
        }}
      >
        {message}
      </p>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
        }}
      >
        <button
          onClick={onClose}
          style={{
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "10px 25px",
            cursor: "pointer",
          }}
        >
          OK
        </button>
      </div>
    </Modal>
  );
}