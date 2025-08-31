// PersonalDetails.js (מתוקן, סופי)
import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Modal from "react-modal";
import "./PersonalDetails.css";
import HeaderHome from "../HeaderHome/HeaderHome";
import personalDetails from "../images/personalDetails.gif";

Modal.setAppElement("#root");

const API = "http://127.0.0.1:5000";
const MIN_YEAR = 1990;
const MAX_YEAR = 2025;

// ------ עזר לפורמט לוחית ------
const normalizeCarNumber = (s) => (s || "").replace(/\D/g, "").slice(0, 8);
const formatCarNumberInput = (val) => {
  const d = normalizeCarNumber(val);
  if (d.length >= 8) return d.replace(/(\d{3})(\d{2})(\d{0,3}).*/, "$1-$2-$3"); // 123-45-678
  if (d.length >= 7) return d.replace(/(\d{2})(\d{3})(\d{0,2}).*/, "$1-$2-$3"); // 12-456-67
  if (d.length >= 6) return d.replace(/(\d{2})(\d{2})(\d{0,2}).*/, "$1-$2-$3"); // 12-34-56
  return d;
};

export default function PersonalDetails() {
  // --- משתמש מלוקאל ---
  const storedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const [userDetails, setUserDetails] = useState(null);
  const [ownerId, setOwnerId] = useState(storedUser?.id || null);
  const [errorMessage, setErrorMessage] = useState("");

  // --- אימות מייל ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  // --- רכבים ---
  const [cars, setCars] = useState([]);
  const [carNumberNew, setCarNumberNew] = useState("");
  const [carTypeNew, setCarTypeNew] = useState("");
  const [carYearNew, setCarYearNew] = useState("");
  const [carsError, setCarsError] = useState("");

  const CAR_BRANDS = [
    "Toyota",
    "Volkswagen",
    "Hyundai",
    "Kia",
    "Honda",
    "Nissan",
    "Ford",
    "Chevrolet",
    "Tesla",
    "BMW",
    "Mercedes-Benz",
    "Audi",
    "Lexus",
    "Porsche",
    "Mazda",
    "Subaru",
    "Mitsubishi",
    "Suzuki",
    "Volvo",
    "Skoda",
    "Seat",
    "Cupra",
    "Renault",
    "Peugeot",
    "Citroën",
    "Dacia",
    "Opel",
    "Fiat",
    "Alfa Romeo",
    "Jeep",
    "Dodge",
    "RAM",
    "GMC",
    "Cadillac",
    "Mini",
    "Land Rover",
    "Jaguar",
    "Infiniti",
    "Acura",
    "BYD",
    "Geely",
    "MG",
    "Chery",
    "Haval",
    "Great Wall",
    "SAIC Maxus",
    "Tata",
    "Mahindra",
  ];

  // ----- טעינת פרטי המשתמש -----
  const localCarNumber = storedUser?.car_number;
  useEffect(() => {
    if (!localCarNumber && !storedUser?.email) {
      setErrorMessage("User is not logged in or identifiers are missing.");
      return;
    }
    axios
      .get(`${API}/get_user_details`, {
        params: {
          car_number: localCarNumber || undefined,
          email: storedUser?.email || undefined,
        },
      })
      .then((res) => {
        const u = res.data.user || {};
        setUserDetails(u);
        if (!ownerId && u?.id) setOwnerId(u.id);
      })
      .catch(() => setErrorMessage("Error fetching user details"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localCarNumber]);

  // ----- טעינת רכבי המשתמש -----
  const loadCars = async (uid) => {
    if (!uid) return;
    try {
      const { data } = await axios.get(`${API}/users/${uid}/cars`);
      setCars(data.cars || []);
    } catch {
      setCarsError("Failed to load cars");
    }
  };
  useEffect(() => {
    if (ownerId) loadCars(ownerId);
  }, [ownerId]);

const handleSubmit = (e) => {
  e.preventDefault();
  const form = e.target;
  const storedUser = JSON.parse(localStorage.getItem("user"));

  const updatedDetails = {
    name: form.name.value.trim(),
    address: form.address.value.trim(),
    phone: storedUser?.phone || "",  // מזהה לפי מספר טלפון
    password: form.password.value.trim(),
  };

  axios
    .put(`${API}/update_user_details`, updatedDetails)
    .then((response) => {
      alert(response.data.message);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      window.dispatchEvent(new Event("storage"));
    })
    .catch((err) => {
      alert(err.response?.data?.message || "Error updating user details");
    });
};



  // ----- בקשת קוד + פתיחת מודאל -----
  const verifyAndUpdate = async (e) => {
    e.preventDefault();
  
    const email = (storedUser?.email || userDetails?.email || "").trim();
    if (!email) return alert("No email found for verification.");
    setVerifying(true);
    try {
      await axios.post(`${API}/send_verification_code`, { email });
      setIsModalOpen(true);
    } catch (err) {
      alert(err.response?.data?.message || "Error sending verification code.");
    }
    setVerifying(false);
  };

  // ----- אימות קוד ואז שליחה ל-handleSubmit -----
  const handleCodeVerification = async () => {
    const email = (storedUser?.email || userDetails?.email || "").trim(); // ללא הנמכה
    try {
      const res = await axios.post(`${API}/verify_email_code`, {
        email,
        code: verificationCode,
      });
      if (res.data.message === "Verification successful") {
        setIsModalOpen(false);
        const form = document.querySelector(".personal-details-form");
        if (form) handleSubmit({ preventDefault: () => {}, target: form });
      } else {
        alert("Invalid verification code.");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Verification failed.");
    }
  };

  // ----- הוספת רכב -----
  const addCar = async (e) => {
    e.preventDefault();
    setCarsError("");
    if (!ownerId) return setCarsError("Missing user id.");
    const num = normalizeCarNumber(carNumberNew);
    const yr = parseInt(carYearNew || "0", 10);
    if (!(num.length >= 6 && num.length <= 8))
      return setCarsError("Car number must be 6–8 digits.");
    if (yr < MIN_YEAR || yr > MAX_YEAR)
      return setCarsError(`Car year must be between ${MIN_YEAR}-${MAX_YEAR}.`);
    if (!carTypeNew.trim()) return setCarsError("Car type is required.");

    try {
      const { data } = await axios.post(`${API}/users/${ownerId}/cars`, {
        car_number: num,
        car_type: carTypeNew.trim(),
        car_year: yr,
      });
      setCars(data.cars || []);
      setCarNumberNew("");
      setCarTypeNew("");
      setCarYearNew("");
    } catch (err) {
      setCarsError(err.response?.data?.message || "Failed to add car.");
    }
  };

  // ----- מחיקת רכב -----
  const deleteCar = async (carId) => {
    setCarsError("");
    try {
      await axios.delete(`${API}/users/${ownerId}/cars/${carId}`);
      setCars((prev) => prev.filter((c) => c.id !== carId));
    } catch (err) {
      setCarsError(err.response?.data?.message || "Failed to delete car.");
    }
  };

  return (
    <div>
      <HeaderHome />
      <div className="personal-details-container">
        {/* טופס פרטים כלליים + אימות מייל */}
        <form onSubmit={handleSubmit} className="personal-details-form">
          <h2>
            Personal Details <img src={personalDetails} alt="personalDetails" />
          </h2>

          <div className="personal-details-sections">
            <div className="personal-details-left">
              <div className="input-group">
                <label htmlFor="name">Name</label>
                <input
                  id="name"
                  name="name"
                  defaultValue={userDetails?.name || ""}
                  required
                />
              </div>
              <div className="input-group">
                <label htmlFor="address">Address</label>
                <input
                  id="address"
                  name="address"
                  defaultValue={userDetails?.address || ""}
                  required
                />
              </div>
              <div className="input-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={userDetails?.email || ""}
                  disabled
                />
              </div>
            </div>

            <div className="personal-details-right">
              {/* <div className="input-group">
                <label htmlFor="car_year">Year</label>
                <input
                  id="car_year"
                  name="car_year"
                  type="number"
                  defaultValue={userDetails?.car_year || ""}
                  min={MIN_YEAR}
                  max={MAX_YEAR}
                  required
                />
              </div> */}
              <div className="input-group">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  defaultValue={userDetails?.password || ""}
                />
              </div>

              <button
                type="submit"
                className="submit-button"
                disabled={verifying}
              >
                {verifying ? "Sending code..." : "Update Details"}
              </button>
            </div>
          </div>
        </form>

        {/* ניהול רכבים */}
        <div className="cars-manager">
          <h3>My Cars</h3>

          {carsError && (
            <div className="error-message" style={{ marginBottom: 10 }}>
              {carsError}
            </div>
          )}

          <form onSubmit={addCar} className="car-add-form">
            <div className="input-group">
              <label>Car Number</label>
              <input
                value={carNumberNew}
                onChange={(e) =>
                  setCarNumberNew(formatCarNumberInput(e.target.value))
                }
                placeholder="123-45-678"
                inputMode="numeric"
                required
              />
            </div>
            <div className="input-group">
              <label className="label">Car Type</label>
              <input
                className="input type"
                type="text"
                list="car-brands"
                value={carTypeNew}
                onChange={(e) => setCarTypeNew(e.target.value)}
                placeholder="Audi"
                required
              />
              <datalist id="car-brands">
                {CAR_BRANDS.map((brand) => (
                  <option key={brand} value={brand} />
                ))}
              </datalist>
            </div>

            <div className="input-group">
              <label>Year</label>
              <input
                type="number"
                value={carYearNew}
                onChange={(e) =>
                  setCarYearNew(e.target.value.replace(/\D/g, "").slice(0, 4))
                }
                placeholder={`${MIN_YEAR}-${MAX_YEAR}`}
                min={MIN_YEAR}
                max={MAX_YEAR}
                required
              />
            </div>
            <button type="submit" className="submit-button">
              Add Car
            </button>
          </form>

          {cars.length === 0 ? (
            <p style={{ marginTop: 8 }}>No cars yet.</p>
          ) : (
            <ul className="cars-list">
              {cars.map((c) => (
                <li key={c.id} className="car-item">
                  <div className="car-item-left">
                    <div>
                      <b>Number:</b> {c.car_number}
                    </div>
                    <div>
                      <b>Type:</b> {c.car_type}
                    </div>
                    <div>
                      <b>Year:</b> {c.car_year}
                    </div>
                  </div>
                  <button className="danger" onClick={() => deleteCar(c.id)}>
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* מודאל אימות קוד */}
        {/* <Modal
          isOpen={isModalOpen}
          onRequestClose={() => setIsModalOpen(false)}
          contentLabel="Enter Verification Code"
          className="modal"
          overlayClassName="modal-overlay"
        >
          <h2>Verify Your Email</h2>
          <p>Enter the 6-digit code sent to your email.</p>
          <input
            type="text"
            maxLength={6}
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
            placeholder="123456"
          />
          <div className="modal-actions">
            <button onClick={handleCodeVerification}>Verify</button>
            <button onClick={() => setIsModalOpen(false)}>Cancel</button>
          </div>
        </Modal> */}

        {errorMessage && <p className="error-message">{errorMessage}</p>}
      </div>
    </div>
  );
}
