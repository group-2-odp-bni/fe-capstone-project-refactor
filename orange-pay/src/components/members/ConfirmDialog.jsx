import React, { useEffect } from "react";

export default function ConfirmDialog({
  open,
  title = "Konfirmasi",
  message,
  children,
  confirmText = "Ya",
  cancelText = "Tidak",
  onConfirm,
  onClose,
  loading = false,
}) {
  useEffect(() => {
    const onEsc = (e) => e.key === "Escape" && onClose?.();
    if (open) window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">{title}</div>

        {message && <div className="modal-body">{message}</div>}
        {children}

        <div className="modal-actions">
          <button disabled={loading} className="btn" onClick={onConfirm}>
            {loading ? "Loading..." : confirmText}
          </button>
          <button disabled={loading} className="btn danger" onClick={onClose}>
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}
