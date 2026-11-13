import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  IconChartBar, IconUserCircle, IconUsers, IconShoppingBagPlus, IconStar,
  IconCreditCardPay, IconLayoutGrid, IconCreditCard, IconPalette, IconCashBanknote, IconFlag,
  IconMailQuestion, IconArticle, IconSpeakerphone, IconChevronDown,
  IconApps, IconCrown, IconWallet, IconMessages, IconBell 
} from "@tabler/icons-react";

// id = tab ka base id (tab button: `${id}-tab`, pane: `${id}-tab-pane`)
const NAV = [
  { id: "stats", label: "Dashboard", icon: IconChartBar },
  { id: "admin-profile", label: "Account Setting", icon: IconUserCircle },
  {
    key: "management", label: "Management", icon: IconApps,
    items: [
      { id: "users", label: "Manage Users", icon: IconUsers },
      { id: "manage-items", label: "Manage Items", icon: IconShoppingBagPlus },
      { id: "manage-catalog", label: "Manage Catalog", icon: IconLayoutGrid },
      { id: "articles", label: "Manage Articles", icon: IconArticle },
    ],
  },
  {
    key: "plans", label: "Plans", icon: IconCrown,
    items: [
      { id: "featured-plans", label: "Featured Plans", icon: IconStar },
      { id: "subscription-plans", label: "Subscription Plans", icon: IconCreditCardPay },
      { id: "design-plans", label: "Design Plans", icon: IconPalette },
    ],
  },
  {
    key: "finance", label: "Finance", icon: IconWallet,
    items: [
      { id: "payments", label: "Transactions", icon: IconCreditCard },
      { id: "withdrawals", label: "Withdrawal Requests", icon: IconCashBanknote },
    ],
  },
  {
    key: "support", label: "Support & Comms", icon: IconMessages,
    items: [
      { id: "announcements", label: "Announcements", icon: IconSpeakerphone },
      { id: "reports", label: "Reports", icon: IconFlag },
      { id: "admin-support", label: "Contact Support", icon: IconMailQuestion },
    ],
  },
  { id: "notification", label: "Notification", icon: IconBell },

];

const AdminNavTabs = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [activeId, setActiveId] = useState("stats");
  const [openGroups, setOpenGroups] = useState([]);

  // Auto tab open when navigated with state
  useEffect(() => {
    if (location.state?.tab) {
      setTimeout(() => {
        const tab = document.getElementById(location.state.tab);
        if (tab) tab.click(); // onClick niche group bhi khol dega
      }, 100);

      // State clear karo — reload pe dobara na chale
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);

  const handleSelect = (id, groupKey) => {
    setActiveId(id);
    if (groupKey) {
      setOpenGroups((prev) => (prev.includes(groupKey) ? prev : [...prev, groupKey]));
    }
  };

  const toggleGroup = (key) => {
    setOpenGroups((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const renderTab = ({ id, label, icon: Icon }, groupKey) => {
    const isActive = activeId === id;
    return (
      <li key={id} className="nav-item me-4 me-md-0" role="presentation">
        <button
          className={`nav-link border-0 p-0 mb-md-2 ${isActive ? "active" : ""}`}
          id={`${id}-tab`}
          data-bs-toggle="tab"
          data-bs-target={`#${id}-tab-pane`}
          type="button"
          role="tab"
          aria-controls={`${id}-tab-pane`}
          aria-selected={isActive}
          onClick={() => handleSelect(id, groupKey)}
        >
          <div className="d-flex align-items-center">
            <Icon stroke={1.5} size={21} className="me-2" />
            <span>{label}</span>
          </div>
        </button>
      </li>
    );
  };

  return (
    <div className="profile-tags">
      <ul className="nav nav-tabs flex-row flex-md-column border-0" id="adminTab" role="tablist">
        {NAV.map((entry) => {
          if (!entry.items) return renderTab(entry, null);

          const isOpen = openGroups.includes(entry.key);
          const hasActive = entry.items.some((i) => i.id === activeId);
          const GroupIcon = entry.icon;

          return (
            <li key={entry.key} className="nav-group" role="presentation">
              <button
                type="button"
                className={`nav-group-toggle mb-md-2 ${hasActive ? "has-active" : ""}`}
                onClick={() => toggleGroup(entry.key)}
                aria-expanded={isOpen}
              >
                <span className="d-flex align-items-center">
                  <GroupIcon stroke={1.5} size={21} className="me-2" />
                  <span>{entry.label}</span>
                </span>
                <IconChevronDown
                  stroke={1.5}
                  size={18}
                  className={`nav-group-chevron ${isOpen ? "open" : ""}`}
                />
              </button>

              <ul className={`nav-group-children text-start ${isOpen ? "open" : ""}`}>
                {entry.items.map((item) => renderTab(item, entry.key))}
              </ul>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default AdminNavTabs;