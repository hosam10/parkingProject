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
  const [cards, setCards] = useState([]);
  const [cardList, setCardList] = useState([]);

  const [cardDetails, setCardDetails] = useState({
    card_number: "",
    card_holder: "",
    cvv: "",
    expiry_date: "",
  });

  const [hasCard, setHasCard] = useState(false);
  const carNumber = JSON.parse(localStorage.getItem("user"))?.car_number;

  useEffect(() => {
    const carNumber = JSON.parse(localStorage.getItem("user"))?.car_number;
    if (!carNumber) {
      setErrorMessage("User is not logged in.");
      return;
    }

    axios
      .get(`http://127.0.0.1:5000/get_card_details?car_number=${carNumber}`)
      .then((response) => {
        if (response.data.cards?.length > 0) {
          setCardList(response.data.cards); // ⬅️ נשמור את כל הכרטיסים
          setHasCard(true);
        } else {
          setHasCard(false);
        }
      })
      .catch(() => {
        setErrorMessage("Error fetching card details.");
      });
  }, []);

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
        navigate("/history");
      })
      .catch((error) => {
        const msg =
          error.response?.data?.message || "Failed to save parking record.";
        setErrorMessage(msg);
        console.error("❌", error.response?.data || error.message);
      });
  };

  const verifyCvvAndSave = () => {
    axios
      .post("http://127.0.0.1:5000/verify_cvv", {
        car_number: carNumber,
        card_number: cardDetails.card_number,
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
    if (!entryTime || !exitTime) {
      setErrorMessage(
        "Please fill in both entry and exit times before proceeding."
      );
      return;
    }

    setErrorMessage("");
    setShowCvvModal(true);
  };

  const handleCardInputChange = (e) => {
    const { name, value } = e.target;
    setCardDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddCard = (e) => {
    e.preventDefault(); // מונע ריענון של העמוד

    axios
      .post("http://127.0.0.1:5000/add_card", {
        car_number: carNumber,
        ...cardDetails,
      })
      .then((response) => {
        alert(response.data.message || "Card added successfully.");
        setHasCard(true);
      })
      .catch(() => {
        setErrorMessage("Failed to add card.");
      });
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
          <input type="text" value={`₪${netAmount.toFixed(2)}`} readOnly />
        </div>

        {hasCard ? (
          <div className="card-container">
            {cardList.map((card, index) => (
              <button
                key={index}
                className="card-btn"
                onClick={() => {
                  setCardDetails(card);
                  setShowCvvModal(true);
                }}
              >
                {`**** **** **** ${card.card_number.slice(-4)}`}
              </button>
            ))}
            <button
              className="add-card-btn"
              onClick={() => {
                setHasCard(false);
                setCardDetails({
                  card_number: "",
                  card_holder: "",
                  cvv: "",
                  expiry_date: "",
                });
              }}
            >
              Add New Card
            </button>
          </div>
        ) : (
          <form className="card-form" onSubmit={handleAddCard}>
            <div className="form-group">
              <label htmlFor="card_number">Card Number</label>
              <input
                type="number"
                id="card_number"
                name="card_number"
                value={cardDetails.card_number}
                onChange={handleCardInputChange}
                maxLength={16}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="card_holder">Card Holder</label>
              <input
                type="text"
                id="card_holder"
                name="card_holder"
                value={cardDetails.card_holder}
                onChange={handleCardInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="expiry_date">Expiry Date</label>
              <input
                type="date"
                id="expiry_date"
                name="expiry_date"
                placeholder="MM/YY"
                value={cardDetails.expiry_date}
                onChange={handleCardInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="cvv">CVV</label>
              <input
                type="password"
                id="cvv"
                name="cvv"
                value={cardDetails.cvv}
                onChange={handleCardInputChange}
                maxLength={3}
                required
              />
            </div>
            <button type="submit" className="save-card-btn">
              Save Card
            </button>
          </form>
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
