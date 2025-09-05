// Popup.js
import React from "react";
import "./Popup.css";

const Popup = ({ message, onClose }) => {
  if (!message) return null; // לא מציג כלום אם אין הודעה

  return (
    <div className="popup-overlay">
      <div className="popup-box">
        <p>{message}</p>
        <button onClick={onClose}>OK</button>
      </div>
    </div>
  );
};

export default Popup;
