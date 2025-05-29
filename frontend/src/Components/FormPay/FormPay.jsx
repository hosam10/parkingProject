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

  // const handleSubmit = (e) => {
  //   e.preventDefault();
  //   setErrorMessage("");

  //   if (!/^\d{16}$/.test(cardDetails.card_number)) {
  //     setErrorMessage("Card number must contain exactly 16 digits.");
  //     return;
  //   }

  //   if (!/^\d{3}$/.test(cardDetails.cvv)) {
  //     setErrorMessage("CVV must contain exactly 3 digits.");
  //     return;
  //   }

  //   const expiryDate = new Date(cardDetails.expiry_date);
  //   const today = new Date();
  //   if (expiryDate < today) {
  //     setErrorMessage("Card expiry date must be in the future.");
  //     return;
  //   }

  //   axios
  //     .post("http://127.0.0.1:5000/update_card_details", {
  //       car_number: carNumber,
  //       card_number: cardDetails.card_number,
  //       card_holder: cardDetails.card_holder,
  //       cvv: cardDetails.cvv,
  //       expiry_date: cardDetails.expiry_date,
  //     })
  //     .then((response) => {
  //       alert(response.data.message);
  //       axios
  //         .get(`http://127.0.0.1:5000/get_card_details?car_number=${carNumber}`)
  //         .then((response) => {
  //           if (response.data.card) {
  //             setCardDetails(response.data.card);
  //             setHasCard(true);
  //           }
  //         });
  //     })
  //     .catch(() => {
  //       setErrorMessage("Error saving card details.");
  //     });
  // };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage(""); // Clear previous errors
  
    // ✅ Validate Card Number
    if (!/^\d{16}$/.test(cardDetails.card_number)) {
      setErrorMessage("Card number must contain exactly 16 digits.");
      return;
    }
  
    // ✅ Validate CVV
    if (!/^\d{3}$/.test(cardDetails.cvv)) {
      setErrorMessage("CVV must contain exactly 3 digits.");
      return;
    }
  
    // ✅ Validate Expiry Date
    const expiryDate = new Date(cardDetails.expiry_date);
    const today = new Date();
    if (expiryDate < today) {
      setErrorMessage("Card expiry date must be in the future.");
      return;
    }
  
    // ✅ Send Card Data
    axios
      .post("http://127.0.0.1:5000/update_card_details", {
        car_number: carNumber,
        card_number: cardDetails.card_number,
        card_holder: cardDetails.card_holder,
        cvv: cardDetails.cvv,
        expiry_date: cardDetails.expiry_date,
      })
      .then((response) => {
        alert("Card saved: " + response.data.message);
  
        // ✅ After saving card, save the parking record
        return axios.post("http://127.0.0.1:5000/save_parking_record", {
          car_number: carNumber,
          entry_time: entryTime,
          exit_time: exitTime,
          amount: netAmount.toFixed(2),
          location: location,
        });
      })
      .then((res) => {
        alert("Parking record saved: " + res.data.message);
        navigate("/home");
      })
      .catch((err) => {
        console.error("❌ Error:", err);
        setErrorMessage("Error saving card or parking data.");
      });
  };
  
  const handleAddNewCard = () => {
    setHasCard(false);
    setCardDetails({
      card_number: "",
      card_holder: "",
      cvv: "",
      expiry_date: "",
    });
  };

  const handleExpiryChange = (e) => {
    const value = e.target.value;
    const today = new Date().toISOString().split("T")[0];
    if (value < today) {
      setExpiryError("Expiry date cannot be in the past.");
    } else {
      setExpiryError("");
      setCardDetails({ ...cardDetails, expiry_date: value });
    }
  };

  return (
    <>
      <HeaderHome />
      <div className="formPay">
        <h1>Basic Pass</h1>

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

        <div className="form-group">
          <label htmlFor="net-amount">Net Amount</label>
          <input
            type="text"
            id="net-amount"
            name="net-amount"
            value={`$${netAmount.toFixed(2)}`}
            readOnly
          />
        </div>

        {hasCard ? (
          <div className="card-container">
            <button
              className="card-btn"
              onClick={() => {
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
              }}
            >
              {`**** **** **** ${cardDetails.card_number.slice(-4)}`}
            </button>

            <button className="add-card-btn" onClick={handleAddNewCard}>
              Add New Card
            </button>
          </div>
        ) : entryTime && exitTime ? (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="card-number">Card Number</label>
              <input
                type="text"
                id="card-number"
                name="card-number"
                value={cardDetails.card_number}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^\d{0,16}$/.test(value)) {
                    setCardDetails({ ...cardDetails, card_number: value });
                  }
                }}
                maxLength={16}
                inputMode="numeric"
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
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^\d{0,3}$/.test(value)) {
                      setCardDetails({ ...cardDetails, cvv: value });
                    }
                  }}
                  maxLength={3}
                  inputMode="numeric"
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
                  min={new Date().toISOString().split("T")[0]}
                  onChange={handleExpiryChange}
                  required
                />
                {expiryError && (
                  <p
                    className="error-message"
                    style={{ color: "red", fontSize: "14px" }}
                  >
                    {expiryError}
                  </p>
                )}
              </div>
            </div>

            <button className="confirm-btn" type="submit">
              Save Card
            </button>
          </form>
        ) : (
          <p style={{ color: "gray", fontSize: "15px" }}>
            Please select entry and exit time before adding card details.
          </p>
        )}

        {errorMessage && <p className="error-message">{errorMessage}</p>}
      </div>
    </>
  );
};

export default FormPay;
