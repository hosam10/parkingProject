import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import Header from "../Header/Header";
import happy from "../images/happy.gif";
import back from "../images/turn-left.png";
import loginIcon from "../images/login.gif"

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPopup, setShowPopup] = useState(false); // state for showing the popup
  const [userName, setUserName] = useState(""); // state for storing username
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post("http://127.0.0.1:5000/login", {
        email: email,
        password: password,
      });

      if (response.data.success) {
        // Save the entire user object (including name, car_number, etc.) in localStorage
        localStorage.setItem("user", JSON.stringify(response.data.user)); // Store the full user object
        
        // Get the username (or name) from the response
        const name = response.data.user.name;
        setUserName(name);

        // Show the popup after successful login
        setShowPopup(true);

        // Redirect to the home page after a delay (e.g., 2 seconds)
        setTimeout(() => {
          navigate("/home"); // Navigate to home page after 2 seconds
        }, 2000); // 2000ms = 2 seconds

      } else {
        console.error(response.data.message);  // Handle invalid credentials
        alert("Invalid credentials");
      }
    } catch (error) {
      console.error("Error during login:", error);
      alert("Error during login. Please try again.");
    }
  };

  const handleRegister = () => {
    navigate("/register");
  };
  const handleReset = () => {
    navigate("/resetPssword");
  };

  return (
    <>
      {/* <Header /> */}
      <div className="login">
        <div className="login-container">
          <form onSubmit={handleLogin}>
            <img src={loginIcon} alt="" />
            <div className="form-group">
              <label className="label">Email:</label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="john@gmail.com"
              />
            </div>
            <div className="form-group">
              <label className="label">Password:</label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="***************"
                required
              />
            </div>
            <button className="loginSubmit" type="submit">
              Login
            </button>
            <p className="p-login p-create">
              Don't have an account?{" "}
              <button type="button" className="toggle-btn" onClick={handleRegister}>
                Create Account
              </button>
            </p>

            <p className="p-login p-password">
              Forget Password?{" "}
              <button type="button" className="toggle-btn" onClick={handleReset}>
                Reset Password
              </button>
            </p>
          </form>
        </div>
      </div>

      {/* Show popup if showPopup state is true */}
      {showPopup && (
        <div className="popup">
          <div className="popup-content">
            <h2>Hello, {userName}! <img src={happy} alt="HappyEmoji" /></h2> {/* Display the username */}
            <p>Welcome back!</p>
          </div>
        </div>
      )}
    </>
  );
};

export default Login;
