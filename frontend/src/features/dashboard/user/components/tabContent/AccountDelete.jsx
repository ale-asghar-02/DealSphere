import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconTrash } from "@tabler/icons-react";

import Modal from "@/components/Model";
import useDashboard from "../../../hooks/useDashboard";

const OTP_LENGTH = 6; // apne backend ke generateOtp ki length ke hisaab se
const RESEND_SECONDS = 60;

const formatTime = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

const AccountDelete = () => {
  const navigate = useNavigate();
  const { dashboardLoading, handleSendDeleteOtp, handleAccountDelete } =
    useDashboard();

  const [showModal, setShowModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(0);

  // Resend timer
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  // Step 1: Delete button par OTP bhejo. Blocker (orders/wallet) ho to modal nahi khulega,
  // hook error toast dikha dega.
  const openDeleteModal = async () => {
    const sent = await handleSendDeleteOtp();
    if (sent) {
      setOtp("");
      setSecondsLeft(RESEND_SECONDS);
      setShowModal(true);
    }
  };

  const closeModal = () => {
    if (dashboardLoading) return;
    setShowModal(false);
    setOtp("");
    setSecondsLeft(0);
  };

  // Resend: OTP expire ho gaya ho ya na mila ho
  const resendOtp = async () => {
    const sent = await handleSendDeleteOtp();
    if (sent) {
      setOtp("");
      setSecondsLeft(RESEND_SECONDS);
    }
  };

  // Verify aur delete
  const verifyAndDelete = async (e) => {
    e.preventDefault();
    if (otp.length !== OTP_LENGTH) return;

    const deleted = await handleAccountDelete(otp);
    if (deleted) {
      setShowModal(false);
      navigate("/", { replace: true });
    }
  };

  return (
    <>
      <div className="col-12 text-center py-5">
        <IconTrash className="mb-3" size={80} color="#dc3545" stroke={1.5} />
        <h4 className="fw-semibold mb-2">Delete Your Account</h4>
        <div className="col-12 d-flex justify-content-center">
          <p className="col-12 col-lg-8 col-xl-6 mb-4">
            Are you sure you want to delete your account? This action cannot be
            undone. Your personal information will be removed, and you will not
            be able to log in again.
          </p>
        </div>
        <button
          onClick={openDeleteModal}
          type="button"
          className="btn btn-danger px-5"
          style={{ paddingBlock: "10px" }}
          disabled={dashboardLoading}
        >
          {dashboardLoading && !showModal ? "Sending OTP..." : "Account Delete"}
        </button>
      </div>

      <Modal
        show={showModal}
        onClose={closeModal}
        title={<span className="text-danger">Confirm account deletion</span>}
        staticBackdrop={dashboardLoading}
        footer={
          <div className="d-flex gap-2 w-100">
            <button
              type="button"
              className="btn btn-outline-secondary flex-fill"
              onClick={closeModal}
              disabled={dashboardLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="delete-account-form"
              className="btn btn-danger flex-fill"
              disabled={dashboardLoading || otp.length !== OTP_LENGTH}
            >
              {dashboardLoading ? "Please wait..." : "Verify & Delete Account"}
            </button>
          </div>
        }
      >
        <form
          id="delete-account-form"
          className="text-center"
          onSubmit={verifyAndDelete}
        >
          <p className="mb-3">
            We have sent a {OTP_LENGTH}-digit code to your email. Enter it
            below to permanently delete your account.
          </p>

          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            maxLength={OTP_LENGTH}
            className="form-control form-control-lg text-center fw-bold"
            style={{ letterSpacing: "0.5rem" }}
            placeholder={"•".repeat(OTP_LENGTH)}
            value={otp}
            onChange={(e) =>
              setOtp(e.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH))
            }
            disabled={dashboardLoading}
          />

          <div className="mt-3 small text-muted">
            Code expired or not received?{" "}
            {secondsLeft > 0 ? (
              <span>Resend in {formatTime(secondsLeft)}</span>
            ) : (
              <button
                type="button"
                className="btn btn-link p-0 align-baseline"
                onClick={resendOtp}
                disabled={dashboardLoading}
              >
                Resend code
              </button>
            )}
          </div>
        </form>
      </Modal>
    </>
  );
};

export default AccountDelete;