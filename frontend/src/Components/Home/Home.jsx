import React, { useState } from "react";
import "./Home.css";
import HeaderHome from "../HeaderHome/HeaderHome";
import Par from "./Par/Par";
import Card from "./Card/Card";
import img1 from "../images/p1.jpg";
import img2 from "../images/p2.jpg";
import img3 from "../images/p3.jpg";
import img4 from "../images/p4.jpg";
import img5 from "../images/p5.jpg";
import img6 from "../images/p6.jpg";
import img7 from "../images/p7.jpg";
import img8 from "../images/p8.jpeg";
import img9 from "../images/p9.jpg";

import { useNavigate } from "react-router-dom";

const Home = () => {
   const [searchQuery, setSearchQuery] = useState(""); // state for search query
  const navigate = useNavigate();

  const locations = {
   "Kiryon": [
      { img: img1, title: "North", handle: "/parking/Kiryon/North" },
      { img: img2, title: "South", handle: "/parking/Kiryon/South" },
      { img: img3, title: "West", handle: "/parking/Kiryon/West" },
      { img: img4, title: "East", handle: "/parking/Kiryon/East" },
    ],
    "Grand Kanyon": [
      { img: img7, title: "North", handle: "/parking/GrandKanyon/North" },
      { img: img5, title: "South", handle: "/parking/GrandKanyon/South" },
      { img: img8, title: "West", handle: "/parking/GrandKanyon/West" },
      { img: img6, title: "East", handle: "/parking/GrandKanyon/East" },
    ],
    "Lev Hamifratz": [
      { img: img4, title: "North", handle: "/parking/Hamifratz/North" },
      { img: img1, title: "South", handle: "/parking/Hamifratz/South" },
      { img: img2, title: "West", handle: "/parking/Hamifratz/West" },
      { img: img9, title: "East", handle: "/parking/Hamifratz/East" },
    ],
  };

  // const handleSelectLocation = (location) => {
  //   setSelectedLocation(location);
  //   setSelectedFloor(""); // Reset floor when location changes
  // };

  // const handleSelectFloor = (floor) => {
  //   setSelectedFloor(floor);
  // };

  const filteredLocations = Object.keys(locations).filter(location =>
    location.toLowerCase().includes(searchQuery.toLowerCase()) // Search filtering logic
  );

  return (
    <div>
      <HeaderHome />
      {/* <Par
        onSelectLocation={handleSelectLocation}
        onSelectFloor={handleSelectFloor}
        locations={locations}
      /> */}
      
      {/* Search input */}
      <div className="search-container">
        <input
          type="text"
          placeholder="Search Locations"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)} // Update searchQuery state
          className="search-input"
        />
      </div>

      {/* Display the filtered locations */}
      {filteredLocations.map((location, index) => (
        <div key={index} className="location-section">
          <h2 className="location-title">{location}</h2> {/* Title for each location */}
          <div className="location-container">
            {locations[location].map((card, index) => (
              <Card
                key={index}
                img={card.img}
                title={card.title}
                handle={card.handle}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Home;
