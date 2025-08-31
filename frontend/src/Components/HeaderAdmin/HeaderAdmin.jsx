import React, { useState } from "react";
import "./HeaderAdmin.css";
import { useNavigate } from "react-router-dom";

const HeaderAdmin = () => {
  const navigate = useNavigate();

  const handleOut = () => {
    navigate("/login");
  };

  return (
    <div className="headerHomeAdmin">
      {/* Logo Section */}
      <div className="header-logo">
        <h2>Smart Parking</h2>
      </div>

      {/* Sign Out Button */}
      <button className="sign-out-btn" onClick={handleOut}>
        Sign Out
      </button>
    </div>
  );
};

export default HeaderAdmin;
