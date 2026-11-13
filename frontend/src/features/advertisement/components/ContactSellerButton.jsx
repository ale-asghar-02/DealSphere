import { useState } from "react";
import { IconPhone, IconPhoneOff } from "@tabler/icons-react";
import Modal from "@/components/Model";

const ContactSellerButton = ({ ad, product }) => {
  const [showPhoneModal, setShowPhoneModal] = useState(false);

  const item = ad || product;

  if (!item) return null;

  // agar product model se aa raha ha to contactInfo ke andar hoga
  const phoneNumber = item.contactInfo?.phoneNumber ?? item.phoneNumber;
  const showPhone = item.contactInfo
    ? item.contactInfo.showPhone
    : item.phoneNumberStatus === "show";
  const sellerName = item.seller?.username || item.user?.username || "N/A";

  return (
    <>
      <div>
        {showPhone ? (
          <button
            type="button"
            className="btn btn-outline-success d-flex align-items-center justify-content-center rounded-circle p-0"
            style={{ width: "40px", height: "40px" }}
            onClick={(e) => {
              e.stopPropagation();
              setShowPhoneModal(true);
            }}
          >
            <IconPhone stroke={1.5} size={22} />
          </button>
        ) : (
          <button
            type="button"
            className="border border-danger bg-transparent d-flex align-items-center justify-content-center rounded-circle p-0"
            style={{ width: "40px", height: "40px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <IconPhoneOff stroke={1.5} size={22} color="#DC3545" />
          </button>
        )}
      </div>

      <Modal
        title="Contact Seller"
        show={showPhoneModal}
        onClose={() => setShowPhoneModal(false)}
        footer={
          <button
            type="button"
            className="btn btn-secondary"
            onClick={(e) => {
              e.stopPropagation();
              setShowPhoneModal(false);
            }}
          >
            Close
          </button>
        }
      >
        <p className="text-muted text-center mb-4" style={{ fontSize: "14px" }}>
          Below are the contact details of the seller.
          You can save the number and contact them directly from your phone.
        </p>

        <div className="border rounded-3 p-3 bg-light">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <span className="text-muted">Seller Name</span>
            <span className="fw-medium fs-6">{sellerName}</span>
          </div>
          <div className="d-flex justify-content-between align-items-center">
            <span className="text-muted">Phone Number</span>
            <span className="fw-medium text-success fs-6">+92 {phoneNumber}</span>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ContactSellerButton;