import React from "react";
import "./AreaP.css";
import Test from "../Test";

const AreaP = (title) => {
  return (
    <div>
      <div className="">
        <Test />
      </div>

       {/* <div className="">
        <ParkingIcon />
      </div> */}
{/*
      <div className="disabled">
        <ParkingIconElectric />
      </div>
      <div className="electric">
        <ParkingIconDisabled />
      </div> */}
    </div>
  );
};

export default AreaP;
