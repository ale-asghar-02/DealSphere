import { useEffect, useState } from "react";
import { IconEdit, IconTrash, IconPlus, IconLink, IconClock, IconUsers, IconSpeakerphone } from "@tabler/icons-react";
import Modal from "@/components/Model"
import useAnnouncementModeration from "../../hooks/useAnnouncementModeration";

const TITLE_OPTIONS = [
  "New Year Sale",
  "Eid Sale",
  "Independence Day Offer",
  "Scheduled Maintenance",
  "New Feature Update",
  "Subscription Discount",
  "Featured Discount",
  "Important Notice",
];

const initialForm = {
  title: TITLE_OPTIONS[0],
  message: "",
  type: "info",
  targetAudience: "all",
  link: "",
  durationInHours: "",
};

const isCurrentlyActive = (a) => {
  if (!a.isActive) return false;
  if (!a.expiresAt) return true;
  return new Date(a.expiresAt) > new Date();
};

const Announcement = () => {
  const {
    announcements,
    announcementLoading,
    fetchAnnouncements,
    handleCreate,
    handleUpdate,
    handleToggleActive,
    handleDelete,
  } = useAnnouncementModeration();

  const [showModal, setShowModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => { fetchAnnouncements() }, [fetchAnnouncements]);

  const openCreateModal = () => {
    setEditingAnnouncement(null);
    setFormData(initialForm);
    setShowModal(true);
  };

  const openEditModal = (announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      message: announcement.message,
      type: announcement.type,
      targetAudience: announcement.targetAudience,
      link: announcement.link || "",
      durationInHours: "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      title: formData.title,
      message: formData.message,
      type: formData.type,
      targetAudience: formData.targetAudience,
      link: formData.link || null,
      durationInHours: formData.durationInHours ? Number(formData.durationInHours) : null,
    };

    const success = editingAnnouncement
      ? await handleUpdate(editingAnnouncement._id, payload)
      : await handleCreate(payload);

    if (success) setShowModal(false);
  };

  return (
    <div>
      <div className="d-flex gap-2 flex-wrap justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Announcements</h5>
        <button className="btn btn-primary d-flex align-items-center" onClick={openCreateModal}>
          <IconPlus stroke={1.5} size={18} className="me-1" /> Create Announcement
        </button>
      </div>

      {announcementLoading ? (
        <p>Loading...</p>
      ) : announcements.length === 0 ? (
        <p>No announcements found.</p>
      ) : (
        <div className="d-flex flex-column gap-3">
          {announcements.map((a) => {
            const active = isCurrentlyActive(a);
            return (
              <div key={a._id} className={`card w-100 ${active ? `border-${a.type}` : "border"}`}>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h6 className="card-title mb-0">{a.title}</h6>
                    <div className="d-flex align-items-center gap-2">
                      {active && <span className="badge bg-dark fw-medium py-2">Live</span>}
                      <div className="form-check form-switch mb-0">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          role="switch"
                          checked={a.isActive}
                          onChange={() => handleToggleActive(a._id, !a.isActive)}
                        />
                      </div>
                    </div>
                  </div>

                  <p className="card-text text-muted small mb-1">{a.message}</p>

                  
                  <div className="d-flex flex-wrap column-gap-3 small text-muted mb-3">
                    <span className="d-flex align-items-center gap-1">
                      <IconUsers stroke={1.5} size={14} />
                      <span>Target : </span>
                      <span className="text-capitalize">{a.targetAudience}</span>
                    </span>
                    <span className="d-flex align-items-center gap-1">
                      <IconClock stroke={1.5} size={14} />
                      <span>Expire At :</span>
                      {a.expiresAt ? new Date(a.expiresAt).toLocaleString() : "Never"}
                    </span>
                    {a.link && (
                      <a href={a.link} target="_blank" rel="noreferrer" className="d-flex align-items-center gap-1">
                        <IconLink stroke={1.5} size={14} />
                        {a.link}
                      </a>
                    )}
                  </div>

                  <div className="d-flex align-items-center justify-content-between">
                    <span
                      className={`badge d-inline-flex align-items-center gap-1 border border-${a.type} text-${a.type} bg-${a.type} bg-opacity-10 fw-medium px-3 py-2 text-capitalize rounded-pill`}
                    >
                      <IconSpeakerphone stroke={1.5} size={14} />
                      {a.type}
                    </span>

                    <div className="d-flex gap-2">
                      <button className="btn btn-sm btn-outline-primary" onClick={() => openEditModal(a)}>
                        <IconEdit stroke={1.5} size={20} />
                      </button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(a._id)}>
                        <IconTrash stroke={1.5} size={20} />
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        show={showModal}
        onClose={() => setShowModal(false)}
        title={editingAnnouncement ? "Edit Announcement" : "Create Announcement"}
        size="lg"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
              Cancel
            </button>
            <button type="submit" form="announcement-form" className="btn btn-primary" disabled={announcementLoading}>
              {editingAnnouncement ? "Update" : "Create"}
            </button>
          </>
        }
      >
        <form id="announcement-form" onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Title</label>
            <select
              className="form-select py-2"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            >
              {TITLE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">Message</label>
            <textarea
              className="form-control"
              rows="3"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              required
            />
          </div>

          <div className="row">
            <div className="col-6 mb-3">
              <label className="form-label">Type</label>
              <select
                className="form-select py-2"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="danger">Danger</option>
              </select>
            </div>

            <div className="col-6 mb-3">
              <label className="form-label">Target Audience</label>
              <select
                className="form-select py-2"
                value={formData.targetAudience}
                onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
              >
                <option value="all">All</option>
                <option value="buyer">Buyer</option>
                <option value="seller">Seller</option>
              </select>
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Link (optional)</label>
            <input
              className="form-control"
              value={formData.link}
              onChange={(e) => setFormData({ ...formData, link: e.target.value })}
            />
          </div>

          <div className="mb-3">
            <label className="form-label d-flex align-items-center gap-1">
              <IconClock size={14} /> Duration (hours)
            </label>
            <input
              type="number"
              min="1"
              className="form-control"
              value={formData.durationInHours}
              onChange={(e) => setFormData({ ...formData, durationInHours: e.target.value })}
              placeholder="e.g. 24 = 1 day, 168 = 7 days, 720 = 1 month"
            />
            <small className="text-muted">
              Leave empty for never expires. Any custom value: 12hr, 24hr, 168hr (7 days), 720hr (1 month), etc.
            </small>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Announcement;