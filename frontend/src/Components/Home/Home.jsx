import React, { useState, useEffect } from "react";
import "./Home.css";
import HeaderHome from "../HeaderHome/HeaderHome";
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

const Home = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [animateCards, setAnimateCards] = useState(false);

  const locations = {
    "Kiryon": {
      name: "Kiryon Mall",
      description: "Premium shopping destination with modern parking facilities",
      distance: "2.5 km",
      rating: 4.8,
      spots: 450,
      available: 120,
      sections: [
        { img: img1, title: "North", handle: "/parking/Kiryon/North", spots: 120, available: 45 },
        { img: img2, title: "South", handle: "/parking/Kiryon/South", spots: 110, available: 30 },
        { img: img3, title: "West", handle: "/parking/Kiryon/West", spots: 100, available: 25 },
        { img: img4, title: "East", handle: "/parking/Kiryon/East", spots: 120, available: 20 },
      ]
    },
    "Grand Kanyon": {
      name: "Grand Kanyon",
      description: "Largest shopping complex with extensive parking options",
      distance: "3.2 km",
      rating: 4.6,
      spots: 600,
      available: 180,
      sections: [
        { img: img7, title: "North", handle: "/parking/GrandKanyon/North", spots: 150, available: 50 },
        { img: img5, title: "South", handle: "/parking/GrandKanyon/South", spots: 150, available: 40 },
        { img: img8, title: "West", handle: "/parking/GrandKanyon/West", spots: 150, available: 45 },
        { img: img6, title: "East", handle: "/parking/GrandKanyon/East", spots: 150, available: 45 },
      ]
    },
    "Lev Hamifratz": {
      name: "Lev Hamifratz",
      description: "Coastal shopping center with scenic parking views",
      distance: "4.1 km",
      rating: 4.7,
      spots: 380,
      available: 95,
      sections: [
        { img: img4, title: "North", handle: "/parking/Hamifratz/North", spots: 95, available: 25 },
        { img: img1, title: "South", handle: "/parking/Hamifratz/South", spots: 95, available: 20 },
        { img: img2, title: "West", handle: "/parking/Hamifratz/West", spots: 95, available: 30 },
        { img: img9, title: "East", handle: "/parking/Hamifratz/East", spots: 95, available: 20 },
      ]
    },
  };

  // Loading effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      setAnimateCards(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Filter locations based on search and filter criteria
  const filteredLocations = Object.entries(locations).filter(([key, location]) => {
    const matchesSearch = location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         location.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedFilter === "all") return matchesSearch;
    if (selectedFilter === "available") return matchesSearch && location.available > 50;
    if (selectedFilter === "nearby") return matchesSearch && parseFloat(location.distance) < 3;
    if (selectedFilter === "high-rated") return matchesSearch && location.rating >= 4.7;
    
    return matchesSearch;
  });

  const totalSpots = Object.values(locations).reduce((sum, location) => sum + location.spots, 0);
  const totalAvailable = Object.values(locations).reduce((sum, location) => sum + location.available, 0);

  if (isLoading) {
    return (
      <div className="home-container">
        <HeaderHome />
        <div className="loading-screen">
          <div className="loading-content">
            <div className="loading-spinner-large"></div>
            <h2>Finding the best parking spots for you...</h2>
            <p>Loading amazing locations</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="home-container">
      <HeaderHome />
      
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Find Your Perfect
            <span className="gradient-text"> Parking Spot</span>
          </h1>
          <p className="hero-subtitle">
            Discover premium parking locations with real-time availability and smart features
          </p>
          
          {/* Stats */}
          <div className="hero-stats">
            <div className="stat-item">
              <div className="stat-number">{totalSpots}</div>
              <div className="stat-label">Total Spots</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{totalAvailable}</div>
              <div className="stat-label">Available Now</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{Object.keys(locations).length}</div>
              <div className="stat-label">Locations</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="search-filter-section">
        <div className="search-container">
          <div className="search-input-wrapper">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <input
              type="text"
              placeholder="Search locations, descriptions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="filter-container">
          <div className="filter-buttons">
            <button 
              className={`filter-btn ${selectedFilter === "all" ? "active" : ""}`}
              onClick={() => setSelectedFilter("all")}
            >
              All Locations
            </button>
            <button 
              className={`filter-btn ${selectedFilter === "available" ? "active" : ""}`}
              onClick={() => setSelectedFilter("available")}
            >
              High Availability
            </button>
            <button 
              className={`filter-btn ${selectedFilter === "nearby" ? "active" : ""}`}
              onClick={() => setSelectedFilter("nearby")}
            >
              Nearby
            </button>
            <button 
              className={`filter-btn ${selectedFilter === "high-rated" ? "active" : ""}`}
              onClick={() => setSelectedFilter("high-rated")}
            >
              Highly Rated
            </button>
          </div>
        </div>
      </div>

      {/* Locations Grid */}
      <div className="locations-grid">
        {filteredLocations.map(([key, location], index) => (
          <div 
            key={key} 
            className={`location-card ${animateCards ? "animate-in" : ""}`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="location-header">
              <div className="location-info">
                <h3 className="location-name">{location.name}</h3>
                <p className="location-description">{location.description}</p>
                <div className="location-meta">
                  <span className="distance">📍 {location.distance}</span>
                  <span className="rating">⭐ {location.rating}</span>
                </div>
              </div>
              <div className="availability-indicator">
                <div className="availability-circle">
                  <span className="availability-text">{location.available}</span>
                  <span className="availability-label">Available</span>
                </div>
                <div className="total-spots">of {location.spots} spots</div>
              </div>
            </div>

            <div className="sections-grid">
              {location.sections.map((section, sectionIndex) => (
                <Card
                  key={sectionIndex}
                  img={section.img}
                  title={section.title}
                  handle={section.handle}
                  spots={section.spots}
                  available={section.available}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredLocations.length === 0 && (
        <div className="no-results">
          <div className="no-results-icon">🔍</div>
          <h3>No locations found</h3>
          <p>Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  );
};

export default Home;
