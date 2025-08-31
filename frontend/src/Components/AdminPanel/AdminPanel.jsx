// AdminPanel.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import "jspdf-autotable";
import "./AdminPanel.css";
import autoTable from "jspdf-autotable";

import HeaderAdmin from "../HeaderAdmin/HeaderAdmin";

const AdminPanel = () => {
  const [records, setRecords] = useState([]);
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  useEffect(() => {
    axios
      .get("http://127.0.0.1:5000/api/parking-records")
      .then((res) => setRecords(res.data))
      .catch((err) => console.error("Failed to fetch records:", err));
  }, []);

  // --- חישובים כלליים ---
  const totalEarnings = records.reduce(
    (sum, rec) => sum + parseFloat(rec.price || 0),
    0
  );
  const totalParkings = records.length;
  const avgTime = totalParkings
    ? (
        records.reduce(
          (sum, rec) =>
            sum + (new Date(rec.exitTime) - new Date(rec.entryTime)) / 3600000,
          0
        ) / totalParkings
      ).toFixed(2)
    : 0;

  const totalHours = records
    .reduce(
      (sum, rec) =>
        sum + (new Date(rec.exitTime) - new Date(rec.entryTime)) / 3600000,
      0
    )
    .toFixed(2);

  const parkingsByHour = {};
  records.forEach((rec) => {
    const hour = new Date(rec.entryTime).getHours();
    parkingsByHour[hour] = (parkingsByHour[hour] || 0) + 1;
  });

  const parkingsByPlace = {};
  records.forEach((rec) => {
    const place = rec.location || "Unknown";
    parkingsByPlace[place] = (parkingsByPlace[place] || 0) + 1;
  });
  const mostPopularPlace = Object.entries(parkingsByPlace).sort(
    (a, b) => b[1] - a[1]
  )[0];

  const peakHour = Object.entries(parkingsByHour).sort(
    (a, b) => b[1] - a[1]
  )[0];

  const avgEarningPerParking = totalParkings
    ? (totalEarnings / totalParkings).toFixed(2)
    : 0;

  // --- סינון לפי חודש ושנה ---
  const filteredRecords = records.filter((rec) => {
    const date = new Date(rec.entryTime);
    const recMonth = date.getMonth() + 1;
    const recYear = date.getFullYear();
    const monthMatch = month ? recMonth === parseInt(month) : true;
    const yearMatch = year ? recYear === parseInt(year) : true;
    return monthMatch && yearMatch;
  });

  // --- פונקציה לייצוא PDF ---
const exportPDF = () => {
  const doc = new jsPDF();
  const tableColumn = ["Entry Time", "Exit Time", "Duration (hrs)", "Price (₪)", "Location"];
  const tableRows = [];

  filteredRecords.forEach((rec) => {
    const entry = new Date(rec.entryTime).toLocaleString();
    const exit = new Date(rec.exitTime).toLocaleString();
    const duration = ((new Date(rec.exitTime) - new Date(rec.entryTime)) / 3600000).toFixed(2);
    tableRows.push([entry, exit, duration, rec.price, rec.location || "N/A"]);
  });

  // סיכום
  const totalDuration = filteredRecords
    .reduce((sum, rec) => sum + (new Date(rec.exitTime) - new Date(rec.entryTime)) / 3600000, 0)
    .toFixed(2);
  const totalPrice = filteredRecords
    .reduce((sum, rec) => sum + parseFloat(rec.price || 0), 0)
    .toFixed(2);
  tableRows.push(["Total", "", totalDuration, totalPrice, ""]);

  doc.text("Parking Records Report", 14, 15);
  autoTable(doc, { head: [tableColumn], body: tableRows, startY: 20 });
  doc.save("parking_report.pdf");
};


  return (
    <div className="adminREPORT-container">
      <HeaderAdmin />
      <h1 className="adminREPORT-title">📊 Parking Reports Dashboard</h1>

      {/* --- כרטיסיות --- */}
      <div className="adminREPORT-cards">
        <div className="adminREPORT-card">
          <h3>Total Parkings</h3>
          <p>{totalParkings}</p>
        </div>
        <div className="adminREPORT-card">
          <h3>Total Earnings (₪)</h3>
          <p>{totalEarnings.toFixed(2)}</p>
        </div>
        <div className="adminREPORT-card">
          <h3>Average Parking Time (hrs)</h3>
          <p>{avgTime}</p>
        </div>
        <div className="adminREPORT-card">
          <h3>Total Hours Parked</h3>
          <p>{totalHours}</p>
        </div>
        <div className="adminREPORT-card">
          <h3>Most Popular Parking</h3>
          <p>{mostPopularPlace ? `${mostPopularPlace[0]} (${mostPopularPlace[1]} times)` : "N/A"}</p>
        </div>
        <div className="adminREPORT-card">
          <h3>Peak Hour</h3>
          <p>{peakHour ? `${peakHour[0]}:00 (${peakHour[1]} parkings)` : "N/A"}</p>
        </div>
        <div className="adminREPORT-card">
          <h3>Avg Earnings per Parking (₪)</h3>
          <p>{avgEarningPerParking}</p>
        </div>
      </div>

      {/* --- גרף חניות לפי שעות --- */}
      <h2 className="adminREPORT-subtitle">📈 Parkings per Entry Hour</h2>
      <div className="adminREPORT-chart">
        {Object.keys(parkingsByHour)
          .sort((a, b) => a - b)
          .map((hour) => (
            <div key={hour} className="adminREPORT-bar-container">
              <span>{hour}:00</span>
              <div
                className="adminREPORT-bar"
                style={{ width: `${parkingsByHour[hour] * 10}px` }}
              >
                {parkingsByHour[hour]}
              </div>
            </div>
          ))}
      </div>

      {/* --- סינון טבלה --- */}
      <h2 className="adminREPORT-subtitle">📋 Parking Records</h2>
      <div className="filter-container">
        <label>
          Month:
          <select value={month} onChange={(e) => setMonth(e.target.value)}>
            <option value="">All</option>
            {[...Array(12)].map((_, i) => (
              <option key={i + 1} value={i + 1}>{i + 1}</option>
            ))}
          </select>
        </label>

        <label>
          Year:
          <select value={year} onChange={(e) => setYear(e.target.value)}>
            <option value="">All</option>
            {[...new Set(records.map((r) => new Date(r.entryTime).getFullYear()))].map(
              (y) => (<option key={y} value={y}>{y}</option>)
            )}
          </select>
        </label>

        {/* כפתור PDF */}
        <button onClick={exportPDF} className="export-button">Export PDF</button>
      </div>

      {/* --- טבלה --- */}
      <table className="adminREPORT-table">
        <thead>
          <tr>
            <th>Entry Time</th>
            <th>Exit Time</th>
            <th>Duration (hrs)</th>
            <th>Price (₪)</th>
            <th>Location</th>
          </tr>
        </thead>
        <tbody>
          {filteredRecords.map((rec, idx) => {
            const entry = new Date(rec.entryTime);
            const exit = new Date(rec.exitTime);
            const duration = ((exit - entry) / 3600000).toFixed(2);
            return (
              <tr key={idx}>
                <td>{entry.toLocaleString()}</td>
                <td>{exit.toLocaleString()}</td>
                <td>{duration}</td>
                <td>{rec.price}</td>
                <td>{rec.location || "N/A"}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="summary-row">
            <td colSpan="2" style={{ fontWeight: "bold" }}>Total</td>
            <td style={{ fontWeight: "bold" }}>
              {filteredRecords.reduce((sum, rec) => {
                const entry = new Date(rec.entryTime);
                const exit = new Date(rec.exitTime);
                return sum + (exit - entry) / 3600000;
              }, 0).toFixed(2)}
            </td>
            <td style={{ fontWeight: "bold" }}>
              {filteredRecords.reduce((sum, rec) => sum + parseFloat(rec.price || 0), 0).toFixed(2)}
            </td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default AdminPanel;
