import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../hooks/useAuth";

const GoogleAuthButton = ({ label = 'Sign in with Google', googleText = 'signin_with' }) => {
  const { handleGoogleAuth } = useAuth();
  const navigate = useNavigate();

  const onGoogleSuccess = async (credentialResponse) => {
    const idToken = credentialResponse.credential;
    const result = await handleGoogleAuth({ idToken });

    if (!result.success) return;

    if (result.needsVerification) {
      navigate('/verify-otp', { state: { email: result.email } });
    } else {
      navigate('/');
    }
  };

  return (
    <div className="col-sm-6 mb-2 google-auth-btn">
      <GoogleLogin
        onSuccess={onGoogleSuccess}
        onError={() => toast.error('Google login failed')}
        useOneTap={false}
        text={googleText}
        render={(renderProps) => (
          <button
            type="button"
            onClick={renderProps.onClick}
            disabled={renderProps.disabled}
          >
            {label}
          </button>
        )}
      />
    </div>
  );
};

export default GoogleAuthButton;