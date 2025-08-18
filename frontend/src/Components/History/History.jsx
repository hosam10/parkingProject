import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import HeaderHome from "../HeaderHome/HeaderHome";
import axios from "axios";
import "./History.css";

const History = () => {
  const navigate = useNavigate();
  const [parkingHistory, setParkingHistory] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const carNumber = JSON.parse(localStorage.getItem("user"))?.car_number;
    if (!carNumber) {
      setErrorMessage("User is not logged in.");
      return;
    }

    axios
      .get(
        `http://127.0.0.1:5000/get_all_parking_records?car_number=${carNumber}`
      )
      .then((response) => {
        setParkingHistory(response.data);
      })
      .catch(() => {
        setErrorMessage("Error fetching parking records.");
      });
  }, []);

  return (
    <>
      <HeaderHome />
      <div className="history-container">
        <div className="history-left">
          <h3 className="history-header">Parking History</h3>
          {errorMessage && (
            <p className="history-error-message">{errorMessage}</p>
          )}
          <div className="history-table-container">
            <table className="history-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Car Number</th>
                  <th>Location</th>
                  <th>Entry Time</th>
                  <th>Exit Time</th>
                  <th>Time</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {parkingHistory.length > 0 ? (
                  parkingHistory.map((record, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{record.car_number}</td>
                      <td>{record.location}</td>
                      <td>{record.entryTime}</td>
                      <td>{record.exitTime}</td>
                      <td>
                        {(() => {
                          const entry = new Date(record.entryTime);
                          const exit = new Date(record.exitTime);
                          const diffMinutes = Math.round(
                            (exit - entry) / 60000
                          ); // הבדל בדקות

                          return diffMinutes < 60
                            ? `${diffMinutes} min`
                            : `${(diffMinutes / 60).toFixed(2)} Hours`;
                        })()}
                      </td>

                      <td>{record.price} ₪</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="history-no-records">
                      No records found
                    </td>
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
