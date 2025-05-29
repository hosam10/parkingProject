import React from "react";
import "./ParkingPlaces.css";

const ParkingPlaces = ({ name, about, pricePerHour }) => {
  return (
    <div className="parkingPlaces">
      {/* Title Section */}
      <div className="parkingPlaces-title">
        {name}
      </div>

      {/* About Section */}
      <div className="parkingPlaces-about">
        {about}
      </div>

      {/* Form Section */}
      <div className="form-container">
        <div className="form-title">Basic pass</div>
        <div className="form-subtitle">Single entry and exit</div>

        <form action="">
          <label htmlFor="full-name" className="form-label">Full name</label>
          <input type="text" id="full-name" name="full-name" className="form-input" placeholder="Enter your full name" />

          <label htmlFor="city" className="form-label">City of residence</label>
          <input type="text" id="city" name="city" className="form-input" placeholder="Enter your city" />

          <label htmlFor="phone" className="form-label">Phone</label>
          <input type="text" id="phone" name="phone" className="form-input" placeholder="Enter your phone number" />

          <label htmlFor="vehicle-model" className="form-label">Vehicle model</label>
          <input type="text" id="vehicle-model" name="vehicle-model" className="form-input" placeholder="Enter your vehicle model" />

          <label htmlFor="license-plate" className="form-label">License plate</label>
          <input type="text" id="license-plate" name="license-plate" className="form-input" placeholder="Enter your license plate" />

          <label htmlFor="entry-time" className="form-label">Entry time</label>
          <input type="text" id="entry-time" name="entry-time" className="form-input" placeholder="dd-mm-yyyy --:--" />

          <label htmlFor="exit-time" className="form-label">Exit time</label>
          <input type="text" id="exit-time" name="exit-time" className="form-input" placeholder="dd-mm-yyyy --:--" />

          <div className="net-amount">Net amount</div>

          <button type="submit" className="confirm-btn">Confirm</button>
        </form>
      </div>
    </div>
  );
};

export default ParkingPlaces;
