import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import HeaderHome from "../HeaderHome/HeaderHome";
import axios from "axios";  // Import axios for HTTP requests
import './History.css';

const History = () => {
  const navigate = useNavigate();
  const [parkingHistory, setParkingHistory] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  // Get car number from localStorage after login
  const carNumber = JSON.parse(localStorage.getItem("user"))?.car_number;

  useEffect(() => {
    // Check if carNumber is available in localStorage
    if (!carNumber) {
      setErrorMessage("User is not logged in or car number is missing.");
      return;
    }

    // Fetch parking history from the backend using the car_number
    axios
      .get(`http://127.0.0.1:5000/search_parking?car_number=${carNumber}`)
      .then((response) => {
        setParkingHistory(response.data);  // Set the fetched data into state
      })
      .catch((error) => {
        // setErrorMessage("Error fetching parking history");
      });
  }, [carNumber]);  // Depend on carNumber so it fetches when carNumber changes

  const handleOut = () => {
    navigate("/login");
  };

  return (
    <>
      <HeaderHome />

      <div className="history-container">
        <div className="history-left">
          <h3 className="history-header">Parking History</h3>
          {errorMessage && <p className="history-error-message">{errorMessage}</p>}
          <div className="history-table-container">
            <table className="history-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Location</th>
                  <th>Date</th>
                  <th>Hours</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {parkingHistory.length > 0 ? (
                  parkingHistory.map((record) => (
                    <tr key={record.id}>
                      <td>{record.id}</td>
                      <td>{record.location}</td>
                      <td>{record.date}</td>
                      <td>{record.hours}</td>
                      <td>{record.price}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="history-no-records">No records found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default History;
