import React, { useState, useEffect } from "react";
import "./FormPay.css";
import { useNavigate } from "react-router-dom";
import HeaderHome from "../HeaderHome/HeaderHome";
import axios from "axios"; // Import axios for API requests

const FormPay = () => {
  const navigate = useNavigate();

  // ✅ State for Entry & Exit Time
  const [entryTime, setEntryTime] = useState("");
  const [exitTime, setExitTime] = useState("");
  const [netAmount, setNetAmount] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  // ✅ State for Card Details
  const [cardDetails, setCardDetails] = useState({
    card_number: "",
    card_holder: "",
    cvv: "",
    expiry_date: "",
  });

  const [hasCard, setHasCard] = useState(false); // Check if user has a card

  // ✅ Get car_number from localStorage
  const carNumber = JSON.parse(localStorage.getItem("user"))?.car_number;

  // ✅ Fetch Card Details from Database
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
          setHasCard(true); // ✅ User has a card
        } else {
          setHasCard(false); // ❌ No card found
        }
      })
      .catch(() => {
        setErrorMessage("Error fetching card details.");
      });
  }, [carNumber]);

  // ✅ Entry & Exit Time Handling
  const handleEntryTimeChange = (e) => {
    setEntryTime(e.target.value);
    calculateNetAmount(e.target.value, exitTime);
  };

  const handleExitTimeChange = (e) => {
    setExitTime(e.target.value);
    calculateNetAmount(entryTime, e.target.value);
  };

  // ✅ Calculate Parking Cost ($3 per Hour)
  const calculateNetAmount = (entry, exit) => {
    if (entry && exit) {
      const entryDate = new Date(entry);
      const exitDate = new Date(exit);

      if (exitDate <= entryDate) {
        setErrorMessage("Exit time must be later than entry time.");
        setNetAmount(0);
        return;
      } else {
        setErrorMessage(""); // Clear error message
      }

      const timeDiff = (exitDate - entryDate) / (1000 * 60 * 60);
      setNetAmount(timeDiff > 0 ? timeDiff * 3 : 0);
    }
  };

  // ✅ Handle Card Submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage(""); // Clear previous errors

    // ✅ Validate Card Number (Must be 16 Digits)
    if (!/^\d{16}$/.test(cardDetails.card_number)) {
      setErrorMessage("Card number must contain exactly 16 digits.");
      return;
    }

    // ✅ Validate CVV (Must be 3 Digits)
    if (!/^\d{3}$/.test(cardDetails.cvv)) {
      setErrorMessage("CVV must contain exactly 3 digits.");
      return;
    }

    // ✅ Validate Expiry Date (Must be in Future)
    const expiryDate = new Date(cardDetails.expiry_date);
    const today = new Date();
    if (expiryDate < today) {
      setErrorMessage("Card expiry date must be in the future.");
      return;
    }

    // ✅ Send Card Data to Backend (Insert/Update)
    axios
      .post("http://127.0.0.1:5000/update_card_details", {
        car_number: carNumber,
        card_number: cardDetails.card_number,
        card_holder: cardDetails.card_holder,
        cvv: cardDetails.cvv,
        expiry_date: cardDetails.expiry_date,
      })
      .then((response) => {
        alert(response.data.message);

        // ✅ Fetch Updated Cards After Saving
        axios
          .get(`http://127.0.0.1:5000/get_card_details?car_number=${carNumber}`)
          .then((response) => {
            if (response.data.card) {
              setCardDetails(response.data.card);
              setHasCard(true); // ✅ Update UI
            }
          })
          .catch(() => {
            setErrorMessage("Error fetching updated card details.");
          });
      })
      .catch(() => {
        setErrorMessage("Error saving card details.");
      });
  };

  // ✅ Reset form fields when "Add New Card" is clicked
  const handleAddNewCard = () => {
    setHasCard(false); // Set the state to show the form to add a new card
    setCardDetails({
      card_number: "",
      card_holder: "",
      cvv: "",
      expiry_date: "",
    }); // Reset the card details to empty fields
  };

  return (
    <>
      <HeaderHome />
      <div className="formPay">
        <h1>Basic Pass</h1>

        {/* ✅ Entry & Exit Time */}
        <div className="form-group-row">
          <div className="form-group">
            <label htmlFor="entry-time">Entry Time</label>
            <input
              type="datetime-local"
              id="entry-time"
              name="entry-time"
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
              name="exit-time"
              value={exitTime}
              onChange={handleExitTimeChange}
              required
            />
          </div>
        </div>

        {/* ✅ Net Amount */}
        <div className="form-group">
          <label htmlFor="net-amount">Net Amount</label>
          <input type="text" id="net-amount" name="net-amount" value={`$${netAmount.toFixed(2)}`} readOnly />
        </div>

        {/* ✅ If User Has a Card, Show Card Button */}
        {hasCard ? (
          <div className="card-container">
            <button className="card-btn">{`**** **** **** ${cardDetails.card_number.slice(-4)}`}</button>
            <button className="add-card-btn" onClick={handleAddNewCard}>
              Add New Card
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="card-number">Card Number</label>
              <input
                type="text"
                id="card-number"
                name="card-number"
                value={cardDetails.card_number}
                onChange={(e) =>
                  setCardDetails({ ...cardDetails, card_number: e.target.value })
                }
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="card-holder">Card Holder</label>
              <input
                type="text"
                id="card-holder"
                name="card-holder"
                value={cardDetails.card_holder}
                onChange={(e) =>
                  setCardDetails({ ...cardDetails, card_holder: e.target.value })
                }
                required
              />
            </div>

            <div className="form-group-row">
              <div className="form-group">
                <label htmlFor="cvv">CVV</label>
                <input
                  type="text"
                  id="cvv"
                  name="cvv"
                  value={cardDetails.cvv}
                  onChange={(e) =>
                    setCardDetails({ ...cardDetails, cvv: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="expiry-date">Expiry Date</label>
                <input
                  type="date"
                  id="expiry-date"
                  name="expiry-date"
                  value={cardDetails.expiry_date}
                  onChange={(e) =>
                    setCardDetails({ ...cardDetails, expiry_date: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <button className="confirm-btn" type="submit">
              Save Card
            </button>
          </form>
        )}

        {/* ✅ Show Error Messages */}
        {errorMessage && <p className="error-message">{errorMessage}</p>}
      </div>
    </>
  );
};

export default FormPay;
