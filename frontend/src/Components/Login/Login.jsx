import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import Header from "../Header/Header";
import happy from "../images/happy.gif";
import back from "../images/turn-left.png";
import loginIcon from "../images/login.gif";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPopup, setShowPopup] = useState(false); // state for showing the popup
  const [userName, setUserName] = useState(""); // state for storing username
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post("http://127.0.0.1:5000/adminLogin", {
        identifier: email,
        password: password,
      });

      if (response.data.success) {
        const user = response.data.user;

        localStorage.setItem("user", JSON.stringify(user));
        setUserName(user.name);
        setShowPopup(true);

        setTimeout(() => {
          if (user.email === "admin") {
            navigate("/admin");
          } else {
            navigate("/home");
          }
        }, 2000);
      } else {
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

  // זיהוי אימייל / טלפון (נייד ישראלי) על סמך הקלט בשדה
  const isEmail = /\S+@\S+\.\S+/.test(email.trim());

  // הפקה מספר טלפון נקי לבדיקה (מסיר כל מה שלא ספרה; תומך +972→0; עד 10)
  const digits = email.replace(/\D/g, "");
  const normPhone = (
    digits.startsWith("972") ? "0" + digits.slice(3) : digits
  ).slice(0, 10);

  // נייד ישראלי: 05X (X=0/2/3/4/5/8) + עוד 7 ספרות
  const isPhone = /^05[023458]\d{7}$/.test(normPhone);

  // לאפשר שליחה רק אם אימייל תקין או טלפון תקין
  const canSubmit = password.trim().length > 0 && (isEmail || isPhone);

  return (
    <>
      {/* <Header /> */}
      <div className="login">
        <div className="login-container">
          <form onSubmit={handleLogin}>
            <img src={loginIcon} alt="" />
            <div className="form-group">
              <label className="label">Email / Phone :</label>
              <input
                className="input"
                type="text"
                value={email}
                onChange={(e) => {
                  const val = e.target.value;

                  // אם זה נראה אימייל – לא נוגעים
                  if (/\S+@\S+\.\S+/.test(val) || /[A-Za-z@]/.test(val)) {
                    setEmail(val);
                    return;
                  }

                  // טלפון: ספרות בלבד, +972 -> 0
                  let d = val.replace(/\D/g, "");
                  if (d.startsWith("972")) d = "0" + d.slice(3);

                  // אם חסר האפס המוביל (9 ספרות) – נוסיף אותו
                  if (d.length === 9 && d[0] !== "0") d = "0" + d;

                  // הגבלה ל-10 ספרות
                  setEmail(d.slice(0, 10));
                }}
                required
                placeholder="john@gmail.com / 0521234567"
              />
            </div>

            <div className="form-group">
              <label className="label">Password :</label>
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
              <button
                type="button"
                className="toggle-btn"
                onClick={handleRegister}
              >
                Create Account
              </button>
            </p>

            <p className="p-login p-password">
              Forget Password?{" "}
              <button
                type="button"
                className="toggle-btn"
                onClick={handleReset}
              >
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
            <h2>
              Hello, {userName}! <img src={happy} alt="HappyEmoji" />
            </h2>{" "}
            {/* Display the username */}
            <p>Welcome back!</p>
          </div>
        </div>
      )}
    </>
  );
};

export default Login;
