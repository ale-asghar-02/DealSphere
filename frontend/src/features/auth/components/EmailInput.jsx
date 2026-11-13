import { useState } from "react";

function EmailInput({ 
  label = "Email", 
  name = "email", 
  value, 
  onChange, 
  error,
  readOnly,
  placeholder = "Enter your email" }) {

  return (

    <div className="text-start mb-3">
      <label className="form-label">{label}</label>
      <div className="position-relative d-flex align-items-center">
        <input
          type="email"
          className={`form-control ${error ? 'is-invalid' : ''} ${readOnly ? 'bg-body-secondary' : ''}`}
          name={name}
          value={value}
          onChange={onChange}
          readOnly={readOnly}
          placeholder={placeholder}
        />
      </div>
      {error && <div className="text-danger small mt-1">{error}</div>}
    </div>
  );
}

export default EmailInput;