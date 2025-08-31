// FormPay.jsx
import React, { useState, useEffect, useMemo } from "react";
import "./FormPay.css";
import { useNavigate, useLocation } from "react-router-dom";
import HeaderHome from "../HeaderHome/HeaderHome";
import axios from "axios";

const API = "http://127.0.0.1:5000";
const STRICT_CARD_VALIDATION = false;

const FormPay = () => {
  const navigate = useNavigate();
  const location = useLocation();

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
  const [locationName, setLocationName] = useState("Kiryon");

  // CVV modal
  const [showCvvModal, setShowCvvModal] = useState(false);
  const [cvvInput, setCvvInput] = useState("");

  // user
  const storedUser = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
  }, []);
  const [userId, setUserId] = useState(storedUser?.id || null);

  // cars & cards
  const [savedCars, setSavedCars] = useState([]);
  const [selectedCarId, setSelectedCarId] = useState(null);
  const [carNumberInput, setCarNumberInput] = useState(storedUser?.car_number || "");
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
    if (d.length >= 8) return d.replace(/(\d{3})(\d{2})(\d{0,3}).*/, "$1-$2-$3");
    if (d.length >= 7) return d.replace(/(\d{2})(\d{3})(\d{0,2}).*/, "$1-$2-$3");
    if (d.length >= 6) return d.replace(/(\d{2})(\d{2})(\d{0,2}).*/, "$1-$2-$3");
    return d;
  };
  const displayCar = (c) => {
    const n = String(c?.car_number || "");
    const only = n.replace(/\D/g, "");
    return only.length ? formatCarNumberForInput(only) : n;
  };
  const cardDigitsOnly = (s) => (s || "").replace(/\D/g, "");
  const formatCard4x4 = (s) => cardDigitsOnly(s).slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  const luhnValid = (num) => {
    const s = cardDigitsOnly(num);
    if (s.length < 13) return false;
    let sum = 0, dbl = false;
    for (let i = s.length - 1; i >= 0; i--) {
      let d = parseInt(s[i], 10);
      if (dbl) { d *= 2; if (d > 9) d -= 9; }
      sum += d; dbl = !dbl;
    }
    return sum % 10 === 0;
  };
  const monthNotPast = (yyyyMm) => {
    if (!yyyyMm) return false;
    const [y, m] = yyyyMm.split("-").map(Number);
    if (!y || !m) return false;
    const now = new Date(); const curY = now.getFullYear(); const curM = now.getMonth() + 1;
    return y > curY || (y === curY && m >= curM);
  };
  const normalizeExpiryForBackend = (yyyyMm) =>
    /^\d{4}-\d{2}$/.test(yyyyMm) ? `${yyyyMm}-01` : yyyyMm;
  const formatExpiryForDisplay = (v) => {
    if (!v) return "";
    if (/^\d{4}-\d{2}$/.test(v)) { const [y,m] = v.split("-"); return `${m}/${String(y).slice(-2)}`; }
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) { const [y,m] = v.split("-"); return `${m}/${String(y).slice(-2)}`; }
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

    axios.get(`${API}/get_user_details`, {
      params: { email: email || undefined, car_number: carOnlyDigits || undefined },
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
  const handleEntryTimeChange = (e) => { setEntryTime(e.target.value); calculateNetAmount(e.target.value, exitTime); };
  const handleExitTimeChange  = (e) => { setExitTime(e.target.value);   calculateNetAmount(entryTime, e.target.value); };

  // ===== save parking =====
  const handleSaveParking = () => {
    const num = normalizeCarNumber(carNumberInput);
    if (!(num.length >= 6 && num.length <= 8)) {
      return setErrorMessage("Please enter a valid car number (6–8 digits).");
    }
    if (!spotId) {
      return setErrorMessage("Please select a parking spot first.");
    }
    axios.post(`${API}/save_parking_record`, {
      car_number: num,
      entry_time: entryTime,
      exit_time: exitTime,
      amount: netAmount.toFixed(2),
      location: locationName,
      spot_id: spotId,
    })
    .then((response) => {
      alert(response.data.message || "Saved.");
      navigate("/history");
    })
    .catch((error) => {
      const msg = error.response?.data?.message || "Failed to save parking record.";
      setErrorMessage(msg);
      console.error("❌", error.response?.data || error.message);
    });
  };

  // ===== verify CVV then save =====
  const verifyCvvAndSave = () => {
    const num = normalizeCarNumber(carNumberInput);
    axios.post(`${API}/verify_cvv`, {
      car_number: num,
      card_number: cardDigitsOnly(cardDetails.card_number),
      cvv: cvvInput,
    })
    .then((res) => {
      if (res.data.success) { handleSaveParking(); }
      else { setErrorMessage("Invalid CVV."); }
    })
    .catch(() => setErrorMessage("CVV verification failed."))
    .finally(() => { setShowCvvModal(false); setCvvInput(""); });
  };

  const requireTimesThenOpenCvv = () => {
    if (!entryTime || !exitTime)
      return setErrorMessage("Please fill in both entry and exit times before proceeding.");
    setErrorMessage(""); setShowCvvModal(true);
  };

  // ===== add card (still needs car_number to attach the card to a specific car) =====
  const handleAddCard = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    const carNum = normalizeCarNumber(carNumberInput);
    if (!(carNum.length >= 6 && carNum.length <= 8)) return setErrorMessage("Car number must be 6–8 digits.");
    const digits = cardDigitsOnly(cardDetails.card_number);
    if (STRICT_CARD_VALIDATION && (!luhnValid(digits) || digits.length < 13)) return setErrorMessage("Card number is invalid.");
    if (digits.length < 13 || digits.length > 19) return setErrorMessage("Card number length must be 13–19 digits.");
    if (!monthNotPast(cardDetails.expiry_date)) return setErrorMessage("Expiry date is invalid or in the past.");
    if (!/^\d{3}$/.test(cardDetails.cvv || "")) return setErrorMessage("CVV must be 3 digits.");

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
      setCardDetails({ card_number: "", card_holder: "", cvv: "", expiry_date: "" });
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
    <div className="payPage">
      <HeaderHome />
      <div className="formPay">
        <h1>Basic Pass</h1>

        {/* Selected spot */}
        <div className="form-group">
          <label>Selected Spot</label>
          <input type="text" value={spotId ?? ""} readOnly placeholder="No spot selected" disabled />
        </div>

        {/* My Cars */}
        {savedCars.length > 0 && (
          <div className="saved-wrap">
            <h3 className="saved-title">My Cars</h3>
            <div className="saved-list scroll-y" role="listbox" aria-label="Saved cars">
              {savedCars.map((c) => {
                const isSelected = selectedCarId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    className={`saved-item ${isSelected ? "selected" : ""}`}
                    title={`${displayCar(c)} • ${c.car_type || ""} • ${c.car_year || ""}`}
                    onClick={() => handleChooseSavedCar(c)}
                  >
                    <div className="saved-item-top">{displayCar(c)}</div>
                    <div className="saved-item-sub">
                      {c.car_type || "—"} {c.car_year ? `• ${c.car_year}` : ""}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Times */}
        <div className="form-group-row">
          <div className="form-group">
            <label htmlFor="entry-time">Entry Time</label>
            <input type="datetime-local" id="entry-time" value={entryTime} onChange={handleEntryTimeChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="exit-time">Exit Time</label>
            <input type="datetime-local" id="exit-time" value={exitTime} onChange={handleExitTimeChange} required />
          </div>
        </div>

        <div className="form-group">
          <label>Net Amount</label>
          <input type="text" value={`₪${netAmount.toFixed(2)}`} readOnly />
        </div>

        {/* Cards (for USER) */}
        {hasCard ? (
          <>
            <h3 className="saved-title">Your Saved Cards</h3>
            <div className="card-container scroll-y">
              {cardList.map((card, idx) => (
                <button
                  key={idx}
                  className="card-btn"
                  onClick={() => {
                    setCardDetails({ ...card, card_number: formatCard4x4(card.card_number) });
                    if (!entryTime || !exitTime) {
                      setErrorMessage("Please fill in both entry and exit times before proceeding.");
                      return;
                    }
                    setShowCvvModal(true);
                  }}
                  title={`**** **** **** ${String(card.card_number).slice(-4)}${
                    card.expiry_date ? ` • ${formatExpiryForDisplay(card.expiry_date)}` : ""
                  }`}
                >
                  {`**** **** **** ${String(card.card_number).slice(-4)}`}
                  {card.expiry_date && (
                    <small style={{ display: "block" }}>
                      {formatExpiryForDisplay(card.expiry_date)}
                    </small>
                  )}
                </button>
              ))}

              <button
                className="add-card-btn"
                onClick={() => {
                  setHasCard(false);
                  setCardDetails({ card_number: "", card_holder: "", cvv: "", expiry_date: "" });
                }}
              >
                Add New Card
              </button>
            </div>
          </>
        ) : (
          // Add new card form
          <form className="card-form" onSubmit={handleAddCard}>
            <div className="form-group">
              <label htmlFor="card_number">Card Number</label>
              <input
                type="text" id="card_number" name="card_number" inputMode="numeric"
                value={formatCard4x4(cardDetails.card_number)}
                onChange={(e) => setCardDetails((p) => ({ ...p, card_number: e.target.value }))}
                placeholder="1234 5678 9012 3456" required
              />
            </div>
            <div className="form-group">
              <label htmlFor="card_holder">Card Holder</label>
              <input
                type="text" id="card_holder" name="card_holder"
                value={cardDetails.card_holder}
                onChange={(e) => setCardDetails((p) => ({ ...p, card_holder: e.target.value }))}
                placeholder="JOHN DOE" required
              />
            </div>
            <div className="form-group">
              <label htmlFor="expiry_date">Expiry Date</label>
              <input
                type="month" id="expiry_date" name="expiry_date" value={cardDetails.expiry_date}
                onChange={(e) => {
                  const val = e.target.value;
                  setCardDetails((p) => ({ ...p, expiry_date: val }));
                  setExpiryError(monthNotPast(val) ? "" : "Expiry date must not be in the past.");
                }}
                min={new Date().toISOString().slice(0, 7)} required
              />
              {expiryError && <p className="error-message">{expiryError}</p>}
            </div>
            <div className="form-group">
              <label htmlFor="cvv">CVV</label>
              <input
                type="password" id="cvv" name="cvv" value={cardDetails.cvv}
                onChange={(e) => setCardDetails((p) => ({ ...p, cvv: e.target.value.replace(/\D/g, "").slice(0,3) }))}
                placeholder="3 digits" required
              />
            </div>
            <button type="submit" className="save-card-btn" disabled={!normalizeCarNumber(carNumberInput)}>
              Save Card for Selected Car
            </button>
          </form>
        )}

        {/* Pay */}
        {hasCard && (
          <button className="confirm-btn" onClick={requireTimesThenOpenCvv}>
            Pay & Save Parking
          </button>
        )}

        {/* CVV Modal */}
        {showCvvModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Enter CVV to Confirm</h3>
              <input
                type="password" maxLength={3} value={cvvInput}
                onChange={(e) => setCvvInput(e.target.value.replace(/\D/g, "").slice(0,3))}
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
