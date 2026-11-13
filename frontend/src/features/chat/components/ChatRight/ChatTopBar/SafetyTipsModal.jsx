import Modal from "@/components/Model";

const SAFETY_TIPS = [
  "Meet in a safe public place",
  "Do not share your financial information",
  "Inspect the item before paying",
  "Avoid any advance payments",
  "Report suspicious ads or products",
];

const SafetyTipsModal = ({ show, onClose }) => (
  <Modal
    show={show}
    onClose={onClose}
    title="Safety Tips"
    footer={<button className="btn btn-sm w-100" style={{ background: "#002f34", color: "#fff" }} onClick={onClose}>OK</button>}
  >
    <ul className="mb-0 ps-3">
      {SAFETY_TIPS.map((tip) => (
        <li key={tip} className="mb-2" style={{ fontSize: "13px", color: "#444" }}>{tip}</li>
      ))}
    </ul>
  </Modal>
);

export default SafetyTipsModal;
