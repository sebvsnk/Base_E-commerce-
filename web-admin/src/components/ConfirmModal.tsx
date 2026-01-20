import "./ConfirmModal.css";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  type = "warning"
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="confirm-modal-overlay" onClick={onClose}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className={`confirm-modal__icon confirm-modal__icon--${type}`}>
          {type === "danger" && "⚠️"}
          {type === "warning" && "❓"}
          {type === "info" && "ℹ️"}
        </div>
        
        <h2 className="confirm-modal__title">{title}</h2>
        <p className="confirm-modal__message">{message}</p>
        
        <div className="confirm-modal__actions">
          <button 
            className="confirm-modal__button confirm-modal__button--cancel" 
            onClick={onClose}
          >
            {cancelText}
          </button>
          <button 
            className="confirm-modal__button confirm-modal__button--confirm" 
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
