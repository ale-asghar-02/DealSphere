import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { IconArrowNarrowRight, IconUser, IconLifebuoy, IconHeart, IconSettings, IconStar, IconStarFilled, IconMoonStars, IconLogout } from '@tabler/icons-react';
import * as DarkReader from 'darkreader';

import { useAuth } from "@/features/auth/hooks/useAuth";
import defaultUser from '@/assets/images/default_user.avif'

const NavAuth = () => {
  const navigate = useNavigate();
  const { user, handleLogout } = useAuth();

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  useEffect(() => {
    if (darkMode) {
      DarkReader.enable({ brightness: 100, contrast: 90, sepia: 0 });
    } else {
      DarkReader.disable();
    }
  }, []);

  const toggleDarkMode = () => {
    const newValue = !darkMode;
    if (newValue) {
      DarkReader.enable({ brightness: 100, contrast: 90, sepia: 0 });
    } else {
      DarkReader.disable();
    }
    localStorage.setItem("darkMode", newValue);
    setDarkMode(newValue);
  };

  const subscription = user?.subscription; // { plan, startDate, expiryDate }
  const isPremium = subscription?.plan === "monthly" || subscription?.plan === "yearly";

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <div>
      {user?.isAccountVerified ? (
        <div className="dropdown me-lg-2">
          {/* Trigger */}
          <div className="d-flex align-items-center gap-2" style={{ cursor: "pointer" }} data-bs-toggle="dropdown">
            <img
              src={user?.userImage ? user.userImage : defaultUser}
              alt="user"
              className="border rounded-circle object-fit-cover"
              width={35}
              height={35}
            />
            <p className="mb-0 fw-normal">{user?.username}</p>
          </div>

          {/* Dropdown Menu */}
          <div className="dropdown-menu dropdown-menu-start dropdown-menu-md-end overflow-hidden border rounded-3 p-0" style={{ width: "280px" }}>
            <div className="p-3 border-bottom">
              <div className="d-flex align-items-center gap-2">
                <div className="border rounded-circle overflow-hidden" style={{ width : '45px', height : '45px' }}>
                  <img
                  src={user?.userImage ? user.userImage : defaultUser}
                  alt="user"
                  className="col-12 h-100 object-fit-cover"
                />
                </div>
                <div className="col mt-1" style={{ minWidth: 0 }}>
                  <p className="mb-0 lh-1 fw-medium">{user?.username}</p>
                  <p className="mb-0 small text-truncate">{user?.email}</p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              <Link className="dropdown-item d-flex align-items-center gap-2 py-2" to={user?.role === "admin" ? "/admin/dashboard" : "/user/dashboard"}>
                <IconUser size={18} /> View Profile
              </Link>

              <Link className="dropdown-item d-flex align-items-center gap-2 py-2" to="/help-center">
                <IconLifebuoy size={18} /> Help Center
              </Link>

              <Link className="dropdown-item d-flex align-items-center gap-2 py-2" to="/wishlist">
                <IconHeart size={18} /> Favorite Deals
              </Link>

              <Link className="dropdown-item d-flex align-items-center gap-2 py-2" to={user?.role === "admin" ? "/admin/dashboard" : "/user/dashboard"}>
                <IconSettings size={18} /> Account Settings
              </Link>
            </div>

            <div className="dropdown-divider m-0"></div>

            <div className="py-2">
              <Link
                className="dropdown-item d-flex align-items-center gap-2 py-2"
                to="/upgrade-plan"
                title={
                  isPremium
                    ? `Active: ${formatDate(subscription.startDate)} - ${formatDate(subscription.expiryDate)}`
                    : "Upgrade Plan"
                }
              >
                {isPremium ? (
                  <IconStarFilled size={18} color="#ffc107" />
                ) : (
                  <IconStar size={18} />
                )}
                <div className="d-flex flex-column" style={{ minWidth: 0 }}>
                  <span>{isPremium ? "Premium Plan" : "Upgrade Plan"}</span>
                  {isPremium && (
                    <span className="text-muted" style={{ fontSize: "11px" }}>
                      {formatDate(subscription.startDate)} - {formatDate(subscription.expiryDate)}
                    </span>
                  )}
                </div>
              </Link>

              <div className="dropdown-item d-flex justify-content-between align-items-center py-2">
                <span className="d-flex align-items-center gap-2">
                  <IconMoonStars size={18} /> Dark Mode
                </span>
                <div className="form-check form-switch m-0">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    checked={darkMode}
                    onChange={toggleDarkMode}
                  />
                </div>
              </div>
            </div>

            <div className="dropdown-divider m-0"></div>

            <div className="py-1">
              <button onClick={ async () => { await handleLogout(); navigate('/') }} className="dropdown-item d-flex align-items-center gap-2 text-danger py-2">
                <IconLogout size={18} /> Log Out
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <button
            onClick={() => { navigate("/login") }}
            type="button"
            className="auth-btn px-4 rounded-pill"
            style={{ padding : '7px'}}
            >
            Login
            <IconArrowNarrowRight className="ms-2" stroke={1.2} />
          </button>
        </div>
      )}
    </div>
  );
};

export default NavAuth;