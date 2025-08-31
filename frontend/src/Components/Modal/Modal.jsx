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
        <p>
          Create your free account and browse through our list of supported car parks.  
          You can search by mall, city, or neighborhood and immediately check if we are available at your preferred location.
        </p>
      </div>

      <div className="step">
        <strong>2. Book your spot!</strong>
        <p>
          Choose the exact date and time when you want to park.  
          The system will show you real-time availability and prices so you can easily compare and pick the best option for you.  
          Once you’re ready, confirm your booking with just one click.
        </p>
      </div>

      <div className="step">
        <strong>3. Park with ease!</strong>
        <p>
          When you arrive at the car park, simply present your reservation on your phone.  
          No need for paper tickets or long waiting lines – our system recognizes your booking instantly and grants you access.  
          Parking has never been this simple!
        </p>
      </div>

      <div className="step">
        <strong>4. Manage your reservations</strong>
        <p>
          From your personal dashboard you can view, edit, or cancel upcoming bookings at any time.  
          You’ll also receive reminders so you never miss your reserved slot.
        </p>
      </div>

      <img src={car} alt="car" className="steps-image" />
    </div>
  </div>
</div>

);
};

export default Modal;
