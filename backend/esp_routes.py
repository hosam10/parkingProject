from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timezone
import time

app = Flask(__name__)
CORS(app)

# מצב לכל חיישן: sensors = {"S1": {"status": "full", "updated": 1723890000.0}, ...}
sensors = {}

def now_ts() -> float:
    return time.time()

def to_iso(ts: float) -> str:
    return datetime.fromtimestamp(ts, tz=timezone.utc).isoformat()

@app.route("/")
def home():
    return "Smart Parking ESP32 API — multi-sensor", 200

# עדכון חיישן בודד: {"id":"S1","status":"full|empty|unknown"}
@app.route("/status", methods=["POST"])
def post_status():
    data = request.get_json(silent=True) or {}
    sid = str(data.get("id", "")).strip()
    status = str(data.get("status", "")).strip().lower()

    if not sid or status not in ("full", "empty", "unknown"):
        return jsonify({"error": "use: {'id':'S1','status':'full|empty|unknown'}"}), 400

    sensors[sid] = {"status": status, "updated": now_ts()}
    print(f"[UPDATE] {sid} → {status}")        # ✅ מציג עדכון בטרמינל
    print("Current sensors:", sensors)         # ✅ מדפיס מצב כללי
    return jsonify({"ok": True, "id": sid, "status": status}), 200

# עדכון באצ׳: {"data":[{"id":"S1","status":"full"}, {"id":"S2","status":"empty"}, ...]}
@app.route("/status/batch", methods=["POST"])
def post_batch():
    data = request.get_json(silent=True) or {}
    arr = data.get("data", [])
    updated = []
    for item in arr:
        sid = str(item.get("id", "")).strip()
        status = str(item.get("status", "")).strip().lower()
        if sid and status in ("full", "empty", "unknown"):
            sensors[sid] = {"status": status, "updated": now_ts()}
            updated.append(sid)

    if updated:
        print(f"[BATCH] Updated sensors: {updated}")  # ✅ רשימת עדכונים
        print("Current sensors:", sensors)            # ✅ מצב כללי

    return jsonify({"ok": True, "updated": updated}), 200

# שליפת כל החיישנים לפרונט
@app.route("/message", methods=["GET"])
def get_all():
    out = []
    for sid, info in sorted(sensors.items()):
        out.append({
            "id": sid,
            "status": info["status"],
            "updated": to_iso(info["updated"]),
        })
    return jsonify({"sensors": out}), 200

# שליפת חיישן יחיד
@app.route("/message/<sid>", methods=["GET"])
def get_one(sid):
    info = sensors.get(sid)
    if not info:
        return jsonify({"error": "not found"}), 404
    return jsonify({
        "id": sid,
        "status": info["status"],
        "updated": to_iso(info["updated"]),
    }), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5006, debug=True)
