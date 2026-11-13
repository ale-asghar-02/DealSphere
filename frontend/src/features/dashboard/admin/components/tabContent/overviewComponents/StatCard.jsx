import React from "react";

const StatCard = ({ label, value, Icon }) => {
  return (
    <div className="col-6 col-md-4 col-lg-3">
      <div
        className="h-100 d-flex flex-column flex-sm-row align-items-start align-items-sm-center gap-2 gap-sm-3"
        style={{
          background: "#fff",
          border: "1px solid #eef0f2",
          borderRadius: 16,
          padding: "20px 22px",
          transition: "border-color 0.15s ease, box-shadow 0.15s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "#d7dae0";
          e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "#eef0f2";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        {Icon && (
          <div
            className="d-flex align-items-center justify-content-center flex-shrink-0 rounded-3"
            style={{
              width: 38,
              height: 38,
              background: "#f4f5f7",
            }}
          >
            <Icon size={18} stroke={1.6} color="#212529" />
          </div>
        )}
        <div style={{ minWidth: 0 }}>
          <div className="fw-bolder" style={{ fontSize: "1.15rem", lineHeight: 1.2 }}>
            {value}
          </div>
          <div
            className="text-muted"
            style={{ fontSize: "0.8rem", lineHeight: 1.3 }}
          >
            {label}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatCard;