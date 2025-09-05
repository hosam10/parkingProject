// History.jsx
import React, { useState, useEffect, useMemo } from "react";
import HeaderHome from "../HeaderHome/HeaderHome";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import "./History.css";


const API = "http://127.0.0.1:5000";

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
  const [parkingHistory, setParkingHistory] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // בחירת חודש/שנה לגרף
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1); // 1-12
  
  // Car number filter
  const [carNumberFilter, setCarNumberFilter] = useState("");

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

  // רשימת מספרי רכב זמינים (מנתונים קיימים)
  const availableCarNumbers = useMemo(() => {
    const carNumbers = new Set();
    parkingHistory.forEach((r) => {
      if (r.car_number && r.car_number.trim()) {
        carNumbers.add(r.car_number.trim());
      }
    });
    return Array.from(carNumbers).sort();
  }, [parkingHistory]);

  // סינון לפי חודש/שנה + מספר רכב
  const filteredRecords = useMemo(() => {
    return parkingHistory.filter((r) => {
      const d = parseDate(r.entryTime);
      if (!d) return false;
      
      // Filter by year and month
      const yearMonthMatch = d.getFullYear() === selectedYear && d.getMonth() + 1 === selectedMonth;
      
      // Filter by car number (exact match)
      const carNumberMatch = !carNumberFilter || r.car_number === carNumberFilter;
      
      return yearMonthMatch && carNumberMatch;
    });
  }, [parkingHistory, selectedYear, selectedMonth, carNumberFilter]);

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

  // Statistics about parking hours
  const hoursStatistics = useMemo(() => {
    if (filteredRecords.length === 0) {
      return {
        totalHours: 0,
        averageHours: 0,
        longestSession: 0,
        shortestSession: 0,
        totalSessions: 0,
        totalDays: 0
      };
    }

    let totalHours = 0;
    let sessionHours = [];
    let uniqueDays = new Set();

    filteredRecords.forEach((r) => {
      const entry = parseDate(r.entryTime);
      const exit = parseDate(r.exitTime);
      if (!entry || !exit) return;

      const diffMinutes = Math.max(0, Math.round((exit - entry) / 60000));
      const hours = diffMinutes / 60;
      
      totalHours += hours;
      sessionHours.push(hours);
      
      // Track unique days
      const dayKey = `${entry.getFullYear()}-${String(entry.getMonth() + 1).padStart(2, '0')}-${String(entry.getDate()).padStart(2, '0')}`;
      uniqueDays.add(dayKey);
    });

    const sortedSessions = sessionHours.sort((a, b) => a - b);
    
    return {
      totalHours: totalHours,
      averageHours: sessionHours.length > 0 ? totalHours / sessionHours.length : 0,
      longestSession: sortedSessions.length > 0 ? sortedSessions[sortedSessions.length - 1] : 0,
      shortestSession: sortedSessions.length > 0 ? sortedSessions[0] : 0,
      totalSessions: sessionHours.length,
      totalDays: uniqueDays.size
    };
  }, [filteredRecords]);

  return (
    <>
      <HeaderHome />
      <div className="history-container">
        <div className="history-left">
          <h3 className="history-header">Parking History</h3>

          {/* מסנני חודש/שנה + סיכום */}
          <div className="history-filters" style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
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

            <label>
              Car Number:&nbsp;
              <select
                value={carNumberFilter}
                onChange={(e) => setCarNumberFilter(e.target.value)}
                className="car-number-filter"
              >
                <option value="">All Cars</option>
                {availableCarNumbers.map((carNumber) => (
                  <option key={carNumber} value={carNumber}>{carNumber}</option>
                ))}
              </select>
            </label>

            <div style={{ marginInlineStart: "auto", fontWeight: 600 }}>
              Total this month: {monthTotalPrice.toFixed(2)} ₪
            </div>
          </div>

          {/* Statistics Section */}
          <div className="statistics-container">
            <h4 className="statistics-title">Parking Statistics</h4>
            <div className="statistics-grid">
              <div className="stat-item">
                <div className="stat-value">{hoursStatistics.totalHours.toFixed(1)}</div>
                <div className="stat-label">Total Hours</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{hoursStatistics.averageHours.toFixed(1)}</div>
                <div className="stat-label">Avg per Session</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{hoursStatistics.longestSession.toFixed(1)}</div>
                <div className="stat-label">Longest Session</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{hoursStatistics.shortestSession.toFixed(1)}</div>
                <div className="stat-label">Shortest Session</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{hoursStatistics.totalSessions}</div>
                <div className="stat-label">Total Sessions</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{hoursStatistics.totalDays}</div>
                <div className="stat-label">Days Parked</div>
              </div>
            </div>
          </div>

          {/* גרף – סך התשלום ליום בחודש הנבחר */}
          <div className="history-chart-card">
            <h4 className="chart-title">Daily Spending (₪)</h4>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="day" 
                    tick={{ fontSize: 12 }}
                    axisLine={{ stroke: '#ccc' }}
                    tickLine={{ stroke: '#ccc' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    axisLine={{ stroke: '#ccc' }}
                    tickLine={{ stroke: '#ccc' }}
                    tickFormatter={(value) => `₪${value}`}
                  />
                  <Tooltip 
                    formatter={(value, name) => [`₪${Number(value).toFixed(2)}`, name === "totalPrice" ? "Amount" : name]}
                    labelFormatter={(label) => `Day ${label}`}
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #ccc',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Bar 
                    dataKey="totalPrice" 
                    fill="#007bff"
                    radius={[4, 4, 0, 0]}
                    stroke="#0056b3"
                    strokeWidth={1}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

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
