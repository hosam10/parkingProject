import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../Login/Login.css";
import lock from '../images/lock.png';

const ResetPassword = () => {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState(1);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const navigate = useNavigate();

  const handleSendCode = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://127.0.0.1:5000/send_verification_code", {
        email,
        purpose: "password",
      });
      setStep(2);
    } catch (err) {
      alert(err.response?.data?.message || "Error sending verification code.");
    }
  };

  const handleVerifyAndReset = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://127.0.0.1:5000/verify_password_code", {
        email,
        code,
        new_password: newPassword,
      });
      alert("Password updated successfully. Please log in.");
      navigate("/login");
    } catch (err) {
      alert(err.response?.data?.message || "Error resetting password.");
    }
  };

  return (
    <div className="login login-reset">
      <div className="login-container">
        <form onSubmit={step === 1 ? handleSendCode : handleVerifyAndReset}>
          <img className="lock" src={lock} alt="lock" />
          <h2>Reset Password</h2>

          <div className="form-group">
            <label className="label">Email:</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="john@gmail.com"
              disabled={step === 2}
            />
          </div>

          {step === 2 && (
            <>
              <div className="form-group">
                <label className="label">Verification Code:</label>
                <input
                  className="input"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  placeholder="Enter code sent to email"
                />
              </div>
              <div className="form-group">
                <label className="label">New Password:</label>
                <input
                  className="input"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="New password"
                />
              </div>
            </>
          )}

          <button className="loginSubmit" type="submit">
            {step === 1 ? "Send Verification Code" : "Confirm Password Reset"}
          </button>

          <p className="p-login p-create p-reset">
            <button type="button" className="toggle-btn" onClick={() => navigate("/login")}>Sign in</button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
