import React from "react";
import "./malls.css";
import { useNavigate } from "react-router-dom";
import HeaderHome from "../../HeaderHome/HeaderHome";
import AreaP from "../../ParkingArea/ParkingsArea/AreaP";
import parkingIcon from "../../images/parking-location.gif"; // Parking image

const Kiryons = ({ title, price }) => {
  // const navigate = useNavigate();
  return (
    <>
      <HeaderHome />
      <div className="centerPar">
        <div className="titleImg">
          <h1>{title} </h1>
          <img src={parkingIcon} alt="parkingIcon" />
        </div>

        <p>
        Our parking system uses clear color indicators, <span className="greenWord">green</span> indicates an empty spot, <span className="redWord">red</span> means the spot is occupied, <span className="blueWord">blue</span> represents a disabled parking spot, and <span className="yellowWord">yellow</span> signifies a parking spot for electric cars, ensuring a smooth and efficient parking experience for all users.
        </p>
        <p className="price">{price}</p>
      </div>
      <div>
        <AreaP/>
      </div>
      {/* FORM */}
    </>
  );
};

export default Kiryons;
