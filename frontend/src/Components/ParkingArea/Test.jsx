import React, { useState } from "react";
import "./Test.css";
import { useNavigate } from "react-router-dom";
import parkingCar from "../images/parked-car.png";
import parkingdisability from "../images/disability-Parking2.png";
import parkingElectric from "../images/charger-station.png";
import arrow from "../images/arrow.png";
import downarrow from "../images/down-arrow.png";
import gate from "../images/barrier.gif";

const Test = () => {
  const navigate = useNavigate();
  const [selectedSpot, setSelectedSpot] = useState(null);

  const spotTypes = {
    1: "electric",
    2: "electric",
    3: "electric",
    4: "electric",
    5: "normal",
    6: "normal",
    7: "normal",
    8: "normal",
    9: "normal",
    10: "normal",
    11: "normal",
    12: "normal",
    13: "normal",
    14: "normal",
    15: "normal",
    16: "normal",
    17: "normal",
    18: "normal",
    19: "normal",
    20: "normal",
    21: "normal",
    22: "normal",
    23: "normal",
    24: "normal",
    25: "disabled",
    26: "disabled",
    27: "disabled",
    28: "disabled",
  };

  const getSpotType = (spot) => spotTypes[spot] || "regular";
  const isDisabled = (spot) => getSpotType(spot) === "disabled";

  const handleSpotClick = (spot) => {
    if (isDisabled(spot)) return;
    setSelectedSpot(spot);
    navigate("/formPay", { state: { spotId: spot } });
  };

  const renderCell = (spot) => {
    const type = getSpotType(spot);
    const selected = selectedSpot === spot;
    const cellClass = `parking-cell ${selected ? "selected" : ""} ${type}`;

    return (
      <td key={spot} className={cellClass} onClick={() => handleSpotClick(spot)}>
        {spot}
        {type === "disabled" && <img src={parkingdisability} alt="parkingdisability" />}
        {type === "electric" && <img src={parkingElectric} alt="parkingElectric" />}
        {type === "normal" && <img src={parkingCar} alt="parkingCar" />}
      </td>
    );
  };

  const renderRow = (spots) => (
    <div className="electric-row">
      <tr>{spots.map(renderCell)}</tr>
    </div>
  );

  const renderVerticalColumn = (spots) => (
    <table className="tableX1">
      <tbody>
        {spots.map((spot) => (
          <tr key={spot}>{renderCell(spot)}</tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="layout">
      <table className="tableX2">
        <tbody>{renderRow([1, 2, 3, 4])}</tbody>
      </table>

      <div className="road-white-container first-white">
        <div className="road-white" />
        <div className="road-white" />
        <div className="road-white" />
      </div>

      <div className="underLine">
        <img id="arrow-img" src={arrow} alt="arrow" />
        <div className="road-horizontal r2 under" />
        <img id="arrow-img" src={downarrow} alt="arrow" />
      </div>

      <div className="road-white-container">
        <div className="road-white" />
        <div className="road-white" />
        <div className="road-white" />
      </div>

      <div className="row-layout">
        {renderVerticalColumn([7, 8, 9,])}
        <div className="road-vertical roadLeft1" />
        {renderVerticalColumn([13, 14, 15,])}
        <div className="roadRight1" />
        {renderVerticalColumn([13, 14, 15,])}
        <div className="road-vertical roadLeft2" />
        {renderVerticalColumn([19, 20, 21,])}
      </div>

      <div className="road-white-container under-road">
        <div className="road-white" />
        <div className="road-white" />
        <div className="road-white" />
      </div>

      <div className="underLine">
        <img id="arrow-img" src={arrow} alt="arrow" />
        <div className="road-horizontal r2 under" />
        <img id="arrow-img" src={downarrow} alt="arrow" />
      </div>

      <div className="road-white-container">
        <div className="road-white" />
        <div className="road-white" />
        <div className="road-white" />
      </div>

      <table className="tableX3">
        <tbody>{renderRow([25, 26, 27, 28])}</tbody>
      </table>

      <div className="r4" />
      <div className="road-horizontal" id="r3" />

      <div className="line-wrapper">
        {/* <div className="line" /> */}
        <img src={gate} alt="Gate" className="gate-img" />
        {/* <div className="line right-line" /> */}
      </div>
    </div>
  );
};

export default Test;
