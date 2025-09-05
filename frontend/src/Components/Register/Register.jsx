// src/pages/Register.jsx
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../Login/Login.css";

const Register = () => {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [carNumber, setCarNumber] = useState("");
  const [carType, setCarType] = useState("");
  const [carYear, setCarYear] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [carYearError, setCarYearError] = useState("");
  const [isYearModalOpen, setIsYearModalOpen] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  // כפילויות (onBlur)
  const [emailTaken, setEmailTaken] = useState(false);
  const [phoneTaken, setPhoneTaken] = useState(false);
  const [carTaken, setCarTaken]   = useState(false);

  const MIN_YEAR = 1990;
  const MAX_YEAR = 2025;
  const navigate = useNavigate();

  const CAR_BRANDS = ["Toyota","Volkswagen","Hyundai","Kia","Honda","Nissan","Ford","Chevrolet","Tesla",
    "BMW","Mercedes-Benz","Audi","Lexus","Porsche","Mazda","Subaru","Mitsubishi","Suzuki",
    "Volvo","Skoda","Seat","Cupra","Renault","Peugeot","Citroën","Dacia","Opel","Fiat",
    "Alfa Romeo","Jeep","Dodge","RAM","GMC","Cadillac","Mini","Land Rover","Jaguar",
    "Infiniti","Acura","BYD","Geely","MG","Chery","Haval","Great Wall","SAIC Maxus","Tata","Mahindra"
  ];

  const normalizePhone = (v) =>
    v.replace(/\D/g, "").replace(/^972/, "0").slice(0, 10);

  const validatePhonePrefix = (phoneNumber) => {
    const validPrefixes = ["052", "054", "053", "050", "059" , "058"];
    const normalizedPhone = normalizePhone(phoneNumber);
    if (normalizedPhone.length === 10) {
      const prefix = normalizedPhone.substring(0, 3);
      return validPrefixes.includes(prefix);
    }
    return false;
  };

  async function checkEmail() {
    if (!email) return;
    try {
      const { data } = await axios.post("http://127.0.0.1:5000/register", {
        email, check_only: true,
      });
      setEmailTaken(Boolean(data?.exists?.email));
    } catch { setEmailTaken(false); }
  }

  async function checkPhone() {
    const p = normalizePhone(phone);
    if (!p) return;
    try {
      const { data } = await axios.post("http://127.0.0.1:5000/register", {
        phone: p, check_only: true,
      });
      setPhoneTaken(Boolean(data?.exists?.phone));
    } catch { setPhoneTaken(false); }
  }

  async function checkCar() {
    const c = carNumber.replace(/\D/g, "");
    if (!c) return;
    try {
      const { data } = await axios.post("http://127.0.0.1:5000/register", {
        car_number: c, check_only: true,
      });
      setCarTaken(Boolean(data?.exists?.car_number));
    } catch { setCarTaken(false); }
  }

  const handleCarYearChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 4);
    setCarYear(raw);
    if (raw.length < 4) { setCarYearError(""); setIsYearModalOpen(false); return; }
    const y = Number(raw);
    const invalid = y < MIN_YEAR || y > MAX_YEAR;
    if (invalid) {
      setCarYearError(`שנת הרכב חייבת להיות בין ${MIN_YEAR} ל־${MAX_YEAR}`);
      setIsYearModalOpen(true);
    } else {
      setCarYearError("");
      setIsYearModalOpen(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    // Validate phone prefix before submitting
    const normalizedPhone = normalizePhone(phone);
    if (normalizedPhone.length === 10 && !validatePhonePrefix(normalizedPhone)) {
      setPhoneError("Phone number must start with 052, 054, 053, 050, 058, or 059");
      return;
    }

    try {
      const payload = {
        name,
        address,
        phone: normalizePhone(phone),
        email,
        password,
        car_number: carNumber.replace(/\D/g, ""),
        car_type: carType,
        car_year: carYear,
      };
      const res = await axios.post("http://127.0.0.1:5000/register", payload);
      alert(res.data.message);
      navigate("/login");
    } catch (error) {
      const msg = error.response?.data?.message || "Something went wrong";
      setErrorMessage(msg);
      if (/Email already exists/i.test(msg)) setEmailTaken(true);
      if (/Phone already exists/i.test(msg)) setPhoneTaken(true);
      if (/Car number already exists/i.test(msg)) setCarTaken(true);
    }
  };

  return (
    <>
      <div className="login">
        <div className="login-container-register">
          <form onSubmit={handleSubmit}>
            <h2>Create Account</h2>
            {errorMessage && <div className="error-message">{errorMessage}</div>}

            <div className="form-group-register">
              <label className="label">Name</label>
              <input
                className="input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value.replace(/[^A-Za-z\u0590-\u05FF\s]/g, ""))}
                placeholder="john"
                required
              />
            </div>

            <div className="form-group-register">
              <label className="label">Address</label>
              <input
                className="input"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Haifa"
                required
              />
            </div>

            <div className="form-group-register">
              <label className="label">Phone</label>
              <input
                className="input phone"
                type="tel"
                value={phone}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "");
                  const norm = digits.startsWith("972") ? "0" + digits.slice(3) : digits;
                  setPhone(norm.slice(0, 10));
                  setPhoneTaken(false);
                  
                  // Validate phone prefix
                  if (norm.length === 10) {
                    if (!validatePhonePrefix(norm)) {
                      setPhoneError("Phone number must start with 052/3/4/5/8/9");
                    } else {
                      setPhoneError("");
                    }
                  } else {
                    setPhoneError("");
                  }
                }}
                onBlur={checkPhone}
                placeholder="0521234567"
                required
                inputMode="tel"
                maxLength={10}
              />
              {phoneTaken && <p className="error-message">Phone already exists</p>}
              {phoneError && <p className="error-message">{phoneError}</p>}
            </div>

            <div className="form-group-register">
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailTaken(false); }}
                onBlur={checkEmail}
                placeholder="john@gmail.com"
                
              />
              {emailTaken && <p className="error-message">Email already exists</p>}
            </div>

            <div className="form-group-register">
              <label className="label">Choose a Password:</label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="***************"
                required
              />
            </div>

            <div className="form-group-register">
              <label className="label">Car Number</label>
              <input
                className="input"
                type="text"
                value={carNumber}
                onChange={(e) => {
                  const d = e.target.value.replace(/\D/g, "").slice(0, 8);
                  let f = d;
                  if (d.length >= 8)      f = d.replace(/(\d{3})(\d{2})(\d{0,3}).*/, "$1-$2-$3");
                  else if (d.length >= 7) f = d.replace(/(\d{2})(\d{3})(\d{0,2}).*/, "$1-$2-$3");
                  else if (d.length >= 6) f = d.replace(/(\d{2})(\d{2})(\d{0,2}).*/, "$1-$2-$3");
                  setCarNumber(f);
                  setCarTaken(false);
                }}
                onBlur={checkCar}
                placeholder="123-45-678"
                inputMode="numeric"
                required
              />
              {carTaken && <p className="error-message">Car number already exists</p>}
            </div>

            <div className="form-group-register">
              <label className="label">Car Type</label>
              <input
                className="input"
                type="text"
                list="car-brands"
                value={carType}
                onChange={(e) => setCarType(e.target.value)}
                placeholder="Audi"
                required
              />
              <datalist id="car-brands">
                {CAR_BRANDS.map((b) => <option key={b} value={b} />)}
              </datalist>
            </div>

            <div className="form-group-register">
              <label className="label">Car Year</label>
              <input
                className="input"
                type="number"
                value={carYear}
                onChange={handleCarYearChange}
                required
                min={MIN_YEAR}
                max={MAX_YEAR}
                placeholder={`${MIN_YEAR}-${MAX_YEAR}`}
                title="שנת ייצור הרכב"
              />
              {carYearError && <p className="error-message">{carYearError}</p>}
            </div>

            {isYearModalOpen && (
              <div className="modal-overlay" onClick={() => setIsYearModalOpen(false)}>
                <div className="modal" onClick={(e) => e.stopPropagation()}>
                  <h3>שגיאה</h3>
                  <p>{carYearError || `שנת הרכב חייבת להיות בין ${MIN_YEAR} ל־${MAX_YEAR}`}</p>
                  <button onClick={() => setIsYearModalOpen(false)}>סגור</button>
                </div>
              </div>
            )}

            <p className="p-login p-create ">
              <button
                type="submit"
                className="toggle-btn-register"
                disabled={emailTaken || phoneTaken || carTaken || phoneError}
              >
                Sign Up
              </button>
            </p>
            <button
              onClick={() => navigate("/login")}
              className="toggle-btn-register toggle-btn-register-signin"
              type="button"
            >
              Sign in
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default Register;
