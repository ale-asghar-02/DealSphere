import { useContext } from "react";
import { AuthContext } from "../../../auth/AuthContext";
import "../../dashboard.scss";

import Navbar from "@/components/Navbar/Navbar";
import AdminNavTabs from "../components/AdminNavTabs"
import AdminNavTabContent from "../components/AdminNavTabContent"

import defaultUser from "@/assets/images/default_user.avif";

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);

  return (
    <div className="user-dashboard">
      <div className="mb-2">
        <Navbar />
      </div>
      <div className="container-fluid">
        <div className="row g-2 px-lg-2">
          <div className="col-12 col-md-4 col-lg-5 col-xl-3 ">
            <div className="card p-3 p-lg-4 border-light-subtle rounded-3 text-center dashboard-left-side">
              <div className="mt-3">
                <img
                  className="image-fluid border rounded-circle object-fit-cover mb-2"
                  src={user?.userImage ? user.userImage : defaultUser}
                  alt="user-image"
                  width={90}
                  height={90}
                />
                <p className="text-break">{user?.email}</p>
              </div>

              <AdminNavTabs />
            </div>
          </div>

          <div className="col-12 col-md-8 col-lg-7 col-xl-9">
            <div className="card p-3 p-lg-4 pb-lg-2 border-light-subtle rounded-3 dashboard-right-side">
              <AdminNavTabContent />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
