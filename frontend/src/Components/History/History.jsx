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
    axios
      .get("http://127.0.0.1:5000/get_all_parking_records")
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
                  <th>Hours</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {parkingHistory.length > 0 ? (
                  parkingHistory.map((record, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td> {/* מספר סידורי */}
                      <td>{record.car_number}</td>
                      <td>{record.location}</td>
                      <td>{record.entryTime}</td>
                      <td>{record.exitTime}</td>
                      <td>{record.hours ?? "-"}</td>
                      <td>{record.price}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="history-no-records">
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
