import { useCallback, useMemo, useRef, useState } from "react";
import { IconMessageCircle2, IconDotsVertical } from "@tabler/icons-react";

import Modal from "@/components/Model";
import { useAuth } from "../../../auth/hooks/useAuth";
import { useChatData } from "../../ChatContext";
import { getId } from "../../utils/chatHelpers";

import { useChatGroups } from "./hooks/useChatGroups";
import ChatLeftItem from "./ChatLeftItem";
import FloatingMenu from "../common/FloatingMenu";

// Filter options shown in the 3-dots menu next to "Messages".
// "all" is the default (no option for it in the menu: click the active option again to go back to All).
const FILTER_OPTIONS = [
  { value: "buyer", label: "Buyer" },
  { value: "seller", label: "Seller" },
  { value: "important", label: "Important" },
];

const FILTER_MATCHERS = {
  all: () => true,
  buyer: (group) => group.isBuyer,
  seller: (group) => group.isSeller,
  important: (group) => group.isImportant,
};

// Left side: seller list (grouped by seller + item type), filter menu, important toggle,
// delete conversation. Selecting a row is reported to the page via onSelectSeller.
const ChatLeft = ({ chats = [], activeSellerId, activeItemType, onSelectSeller, onChatDeleted, isMobileChatOpen }) => {
  const { user } = useAuth();
  const currentUserId = user?._id;
  const { handleToggleImportantSeller, handleDeleteChat } = useChatData();

  const groups = useChatGroups(chats, currentUserId);

  const [openMenuKey, setOpenMenuKey] = useState(null);     // row whose dropdown is open
  const [deleteTarget, setDeleteTarget] = useState(null);   // group waiting for delete confirmation
  const [deleting, setDeleting] = useState(false);

  const [filter, setFilter] = useState("all");              // all | buyer | seller | important
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const filterBtnRef = useRef(null);

  const closeMenu = useCallback(() => setOpenMenuKey(null), []);
  const closeFilterMenu = useCallback(() => setFilterMenuOpen(false), []);

  const filteredGroups = useMemo(
    () => groups.filter(FILTER_MATCHERS[filter] || FILTER_MATCHERS.all),
    [groups, filter]
  );

  // clicking the active option again goes back to "all"
  const handleSelectFilter = (value) => {
    setFilter((prev) => (prev === value ? "all" : value));
    setFilterMenuOpen(false);
  };

  const handleToggleImportant = async (group) => {
    setOpenMenuKey(null);
    await handleToggleImportantSeller({ sellerId: group.sellerId });
  };

  const handleRequestDelete = (group) => {
    setDeleteTarget(group);
    setOpenMenuKey(null);
  };

  // deletes every chat inside the group, then tells the page which ids were removed
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    const ids = deleteTarget.chats.map((c) => c._id);
    await Promise.all(ids.map((chatId) => handleDeleteChat({ chatId })));

    onChatDeleted?.(ids);
    setDeleting(false);
    setDeleteTarget(null);
  };

  const wrapperClass = `chat-left ${isMobileChatOpen ? "mobile-hidden" : ""}`;

  // no chats at all (the filter menu is not needed here)
  if (groups.length === 0) {
    return (
      <div className={wrapperClass}>
        <div className="h-100 d-flex flex-column align-items-center justify-content-center text-center px-4" style={{ color: "#999" }}>
          <IconMessageCircle2 size={48} stroke={1.2} />
          <div className="fw-semibold mt-2" style={{ color: "#555" }}>No conversations</div>
          <div style={{ fontSize: "12px" }}>Your Advertisement and Product conversations will appear here.</div>
        </div>
      </div>
    );
  }

  const activeFilterLabel = FILTER_OPTIONS.find((o) => o.value === filter)?.label;

  return (
    <div className={wrapperClass}>
      <div className="px-3 py-3 border-bottom d-flex align-items-center justify-content-between" style={{ minHeight: "62px" }}>
        <div>
          <div className="fw-semibold" style={{ color: "#002f34", fontSize: "17px" }}>Messages</div>
          <div style={{ color: "#888", fontSize: "11px" }}>
            {activeFilterLabel ? `${activeFilterLabel} conversations` : "Advertisements & Products"}
          </div>
        </div>

        {/* filter menu button */}
        <button
          type="button"
          ref={filterBtnRef}
          className={`chat-filter-btn ${filter !== "all" || filterMenuOpen ? "is-active" : ""}`}
          aria-label="Filter conversations"
          onClick={() => setFilterMenuOpen((prev) => !prev)}
        >
          <IconDotsVertical size={18} color="#444" />
        </button>

        <FloatingMenu open={filterMenuOpen} anchorRef={filterBtnRef} onClose={closeFilterMenu} align="end" minWidth={160}>
          {FILTER_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`chat-filter-option ${filter === option.value ? "is-active" : ""}`}
              onClick={() => handleSelectFilter(option.value)}
            >
              {option.label}
            </button>
          ))}
        </FloatingMenu>
      </div>

      <div className="flex-grow-1 overflow-auto">
        {filteredGroups.length === 0 ? (
          <div className="h-100 d-flex flex-column align-items-center justify-content-center text-center px-4" style={{ color: "#999" }}>
            <IconMessageCircle2 size={40} stroke={1.2} />
            <div className="fw-semibold mt-2" style={{ color: "#555" }}>No {activeFilterLabel?.toLowerCase()} conversations</div>
            <button type="button" className="btn btn-link btn-sm mt-1" onClick={() => setFilter("all")}>Show all</button>
          </div>
        ) : (
          filteredGroups.map((group) => (
            <ChatLeftItem
              key={group.key}
              group={group}
              currentUserId={currentUserId}
              isActive={getId(activeSellerId) === group.sellerId && activeItemType === group.itemType}
              menuOpen={openMenuKey === group.key}
              onSelect={() => onSelectSeller?.(group.chats)}
              onToggleMenu={() => setOpenMenuKey((prev) => (prev === group.key ? null : group.key))}
              onCloseMenu={closeMenu}
              onToggleImportant={() => handleToggleImportant(group)}
              onRequestDelete={() => handleRequestDelete(group)}
            />
          ))
        )}
      </div>

      <Modal
        show={!!deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        title="Delete conversation"
        footer={
          <>
            <button className="btn btn-light" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</button>
            <button className="btn btn-danger" onClick={confirmDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </>
        }
      >
        Are you sure you want to delete this conversation? This action cannot be undone.
      </Modal>
    </div>
  );
};

export default ChatLeft;