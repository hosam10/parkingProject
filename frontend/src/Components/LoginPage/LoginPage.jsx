import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';
import Header from '../Header/Header';

const LoginPage = () => {
  const navigate = useNavigate();

  return (
    <>
    <div class="home-page">
    <h1>SmartParking</h1>
    <div class="button-container">
    <button className="home-button" onClick={() => navigate('/login')}>
          Login
        </button>
        <button className="home-button" onClick={() => navigate('/register')}>
          Register
        </button>
    </div>
</div>
</>
  );
};

export default LoginPage;
