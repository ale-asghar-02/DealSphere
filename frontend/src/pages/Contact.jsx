import { useContext, useState, useEffect } from "react";
import Navbar from "@/components/Navbar/Navbar";
import { AuthContext } from "@/features/auth/AuthContext";
import useUser from "@/hooks/useUser";
import { IconPaperclip, IconArrowUpRight, IconX } from "@tabler/icons-react";

const subjectOptions = [
  "General Inquiry",
  "Payment Issue",
  "Account Problem",
  "Report a Bug",
  "Advertisement / Listing Issue",
  "Other",
];

const Contact = () => {
  const { user } = useContext(AuthContext);
  const { contactLoading, handleSubmitContact, fieldErrors, setFieldErrors } = useUser();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    if (user) {
      setName(user.username || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const clearError = (field) => {
    if (fieldErrors[field]) setFieldErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const resetForm = () => {
    if (!user) setName("");
    if (!user) setEmail("");
    setSubject("");
    setMessage("");
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("subject", subject);
    formData.append("message", message);
    if (imageFile) formData.append("image", imageFile);

    const success = await handleSubmitContact(formData);
    if (success) resetForm();
  };

  return (
    <div>
      <Navbar />

      <div className="container py-5">
        <div className="d-flex align-items-center mb-5">
          <div style={{ width: "3px", height: "80px", background: "#111" }} className="me-4 d-none d-md-block" />
          <div>
            <h1 className="fw-bold display-6 mb-1">Need help? Let's sort it out</h1>
            <h1 className="fw-bold display-6 mb-0">Send us a message <span>📩</span></h1>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="row mb-4">
            <div className="col-md-6 mb-3 mb-md-0">
              <label className="form-label text-secondary small mb-2">Your name</label>
              <input
                type="text"
                className={`form-control ${fieldErrors.name ? "is-invalid" : ""}`}
                style={{ paddingBlock: "10px" }}
                value={name}
                disabled={!!user}
                onChange={(e) => {
                  setName(e.target.value);
                  clearError("name");
                }}
                placeholder="Enter your name"
              />
              {fieldErrors.name && <div className="text-danger small mt-1">{fieldErrors.name}</div>}
            </div>

            <div className="col-md-6">
              <label className="form-label text-secondary small mb-2">Your email</label>
              <input
                type="email"
                className={`form-control ${fieldErrors.email ? "is-invalid" : ""}`}
                style={{ paddingBlock: "10px" }}
                value={email}
                disabled={!!user}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearError("email");
                }}
                placeholder="you@example.com"
              />
              {fieldErrors.email && <div className="text-danger small mt-1">{fieldErrors.email}</div>}
            </div>
          </div>

          <div className="row mb-4">
            <div className="col-md-6">
              <label className="form-label text-secondary small mb-2">What is this about</label>
              <select
                className={`form-select ${fieldErrors.subject ? "is-invalid" : ""}`}
                style={{ paddingBlock: "10px" }}
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  clearError("subject");
                }}
              >
                <option value="">Select a subject</option>
                {subjectOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              {fieldErrors.subject && <div className="text-danger small mt-1">{fieldErrors.subject}</div>}
            </div>

            <div className="col-md-6">
              <label className="form-label text-secondary small mb-2">Attach image (optional)</label>

              {!imagePreview ? (
                <label
                  htmlFor="contactImage"
                  className="form-control d-flex align-items-center text-secondary"
                  style={{ cursor: "pointer", paddingBlock: "10px" }}
                >
                  <IconPaperclip size={16} className="me-2" />
                  Upload a file
                  <input type="file" id="contactImage" accept="image/*" className="d-none" onChange={handleImageChange} />
                </label>
              ) : (
                <div className="d-flex align-items-center border rounded px-2 py-1">
                  <img
                    src={imagePreview}
                    alt="preview"
                    className="rounded me-2"
                    style={{ width: "36px", height: "36px", objectFit: "cover" }}
                  />
                  <span className="small text-truncate flex-grow-1">{imageFile?.name}</span>
                  <button type="button" onClick={removeImage} className="btn btn-sm p-1 border-0">
                    <IconX size={16} />
                  </button>
                </div>
              )}
              {fieldErrors.image && <div className="text-danger small mt-1">{fieldErrors.image}</div>}
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label text-secondary small mb-2">Message</label>
            <textarea
              rows={6}
              className={`form-control ${fieldErrors.message ? "is-invalid" : ""}`}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                clearError("message");
              }}
              placeholder="Tell us what's going on..."
            />
            {fieldErrors.message && <div className="text-danger small mt-1">{fieldErrors.message}</div>}
          </div>

          <button type="submit" className="btn btn-outline-dark d-inline-flex align-items-center gap-2 px-4 py-2" disabled={contactLoading}>
            {contactLoading ? <span>Waiting</span> : <>Just Send <IconArrowUpRight size={18} /></>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Contact;