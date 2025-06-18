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
   <>
  <div className="header-hover-zone"></div>

  <div className="header-wrapper">
    <HeaderHome />
    <div className="centerPar">
      <div className="titleImg">
        <h1>{title} </h1>
        <img src={parkingIcon} alt="parkingIcon" />
      </div>
      <p>
        <span className="greenWord">green</span> = available, <span className="redWord">red</span> = occupied, <span className="blueWord">blue</span> = disabled, <span className="yellowWord">yellow</span> = electric
      </p>
      <p className="price">{price}</p>
    </div>
  </div>

  <div>
    <AreaP />
  </div>
</>

    </>
  );
};

export default Kiryons;
