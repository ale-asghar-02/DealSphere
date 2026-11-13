import { useState } from "react";
import Modal from "@/components/Model";
import useAutofill from "../hooks/useAutofill";

const DESC_MIN = 10;
const DESC_MAX = 5000;

// 422 response ke partialData mein categoryId / subCategoryId aata hai aur category
// match nahi hui hoti, is liye category ids hata kar baaki fields (title, price...) use karte hain.
const normalizeResult = (result) => {
  if (!result) return null;
  if (result.data) return result.data;
  if (result.partialData) {
    const { categoryId, subCategoryId, category, subCategory, ...rest } = result.partialData;
    return rest;
  }
  return null;
};

const AdAutofillModal = ({ show, onClose, onApply }) => {
  const { autofillLoading, handleAutofillAd } = useAutofill();
  const [description, setDescription] = useState("");
  const [condition, setCondition] = useState("");
  const [touched, setTouched] = useState(false);

  const trimmedLength = description.trim().length;
  const isDescValid = trimmedLength >= DESC_MIN && trimmedLength <= DESC_MAX;

  const handleClose = () => {
    if (autofillLoading) return; // request chal rahi ho to modal band na ho
    setDescription("");
    setCondition("");
    setTouched(false);
    onClose();
  };

  const handleAdd = async () => {
    if (autofillLoading) return;
    setTouched(true);
    if (!isDescValid) return;

    // Condition optional hai: services, birds, jobs mein khali rehne do
    const result = await handleAutofillAd(description.trim(), condition);
    const data = normalizeResult(result);

    if (data) {
      await onApply(data);
      setDescription("");
      setCondition("");
      setTouched(false);
      onClose();
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
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={handleClose}
            disabled={autofillLoading}
          >
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
        <label className="form-label">Describe your item or service</label>
        <textarea
          className={`form-control ${touched && !isDescValid ? "is-invalid" : ""}`}
          rows="5"
          maxLength={DESC_MAX}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Selling my Samsung 55 inch 4K TV, brand new, sealed box... or: I build React websites for businesses"
        />
        <div className="mt-1 d-flex justify-content-between">
          {touched && !isDescValid ? (
            <small className="text-danger">
              Description must be at least {DESC_MIN} characters
            </small>
          ) : (
            <small className="text-muted">Mention brand, model, features etc.</small>
          )}
          <small className="text-muted">
            {description.length}/{DESC_MAX}
          </small>
        </div>
      </div>

      <div className="mb-2">
        <label className="form-label">
          Condition <span className="text-muted">(optional)</span>
        </label>
        <select
          className="form-select py-2"
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
        >
          <option value="">Not applicable / skip</option>
          <option value="New">New</option>
          <option value="Used">Used</option>
          <option value="Open Box">Open Box</option>
        </select>
        <small className="text-muted">
          Services, jobs, birds/animals jaisi cheezon ke liye khali chhor do.
        </small>
      </div>
    </Modal>
  );
};

export default AdAutofillModal;