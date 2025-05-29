import React, { useState, useEffect } from "react";
import "./Par.css";

const Par = ({ onSelectLocation, onSelectFloor, locations }) => {
  const [selectedLocation, setSelectedLocation] = useState("");
  const [floors, setFloors] = useState([]);

  useEffect(() => {
    if (selectedLocation) {
      setFloors(locations[selectedLocation] || []);
    }
  }, [selectedLocation, locations]);

  const handleLocationChange = (event) => {
    const location = event.target.value;
    setSelectedLocation(location);
    onSelectLocation(location);
  };

  return (
    <div className="par-container">
      <div className="par-title">Select Location</div>
      <select onChange={handleLocationChange} className="search-select" defaultValue="">
        <option value="">All Locations</option>
        <option value="Kiryon">Kiryon Bialik</option>
        <option value="Grand Kanyon">Grand Kanyon</option>
        <option value="Lev Hamifratz">Lev Hamifratz</option>
      </select>
    </div>
  );
};

export default Par;
