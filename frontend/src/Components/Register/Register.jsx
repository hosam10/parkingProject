import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../Login/Login.css";
import Header from "../Header/Header";

const Register = () => {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [carNumber, setCarNumber] = useState(""); // New field
  const [carType, setCarType] = useState(""); // New field
  const [carYear, setCarYear] = useState(""); // New field
  const [carYearError, setCarYearError] = useState("");
  const [errorMessage, setErrorMessage] = useState(""); // To show error messages
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(""); // Clear previous error messages

    try {
        const response = await axios.post("http://127.0.0.1:5000/register", {
            name,
            address,
            email,
            password,
            car_number: carNumber, // Send car_number to backend
            car_type: carType, // Send car_type to backend
            car_year: carYear, // Send car_year to backend
        });
        // Show the response message
        alert(response.data.message);  // Show the success message as an alert or display it in the UI
        console.log(response.data.message);
        navigate("/login"); // Redirect to login page after successful registration
    } catch (error) {
        // Display error message if registration fails
        setErrorMessage(error.response?.data?.message || "Something went wrong");
        console.error(error.response?.data?.message || "Something went wrong");
    }
};
  

  const handleHome = () => {
    navigate("/login");
  };

  const handleCarYearChange = (e) => {
    const year = e.target.value;
    if (year < 1990 || year > 2025) {
      setCarYearError("Car year must be between 1990 and 2025");
    } else {
      setCarYearError("");
    }
    setCarYear(year);
  };
  const handleSignIn = () => {
    navigate("/login");
  };
  
  return (
    <>
      {/* <Header /> */}

      <div className="login">
        <div className="login-container-register">
          <form onSubmit={handleSubmit}>
            {/* <div className="backBtn" onClick={handleHome}>
              &lt;&lt; Back
            </div> */}
            <h2>Create Account</h2>
            {errorMessage && (
              <div className="error-message">{errorMessage}</div>
            )}{" "}
            {/* Display error message */}
            <div className="form-group-register">
              <label className="label">Name</label>
              <input
                className="input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
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
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@gmail.com"
                required
              />
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
            {/* New Car Details Fields */}
            <div className="form-group-register">
              <label className="label">Car Number</label>
              <input
                className="input"
                type="text"
                value={carNumber}
                onChange={(e) => setCarNumber(e.target.value)}
                placeholder="123-45-678"
                required
              />
            </div>
            <div className="form-group-register">
              <label className="label">Car Type</label>
              <input
                className="input"
                type="text"
                value={carType}
                onChange={(e) => setCarType(e.target.value)}
                placeholder="Audi"
                required
              />
            </div>
            <div className="form-group-register">
              <label className="label">Car Year</label>
              <input
                className="input"
                type="number"
                value={carYear}
                onChange={handleCarYearChange}
                required
                min="1990"
                max="2025"
                placeholder="1990-2025"
              />
              {carYearError && <p className="error-message">{carYearError}</p>}{" "}
              {/* Display error message */}
            </div>
            <p className="p-login p-create ">
            <button type="submit" className="toggle-btn-register">
              Sign Up
            </button>

            </p>
            <button onClick={handleSignIn} className="toggle-btn-register toggle-btn-register-signin">
              Sign in
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default Register;
