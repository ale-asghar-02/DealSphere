import { IconBan } from "@tabler/icons-react";

const BlockedBanner = ({ other, onUnblock }) => (
  <div className="d-flex align-items-center justify-content-between px-3 py-2 rounded mx-1 mb-2" style={{ background: "#fff3e0", border: "1px solid #ffb74d" }}>
    <span className="d-flex align-items-center gap-2" style={{ fontSize: "13px", color: "#e65100" }}>
      <IconBan size={15} /> You have blocked {other?.username || other?.name || "this user"}
    </span>
    <button className="btn btn-sm fw-semibold" style={{ fontSize: "12px", color: "#002f34" }} onClick={onUnblock}>Unblock</button>
  </div>
);

export default BlockedBanner;
