import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./PersonalDetails.css";
import HeaderHome from "../HeaderHome/HeaderHome";
import personalDetails from "../images/personalDetails.gif";

const PersonalDetails = () => {
  const navigate = useNavigate();
  const [userDetails, setUserDetails] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Get car number from localStorage after login
  const carNumber = JSON.parse(localStorage.getItem("user"))?.car_number;

  // Check if carNumber exists
  useEffect(() => {
    if (!carNumber) {
      setErrorMessage("User is not logged in or car number is missing.");
      return;
    }

    // Fetch user personal details using car_number
    axios
      .get(`http://127.0.0.1:5000/get_user_details?car_number=${carNumber}`)
      .then((response) => {
        setUserDetails(response.data.user);
      })
      .catch((error) => {
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
    };

    // Send updated data to backend
    axios
      .put("http://127.0.0.1:5000/update_user_details", updatedDetails)
      .then((response) => {
        alert(response.data.message); // Show success message
        
        // ✅ Update localStorage with new user data
        localStorage.setItem("user", JSON.stringify(updatedDetails));

        // ✅ Dispatch a storage event so other components (Header) update
        window.dispatchEvent(new Event("storage"));
      })
      .catch((error) => {
        alert("Error updating user details");
      });
};


  return (
    <div>
      <HeaderHome />
      <div className="personal-details-container">
        <form onSubmit={handleSubmit} className="personal-details-form">
          <h2>
            Personal Details <img src={personalDetails} alt="personalDetails" />
          </h2>
          <div className="personal-details-sections">
            <div className="personal-details-left">
              <div className="input-group">
                <label htmlFor="name">Name:</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  defaultValue={userDetails ? userDetails.name : ""}
                  required
                />
              </div>
              <div className="input-group">
                <label htmlFor="address">Address:</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  defaultValue={userDetails ? userDetails.address : ""}
                  required
                />
              </div>
              <div className="input-group">
                <label htmlFor="email">Email:</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  defaultValue={userDetails ? userDetails.email : ""}
                  required
                />
              </div>
              <div className="input-group">
                <label htmlFor="car_number">Car Number:</label>
                <input
                  type="text"
                  id="car_number"
                  name="car_number"
                  defaultValue={userDetails ? userDetails.car_number : ""}
                  required
                />
              </div>
            </div>

            <div className="personal-details-right">
              <div className="input-group">
                <label htmlFor="car_type">Car Type:</label>
                <input
                  type="text"
                  id="car_type"
                  name="car_type"
                  defaultValue={userDetails ? userDetails.car_type : ""}
                  required
                />
              </div>
              <div className="input-group">
                <label htmlFor="car_year">Car Year:</label>
                <input
                  type="number"
                  id="car_year"
                  name="car_year"
                  defaultValue={userDetails ? userDetails.car_year : ""}
                  required
                />
              </div>
              <div className="input-group">
                <button type="submit" className="submit-button">
                  Update Details
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PersonalDetails;
