import { useState } from "react";
import Modal from "@/components/Model";

const StockModal = ({ product, onClose, handleSellerUpdateStock }) => {
  const [stock, setStock] = useState(product.stock ?? 0);
  const [submitting, setSubmitting] = useState(false);

  const handleSave = async () => {
    setSubmitting(true);
    await handleSellerUpdateStock?.(product._id, { action: "set", quantity: Number(stock) });
    setSubmitting(false);
    onClose();
  };

  return (
    <Modal
      show={true}
      onClose={onClose}
      title="Update Stock"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={submitting}>
            {submitting ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</> : "Save"}
          </button>
        </>
      }
    >
      <label className="form-label">New Stock Quantity</label>
      <input
        type="number"
        min="0"
        className="form-control"
        value={stock}
        onChange={(e) => setStock(e.target.value)}
      />
      <small className="text-muted">Current stock: {product.stock ?? 0}</small>
    </Modal>
  );
};

export default StockModal;