import React, { useState, useEffect } from "react";
import "./FirstPage.css";
import HeaderHome from "../../HeaderHome/HeaderHome";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const FirstPage = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]); // Parking records

  // Fetch parking records based on the logged-in user's car_number
  const fetchRecords = async () => {
    const storedCarNumber = localStorage.getItem("car_number"); // Get car_number from localStorage

    if (!storedCarNumber) {
      alert("You are not logged in!");
      navigate("/login"); // Redirect to login page if car_number is not found
      return;
    }

    try {
      const response = await axios.get(
        `http://127.0.0.1:5000/search_parking?car_number=${storedCarNumber}`
      );
      setRecords(response.data); // Set the records state with the data from the response
    } catch (error) {
      console.error("Error fetching parking records:", error);
    }
  };

  useEffect(() => {
    fetchRecords(); // Fetch parking records when the page loads
  }, []);

  const handleOrderParking = () => {
    navigate("/home");
  };

  return (
    <>
      <HeaderHome />
      <div className="firstPage">
        <div className="firstPar">
          Lorem, ipsum dolor sit amet consectetur adipisicing elit. Culpa
          ratione magnam deleniti, ipsam optio cupiditate esse, doloribus odit
          nemo, est asperiores repellat modi numquam alias eum officia
          dignissimos temporibus quos.
          <button className="orderBtn" onClick={handleOrderParking}>
            Parking Order
          </button>
        </div>
        <div className="secondPar">
          <h2>Parking Records</h2>

          {/* Parking Records Table */}
          <table className="recordsTable">
            <thead>
              <tr>
                <th>ID</th>
                <th>Car Number</th>
                <th>Location</th>
                <th>Date</th>
                <th>Hours</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              {records.length > 0 ? (
                records.map((record) => (
                  <tr key={record.id}>
                    <td>{record.id}</td>
                    <td>{record.car_number}</td>
                    <td>{record.location}</td>
                    <td>{record.date}</td>
                    <td>{record.hours}</td>
                    <td>{record.price}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6">No records found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default FirstPage;
