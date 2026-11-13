import React, { useContext } from 'react'
import { AuthContext } from '@/features/auth/AuthContext'

import NavLogo from '../Navbar/NavLogo'
import NavItems from '../Navbar/NavItems'
import NavAuth from '../Navbar/NavAuth'

import NavChatIcon from '@/features/chat/components/NavChatIcon'
import NavCartIcon from '@/features/cart/components/NavCartIcon'
import NavNotifyIcon from '@/features/notification/components/NavNotifyIcon'

const Navbar = () => {
  const { user } = useContext(AuthContext);

  return (
      <div className="mx-lg-2 pt-1">
      <nav className="navbar navbar-expand-md">
        <div className="container-fluid">
          <NavLogo />
          <button
            className="navbar-toggler p-0 border-0 shadow-none"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation">
            <span className="navbar-toggler-icon border-0"></span>
          </button>

          <div className="collapse navbar-collapse mt-1" id="navbarNav">
            <NavItems />

            { user?.isAccountVerified && (
              <div className="d-flex align-items-center gap-4 me-4 mb-3 mb-md-0">
                <NavChatIcon />
                <NavCartIcon />
                <NavNotifyIcon /> 
              </div>
            )}

            <NavAuth />
          </div>
        </div>
      </nav>
    </div>
  )
}

export default Navbar