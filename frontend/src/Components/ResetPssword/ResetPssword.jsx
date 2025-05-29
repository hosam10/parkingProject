import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../Login/Login.css";
import lock from '../images/lock.png';

const ResetPssword = () => {
  const [email, setEmail] = useState("");
  
  const navigate = useNavigate();
  
  const handleSignIn = () => {
    navigate("/login");
  };
  return (
    <>
      <div className="login login-reset">
        <div className="login-container ">
          <form >
            {/* <div className="backBtn" onClick={handleHome}>
              <img src={back} alt="" />
            </div> */}
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
              />
            </div>
            
            <button className="loginSubmit" type="submit">
              Reset
            </button>
            <p className="p-login p-create p-reset">
              <button type="button" className="toggle-btn" onClick={handleSignIn} >
                Sign in
              </button>
            </p>
          </form>
        </div>
      </div>
    </>
  );
};

export default ResetPssword;
