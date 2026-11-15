import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import '../auth.scss'

import EmailInput from "../components/EmailInput";
import PasswordInput from "../components/PasswordInput";
import GoogleAuthButton from "../components/GoogleAuthButton";
import PromoPanel from "../components/PromoPanel";

import logo from '@/assets/images/logo.svg'

const Login = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { authLoading, fieldErrors, setFieldErrors, handleLogin, handleResetOtp, handleGoogleAuth } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Google se wapas aane par backend /login?error=<code> bhejta hai
  useEffect(() => {
    const code = searchParams.get("error");
    if (code) {
      handleGoogleAuth({ error: code });
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitLoginHandler = async (e) => {
    e.preventDefault();

    const result = await handleLogin({ email, password });

    if (result === true) {
      navigate('/')
    } else if (result.notVerified) {
      navigate('/verify-otp', { state: { email: result.email } });
    }
  }

  const handleForgotPasswordClick = async () => {
    if (!email) {
      setFieldErrors(prev => ({ ...prev, email: 'Email is required to reset password' }));
      return;
    }
    const result = await handleResetOtp({ email });
    if (result) {
      navigate('/verify-otp', { state: { email, mode: 'reset' } });
    }
  };

  return (
    <div className="container login-section pt-4">
      <div onClick={() => { navigate("/") }} style={{ cursor: "pointer" }}>
        <img src={logo} alt="logo" height={52} />
      </div>

      <div className="row px-xl-5 py-4 align-items-center">
        <div className="col-lg-6 px-xxl-5 mb-3">
          <div className="px-xxl-4">
            <div className="col-12 text-center mb-3">
              <h3 className="mb-1 fw-semibold fs-3 text-dark">Login to your account</h3>
              <p className="text-body-tertiary">Let’s get Started your journey with us</p>
            </div>

            <form onSubmit={submitLoginHandler}>

              <EmailInput value={email}
                error={fieldErrors.email}
                onChange={(e) => { setEmail(e.target.value);
                  if (fieldErrors.email) {
                      setFieldErrors(prev => ({ ...prev, email: '' }));
                  }
                }}
              />

              <PasswordInput value={password}
                error={fieldErrors.password}
                onChange={(e) => { setPassword(e.target.value);
                  if (fieldErrors.password) {
                      setFieldErrors(prev => ({ ...prev, password: '' }));
                  }
                }}
              />

              <div className="forgot-password" onClick={handleForgotPasswordClick}> Forgot Password?</div>

              <div className="row g-2 my-2">
                <div className="col-sm-6 mb-2">
                  <button
                    type="submit"
                    className="btn btn-primary col-12 rounded-2"
                    style={{ paddingBlock: "0.7rem" }}
                    disabled={authLoading}
                  >
                    {authLoading ? "Waiting..." : "Login Account"}
                  </button>
                </div>

                <GoogleAuthButton />
              </div>

            </form>

            <div className="col-12 text-center">
              <p className="mb-0" style={{ fontSize: "1.1rem" }}>
                Don't have an account?{" "}
                <span
                  onClick={() => navigate("/register")}
                  style={{ cursor: "pointer", color: "#0d6efd" }}>
                  Sign up
                </span>
              </p>
            </div>

          </div>
        </div>

        <PromoPanel />
      </div>
    </div>
  );
};

export default Login;