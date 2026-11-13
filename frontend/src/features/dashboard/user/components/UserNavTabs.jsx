import { useContext, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../../../auth/AuthContext";
import { IconUserCircle, IconShoppingBagPlus, IconCreditCard, IconWallet, IconReceipt2, IconRobot, IconBell, IconTrash } from "@tabler/icons-react";

const UserNavTabs = () => {

  const { user } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  // Auto tab open when navigated with state
useEffect(() => {
  if (location.state?.tab) {
    setTimeout(() => {
      const tab = document.getElementById(location.state.tab);
      if (tab) tab.click();
    }, 100);

    // State clear karo — reload pe dobara na chale
    navigate(location.pathname, { replace: true, state: {} });
  }
}, [location.state]);

  return (
        <div className="profile-tags">
         <ul className="nav nav-tabs flex-row flex-md-column border-0" id="myTab" role="tablist">
           <li className="nav-item me-4 me-md-0" role="presentation">
             <button className="nav-link active border-0 p-0 mb-md-2" id="profile-tab" data-bs-toggle="tab" data-bs-target="#profile-tab-pane" type="button" role="tab" aria-controls="profile-tab-pane" aria-selected="false">
                <div className="d-flex align-items-center">
                  <IconUserCircle stroke={1.5} size={21} className="me-2" />
                  <span>Account Setting</span>
                </div>
             </button>
           </li>
           <li className="nav-item me-4 me-md-0" role="presentation">
             <button className="nav-link border-0 p-0 mb-md-2" id="order-tab" data-bs-toggle="tab" data-bs-target="#order-tab-pane" type="button" role="tab" aria-controls="order-tab-pane" aria-selected="false">
               <div className="d-flex align-items-center">
                 <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" fill="currentColor" className="bi bi-cart-plus me-2" style={{ marginBottom : '2px'}} viewBox="0 0 16 16">
                  <path d="M9 5.5a.5.5 0 0 0-1 0V7H6.5a.5.5 0 0 0 0 1H8v1.5a.5.5 0 0 0 1 0V8h1.5a.5.5 0 0 0 0-1H9z"/>
                  <path d="M.5 1a.5.5 0 0 0 0 1h1.11l.401 1.607 1.498 7.985A.5.5 0 0 0 4 12h1a2 2 0 1 0 0 4 2 2 0 0 0 0-4h7a2 2 0 1 0 0 4 2 2 0 0 0 0-4h1a.5.5 0 0 0 .491-.408l1.5-8A.5.5 0 0 0 14.5 3H2.89l-.405-1.621A.5.5 0 0 0 2 1zm3.915 10L3.102 4h10.796l-1.313 7zM6 14a1 1 0 1 1-2 0 1 1 0 0 1 2 0m7 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0"/>
                 </svg>
                 <span>My Orders</span>
               </div>
             </button>
           </li>

           <li className="nav-item me-4 me-md-0" role="presentation">
              <button className="nav-link border-0 p-0 mb-md-2" id="wallet-tab" data-bs-toggle="tab" data-bs-target="#wallet-tab-pane" type="button" role="tab" aria-controls="wallet-tab-pane" aria-selected="false">
                <div className="d-flex align-items-center">
                  {user?.accountType === "seller" ? (
                    <>
                      <IconWallet stroke={1.5} size={20} className="me-2" />
                      <span>Wallet</span>
                    </>
                  ) : (
                    <>
                      <IconReceipt2 stroke={1.5} size={20} className="me-2" />
                      <span>Transactions</span>
                    </>
                  )}
                </div>
              </button>
           </li>

           {/************************* Only Seller User Access *************************/}

           {user?.accountType === "seller" && (
             <>
               <li className="nav-item me-4 me-md-0" role="presentation">
                 <button className="nav-link border-0 p-0 mb-md-2" id="post-tab" data-bs-toggle="tab" data-bs-target="#post-tab-pane" type="button" role="tab" aria-controls="post-tab-pane" aria-selected="false">
                    <div className="d-flex align-items-center">
                      <IconShoppingBagPlus stroke={1.5} size={20} className="me-2 mb-1" />
                      <span>My Listings</span>
                    </div>
                 </button>
               </li>
               <li className="nav-item me-4 me-md-0" role="presentation">
                 <button className="nav-link border-0 p-0 mb-md-2" id="subscription-tab" data-bs-toggle="tab" data-bs-target="#subscription-tab-pane" type="button" role="tab">
                    <div className="d-flex align-items-center">
                      <IconCreditCard size={20} className="me-2" />
                      <span>My Subscription</span>
                    </div>
                 </button>
               </li>
               <li className="nav-item me-4 me-md-0" role="presentation">
                 <button className="nav-link border-0 p-0 mb-md-2" id="ai-tab" data-bs-toggle="tab" data-bs-target="#ai-tab-pane" type="button" role="tab" aria-controls="ai-tab-pane" aria-selected="false" >
                    <div className="d-flex align-items-center">
                      <IconRobot stroke={1.5} size={20} className="me-2" />
                      <span>AI Assistant</span>
                    </div>
                 </button>
               </li>
             </>
           )}

            <li className="nav-item me-4 me-md-0" role="presentation">
              <button className="nav-link border-0 p-0 mb-md-2" id="notification-tab" data-bs-toggle="tab" data-bs-target="#notification-tab-pane" type="button" role="tab" aria-controls="notification-tab-pane" aria-selected="false">
                <div className="d-flex align-items-center">
                  <IconBell stroke={1.5} size={20} style={{ marginBottom : '1px'}} className="me-2" />
                  <span>Notification</span>
                </div>
              </button>
            </li>
            <li className="nav-item me-4 me-md-0" role="presentation">
              <button className="nav-link border-0 p-0" id="account-delete-tab" data-bs-toggle="tab" data-bs-target="#account-delete-tab-pane" type="button" role="tab" aria-controls="account-delete-tab-pane" aria-selected="false">
                <div className="d-flex align-items-center">
                  <IconTrash stroke={1.5} size={21} className="me-2" style={{ marginBottom : '3px'}} />
                  <span>Account Delete</span>
                </div>
              </button>
            </li>
          </ul>
        </div>
  )
}

export default UserNavTabs