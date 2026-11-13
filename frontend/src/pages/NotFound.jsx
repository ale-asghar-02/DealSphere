import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="d-flex flex-column align-items-center justify-content-center p-3" style={{
      minHeight: "100vh", textAlign: "center",
    }}>

      {/* 404 number */}
      <div className="d-flex align-items-center fw-semibold" style={{ fontSize: 120, height : '150px' }}>
        <span>4</span>
        <span className="ms-2" style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 90, height: 90, borderRadius: "50%",
          background: "#f1f5f9", border: "2.5px solid #cbd5e1",
          margin: "0 4px", position: "relative", top: -4,
        }}>
          <span style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "#e2e8f0", border: "1.5px solid #cbd5e1",
          }} />
        </span>
        <span>4</span>
      </div>

      {/* Divider */}
      <div className="mb-3 rounded-pill" style={{
        width: 100, height: 2, background: "#cbd5e1"
      }} />

      {/* Message */}
      <p className="fw-medium mb-2" style={{ fontSize: 20 }}>
        This page doesn't exist
      </p>
      <p className="col-12 col-md-8 col-lg-5 col-xl-4 text-body-secondary" style={{ fontSize: 14 }}>
        The page you're looking for may have been moved, deleted, or never existed in the first place.
      </p>

      {/* Button */}
      <button className="d-flex align-items-center gap-3 border-0 rounded-pill"
        onClick={() => navigate("/")}
        style={{
          background: "#0f172a", color: "#fff",
          padding: "10px 28px", fontSize: '14px'
        }}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"
          stroke="currentColor" strokeWidth="1.5"
          strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13l-5-5 5-5" />
        </svg>
        Go back home
      </button>
    </div>
  );
};

export default NotFound;