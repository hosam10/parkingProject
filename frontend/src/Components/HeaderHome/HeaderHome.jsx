import React, { useState } from "react";
import "./HeaderHome.css";
import { useNavigate } from "react-router-dom";
import user from "../images/user.png"; // User image
import Navigation from "../Navigation/Navigation";

const HeaderHome = () => {
  const navigate = useNavigate();

  // Retrieve user details from localStorage
  const userData = JSON.parse(localStorage.getItem("user")) || {};
  const { name, email } = userData;

  // Hover state for showing tooltip
  const [showTooltip, setShowTooltip] = useState(false);

  const handleOut = () => {
    navigate("/login");
  };

  return (
    <div className="headerHome">
      {/* Logo Section */}
      <div className="header-logo">
        <h2>Smart Parking</h2>
      </div>

      <Navigation />

      {/* User Profile with Hover Effect */}
      <div
        className="user-container"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <img src={user} alt="User" className="user-image" />

        {/* Tooltip Message */}
        {showTooltip && (
          <div className="tooltip">
            <div className="tooltip-name">{"Welcome " + name || "User"}</div>
            <div className="tooltip-email">{email || "No email"}</div>
          </div>
        )}
      </div>

      {/* Sign Out Button */}
      <button className="sign-out-btn" onClick={handleOut}>
        Sign Out
      </button>
    </div>
  );
};

export default HeaderHome;
