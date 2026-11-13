import { useEffect, useState } from "react";
import { IconBan, IconClockPause, IconRotateClockwise2, IconAlertTriangle } from "@tabler/icons-react";
import useUserModeration from "../../hooks/useUserModeration";
import useAdminSearch from "../../hooks/useAdminSearch";
import AdminSearchBar from "../AdminSearcBar";
import Modal from "@/components/Model";
import { timeAgo } from "@/utils/timeAgo";

import defaultUser from "@/assets/images/default_user.avif";

const STATUS_BADGE = {
  active: "text-bg-success",
  banned: "text-bg-danger",
  suspended: "text-bg-warning",
  deleted: "text-bg-secondary",
};

const DURATION_OPTIONS = [
  { value: "1m", label: "1 Month" },
  { value: "3m", label: "3 Months" },
  { value: "6m", label: "6 Months" },
  { value: "1y", label: "1 Year" },
];

const getUserStatus = (user) => {
  if (user.deletion?.isDeleted) return "deleted";
  if (user.moderation?.isBanned) return "banned";
  if (user.moderation?.suspendedUntil && new Date(user.moderation.suspendedUntil) > new Date()) return "suspended";
  return "active";
};

const ManageUsers = () => {
  const { users, moderationLoading, handleGetUsers, handleBanUser, handleSuspendUser, handleUnbanUser } = useUserModeration();

  // Search bar sirf "users" type search karega
  const { results: searchResults, searchLoading, handleSearch, clearSearch } = useAdminSearch("users");

  // Jab tak search active nahi, table normal users dikhayegi
  const [isSearching, setIsSearching] = useState(false);

  const [activeModal, setActiveModal] = useState(null); // { type: "ban" | "suspend" | "unban", user }
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState("1m");

  useEffect(() => {
    handleGetUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const closeModal = () => {
    setActiveModal(null);
    setReason("");
    setDuration("1m");
  };

  const submitBan = async () => {
    if (!reason.trim()) return;
    const success = await handleBanUser(activeModal.user._id, reason.trim());
    if (success) {
      await handleGetUsers();
      closeModal();
    }
  };

  const submitSuspend = async () => {
    if (!reason.trim()) return;
    const success = await handleSuspendUser(activeModal.user._id, reason.trim(), duration);
    if (success) {
      await handleGetUsers();
      closeModal();
    }
  };

  const submitUnban = async () => {
    const success = await handleUnbanUser(activeModal.user._id);
    if (success) {
      await handleGetUsers();
      closeModal();
    }
  };

  const onSearch = (query) => {
    setIsSearching(true);
    handleSearch(query);
  };

  const onClearSearch = () => {
    setIsSearching(false);
    clearSearch();
  };

  const displayedUsers = isSearching ? searchResults : users;
  const isLoading = isSearching ? searchLoading : moderationLoading;

  return (
    <div>
      <div className="col-12 d-flex flex-wrap align-items-center justify-content-between mb-2">
        <h1 className="fs-5 me-3">Manage Users</h1>
        <AdminSearchBar type="users" placeholder="Search users..." onSearch={onSearch} onClear={onClearSearch} />
      </div>

      <div className="table-responsive border rounded-2">
        <table className="table table-hover rounded-2 align-middle mb-0">
          <thead>
            <tr>
              <th className="rounded-start">No.</th>
              <th className="text-start" style={{ width: "250px" }}>Guest</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th className="rounded-end">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="text-center py-4">Loading...</td>
              </tr>
            ) : displayedUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-4 text-muted">No users found</td>
              </tr>
            ) : (
              displayedUsers.map((user, idx) => {
                const status = getUserStatus(user);
                const isAdmin = user.role === "admin";

                return (
                  <tr key={user._id} className="border-bottom">
                    <td className="px-xl-0">{idx + 1}</td>
                    <td className="d-flex align-items-center gap-2">
                      <div className="border rounded-pill overflow-hidden" style={{ width: "45px", height: "45px" }}>
                        <img className="w-100 h-100 objec-fit-cover" src={user?.userImage ? user.userImage : defaultUser} alt="user-image" />
                      </div>
                      <div className="text-start lh-sm">
                        <p className="mb-0 text-truncate" style={{ maxWidth: "220px" }}>{user.username}</p>
                        <span className="small text-body-secondary">{user.email}</span>
                      </div>
                    </td>
                    <td>
                      <span className="text-capitalize">{user.accountType || user.role}</span>
                    </td>
                    <td>
                      <span className={`badge fw-normal p-2 ${STATUS_BADGE[status]}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                      {status === "suspended" && (
                        <div className="text-body-secondary mt-1" style={{ fontSize: "12px" }}>
                          Until {new Date(user.moderation.suspendedUntil).toDateString()}
                        </div>
                      )}
                    </td>
                    <td>{timeAgo(user.createdAt)}</td>
                    <td className="text-center">
                      {status === "deleted" ? (
                        <span className="text-body-secondary" style={{ fontSize: "13px" }}>Not available</span>
                      ) : status === "active" ? (
                        <div className="d-flex justify-content-center" style={{ width: "fit-content", margin: "0 auto" }}>
                          <button type="button" title={isAdmin ? "Admin cannot be suspended" : "Suspend"} className="btn btn-sm btn-outline-warning me-1 p-0" disabled={isAdmin} onClick={() => setActiveModal({ type: "suspend", user })}>
                            <IconClockPause stroke={1.5} size={20} />
                          </button>
                          <button type="button" title={isAdmin ? "Admin cannot be banned" : "Ban"} className="btn btn-sm btn-outline-danger p-0" disabled={isAdmin} onClick={() => setActiveModal({ type: "ban", user })}>
                            <IconBan stroke={1.5} size={20} />
                          </button>
                        </div>
                      ) : (
                        <div className="col-12 d-flex justify-content-center">
                          <button type="button" title="Restore" className="btn btn-sm bg btn-outline-success p-0" disabled={isAdmin} onClick={() => setActiveModal({ type: "unban", user })}>
                            <IconRotateClockwise2 stroke={1.5} size={20} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Ban Modal */}
        <Modal
          show={activeModal?.type === "ban"}
          onClose={closeModal}
          title={`Ban ${activeModal?.user?.username || ""}`}
          footer={
            <>
              <button type="button" className="btn btn-outline-secondary" onClick={closeModal}>Cancel</button>
              <button type="button" className="btn btn-danger" disabled={!reason.trim() || moderationLoading} onClick={submitBan}>
                {moderationLoading ? "Banning..." : "Ban User"}
              </button>
            </>
          }
        >
          <div className="alert alert-danger d-flex align-items-start gap-2" role="alert">
            <IconAlertTriangle stroke={1.5} size={20} className="mt-1 flex-shrink-0" />
            <div>This will permanently disable the account. All active listings will be hidden immediately.</div>
          </div>
          <label className="form-label">Reason for ban</label>
          <textarea className="form-control" rows={3} placeholder="Explain why this account is being banned..." value={reason} onChange={(e) => setReason(e.target.value)} />
        </Modal>

        {/* Suspend Modal */}
        <Modal
          show={activeModal?.type === "suspend"}
          onClose={closeModal}
          title={`Suspend ${activeModal?.user?.username || ""}`}
          footer={
            <>
              <button type="button" className="btn btn-outline-secondary" onClick={closeModal}>Cancel</button>
              <button type="button" className="btn btn-warning" disabled={!reason.trim() || moderationLoading} onClick={submitSuspend}>
                {moderationLoading ? "Suspending..." : "Suspend User"}
              </button>
            </>
          }
        >
          <div className="alert alert-warning d-flex align-items-start gap-2" role="alert">
            <IconAlertTriangle stroke={1.5} size={20} className="mt-1 flex-shrink-0" />
            <div>Account will be restricted until the selected duration ends, then restored automatically.</div>
          </div>
          <label className="form-label">Duration</label>
          <select className="form-select mb-3" value={duration} onChange={(e) => setDuration(e.target.value)}>
            {DURATION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <label className="form-label">Reason for suspension</label>
          <textarea className="form-control" rows={3} placeholder="Explain why this account is being suspended..." value={reason} onChange={(e) => setReason(e.target.value)} />
        </Modal>

        {/* Unban / Restore Modal */}
        <Modal
          show={activeModal?.type === "unban"}
          onClose={closeModal}
          title={`Restore ${activeModal?.user?.username || ""}`}
          footer={
            <>
              <button type="button" className="btn btn-outline-secondary" onClick={closeModal}>Cancel</button>
              <button type="button" className="btn btn-success" disabled={moderationLoading} onClick={submitUnban}>
                {moderationLoading ? "Restoring..." : "Yes, Restore"}
              </button>
            </>
          }
        >
          <p className="mb-0">
            Are you sure you want to restore <strong>{activeModal?.user?.username}</strong>'s account? Their listings will become visible again immediately.
          </p>
        </Modal>
      </div>
    </div>
  );
};

export default ManageUsers;