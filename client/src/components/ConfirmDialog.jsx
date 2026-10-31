import { useState } from "react";
import Modal from "./Modal.jsx";

export default function ConfirmDialog({ title, text, confirmLabel = "Delete", onConfirm, onClose }) {
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    await onConfirm();
    setBusy(false);
    onClose();
  };
  return (
    <Modal title={title} onClose={onClose} width={420}>
      <div className="mdl-body"><p className="mdl-text">{text}</p></div>
      <div className="mdl-foot">
        <span className="grow" />
        <button type="button" className="dx-btn" onClick={onClose} autoFocus>Cancel</button>
        <button type="button" className="dx-btn danger solid" onClick={run} disabled={busy}>{confirmLabel}</button>
      </div>
    </Modal>
  );
}
