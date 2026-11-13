import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

import PromoPanel from "../components/PromoPanel";
import EmailInput from "../components/EmailInput";
import PasswordInput from "../components/PasswordInput";
import GoogleAuthButton from "../components/GoogleAuthButton";

import logo from '@/assets/images/logo.svg'

const Register = () => {
  const navigate = useNavigate();
  const { authLoading, fieldErrors, setFieldErrors, handleRegister } = useAuth();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accountType, setAccountType] = useState('buyer');

  const submitRegisterHandler = async (e) => {
    e.preventDefault();

    const result = await handleRegister({ username, email, password, accountType });

    if (result) { navigate('/verify-otp', { state: { email } } ) }
  };

  return (
    <div className="container pt-4">
      <div onClick={() => { navigate("/") }} style={{ cursor: "pointer" }}>
        <img src={logo} alt="logo" height={52} />
      </div>

      <div className="row px-xl-5 py-4 align-items-center">
        <div className="col-lg-6 px-xxl-5 mb-3">
          <div className="px-xxl-4">
            <div className="col-12 text-center mb-3">
              <h3 className="mb-1 fw-semibold fs-3 text-dark">Create a new account</h3>
              <p className="text-body-tertiary">Join us and start learning today</p>
            </div>

            <form onSubmit={submitRegisterHandler}>
              <div className="mb-3">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  name="username"
                  className={`form-control ${fieldErrors.username ? 'is-invalid' : ''}`}
                  value={username}
                  onChange={(e) => { setUsername(e.target.value);
                    if (fieldErrors.username) {
                        setFieldErrors(prev => ({ ...prev, username: '' }));
                    }
                  }}
                  placeholder="Enter your username"
                />
                {fieldErrors.username && (
                  <div className="text-danger small mt-1">{fieldErrors.username}</div>
                )}
              </div>

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

              <div className="mt-3 d-flex gap-3">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="accountType"
                    id="buyer"
                    value="buyer"
                    checked={accountType === 'buyer'}
                    onChange={(e) => setAccountType(e.target.value)}
                  />
                  <label className="form-check-label" htmlFor="buyer">Become a Buyer</label>
                </div>

                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="accountType"
                    id="seller"
                    value="seller"
                    checked={accountType === 'seller'}
                    onChange={(e) => setAccountType(e.target.value)}
                  />
                  <label className="form-check-label" htmlFor="seller">Become a Seller</label>
                </div>
              </div>

              <div className="row g-2 my-2">
                <div className="col-sm-6 mb-2">
                  <button
                    type="submit"
                    className="btn btn-primary col-12 rounded-2"
                    style={{ paddingBlock: "0.7rem" }}
                    disabled={authLoading}
                  >
                    {authLoading ? "Waiting..." : "Register Account"}
                  </button>
                </div>
                <GoogleAuthButton label="Sign up with Google" googleText="signup_with" />
              </div>
            </form>

            <div className="col-12 text-center">
              <p className="mb-0" style={{ fontSize: "1.1rem" }}>
                Already have an account?{" "}
                <span onClick={() => navigate("/login")} style={{ cursor: "pointer", color: "#0d6efd" }}>
                  Sign in
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

export default Register;