// Reports.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import "jspdf-autotable";
import "./Reports.css";

const Reports = () => {
  const [reportType, setReportType] = useState("parking_records");
  const [data, setData] = useState([]);

  useEffect(() => {
    let endpoint = "";
    if (reportType === "parking_records") {
      endpoint = "/api/parking-records";
    } else if (reportType === "duration_summary") {
      endpoint = "/api/parking-duration-summary";
    }

    if (endpoint) {
      axios
        .get(`http://127.0.0.1:5000${endpoint}`)
        .then((res) => setData(res.data))
        .catch((err) => console.error("Failed to fetch report data", err));
    }
  }, [reportType]);

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Smart Parking Report", 14, 10);
    if (reportType === "parking_records") {
      doc.autoTable({
        head: [["#", "Car", "Entry", "Exit", "Spot", "Price"]],
        body: data.map((r, i) => [
          i + 1,
          r.car_number,
          r.entryTime,
          r.exitTime,
          r.parking_num,
          r.price + " ₪",
        ]),
      });
    } else if (reportType === "duration_summary") {
      doc.autoTable({
        head: [["#", "Parking", "Total Time (min)", "Visits", "Avg Duration"]],
        body: data.map((d, i) => [
          i + 1,
          d.parking_num,
          d.total_minutes,
          d.visits,
          d.avg_duration,
        ]),
      });
    }
    doc.save("report.pdf");
  };

  return (
    <div className="report-container">
      <h2>דוחות חכמים</h2>

      <div className="report-controls">
        <label>בחר דוח:</label>
        <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
          <option value="parking_records">רשימת חניות</option>
          <option value="duration_summary">זמן חניה לפי מקום</option>
        </select>
        <button onClick={exportToPDF}>הורד כ־PDF</button>
      </div>

      {reportType === "parking_records" && (
        <table className="report-table">
          <thead>
            <tr>
              <th>#</th>
              <th>רכב</th>
              <th>כניסה</th>
              <th>יציאה</th>
              <th>חניה</th>
              <th>מחיר</th>
            </tr>
          </thead>
          <tbody>
            {data.map((r, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{r.car_number}</td>
                <td>{r.entryTime}</td>
                <td>{r.exitTime}</td>
                <td>{r.parking_num}</td>
                <td>{r.price} ₪</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {reportType === "duration_summary" && (
        <table className="report-table">
          <thead>
            <tr>
              <th>#</th>
              <th>מס׳ חניה</th>
              <th>סה״כ זמן (דקות)</th>
              <th>כמות חניות</th>
              <th>ממוצע זמן</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{d.parking_num}</td>
                <td>{d.total_minutes}</td>
                <td>{d.visits}</td>
                <td>{d.avg_duration}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Reports;
