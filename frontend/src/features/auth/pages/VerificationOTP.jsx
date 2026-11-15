import { useRef, useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams, Navigate } from "react-router-dom";
import { IconShieldCheck } from "@tabler/icons-react";
import { useAuth } from "../hooks/useAuth";

import EmailInput from "../components/EmailInput";

const VerificationOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const {
    authLoading,
    user,
    fieldErrors,
    setFieldErrors,
    handleSendOtpVerify,
    handleVerifyAccount,
    handleResetOtp,
    handleVerifyResetOtp,
  } = useAuth();

  const RESEND_SECONDS = 60;
  // mode: 'reset' → forgot password flow, otherwise → register/account-verify flow
  const mode = location.state?.mode === "reset" ? "reset" : "register";

  // email ka source: router state (normal register / reset),
  // ?email= query param (Google signup redirect), ya logged-in user
  const [email] = useState(
    location.state?.email ||
      searchParams.get("email") ||
      user?.email ||
      ""
  );
  const [otp, setOtp] = useState("");

  const submitVerifyHandler = async (e) => {
    e.preventDefault();

    if (mode === "reset") {
      const result = await handleVerifyResetOtp({ email, otp });
      if (result) {
        navigate("/reset-password", { state: { email } });
      }
    } else {
      const result = await handleVerifyAccount({ email, otp });
      if (result) {
        navigate("/");
      }
    }
  };

  const [code, setCode] = useState(new Array(6).fill(""));
  const [timeLeft, setTimeLeft] = useState(RESEND_SECONDS);
  const inputs = useRef([]);

  // Timer logic
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const handleResend = async () => {
    const result =
      mode === "reset"
        ? await handleResetOtp({ email })
        : await handleSendOtpVerify({ email });

    if (result !== false) {
      setTimeLeft(RESEND_SECONDS);
    }
  };

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return;

    const newCode = [...code];
    newCode[index] = element.value;
    setCode(newCode);
    setOtp(newCode.join(""));

    if (fieldErrors.otp) {
      setFieldErrors((prev) => ({ ...prev, otp: "" }));
    }

    if (element.value !== "" && index < 5) {
      inputs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && code[index] === "" && index > 0) {
      inputs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();

    const pasteData = e.clipboardData.getData("text").trim();

    if (!/^\d+$/.test(pasteData)) return; // only numbers allowed

    const pasteArray = pasteData.slice(0, 6).split(""); // max 6 digits

    const newCode = [...code];

    pasteArray.forEach((digit, index) => {
      newCode[index] = digit;
      if (inputs.current[index]) {
        inputs.current[index].value = digit;
      }
    });

    setCode(newCode);
    setOtp(newCode.join(""));

    if (fieldErrors.otp) {
      setFieldErrors((prev) => ({ ...prev, otp: "" }));
    }

    // focus on last filled input
    const lastIndex = pasteArray.length - 1;
    if (inputs.current[lastIndex]) {
      inputs.current[lastIndex].focus();
    }
  };

  // Email ke bina page na khule (saare hooks ke BAAD hona zaroori hai)
  if (!email) {
    return <Navigate to={mode === "reset" ? "/login" : "/register"} replace />;
  }

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 p-3">
      <div
        className="bg-white p-3 p-md-4 py-5 rounded-4 border"
        style={{ width: "380px" }}
      >
        <div className="text-center">
          <div
            className="mx-auto mb-3 d-flex align-items-center justify-content-center rounded-circle bg-primary"
            style={{ width: "60px", height: "60px" }}
          >
            <IconShieldCheck stroke={2} color="white" size={30} />
          </div>

          <h5 className="fw-semibold mb-2">Verify your code</h5>
          <p className="text-muted small mb-4">
            We have sent a code to your email
          </p>

          <form onSubmit={submitVerifyHandler}>
            <EmailInput value={email} label="Your email" readOnly />

            <div className="col-12 mb-4">
              <div className="d-flex justify-content-between">
                {code.map((data, index) => (
                  <input
                    key={index}
                    type="text"
                    maxLength="1"
                    className="form-control text-center fw-semibold fs-5 rounded-2"
                    style={{ width: "48px", height: "56px" }}
                    value={data}
                    onChange={(e) => handleChange(e.target, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    ref={(el) => (inputs.current[index] = el)}
                  />
                ))}
              </div>
              {fieldErrors.otp && (
                <div className="text-start text-danger small mt-1">
                  {fieldErrors.otp}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="col-12 btn btn-primary py-2 mb-3"
              disabled={authLoading}
            >
              {authLoading ? "Waiting..." : "Click here"}
            </button>
          </form>
          <p className="mt-3 small">
            Didn&rsquo;t receive code?
            {timeLeft > 0 ? (
              <span className="fw-medium"> {formatTime()}</span>
            ) : authLoading ? (
              <span className="text-muted fw-medium"> Waiting...</span>
            ) : (
              <span
                className="text-primary fw-medium"
                style={{ cursor: "pointer" }}
                onClick={handleResend}
              >
                {" "}
                Resend Code
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerificationOTP;