import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

import PasswordInput from "../components/PasswordInput";

import logo from "@/assets/images/logo.svg";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { authLoading, fieldErrors, setFieldErrors, handleForgotPassword } = useAuth();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const submitResetPasswordHandler = async (e) => {
    e.preventDefault();

    const result = await handleForgotPassword({ newPassword, confirmPassword });
    if (result) {
      navigate("/login");
    }
  };

  return (
    <div className="container">
      <div className="py-4" onClick={() => { navigate("/") }} style={{ cursor: "pointer" }}>
        <img src={logo} alt="logo" height={52} />
      </div>
      <div className="d-flex justify-content-center align-items-center" style={{ height: 'calc(88vh - 100px)' }}>
        <div className="col-12 col-md-8 col-lg-6 col-xl-4 border rounded-4 px-3 px-md-4 py-5">
          <div className="text-center">
            <h5 className="fw-semibold mb-1">Create New Password</h5>
            <p className="mb-0 text-secondary mb-3">
              Enter the new password below
            </p>
          </div>
          <form onSubmit={submitResetPasswordHandler}>
            <PasswordInput
              label="New Password"
              placeholder="Enter new password"
              value={newPassword}
              error={fieldErrors.newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (fieldErrors.newPassword) {
                  setFieldErrors((prev) => ({ ...prev, newPassword: "" }));
                }
              }}
            />
            <PasswordInput
              label="Confirm Password"
              placeholder="Confirm new password"
              value={confirmPassword}
              error={fieldErrors.confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (fieldErrors.confirmPassword) {
                  setFieldErrors((prev) => ({ ...prev, confirmPassword: "" }));
                }
              }}
            />

            <button
              type="submit"
              className="col-12 btn btn-primary"
              style={{ paddingBlock: "0.8rem" }}
              disabled={authLoading}
            >
              {authLoading ? "Waiting..." : "Save new password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;