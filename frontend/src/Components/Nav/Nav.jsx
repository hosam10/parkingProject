import React from "react";
import "./Nav.css";
const Nav = () => {
  return (
    <div className="nav">
      {/* <h1>Welcome to Smart Parking!</h1> */}
      <div class="topnav">
        <a class="active" href="#home">
          Home
        </a>
        <a href="#about">About</a>
        <a href="#contact">Contact</a>
      </div>
    </div>
  );
};

export default Nav;
