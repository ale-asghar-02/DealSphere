import React from 'react'
import { Link } from "react-router-dom";
import logo from '@/assets/images/logo.svg'

const NavLogo = () => {
  return (
    <div>
        <Link className="navbar-brand" to="/">
          <img src={logo} alt="Logo" height="45" />
        </Link>
    </div>
  )
}

export default NavLogo