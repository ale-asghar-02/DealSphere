import { useAuth } from "../hooks/useAuth";
import googleIcon from "@/assets/icons/google.svg";

const GoogleAuthButton = ({ label = "Sign in with Google" }) => {
  const { handleGoogleAuth } = useAuth();

  return (
    <div className="col-12 col-sm-6 mb-2 google-auth-btn">
      <button type="button" onClick={() => handleGoogleAuth()}>
        <img src={googleIcon} alt="Google" />
        <span>{label}</span>
      </button>
    </div>
  );
};

export default GoogleAuthButton;