// History.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import HeaderHome from "../HeaderHome/HeaderHome";
import axios from "axios";
import "./History.css";


const API = "http://127.0.0.1:5000";
const onlyDigits = (s) => (s || "").replace(/\D/g, "");

// תאריך מה-DB הוא "YYYY-MM-DD HH:mm:ss" – נהפוך ל־ISO כדי ש-Date יעבוד בכל הדפדפנים
const parseDate = (s) => {
  if (!s) return null;
  // אם כבר ISO, נשאיר. אם יש רווח בין תאריך לשעה – נחליף ב-T
  const fixed = s.includes("T") ? s : s.replace(" ", "T");
  const d = new Date(fixed);
  return isNaN(d) ? null : d;
};

const monthNames = [
  "01","02","03","04","05","06","07","08","09","10","11","12"
];

const History = () => {
  const navigate = useNavigate();
  const [parkingHistory, setParkingHistory] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // בחירת חודש/שנה לגרף
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1); // 1-12

  // טען היסטוריה לפי user_id (כל הרכבים של המשתמש)
  useEffect(() => {
    const controller = new AbortController();

    const loadHistory = async () => {
      try {
        setErrorMessage("");
        setLoading(true);

        const user = (() => {
          try {
            return JSON.parse(localStorage.getItem("user") || "{}");
          } catch {
            return {};
          }
        })();
        const userId = user?.id;
        if (!userId) {
          setErrorMessage("User is not logged in.");
          setParkingHistory([]);
          return;
        }

        const { data } = await axios.get(`${API}/get_all_parking_records`, {
          params: { user_id: userId },
          signal: controller.signal,
        });

        setParkingHistory(Array.isArray(data) ? data : []);
      } catch (err) {
        if (axios.isCancel(err)) return;
        if (err.response) {
          setErrorMessage(
            err.response.data?.message || `Server error (${err.response.status})`
          );
        } else if (err.request) {
          setErrorMessage("Network error: failed to reach API (is the backend up? CORS?)");
        } else {
          setErrorMessage(`Unexpected error: ${err.message}`);
        }
        setParkingHistory([]);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
    return () => controller.abort();
  }, []);

  // רשימת שנים זמינות (מנתונים קיימים + השנה הנוכחית)
  const availableYears = useMemo(() => {
    const years = new Set();
    parkingHistory.forEach((r) => {
      const d = parseDate(r.entryTime);
      if (d) years.add(d.getFullYear());
    });
    years.add(new Date().getFullYear());
    return Array.from(years).sort((a, b) => a - b);
  }, [parkingHistory]);

  // סינון לפי חודש/שנה
  const filteredRecords = useMemo(() => {
    return parkingHistory.filter((r) => {
      const d = parseDate(r.entryTime);
      if (!d) return false;
      return d.getFullYear() === selectedYear && d.getMonth() + 1 === selectedMonth;
    });
  }, [parkingHistory, selectedYear, selectedMonth]);

  // אגרגציה לימים בחודש: סכום מחיר ו/או שעות
  const daysInMonth = useMemo(() => {
    return new Date(selectedYear, selectedMonth, 0).getDate(); // יום 0 של החודש הבא -> מספר הימים
  }, [selectedYear, selectedMonth]);

  const chartData = useMemo(() => {
    // הכנה של מערך בגודל מספר הימים, ערך התחלתי 0
    const byDay = Array.from({ length: daysInMonth }, (_, i) => ({
      day: String(i + 1).padStart(2, "0"),
      totalPrice: 0,
      totalHours: 0,
      count: 0,
    }));

    filteredRecords.forEach((r) => {
      const entry = parseDate(r.entryTime);
      const exit = parseDate(r.exitTime);
      if (!entry || !exit) return;

      const idx = entry.getDate() - 1;
      const price = Number(r.price) || 0;

      const diffMinutes = Math.max(0, Math.round((exit - entry) / 60000));
      const hours = diffMinutes / 60;

      byDay[idx].totalPrice += price;
      byDay[idx].totalHours += hours;
      byDay[idx].count += 1;
    });

    return byDay;
  }, [filteredRecords, daysInMonth]);

  const monthTotalPrice = useMemo(
    () => chartData.reduce((sum, d) => sum + d.totalPrice, 0),
    [chartData]
  );

  return (
    <>
      <HeaderHome />
      <div className="history-container">
        <div className="history-left">
          <h3 className="history-header">Parking History</h3>

          {/* מסנני חודש/שנה + סיכום */}
          <div className="history-filters" style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
            <label>
              Year:&nbsp;
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              >
                {availableYears.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </label>

            <label>
              Month:&nbsp;
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
              >
                {monthNames.map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>
            </label>

            <div style={{ marginInlineStart: "auto", fontWeight: 600 }}>
              Total this month: {monthTotalPrice.toFixed(2)} ₪
            </div>
          </div>

          {/* גרף – סך התשלום ליום בחודש הנבחר */}
          {/* <div className="history-chart-card" style={{ width: "100%", height: 300, background: "#fff", borderRadius: 12, padding: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", marginBottom: 16 }}>
            <h4 style={{ margin: "0 0 8px" }}>Daily Spend (₪)</h4>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip formatter={(value, name) => [Number(value).toFixed(2), name === "totalPrice" ? "₪" : name]} />
                <Bar dataKey="totalPrice" />
              </BarChart>
            </ResponsiveContainer>
          </div> */}

          {loading && <p className="history-loading">Loading…</p>}
          {errorMessage && <p className="history-error-message">{errorMessage}</p>}

          {/* טבלה */}
          <div className="history-table-container">
            <table className="history-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Car Number</th>
                  <th>Parking</th>
                  <th>Location</th>
                  <th>Entry Time</th>
                  <th>Exit Time</th>
                  <th>Time</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length > 0 ? (
                  filteredRecords.map((record, index) => (
                    <tr key={record.id ?? index}>
                      <td>{index + 1}</td>
                      <td>{record.car_number}</td>
                      <td>{record.parking_num ?? "—"}</td>
                      <td>{record.location}</td>
                      <td>{record.entryTime}</td>
                      <td>{record.exitTime}</td>
                      <td>
                        {(() => {
                          const entry = parseDate(record.entryTime);
                          const exit = parseDate(record.exitTime);
                          if (!entry || !exit) return "—";
                          const diffMinutes = Math.round((exit - entry) / 60000);
                          return diffMinutes < 60
                            ? `${diffMinutes} min`
                            : `${(diffMinutes / 60).toFixed(2)} Hours`;
                        })()}
                      </td>
                      <td>{Number(record.price).toFixed(2)} ₪</td>
                    </tr>
                  ))
                ) : (
                  !loading && (
                    <tr>
                      <td colSpan="8" className="history-no-records">No records found</td>
                    </tr>
                  )
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
