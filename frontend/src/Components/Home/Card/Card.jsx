import React from "react";
import "./Card.css";
import { useNavigate } from "react-router-dom";

const Card = ({ img, title , handle }) => {

        const navigate = useNavigate();
    
        const handleCliked = () => {
            navigate(handle);
        };

  return (
    <div onClick={handleCliked} className="card-container">
        <img src={img} alt="" />
        <button>{title}</button>
    </div>
  );
};

export default Card;
