import { Button, Modal } from "react-bootstrap";

function ConfirmModal({
  show,
  onHide,
  title,
  body,
  cancelLabel = "Cancel",
  confirmLabel = "Confirm",
  onConfirm,
}) {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton className="hv-modal-header">
        <Modal.Title className="hv-modal-title">{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body className="hv-modal-body">{body}</Modal.Body>
      <Modal.Footer className="hv-modal-footer">
        <Button variant="secondary" className="hv-modal-btn-min" onClick={onHide}>
          {cancelLabel}
        </Button>
        <Button className="hv-primary-btn hv-modal-btn-min" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default ConfirmModal;
