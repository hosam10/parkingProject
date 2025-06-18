import React, { useState, useEffect } from "react";
import "./FormPay.css";
import { useNavigate } from "react-router-dom";
import HeaderHome from "../HeaderHome/HeaderHome";
import axios from "axios";

const FormPay = () => {
  const navigate = useNavigate();

  const [entryTime, setEntryTime] = useState("");
  const [exitTime, setExitTime] = useState("");
  const [netAmount, setNetAmount] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [location, setLocation] = useState("Kiryon");
  const [expiryError, setExpiryError] = useState("");
  const [showCvvModal, setShowCvvModal] = useState(false);
  const [cvvInput, setCvvInput] = useState("");

  const [cardDetails, setCardDetails] = useState({
    card_number: "",
    card_holder: "",
    cvv: "",
    expiry_date: "",
  });

  const [hasCard, setHasCard] = useState(false);
  const carNumber = JSON.parse(localStorage.getItem("user"))?.car_number;

  useEffect(() => {
    if (!carNumber) {
      setErrorMessage("User is not logged in or car number is missing.");
      return;
    }

    axios
      .get(`http://127.0.0.1:5000/get_card_details?car_number=${carNumber}`)
      .then((response) => {
        if (response.data.card) {
          setCardDetails(response.data.card);
          setHasCard(true);
        } else {
          setHasCard(false);
        }
      })
      .catch(() => {
        setErrorMessage("Error fetching card details.");
      });
  }, [carNumber]);

  const handleEntryTimeChange = (e) => {
    setEntryTime(e.target.value);
    calculateNetAmount(e.target.value, exitTime);
  };

  const handleExitTimeChange = (e) => {
    setExitTime(e.target.value);
    calculateNetAmount(entryTime, e.target.value);
  };

  const calculateNetAmount = (entry, exit) => {
    if (entry && exit) {
      const entryDate = new Date(entry);
      const exitDate = new Date(exit);

      if (exitDate <= entryDate) {
        setErrorMessage("Exit time must be later than entry time.");
        setNetAmount(0);
        return;
      } else {
        setErrorMessage("");
      }

      const timeDiff = (exitDate - entryDate) / (1000 * 60 * 60);
      setNetAmount(timeDiff > 0 ? timeDiff * 3 : 0);
    }
  };

  const handleSaveParking = () => {
    axios
      .post("http://127.0.0.1:5000/save_parking_record", {
        car_number: carNumber,
        entry_time: entryTime,
        exit_time: exitTime,
        amount: netAmount.toFixed(2),
        location: location,
      })
      .then((response) => {
        alert(response.data.message);
        navigate("/home");
      })
      .catch(() => {
        setErrorMessage("Failed to save parking record.");
      });
  };

  const verifyCvvAndSave = () => {
    axios
      .post("http://127.0.0.1:5000/verify_cvv", {
        car_number: carNumber,
        cvv: cvvInput,
      })
      .then((res) => {
        if (res.data.success) {
          handleSaveParking();
        } else {
          setErrorMessage("Invalid CVV.");
        }
      })
      .catch(() => {
        setErrorMessage("CVV verification failed.");
      })
      .finally(() => {
        setShowCvvModal(false);
        setCvvInput("");
      });
  };

  const handleCardClick = () => {
    setShowCvvModal(true);
  };

  return (
    <div className="payPage">
      <HeaderHome />
      <div className="formPay">
        <h1>Basic Pass</h1>

        <div className="form-group-row">
          <div className="form-group">
            <label htmlFor="entry-time">Entry Time</label>
            <input
              type="datetime-local"
              id="entry-time"
              value={entryTime}
              onChange={handleEntryTimeChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="exit-time">Exit Time</label>
            <input
              type="datetime-local"
              id="exit-time"
              value={exitTime}
              onChange={handleExitTimeChange}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label>Net Amount</label>
          <input type="text" value={`$${netAmount.toFixed(2)}`} readOnly />
        </div>

        {hasCard ? (
          <div className="card-container">
            <button className="card-btn" onClick={handleCardClick}>
              {`**** **** **** ${cardDetails.card_number.slice(-4)}`}
            </button>
            <button className="add-card-btn" onClick={() => setHasCard(false)}>
              Add New Card
            </button>
          </div>
        ) : (
          <p>Please enter card details to continue.</p>
        )}

        {showCvvModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Enter CVV to Confirm</h3>
              <input
                type="password"
                maxLength={3}
                value={cvvInput}
                onChange={(e) => setCvvInput(e.target.value)}
                placeholder="CVV"
              />
              <div className="modal-buttons">
                <button onClick={verifyCvvAndSave}>Confirm</button>
                <button onClick={() => setShowCvvModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {errorMessage && <p className="error-message">{errorMessage}</p>}
      </div>
    </div>
  );
};

export default FormPay;
