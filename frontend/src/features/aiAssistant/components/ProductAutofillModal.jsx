import { useState } from "react";
import Modal from "@/components/Model";
import useAutofill from "../hooks/useAutofill";

const ProductAutofillModal = ({ show, onClose, onApply }) => {
  const { autofillLoading, handleAutofillProduct } = useAutofill();
  const [description, setDescription] = useState("");
  const [touched, setTouched] = useState(false);

  const isDescValid = description.trim().length >= 10;

  const handleClose = () => {
    setDescription("");
    setTouched(false);
    onClose();
  };

  const handleAdd = async () => {
    setTouched(true);
    if (!isDescValid) return;

    const result = await handleAutofillProduct(description);

    if (result) {
      onApply(result.data);
      handleClose();
    }
  };

  return (
    <Modal
      show={show}
      onClose={handleClose}
      title="AI Autofill"
      size="lg"
      footer={
        <>
          <button type="button" className="btn btn-outline-secondary" onClick={handleClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleAdd}
            disabled={autofillLoading}
          >
            {autofillLoading ? "Generating..." : "Add"}
          </button>
        </>
      }
    >
      <div className="mb-3">
        <label className="form-label">Describe your item</label>
        <textarea
          className={`form-control ${touched && !isDescValid ? "is-invalid" : ""}`}
          rows="5"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Selling my Samsung 55 inch 4K TV, brand new, sealed box..."
        />
        <div className="mt-1 d-flex justify-content-between">
          {touched && !isDescValid ? (
            <small className="text-danger">Description must be at least 10 characters</small>
          ) : (
            <small className="text-muted">Mention brand, model, features etc.</small>
          )}
          <small className="text-muted">{description.length}/5000</small>
        </div>
      </div>
    </Modal>
  );
};

export default ProductAutofillModal;