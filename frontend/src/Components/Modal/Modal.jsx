import React from 'react';
import './Modal.css';
import car from '../images/car.gif'
const Modal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay-steps">
    <div className="modal-content-steps">
      <button className="close-button-steps" onClick={onClose}>×</button>
      <h1>HOW IT WORKS</h1>
      <div className="steps">
        <div className="step">
          <strong>1. Find your car park!</strong>
          <p>Sign up and check our presence at malls</p>
        </div>
        <div className="step">
          <strong>2. Book!</strong>
          <p>Select date and time, check availability, see prices...</p>
        </div>
        <div className="step">
          <strong>3. And park!</strong>
          <p>Upon arrival, just show your reservation in the car park.</p>
        </div>
        <img src={car} alt="car" />
      </div>
    </div>
  </div>
);
};

export default Modal;
