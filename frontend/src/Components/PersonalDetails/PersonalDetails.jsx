import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Modal from "react-modal";
import "./PersonalDetails.css";
import HeaderHome from "../HeaderHome/HeaderHome";
import personalDetails from "../images/personalDetails.gif";

Modal.setAppElement("#root");

const PersonalDetails = () => {
  const navigate = useNavigate();
  const [userDetails, setUserDetails] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const carNumber = JSON.parse(localStorage.getItem("user"))?.car_number;

  useEffect(() => {
    if (!carNumber) {
      setErrorMessage("User is not logged in or car number is missing.");
      return;
    }

    axios
      .get(`http://127.0.0.1:5000/get_user_details?car_number=${carNumber}`)
      .then((response) => {
        setUserDetails(response.data.user);
      })
      .catch(() => {
        setErrorMessage("Error fetching user details");
      });
  }, [carNumber]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const updatedDetails = {
      name: e.target.name.value,
      address: e.target.address.value,
      email: e.target.email.value,
      car_number: e.target.car_number.value,
      car_type: e.target.car_type.value,
      car_year: e.target.car_year.value,
      password: e.target.password.value,
    };

    axios
      .put("http://127.0.0.1:5000/update_user_details", updatedDetails)
      .then((response) => {
        alert(response.data.message);
        localStorage.setItem("user", JSON.stringify(updatedDetails));
        window.dispatchEvent(new Event("storage"));
      })
      .catch(() => {
        alert("Error updating user details");
      });
  };

  const verifyAndUpdate = async (e) => {
    e.preventDefault();
    const email = JSON.parse(localStorage.getItem("user"))?.email;
    setVerifying(true);

    try {
      await axios.post("http://127.0.0.1:5000/send_verification_code", { email });
      setIsModalOpen(true);
    } catch (err) {
      alert(err.response?.data?.message || "Error sending verification code.");
    }

    setVerifying(false);
  };

  const handleCodeVerification = async () => {
    const email = JSON.parse(localStorage.getItem("user"))?.email;
    try {
      const res = await axios.post("http://127.0.0.1:5000/verify_email_code", {
        email,
        code: verificationCode,
      });
  
      if (res.data.message === "Verification successful") {
        setIsModalOpen(false);
        const form = document.querySelector("form");
        handleSubmit({ preventDefault: () => {}, target: form }); // ✅ Fixed
      } else {
        alert("Invalid verification code.");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Verification failed.");
    }
  };
  
  return (
    <div>
      <HeaderHome />
      <div className="personal-details-container">
        <form onSubmit={verifyAndUpdate} className="personal-details-form">
          <h2>
            Personal Details <img src={personalDetails} alt="personalDetails" />
          </h2>
          <div className="personal-details-sections">
            <div className="personal-details-left">
              <div className="input-group">
                <label htmlFor="name">Name</label>
                <input type="text" id="name" name="name" defaultValue={userDetails?.name || ""} required />
              </div>
              <div className="input-group">
                <label htmlFor="address">Address</label>
                <input type="text" id="address" name="address" defaultValue={userDetails?.address || ""} required />
              </div>
              <div className="input-group">
                <label htmlFor="email">Email</label>
                <input type="email" id="email" name="email" defaultValue={userDetails?.email || ""} disabled />
              </div>
              <div className="input-group">
                <label htmlFor="car_number">Car Number</label>
                <input type="text" id="car_number" name="car_number" defaultValue={userDetails?.car_number || ""} disabled />
              </div>
            </div>
            <div className="personal-details-right">
              <div className="input-group">
                <label htmlFor="car_type">Type</label>
                <input type="text" id="car_type" name="car_type" defaultValue={userDetails?.car_type || ""} required />
              </div>
              <div className="input-group">
                <label htmlFor="car_year">Year</label>
                <input type="number" id="car_year" name="car_year" defaultValue={userDetails?.car_year || ""} required />
              </div>
              <div className="input-group">
                <label htmlFor="password">Password</label>
                <input type="password" id="password" name="password" defaultValue={userDetails?.password || ""}  />
              </div>
                <button type="submit" className="submit-button">
                  Update Details
                </button>
            </div>
          </div>
        </form>

        <Modal
          isOpen={isModalOpen}
          onRequestClose={() => setIsModalOpen(false)}
          contentLabel="Enter Verification Code"
          className="modal"
          overlayClassName="modal-overlay"
        >
          <h2>Verify Your Email</h2>
          <p>Enter the 6-digit code sent to your email.</p>
          <input
            type="text"
            maxLength={6}
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            placeholder="123456"
          />
          <div className="modal-actions">
            <button onClick={handleCodeVerification}>Verify</button>
            <button onClick={() => setIsModalOpen(false)}>Cancel</button>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default PersonalDetails;
