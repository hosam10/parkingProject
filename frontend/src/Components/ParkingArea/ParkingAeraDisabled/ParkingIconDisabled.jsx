import React from "react";
import "./ParkingIconDisabled.css";
import parkingdisability from '../../images/disability-Parking2.png'; // Parking image

import { useNavigate } from "react-router-dom";

const ParkingIconDisabled = () => {
  const navigate = useNavigate();
  
  // Function to handle the click event for a parking spot
  const handleClick = () => {
    navigate('/formPay');
    
    // You can perform any action when a parking spot is clicked, like navigating or showing details.
  };

  return (
    <div className="parking-section">
      <h2 className="parking-title">Disabled Parking</h2>
      <div className="ParkingsArea">
        <button className="parkingItem red" onClick={() => handleClick(7)} disabled>
          {/* <div className="ligh green">G</div> Green light */}
          <div className="number">1</div>
          <img src={parkingdisability} alt="Parking 7" />
        </button>

        <button className="parkingItem blue" onClick={() => handleClick(8)}>
          {/* <div className="ligh red">R</div> Red light */}
          <div className="number">2</div>
          <img src={parkingdisability} alt="Parking 8" />
        </button>

        <button className="parkingItem blue" onClick={() => handleClick(8)}>
          {/* <div className="ligh red">R</div> Red light */}
          <div className="number">3</div>
          <img src={parkingdisability} alt="Parking 8" />
        </button>

        <button className="parkingItem blue" onClick={() => handleClick(8)}>
          {/* <div className="ligh red">R</div> Red light */}
          <div className="number">4</div>
          <img src={parkingdisability} alt="Parking 8" />
        </button>

        <button className="parkingItem blue" onClick={() => handleClick(8)}>
          {/* <div className="ligh red">R</div> Red light */}
          <div className="number">5</div>
          <img src={parkingdisability} alt="Parking 8" />
        </button>
      </div>
    </div>
  );
};

export default ParkingIconDisabled;
