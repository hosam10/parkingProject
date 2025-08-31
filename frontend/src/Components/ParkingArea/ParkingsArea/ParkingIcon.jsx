import React from "react";
import "./ParkingIcon.css";
import parkingdisability from "../../images/disability-Parking2.png"; // Parking image
import parkingElectric from "../../images/charger-station.png"; // Parking image
import parkingMotor from "../../images/parking-motor.png"; // Parking image
import parkingCar from "../../images/parked-car.png"; // Parking image

import { useNavigate } from "react-router-dom";

const ParkingIcon = () => {
  const navigate = useNavigate();

  // Function to handle the click event for a parking spot
  const handleClick = () => {
    navigate("/formPay");
    // You can perform any action when a parking spot is clicked, like navigating or showing details.
  };

  return (
    <div>
      <h1 className="parking-title">Available Parking Spots</h1>
      <div className="ParkingsArea">
        <button className="parkingItem green" onClick={() => handleClick(7)}>
          {/* <div className="ligh green">G</div> Green light */}
          <div className="number">1</div>
          <img src={parkingCar} alt="Parking 1" />
        </button>

        <button className="parkingItem green" onClick={() => handleClick(8)}>
          {/* <div className="ligh red">R</div> Red light */}
          <div className="number">2</div>
          <img src={parkingCar} alt="Parking 2" />
        </button>

        <button className="parkingItem green" onClick={() => handleClick(9)}>
          <div className="number">3</div>
          <img src={parkingCar} alt="Parking 3" />
        </button>

        <button
          className="parkingItem red"
          onClick={() => handleClick(10)}
          disabled
        >
          <div className="number">4</div>
          <img src={parkingCar} alt="Parking 4" />
        </button>

        <button className="parkingItem green" onClick={() => handleClick(11)}>
          <div className="number">5</div>
          <img src={parkingCar} alt="Parking 5" />
        </button>

        <button className="parkingItem green" onClick={() => handleClick(12)}>
          <div className="number">6</div>
          <img src={parkingCar} alt="Parking 6" />
        </button>

        <button className="parkingItem green" onClick={() => handleClick(12)}>
          <div className="number">7</div>
          <img src={parkingCar} alt="Parking 7" />
        </button>

        <button className="parkingItem green" onClick={() => handleClick(12)}>
          <div className="number">8</div>
          <img src={parkingCar} alt="Parking 8" />
        </button>

        <button
          className="parkingItem red"
          onClick={() => handleClick(12)}
          disabled
        >
          <div className="number">9</div>
          <img src={parkingCar} alt="Parking 9" />
        </button>

        <button className="parkingItem green" onClick={() => handleClick(12)}>
          <div className="number">10</div>
          <img src={parkingCar} alt="Parking 10" />
        </button>

        <button className="parkingItem green" onClick={() => handleClick(12)}>
          <div className="number">11</div>
          <img src={parkingCar} alt="Parking 11" />
        </button>

        <button
          className="parkingItem red"
          onClick={() => handleClick(12)}
          disabled
        >
          <div className="number">12</div>
          <img src={parkingCar} alt="Parking 12" />
        </button>

        <button
          className="parkingItem red"
          onClick={() => handleClick(12)}
          disabled
        >
          <div className="number">13</div>
          <img src={parkingCar} alt="Parking 13" />
        </button>

        <button className="parkingItem green" onClick={() => handleClick(12)}>
          <div className="number">14</div>
          <img src={parkingCar} alt="Parking 14" />
        </button>
      </div>
    </div>
  );
};

export default ParkingIcon;
