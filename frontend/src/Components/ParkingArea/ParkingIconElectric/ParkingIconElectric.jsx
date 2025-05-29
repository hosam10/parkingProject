import React from "react";
import "./ParkingIconElectric.css";
import parkingdisability from '../../images/disability-Parking2.png'; // Parking image
import parkingMotor from '../../images/parking-motor.png'; // Parking image
import parkingCar from '../../images/parked-car.png'; // Parking image
import parkingElectric from '../../images/charger-station.png'; // Parking image

import { useNavigate } from "react-router-dom";

const ParkingIconElectric = () => {
  const navigate = useNavigate();
  
  // Function to handle the click event for a parking spot
  const handleClick = () => {
    navigate('/formPay');
    
    // You can perform any action when a parking spot is clicked, like navigating or showing details.
  };

  return (
    <div>
      <h1 className="disabled-title">Electric Parking</h1>
      <div className="ParkingsArea">
        <button className="parkingItem yellow" onClick={() => handleClick(9)}>
          <div className="number">3</div>
          <img src={parkingElectric} alt="Parking 9" />
        </button>

        <button className="parkingItem yellow" onClick={() => handleClick(9)}>
          <div className="number">3</div>
          <img src={parkingElectric} alt="Parking 9" />
        </button>
        
        <button className="parkingItem yellow" onClick={() => handleClick(9)}>
          <div className="number">3</div>
          <img src={parkingElectric} alt="Parking 9" />
        </button>

        <button className="parkingItem red" onClick={() => handleClick(9)} disabled>
          <div className="number">4</div>
          <img src={parkingElectric} alt="Parking 9" />
        </button>

        <button className="parkingItem yellow" onClick={() => handleClick(9)}>
          <div className="number">5</div>
          <img src={parkingElectric} alt="Parking 9" />
        </button>
      </div>
    </div>
  );
};

export default ParkingIconElectric;
