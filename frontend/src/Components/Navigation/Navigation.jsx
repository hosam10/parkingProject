import React, { useState } from "react";
import "./Navigation.css";
import { useNavigate } from "react-router-dom";
import Modal from "../Modal/Modal"; // Import the Modal component

const Navigation = () => {
  const navigate = useNavigate();

  const handlePersonalDetails = () => {
    navigate("/personalDetails");
  };

  const handleHome = () => {
    navigate("/home");
  };

  const handleHistory = () => {
    navigate("/history");
  };

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Open the modal
  const openModal = () => setIsModalOpen(true);

  // Close the modal
  const closeModal = () => setIsModalOpen(false);

  const handleHowitwork = () => {
    openModal(); // Open the modal when "How it work" is clicked
  };

  return (
    <div className="nav">
      {/* Navigation Links */}
      <div className="navigations">
        <div className="nav-item home-link" onClick={handleHome}>
          Home
        </div>
        <div className="nav-item profile-link" onClick={handlePersonalDetails}>
          My Profile
        </div>
        <div className="nav-item profile-link" onClick={handleHistory}>
          History Reservation
        </div>
        <div className="nav-item about-link" onClick={handleHowitwork}>
          How it works
        </div>
        
        {/* Modal is conditionally rendered */}
        <Modal isOpen={isModalOpen} onClose={closeModal} />
      </div>
    </div>
  );
};

export default Navigation;
