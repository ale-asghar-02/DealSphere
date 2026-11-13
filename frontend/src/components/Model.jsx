import { useEffect, useState } from "react";
import ReactDOM from "react-dom";

const Modal = ({ show, onClose, title, children, footer, size, staticBackdrop = false }) => {
  const [shouldRender, setShouldRender] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let rafId1, rafId2, timeoutId;

    if (show) {
      setShouldRender(true);
      rafId1 = requestAnimationFrame(() => {
        rafId2 = requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
    } else {
      setIsVisible(false);
      timeoutId = setTimeout(() => {
        setShouldRender(false);
      }, 300);
    }

    return () => {
      cancelAnimationFrame(rafId1);
      cancelAnimationFrame(rafId2);
      clearTimeout(timeoutId);
    };
  }, [show]);

  useEffect(() => {
    if (!shouldRender) return;

    const handleEsc = (e) => {
      if (e.key === "Escape" && !staticBackdrop) {
        onClose?.();
      }
    };

    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [shouldRender, staticBackdrop, onClose]);

  if (!shouldRender) return null;

  const sizeClass = size ? `modal-${size}` : "";

  const handleBackdropClick = () => {
    if (!staticBackdrop) {
      onClose?.();
    }
  };

  return ReactDOM.createPortal(
    <>
      <div
        className={`modal fade ${isVisible ? "show" : ""}`}
        style={{ display: "block" }}
        tabIndex="-1"
        onClick={handleBackdropClick}
      >
        <div
          className={`modal-dialog modal-dialog-centered ${sizeClass}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-content">
            <div className="modal-header">
              <h1 className="modal-title fs-5">{title}</h1>
              <button type="button" className="btn-close" aria-label="Close" onClick={() => onClose?.()}></button>
            </div>
            <div className="modal-body">{children}</div>
            {footer && <div className="modal-footer">{footer}</div>}
          </div>
        </div>
      </div>
      <div className={`modal-backdrop fade ${isVisible ? "show" : ""}`}></div>
    </>,
    document.body
  );
};

export default Modal;