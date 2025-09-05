// FormPay.jsx
import React, { useState, useEffect, useMemo } from "react";
import "./FormPay.css";
import { useNavigate, useLocation } from "react-router-dom";
import HeaderHome from "../HeaderHome/HeaderHome";
import axios from "axios";
import Popup from "../Popup/Popup"; // תעדכן נתיב לפי התיקיות שלך

const API = "http://127.0.0.1:5000";
const STRICT_CARD_VALIDATION = false;

const FormPay = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [popupMessage, setPopupMessage] = useState("");

  // ---- spotId ----
  const incomingSpotId = location?.state?.spotId ?? null;
  const [spotId, setSpotId] = useState(() => {
    const fromLS = Number(localStorage.getItem("active_spot_id") || "") || null;
    return incomingSpotId ?? fromLS;
  });
  useEffect(() => {
    if (incomingSpotId != null) {
      setSpotId(incomingSpotId);
      localStorage.setItem("active_spot_id", String(incomingSpotId));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingSpotId]);

  // times & price
  const [entryTime, setEntryTime] = useState("");
  const [exitTime, setExitTime] = useState("");
  const [netAmount, setNetAmount] = useState(0);

  // ui/errors
  const [errorMessage, setErrorMessage] = useState("");
  const [expiryError, setExpiryError] = useState("");
  const [locationName] = useState("Kiryon");

  // CVV modal
  const [showCvvModal, setShowCvvModal] = useState(false);
  const [cvvInput, setCvvInput] = useState("");

  // user
  const storedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);
  const [userId, setUserId] = useState(storedUser?.id || null);

  // cars & cards
  const [savedCars, setSavedCars] = useState([]);
  const [selectedCarId, setSelectedCarId] = useState(null);
  const [carNumberInput, setCarNumberInput] = useState(
    storedUser?.car_number || ""
  );
  const [hasCard, setHasCard] = useState(false);
  const [cardList, setCardList] = useState([]);
  const [cardDetails, setCardDetails] = useState({
    card_number: "",
    card_holder: "",
    cvv: "",
    expiry_date: "",
  });

  // ===== helpers =====
  const normalizeCarNumber = (s) => (s || "").replace(/\D/g, "").slice(0, 8);
  const formatCarNumberForInput = (val) => {
    const d = normalizeCarNumber(val);
    if (d.length >= 8)
      return d.replace(/(\d{3})(\d{2})(\d{0,3}).*/, "$1-$2-$3");
    if (d.length >= 7)
      return d.replace(/(\d{2})(\d{3})(\d{0,2}).*/, "$1-$2-$3");
    if (d.length >= 6)
      return d.replace(/(\d{2})(\d{2})(\d{0,2}).*/, "$1-$2-$3");
    return d;
  };
  const displayCar = (c) => {
    const n = String(c?.car_number || "");
    const only = n.replace(/\D/g, "");
    return only.length ? formatCarNumberForInput(only) : n;
  };
  const cardDigitsOnly = (s) => (s || "").replace(/\D/g, "");
  const formatCard4x4 = (s) =>
    cardDigitsOnly(s)
      .slice(0, 16)
      .replace(/(.{4})/g, "$1 ")
      .trim();
  const luhnValid = (num) => {
    const s = cardDigitsOnly(num);
    if (s.length < 13) return false;
    let sum = 0,
      dbl = false;
    for (let i = s.length - 1; i >= 0; i--) {
      let d = parseInt(s[i], 10);
      if (dbl) {
        d *= 2;
        if (d > 9) d -= 9;
      }
      sum += d;
      dbl = !dbl;
    }
    return sum % 10 === 0;
  };
  const monthNotPast = (yyyyMm) => {
    if (!yyyyMm) return false;
    const [y, m] = yyyyMm.split("-").map(Number);
    if (!y || !m) return false;
    const now = new Date();
    const curY = now.getFullYear();
    const curM = now.getMonth() + 1;
    return y > curY || (y === curY && m >= curM);
  };
  const normalizeExpiryForBackend = (yyyyMm) =>
    /^\d{4}-\d{2}$/.test(yyyyMm) ? `${yyyyMm}-01` : yyyyMm;
  const formatExpiryForDisplay = (v) => {
    if (!v) return "";
    if (/^\d{4}-\d{2}$/.test(v)) {
      const [y, m] = v.split("-");
      return `${m}/${String(y).slice(-2)}`;
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
      const [y, m] = v.split("-");
      return `${m}/${String(y).slice(-2)}`;
    }
    if (/^\d{2}\/\d{2}$/.test(v)) return v;
    return v;
  };

  // ===== API loaders (USER-CENTRIC) =====
  const loadCardsForUser = async (uid) => {
    if (!uid) return;
    try {
      const { data } = await axios.get(`${API}/users/${uid}/cards`);
      const cards = data.cards || [];
      setCardList(cards);
      setHasCard(cards.length > 0);
    } catch (err) {
      console.error("Failed to load cards:", err);
      setCardList([]);
      setHasCard(false);
    }
  };

  const loadSavedCars = async (uid) => {
    if (!uid) return;
    try {
      const { data } = await axios.get(`${API}/users/${uid}/cars`);
      const cars = data?.cars || [];
      setSavedCars(cars);

      if (!selectedCarId && cars.length > 0) {
        const first = cars[0];
        setSelectedCarId(first.id);
        setCarNumberInput(displayCar(first));
        // טוענים כרטיסים תמיד לפי USER
        loadCardsForUser(uid);
      }
    } catch (err) {
      console.error("Error loading cars:", err);
      setSavedCars([]);
    }
  };

  // bootstrap by userId; else try to resolve it
  useEffect(() => {
    if (userId) {
      loadSavedCars(userId);
      loadCardsForUser(userId);
      return;
    }
    // try resolve user by email or car_number (backward compat)
    const email = storedUser?.email || "";
    const carOnlyDigits = (storedUser?.car_number || "").replace(/\D/g, "");
    if (!email && !carOnlyDigits) return;

    axios
      .get(`${API}/get_user_details`, {
        params: {
          email: email || undefined,
          car_number: carOnlyDigits || undefined,
        },
      })
      .then((res) => {
        const u = res.data?.user;
        if (u?.id) {
          setUserId(u.id);
          loadSavedCars(u.id);
          loadCardsForUser(u.id);
        }
      })
      .catch((err) => console.error("Error getting user details:", err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // keep selected car in localStorage (no card loading by car!)
  const setActiveCarLS = (raw) => {
    const digits = (raw || "").replace(/\D/g, "");
    if (digits) localStorage.setItem("active_car_number", digits);
  };
  const getActiveCarLS = () =>
    (localStorage.getItem("active_car_number") || "").replace(/\D/g, "");
  useEffect(() => {
    const active = getActiveCarLS();
    if (active && !carNumberInput) {
      setCarNumberInput(formatCarNumberForInput(active));
      // אין יותר טעינת כרטיסים לפי רכב כאן
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== price calc =====
  const calculateNetAmount = (entry, exit) => {
    if (entry && exit) {
      const entryDate = new Date(entry);
      const exitDate = new Date(exit);
      if (exitDate <= entryDate) {
        setErrorMessage("Exit time must be later than entry time.");
        setNetAmount(0);
        return;
      }
      setErrorMessage("");
      const timeDiffHrs = (exitDate - entryDate) / (1000 * 60 * 60);
      setNetAmount(timeDiffHrs > 0 ? timeDiffHrs * 3 : 0);
    }
  };
  const handleEntryTimeChange = (e) => {
    setEntryTime(e.target.value);
    calculateNetAmount(e.target.value, exitTime);
  };
  const handleExitTimeChange = (e) => {
    setExitTime(e.target.value);
    calculateNetAmount(entryTime, e.target.value);
  };

  // ===== save parking =====
  const handleSaveParking = () => {
    const num = normalizeCarNumber(carNumberInput);
    if (!(num.length >= 6 && num.length <= 8)) {
      return setErrorMessage("Please enter a valid car number (6–8 digits).");
    }
    if (!spotId) {
      return setErrorMessage("Please select a parking spot first.");
    }
    axios
      .post(`${API}/save_parking_record`, {
        car_number: num,
        entry_time: entryTime,
        exit_time: exitTime,
        amount: netAmount.toFixed(2),
        location: locationName,
        spot_id: spotId,
      })
      .then((response) => {
        setPopupMessage(response.data.message || "Saved.");
        setTimeout(() => navigate("/history"), 1500); // אחרי 1.5 שניות מעבר להיסטוריה
      })
      .catch((error) => {
        const msg =
          error.response?.data?.message || "Failed to save parking record.";
        setErrorMessage(msg);
        console.error("❌", error.response?.data || error.message);
      });
  };

  // ===== verify CVV then save =====
  const verifyCvvAndSave = () => {
    const num = normalizeCarNumber(carNumberInput);
    axios
      .post(`${API}/verify_cvv`, {
        car_number: num,
        card_number: cardDigitsOnly(cardDetails.card_number),
        cvv: cvvInput,
      })
      .then((res) => {
        if (res.data.success) {
          handleSaveParking();
        } else {
          setErrorMessage("Invalid CVV.");
        }
      })
      .catch(() => setErrorMessage("CVV verification failed."))
      .finally(() => {
        setShowCvvModal(false);
        setCvvInput("");
      });
  };

  const requireTimesThenOpenCvv = () => {
    if (!entryTime || !exitTime)
      return setErrorMessage(
        "Please fill in both entry and exit times before proceeding."
      );
    setErrorMessage("");
    setShowCvvModal(true);
  };

  // ===== add card (still needs car_number to attach the card to a specific car) =====
  const handleAddCard = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    const carNum = normalizeCarNumber(carNumberInput);
    if (!(carNum.length >= 6 && carNum.length <= 8))
      return setErrorMessage("Car number must be 6–8 digits.");
    const digits = cardDigitsOnly(cardDetails.card_number);
    if (STRICT_CARD_VALIDATION && (!luhnValid(digits) || digits.length < 13))
      return setErrorMessage("Card number is invalid.");
    if (digits.length < 13 || digits.length > 19)
      return setErrorMessage("Card number length must be 13–19 digits.");
    if (!monthNotPast(cardDetails.expiry_date))
      return setErrorMessage("Expiry date is invalid or in the past.");
    if (!/^\d{3}$/.test(cardDetails.cvv || ""))
      return setErrorMessage("CVV must be 3 digits.");

    try {
      await axios.post(`${API}/add_card`, {
        car_number: carNum,
        card_number: digits,
        card_holder: cardDetails.card_holder.trim(),
        cvv: cardDetails.cvv,
        expiry_date: normalizeExpiryForBackend(cardDetails.expiry_date),
      });
      alert("Card added successfully.");
      setHasCard(true);
      setCardDetails({
        card_number: "",
        card_holder: "",
        cvv: "",
        expiry_date: "",
      });
      // טוענים מחדש לפי USER
      loadCardsForUser(userId);
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to add card.";
      setErrorMessage(msg);
    }
  };

  // ===== choose car (does NOT reload cards by car) =====
  const handleChooseSavedCar = (c) => {
    setSelectedCarId(c.id);
    const formatted = displayCar(c);
    setCarNumberInput(formatted);
    setActiveCarLS(formatted); // רק שומר בחירה
    // לא טוען כרטיסים לפי רכב — ממשיכים להציג כל כרטיסי המשתמש
  };

  return (
    <div className="payment-page">
      <HeaderHome />
      
      {/* Hero Section */}
      <div className="payment-hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Complete Your
            <span className="gradient-text"> Parking Payment</span>
          </h1>
          <p className="hero-subtitle">
            Secure and fast payment processing for your parking session
          </p>
        </div>
      </div>

      <div className="payment-container">
        <div className="payment-form">
          <div className="form-header">
            <h2>Payment Details</h2>
            <div className="form-progress">
              <div className="progress-step active">
                <span className="step-number">1</span>
                <span className="step-label">Details</span>
              </div>
              <div className="progress-line"></div>
              <div className="progress-step">
                <span className="step-number">2</span>
                <span className="step-label">Payment</span>
              </div>
              <div className="progress-line"></div>
              <div className="progress-step">
                <span className="step-number">3</span>
                <span className="step-label">Confirm</span>
              </div>
            </div>
          </div>

          {/* Selected Spot Section */}
          <div className="form-section">
            <div className="section-header">
              <h3>Selected Parking Spot</h3>
              <div className="spot-indicator">
                <span className="spot-icon">🅿️</span>
                <span className="spot-text">Spot #{spotId || "Not Selected"}</span>
              </div>
            </div>
          </div>

          {/* Vehicle Selection Section */}
          {savedCars.length > 0 && (
            <div className="form-section">
              <div className="section-header">
                <h3>Select Your Vehicle</h3>
                <p className="section-description">Choose from your saved vehicles</p>
              </div>
              <div className="vehicle-grid">
                {savedCars.map((c) => {
                  const isSelected = selectedCarId === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      className={`vehicle-card ${isSelected ? "selected" : ""}`}
                      onClick={() => handleChooseSavedCar(c)}
                    >
                      <div className="vehicle-icon">🚗</div>
                      <div className="vehicle-info">
                        <div className="vehicle-number">{displayCar(c)}</div>
                        <div className="vehicle-details">
                          {c.car_type || "Unknown"} • {c.car_year || "—"}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="selected-indicator">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M20 6L9 17l-5-5"/>
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Time Selection Section */}
          <div className="form-section">
            <div className="section-header">
              <h3>Parking Duration</h3>
              <p className="section-description">Set your entry and exit times</p>
            </div>
            <div className="time-inputs">
              <div className="time-input-group">
                <label htmlFor="entry-time" className="time-label">
                  <span className="label-icon">🕐</span>
                  Entry Time
                </label>
                <input
                  type="datetime-local"
                  id="entry-time"
                  value={entryTime}
                  onChange={handleEntryTimeChange}
                  className="time-input"
                  required
                />
              </div>
              <div className="time-separator">
                <div className="separator-line"></div>
                <span className="separator-text">to</span>
                <div className="separator-line"></div>
              </div>
              <div className="time-input-group">
                <label htmlFor="exit-time" className="time-label">
                  <span className="label-icon">🕕</span>
                  Exit Time
                </label>
                <input
                  type="datetime-local"
                  id="exit-time"
                  value={exitTime}
                  onChange={handleExitTimeChange}
                  className="time-input"
                  required
                />
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="form-section">
            <div className="section-header">
              <h3>Payment Summary</h3>
            </div>
            <div className="payment-summary">
              <div className="summary-row">
                <span className="summary-label">Parking Duration</span>
                <span className="summary-value">
                  {entryTime && exitTime ? 
                    `${Math.round((new Date(exitTime) - new Date(entryTime)) / (1000 * 60 * 60) * 10) / 10} hours` : 
                    "—"
                  }
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Rate per hour</span>
                <span className="summary-value">₪3.00</span>
              </div>
              <div className="summary-divider"></div>
              <div className="summary-row total">
                <span className="summary-label">Total Amount</span>
                <span className="summary-value total-amount">₪{netAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Method Section */}
          <div className="form-section">
            <div className="section-header">
              <h3>Payment Method</h3>
              <p className="section-description">Choose your preferred payment method</p>
            </div>
            
            {hasCard ? (
              <div className="payment-methods">
                <div className="saved-cards">
                  <h4 className="cards-title">Your Saved Cards</h4>
                  <div className="cards-grid">
                    {cardList.map((card, idx) => (
                      <button
                        key={idx}
                        className="saved-card"
                        onClick={() => {
                          setCardDetails({
                            ...card,
                            card_number: formatCard4x4(card.card_number),
                          });
                          if (!entryTime || !exitTime) {
                            setErrorMessage(
                              "Please fill in both entry and exit times before proceeding."
                            );
                            return;
                          }
                          setShowCvvModal(true);
                        }}
                      >
                        <div className="card-icon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                            <line x1="1" y1="10" x2="23" y2="10"/>
                          </svg>
                        </div>
                        <div className="card-info">
                          <div className="card-number">
                            **** **** **** {String(card.card_number).slice(-4)}
                          </div>
                          {card.expiry_date && (
                            <div className="card-expiry">
                              {formatExpiryForDisplay(card.expiry_date)}
                            </div>
                          )}
                        </div>
                        <div className="card-arrow">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M9 18l6-6-6-6"/>
                          </svg>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  className="add-card-button"
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
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Add New Card
                </button>
              </div>
            ) : (
              // Add new card form
              <div className="new-card-form">
                <h4 className="form-title">Add New Payment Card</h4>
                <form className="card-form" onSubmit={handleAddCard}>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="card_number" className="form-label">
                        <span className="label-icon">💳</span>
                        Card Number
                      </label>
                      <input
                        type="text"
                        id="card_number"
                        name="card_number"
                        inputMode="numeric"
                        value={formatCard4x4(cardDetails.card_number)}
                        onChange={(e) =>
                          setCardDetails((p) => ({ ...p, card_number: e.target.value }))
                        }
                        placeholder="1234 5678 9012 3456"
                        className="form-input"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="card_holder" className="form-label">
                        <span className="label-icon">👤</span>
                        Card Holder Name
                      </label>
                      <input
                        type="text"
                        id="card_holder"
                        name="card_holder"
                        value={cardDetails.card_holder}
                        onChange={(e) =>
                          setCardDetails((p) => ({
                            ...p,
                            card_holder: e.target.value.toUpperCase(),
                          }))
                        }
                        placeholder="JOHN DOE"
                        className="form-input"
                        style={{ textTransform: "uppercase" }}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="expiry_date" className="form-label">
                        <span className="label-icon">📅</span>
                        Expiry Date
                      </label>
                      <input
                        type="month"
                        id="expiry_date"
                        name="expiry_date"
                        value={cardDetails.expiry_date}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCardDetails((p) => ({ ...p, expiry_date: val }));
                          setExpiryError(
                            monthNotPast(val)
                              ? ""
                              : "Expiry date must not be in the past."
                          );
                        }}
                        min={new Date().toISOString().slice(0, 7)}
                        className="form-input"
                        required
                      />
                      {expiryError && <p className="error-message">{expiryError}</p>}
                    </div>
                    <div className="form-group">
                      <label htmlFor="cvv" className="form-label">
                        <span className="label-icon">🔒</span>
                        CVV
                      </label>
                      <input
                        type="password"
                        id="cvv"
                        name="cvv"
                        value={cardDetails.cvv}
                        onChange={(e) =>
                          setCardDetails((p) => ({
                            ...p,
                            cvv: e.target.value.replace(/\D/g, "").slice(0, 3),
                          }))
                        }
                        placeholder="123"
                        className="form-input"
                        required
                      />
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    className="save-card-button"
                    disabled={!normalizeCarNumber(carNumberInput)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
                      <polyline points="17,21 17,13 7,13 7,21"/>
                      <polyline points="7,3 7,8 15,8"/>
                    </svg>
                    Save Card
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Payment Action */}
          {hasCard && (
            <div className="payment-action">
              <button className="pay-button" onClick={requireTimesThenOpenCvv}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
                </svg>
                Complete Payment
                <span className="pay-amount">₪{netAmount.toFixed(2)}</span>
              </button>
            </div>
          )}

          {/* CVV Modal */}
          {showCvvModal && (
            <div className="modal-overlay">
              <div className="modal-content">
                <div className="modal-header">
                  <h3>Security Verification</h3>
                  <p>Enter your CVV to complete the payment</p>
                </div>
                <div className="modal-body">
                  <div className="cvv-input-group">
                    <label htmlFor="cvv-input" className="cvv-label">
                      <span className="label-icon">🔒</span>
                      CVV Code
                    </label>
                    <input
                      id="cvv-input"
                      type="password"
                      maxLength={3}
                      value={cvvInput}
                      onChange={(e) =>
                        setCvvInput(e.target.value.replace(/\D/g, "").slice(0, 3))
                      }
                      placeholder="•••"
                      className="cvv-input"
                    />
                  </div>
                </div>
                <div className="modal-actions">
                  <button 
                    className="modal-button secondary" 
                    onClick={() => setShowCvvModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    className="modal-button primary" 
                    onClick={verifyCvvAndSave}
                    disabled={cvvInput.length !== 3}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M20 6L9 17l-5-5"/>
                    </svg>
                    Confirm Payment
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="error-notification">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      </div>
      <Popup message={popupMessage} onClose={() => setPopupMessage("")} />
    </div>
  );
};

export default FormPay;
