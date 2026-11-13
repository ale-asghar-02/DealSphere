import { useContext } from 'react'
import { AuthContext } from '../../../auth/AuthContext'

import AccountSetting from '../../components/AccountSetting'

import UserOrders from '../../../order/components/UserOrders'
import Wallet from '../components/tabContent/Wallet'

import SellerAddPost from '../components/tabContent/SellerAddPost'
import SellerSubscription from '../../../subscription/components/SellerSubscription'

import AIAssistant from '../../../aiAssistant/components/AIAssistant'
import Notifications from '../../../notification/pages/Notifications'
import AccountDelete from '../components/tabContent/AccountDelete'

const UserNavTabContent = () => {

  const { user } = useContext(AuthContext);

  return (
        <div className="tab-content" id="myTabContent">

          <div className="tab-pane fade show active" id="profile-tab-pane" role="tabpanel" aria-labelledby="profile-tab" tabIndex="0">
            <AccountSetting />
          </div>

          <div className="tab-pane fade" id="order-tab-pane" role="tabpanel" aria-labelledby="order-tab" tabIndex="0">
            <UserOrders />
          </div>

          <div className="tab-pane fade" id="wallet-tab-pane" role="tabpanel" aria-labelledby="wallet-tab" tabIndex="0">
            <Wallet />
          </div>

          {/*************************  Only Seller User Access  *************************/}

          {user?.accountType === "seller" && (
            <>
              <div className="tab-pane fade" id="post-tab-pane" role="tabpanel" aria-labelledby="post-tab" tabIndex="0">
                <SellerAddPost />
              </div>

              <div className="tab-pane fade" id="subscription-tab-pane" role="tabpanel" aria-labelledby="subscription-tab" tabIndex="0">
                <SellerSubscription />
              </div>

              <div className="tab-pane fade" id="ai-tab-pane" role="tabpanel" aria-labelledby="ai-tab" tabIndex="0">
                <AIAssistant />
              </div>
            </>
          )}

          <div className="tab-pane fade" id="notification-tab-pane" role="tabpanel" aria-labelledby="notification-tab" tabIndex="0">
            <Notifications />
          </div>

          <div className="tab-pane fade py-md-5" id="account-delete-tab-pane" role="tabpanel" aria-labelledby="account-delete-tab" tabIndex="0">
            <AccountDelete />
          </div>

        </div>
  )
}

export default UserNavTabContent