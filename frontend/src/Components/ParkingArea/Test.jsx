import React, { useEffect, useMemo, useState } from "react";
import "./Test.css";
import { useNavigate } from "react-router-dom";

import parkingCar from "../images/parked-car.png";
import parkingdisability from "../images/disability-Parking2.png";
import parkingElectric from "../images/charger-station.png";
import arrow from "../images/arrow.png";
import downarrow from "../images/down-arrow.png";
import gate from "../images/barrier.gif";

// ===== CONNECT =====
const API_URL = "http://10.122.229.120:5006/message"; // עדכן IP/פורט אצלך
const HW_ID_MAP = { S1: 1, S2: 2, S3: 3, S4: 4 };
const POLL_MS = 3000;

const Test = () => {
  const navigate = useNavigate();

  const [selectedSpot, setSelectedSpot] = useState(null);
  const [spotStatus, setSpotStatus] = useState({}); // {1:'empty',2:'full',...}
  const [apiError, setApiError] = useState("");

  // ==== משיכה מהשרת ומיפוי ל־1..4 ====
  useEffect(() => {
    let alive = true;

    const fetchOnce = async () => {
      try {
        const res = await fetch(API_URL, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        const next = {};
        for (let i = 1; i <= 28; i++) next[i] = "unknown";

        (json.sensors || []).forEach((s) => {
          const id = String(s.id || "").toUpperCase(); // "S1"
          const uiSpot = HW_ID_MAP[id]; // 1
          if (uiSpot) {
            const st = String(s.status || "unknown").toLowerCase();
            next[uiSpot] =
              st === "full" || st === "occupied"
                ? "full"
                : st === "empty"
                ? "empty"
                : "unknown";
          }
        });

        if (!alive) return;
        setSpotStatus(next);
        setApiError("");
      } catch {
        if (!alive) return;
        setApiError("Connection issue");
      }
    };

    fetchOnce();
    const t = setInterval(fetchOnce, POLL_MS);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  // סוגי חניה
  const spotTypes = {
    1: "electric",
    2: "electric",
    3: "electric",
    4: "electric",
    5: "normal",
    6: "normal",
    7: "normal",
    8: "normal",
    9: "normal",
    10: "normal",
    11: "normal",
    12: "normal",
    13: "normal",
    14: "normal",
    15: "normal",
    16: "normal",
    17: "normal",
    18: "normal",
    19: "normal",
    20: "normal",
    21: "normal",
    22: "normal",
    23: "normal",
    24: "normal",
    25: "disabled",
    26: "disabled",
    27: "disabled",
    28: "disabled",
  };

  const getSpotType = (spot) => spotTypes[spot] || "regular";
  const isDisabled = (spot) => getSpotType(spot) === "disabled";

  const handleSpotClick = (spot) => {
    if (isDisabled(spot)) return;
    setSelectedSpot(spot);
    navigate("/formPay", { state: { spotId: spot } });
  };

  // ======== renderCell — גרסה מתוקנת ========
  const renderCell = (spot) => {
    const type = getSpotType(spot);
    const selected = selectedSpot === spot;
    const status = spotStatus[spot] || "unknown";

    // ✅ שימוש נכון ב-template string
    const cellClass = `parking-cell ${selected ? "selected" : ""} ${type} status-${status}`;

    return (
      <td
        key={spot}
        className={cellClass}
        onClick={() => handleSpotClick(spot)}
        title={`#${spot} · ${status}`}
      >
        {spot}
        {type === "disabled" && (
          <img src={parkingdisability} alt="parkingdisability" />
        )}
        {type === "electric" && (
          <img src={parkingElectric} alt="parkingElectric" />
        )}
        {type === "normal" && <img src={parkingCar} alt="parkingCar" />}
      </td>
    );
  };

  // ✅ שורות טבלה חייבות להיות בתוך <table><tbody>
  const renderRow = (spots) => <tr>{spots.map(renderCell)}</tr>;

  const renderVerticalColumn = (spots) => (
    <table className="tableX1">
      <tbody>
        {spots.map((spot) => (
          <tr key={spot}>{renderCell(spot)}</tr>
        ))}
      </tbody>
    </table>
  );

  const stats = useMemo(() => {
    const vals = Object.values(spotStatus);
    const full = vals.filter((v) => v === "full").length;
    const empty = vals.filter((v) => v === "empty").length;
    const unknown = 28 - full - empty;
    return { full, empty, unknown };
  }, [spotStatus]);

  return (
    <div className="layout">
      {apiError && <div className="pd-error">{apiError}</div>}
      {!apiError && (
        <div className="pd-legend pad">
          <b>Available:</b> {stats.empty} &nbsp;|&nbsp;
          <b>Occupied:</b> {stats.full} &nbsp;|&nbsp;
          <b>Unknown:</b> {stats.unknown}
        </div>
      )}
      <table className="tableX2">
        <tbody>{renderRow([1, 2, 3, 4])}</tbody>
      </table>

      <div className="road-white-container first-white">
        <div className="road-white" />
        <div className="road-white" />
        <div className="road-white" />
      </div>

      <div className="underLine">
        <img id="arrow-img" src={arrow} alt="arrow" />
        <div className="road-horizontal r2 under" />
        <img id="arrow-img" src={downarrow} alt="arrow" />
      </div>

      <div className="road-white-container">
        <div className="road-white" />
        <div className="road-white" />
        <div className="road-white" />
      </div>

      <div className="row-layout">
        {renderVerticalColumn([7, 8, 9])}
        <div className="road-vertical roadLeft1" />
        {renderVerticalColumn([13, 14, 15])}
        <div className="roadRight1" />
        {renderVerticalColumn([16, 17, 18])}
        <div className="road-vertical roadLeft2" />
        {renderVerticalColumn([19, 20, 21])}
      </div>

      <div className="road-white-container under-road">
        <div className="road-white" />
        <div className="road-white" />
        <div className="road-white" />
      </div>

      <div className="underLine">
        <img id="arrow-img" src={arrow} alt="arrow" />
        <div className="road-horizontal r2 under" />
        <img id="arrow-img" src={downarrow} alt="arrow" />
      </div>

      <div className="road-white-container">
        <div className="road-white" />
        <div className="road-white" />
        <div className="road-white" />
      </div>

      <table className="tableX3">
        <tbody>{renderRow([25, 26, 27, 28])}</tbody>
      </table>

      <div className="r4" />
      <div className="road-horizontal" id="r3" />

      <div className="line-wrapper">
        <img src={gate} alt="Gate" className="gate-img" />
      </div>

      
    </div>
  );
};

export default Test;
