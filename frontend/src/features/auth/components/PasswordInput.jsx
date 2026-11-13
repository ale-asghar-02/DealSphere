import { useState } from "react";
import { IconEye, IconEyeOff } from "@tabler/icons-react";

function PasswordInput({ 
  label = "Password", 
  name = "password", 
  value, 
  onChange,
  error,
  placeholder = "Enter your password" 
}) {
  const [showPassword, setShowPassword] = useState(false);
  const togglePassword = () => setShowPassword(!showPassword);

  return (
    <div className="mb-3">
      <label className="form-label">{label}</label>
      <div className="position-relative d-flex align-items-center">
        <input
          type={showPassword ? "text" : "password"}
          className={`form-control ${error ? 'is-invalid' : ''}`}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
        />
        {!error && (
          showPassword ? (
            <IconEyeOff
              className="position-absolute end-0 me-3"
              style={{ cursor: "pointer" }}
              onClick={togglePassword}
              stroke={1.5}
            />
          ) : (
            <IconEye
              className="position-absolute end-0 me-3"
              style={{ cursor: "pointer" }}
              onClick={togglePassword}
              stroke={1.5}
            />
          )
        )}
      </div>
      {error && <div className="text-danger small mt-1">{error}</div>}
    </div>
  );
}

export default PasswordInput;