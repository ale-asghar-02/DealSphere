import { useState, useEffect } from "react";
import useContactModeration from "../../hooks/useContactModeration";
import useAdminSearch from "../../hooks/useAdminSearch";
import AdminSearchBar from "../AdminSearcBar"
import Modal from "@/components/Model";
import { IconEye, IconTrash, IconSend, IconCircleCheck, IconClock } from "@tabler/icons-react";

const STATUS_BADGE = {
  pending: "bg-warning text-dark",
  resolved: "bg-success text-white",
};

const timeAgo = (date) => new Date(date).toDateString();

const ContactSupport = () => {
  const {
    contacts,
    contactDetail,
    contactsLoading,
    handleGetAllContacts,
    handleGetContactById,
    handleReplyToContact,
    handleDeleteContact,
  } = useContactModeration();

  // Search bar sirf "support" type search karega
  const {
    results: searchResults,
    searchLoading,
    handleSearch,
    clearSearch,
  } = useAdminSearch("support");

  // Jab tak search active nahi, list normal contacts se banti hai
  const [isSearching, setIsSearching] = useState(false);

  const [statusFilter, setStatusFilter] = useState("");
  const [activeModal, setActiveModal] = useState(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => { handleGetAllContacts() }, []);
  const refreshList = () => {  handleGetAllContacts() };

  // search active ho to searchResults base list banti hai, warna normal contacts
  const baseContacts = isSearching ? searchResults : contacts;

  // status filter search results ke upar bhi apply hota hai
  const filteredContacts = statusFilter
    ? baseContacts.filter((c) => c.status === statusFilter)
    : baseContacts;

  const isLoading = isSearching ? searchLoading : (contactsLoading && contacts.length === 0);

  const onSearch = (query) => {
    setIsSearching(true);
    handleSearch(query);
  };

  const onClearSearch = () => {
    setIsSearching(false);
    clearSearch();
  };

  const openReplyModal = async (contact) => {
    setActiveModal({ type: "reply", contact });
    setReplyText("");
    await handleGetContactById(contact._id);
  };

  const closeModal = () => {
    setActiveModal(null);
    setReplyText("");
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    const success = await handleReplyToContact(activeModal.contact._id, { reply: replyText });
    if (success) {
      closeModal();
      refreshList();
    }
  };

  const confirmDelete = async () => {
    const success = await handleDeleteContact(activeModal.contact._id);
    if (success) {
      closeModal();
      refreshList();
    }
  };

  return (
    <div>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3 mb-md-0 ">
        <h1 className="fs-5 me-3 mb-0">Contact Support</h1>
        <AdminSearchBar
          type="support"
          placeholder="Search support messages..."
          onSearch={onSearch}
          onClear={onClearSearch}
        />
      </div>

      <div className="mb-3">
        <select
          className="form-select form-select-sm w-auto"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Messages</option>
          <option value="pending">Pending</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      <div className="table-responsive border rounded-2">
        <table className="table table-hover rounded-2 align-middle mb-0">
          <thead>
            <tr>
              <th className="rounded-start">No.</th>
              <th className="text-start" style={{ width: "250px" }}>Sender</th>
              <th>Subject</th>
              <th>Status</th>
              <th>Received</th>
              <th className="rounded-end text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="text-center py-4">Loading...</td>
              </tr>
            ) : filteredContacts.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-4 text-muted">No messages found</td>
              </tr>
            ) : (
              filteredContacts.map((contact, idx) => (
                <tr key={contact._id} className="border-bottom">
                  <td className="px-xl-0">{idx + 1}</td>
                  <td className="text-start lh-sm">
                    <p className="mb-0 text-truncate" style={{ maxWidth: "220px" }}>
                      {contact.name}
                    </p>
                    <span className="small text-body-secondary">{contact.email}</span>
                  </td>
                  <td className="text-truncate" style={{ maxWidth: "180px" }}>{contact.subject}</td>
                  <td>
                    <span className={`badge fw-normal p-2 ${STATUS_BADGE[contact.status]}`}>
                      {contact.status.charAt(0).toUpperCase() + contact.status.slice(1)}
                    </span>
                  </td>
                  <td>{timeAgo(contact.createdAt)}</td>
                  <td className="text-center">
                    <div className="d-flex justify-content-center" style={{ width: "fit-content", margin: "0 auto" }}>
                      <button
                        type="button"
                        title="View / Reply"
                        className="btn btn-sm btn-outline-primary me-1 p-0"
                        style={{ width: "28px", height: "28px" }}
                        onClick={() => openReplyModal(contact)}
                      >
                        <IconEye stroke={1.5} size={20} />
                      </button>
                      <button
                        type="button"
                        title="Delete"
                        className="btn btn-sm btn-outline-danger p-0"
                        style={{ width: "28px", height: "28px" }}
                        onClick={() => setActiveModal({ type: "delete", contact })}
                      >
                        <IconTrash stroke={1.5} size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Reply / View Modal */}
      <Modal
        show={activeModal?.type === "reply"}
        onClose={closeModal}
        title="Message Details"
        size="lg"
      >
        {!contactDetail ? (
          <div className="text-center py-4">
            <div className="spinner-border" role="status" />
          </div>
        ) : (
          <>
            <div className="row mb-3">
              <div className="col-md-6 mb-2 mb-md-0">
                <small className="text-secondary d-block">Name</small>
                <div>{contactDetail.name}</div>
              </div>
              <div className="col-md-6">
                <small className="text-secondary d-block">Email</small>
                <div>{contactDetail.email}</div>
              </div>
            </div>

            <div className="mb-3">
              <small className="text-secondary d-block">Subject</small>
              <div>{contactDetail.subject}</div>
            </div>

            <div className="mb-3">
              <small className="text-secondary d-block">Message</small>
              <div className="p-3 bg-light rounded">{contactDetail.message}</div>
            </div>

            {contactDetail.image?.url && (
              <div className="mb-3">
                <small className="text-secondary d-block mb-1">Attachment</small>
                <a href={contactDetail.image.url} target="_blank" rel="noreferrer">
                  <img
                    src={contactDetail.image.url}
                    alt="attachment"
                    className="rounded border"
                    style={{ maxWidth: "150px", maxHeight: "150px", objectFit: "cover" }}
                  />
                </a>
              </div>
            )}

            {contactDetail.status === "resolved" ? (
              <div>
                <small className="text-secondary d-block d-flex align-items-center gap-1">
                  <IconCircleCheck size={14} className="text-success" /> Admin Reply
                </small>
                <div className="p-3 bg-light rounded">{contactDetail.adminReply}</div>
              </div>
            ) : (
              <form onSubmit={handleReply}>
                <label className="form-label d-flex align-items-center gap-1">
                  <IconClock size={14} className="text-warning" /> Reply
                </label>
                <textarea
                  rows={4}
                  className="form-control mb-3"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write your reply..."
                />
                <button
                  type="submit"
                  className="btn btn-dark d-inline-flex align-items-center gap-2"
                  disabled={contactsLoading}
                >
                  {contactsLoading ? <span>Sending...</span> : <><IconSend size={16} /> Send Reply</>}
                </button>
              </form>
            )}
          </>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        show={activeModal?.type === "delete"}
        onClose={closeModal}
        title="Delete Message"
        footer={
          <>
            <button className="btn btn-outline-secondary" onClick={closeModal}>Cancel</button>
            <button className="btn btn-danger" onClick={confirmDelete} disabled={contactsLoading}>
              {contactsLoading ? "Deleting..." : "Delete"}
            </button>
          </>
        }
      >
        Are you sure you want to delete the message from{" "}
        <strong>{activeModal?.contact?.name}</strong>? This action cannot be undone.
      </Modal>
    </div>
  );
};

export default ContactSupport;