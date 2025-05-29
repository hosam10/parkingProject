import React, { useState } from "react";
import "./Test.css";
import { useNavigate } from "react-router-dom";

const Test = () => {
  const navigate = useNavigate();
  const [selectedSpot, setSelectedSpot] = useState(null);

  // מיפוי מספרי חניה לסוגים
  const spotTypes = {
    1: "electric",
    2: "electric",
    3: "electric",
    4: "electric",
    5: "electric",
    6: "electric",
    25: "disabled",
    26: "disabled",
    27: "disabled",
    28: "disabled",
    29: "disabled",
    30: "disabled",

  };

  const getSpotType = (spot) => spotTypes[spot] || "regular";

  const isDisabled = (spot) => getSpotType(spot) === "disabled";

  const handleSpotClick = (spot) => {
    if (isDisabled(spot)) return;
    setSelectedSpot(spot);
    navigate('/formPay', { state: { spotId: spot } });
  };

  const renderCell = (spot) => {
    const type = getSpotType(spot);
    const selected = selectedSpot === spot;
    const cellClass = `parking-cell ${selected ? 'selected' : ''} ${type}`;

    return (
      <td
        key={spot}
        className={cellClass}
        onClick={() => handleSpotClick(spot)}
      >
        {spot}
        {type === "disabled" && <span className="disabled-icon">♿</span>}
        {type === "electric" && <span className="electric-icon">⚡</span>}
      </td>
    );
  };

  const renderRow = (spots) => (
    <tr >{spots.map(renderCell)}</tr>
  );

  const renderVerticalColumn = (spots) => (
    <table className="tableX1">
      <tbody>
        {spots.map((spot) => (
          <tr  key={spot}>{renderCell(spot)}</tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="layout">
      {/* Top row */}
      <table className="tableX2">
        <tbody className="tt">{renderRow([1, 2, 3, 4, 5, 6])}</tbody>
      </table>

      <div className="road-horizontal" />

      {/* Middle vertical sections */}
      <div className="row-layout">
        {renderVerticalColumn([7, 8, 9, 10, 11, 12])}
        <div className="road-vertical" />
        {renderVerticalColumn([13, 14, 15, 16, 17, 18])}
        <div className="road-vertical" />
        {renderVerticalColumn([19, 20, 21, 22, 23, 24])}
      </div>

      <div className="road-horizontal" />

      {/* Bottom row */}
      <table className="tableX3">
        <tbody>{renderRow([25, 26, 27, 28, 29, 30])}</tbody>
      </table>
    </div>
  );
};

export default Test;
