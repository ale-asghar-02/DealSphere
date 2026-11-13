import AdminStatsOverview from '../components/tabContent/AdminStatsOverview'
import AccountSetting from "../../components/AccountSetting";
import ContactSupport from "./tabContent/ContactSupport";
import ManageCategory from "./tabContent/ManageCategory";
import ManageItems from "./tabContent/ManageItems";
import ManageUsers from "./tabContent/ManageUsers";
import Reports from "./tabContent/Reports";
import FeaturePlan from "./tabContent/FeaturePlan";
import SubscriptionPlan from "./tabContent/SubscrptionPlan";
import DesignPlan from "./tabContent/DesignPlan";
import AdminTransactions from "./tabContent/Transactions";
import AdminWithdrawals from "./tabContent/Withdrawal";
import ManageArticle from './tabContent/ManageArticle';
import Announcement from "./tabContent/Announcement";
import Notification from "../../../notification/pages/Notifications"

const AdminTabContent = () => {
  return (
    <div className="tab-content" id="adminTabContent">

      {/* 1. Dashboard */}
      <div className="tab-pane fade show active" id="stats-tab-pane" role="tabpanel" aria-labelledby="stats-tab" tabIndex="0">
        <AdminStatsOverview />
      </div>

      {/* 2. Profile Setting */}
      <div className="tab-pane fade" id="admin-profile-tab-pane" role="tabpanel" aria-labelledby="admin-profile-tab" tabIndex="0">
        <AccountSetting />
      </div>

      {/* 3. Users */}
      <div className="tab-pane fade" id="users-tab-pane" role="tabpanel" aria-labelledby="users-tab" tabIndex="0">
        <ManageUsers />
      </div>

      {/* 4. Manage Items */}
      <div className="tab-pane fade" id="manage-items-tab-pane" role="tabpanel" aria-labelledby="manage-items-tab" tabIndex="0">
        <ManageItems />
      </div>

      {/* 5. Manage Catalog */}
      <div className="tab-pane fade" id="manage-catalog-tab-pane" role="tabpanel" aria-labelledby="manage-catalog-tab" tabIndex="0">
        <ManageCategory />
      </div>

      {/* 6. Featured Plans */}
      <div className="tab-pane fade" id="featured-plans-tab-pane" role="tabpanel" aria-labelledby="featured-plans-tab" tabIndex="0">
        <FeaturePlan />
      </div>

      {/* 7. Subscription Plans */}
      <div className="tab-pane fade" id="subscription-plans-tab-pane" role="tabpanel" aria-labelledby="subscription-plans-tab" tabIndex="0">
        <SubscriptionPlan />
      </div>

      {/* 8. Design Plans */}
      <div className="tab-pane fade" id="design-plans-tab-pane" role="tabpanel" aria-labelledby="design-plans-tab" tabIndex="0">
        <DesignPlan />
      </div>

      {/* 9. Transactions */}
      <div className="tab-pane fade" id="payments-tab-pane" role="tabpanel" aria-labelledby="payments-tab" tabIndex="0">
        <AdminTransactions />
      </div>

      {/* 10. Withdrawal Requests */}
      <div className="tab-pane fade" id="withdrawals-tab-pane" role="tabpanel" aria-labelledby="withdrawals-tab" tabIndex="0">
        <AdminWithdrawals />
      </div>

      {/* 11. Reports */}
      <div className="tab-pane fade" id="reports-tab-pane" role="tabpanel" aria-labelledby="reports-tab" tabIndex="0">
        <Reports />
      </div>

      {/* 12. Support */}
      <div className="tab-pane fade" id="admin-support-tab-pane" role="tabpanel" aria-labelledby="admin-support-tab" tabIndex="0">
        <ContactSupport />
      </div>

      {/* 13. Articles */}
      <div className="tab-pane fade" id="articles-tab-pane" role="tabpanel" aria-labelledby="articles-tab" tabIndex="0">
        <ManageArticle />
      </div>

      {/* 14. Announcements */}
      <div className="tab-pane fade" id="announcements-tab-pane" role="tabpanel" aria-labelledby="announcements-tab" tabIndex="0">
        <Announcement />
      </div>

      {/* 15. Announcements */}
      <div className="tab-pane fade" id="notification-tab-pane" role="tabpanel" aria-labelledby="notification-tab" tabIndex="0">
        <Notification />
      </div>

    </div>
  );
};

export default AdminTabContent;