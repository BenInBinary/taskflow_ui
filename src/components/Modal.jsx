// ──────────────────────────────────────────────
// src/components/Modal.jsx  —  Reusable modal
// ──────────────────────────────────────────────

export default function Modal({ title, children, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">{title}</h2>
        {children}
      </div>
    </div>
  );
}
