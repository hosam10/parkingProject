import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './Components/Login/Login';
import Register from './Components/Register/Register';
import LoginPage from './Components/LoginPage/LoginPage';
import Home from './Components/Home/Home';
import ParkingPlaces from './Components/Home/ParkingPlaces/ParkingPlaces';
import Kiryons from './Components/Home/Malls/Kiryons';
import FirstPage from './Components/Home/FirstPage/FirstPage';
import PersonalDetails from './Components/PersonalDetails/PersonalDetails';
import FormPay from './Components/FormPay/FormPay';
import History from './Components/History/History';
import ResetPssword from './Components/ResetPssword/ResetPssword';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/loginPage" element={<LoginPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={<Home />} />
        <Route path="/parkingPlace" element={<ParkingPlaces />} />
        <Route path="/firstPage" element={<FirstPage />} />
        
        <Route path="/history" element={<History />} />

        {/* Malls */}
        <Route path="/parking/Kiryon/North" element={<Kiryons 
        title="North-Parking" 
        price="3$ per hour"
        
        />} />

        <Route path="/parking/Kiryon/South" element={<Kiryons title="South-Parking" 
        price="8$ per hour" />} />
        <Route path="/parking/Kiryon/West" element={<Kiryons title="West-Parking" 
        price="12$ per hour" />} />
        <Route path="/parking/Kiryon/East" element={<Kiryons title="East-Parking" 
        price="10$ per hour" />} />

        <Route path="/PersonalDetails" element={<PersonalDetails />} />
        <Route path="/formPay" element={<FormPay />} />
        
        <Route path="/resetPssword" element={<ResetPssword />} />

      </Routes>
    </Router>
  );
}

export default App;
