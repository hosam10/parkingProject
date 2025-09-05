from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
import random
import smtplib
from email.mime.text import MIMEText
from datetime import datetime, timedelta
from decimal import Decimal
import re

# ---------------------------
# App & DB
# ---------------------------
app = Flask(__name__)
CORS(app)

verification_codes = {}

try:
    db = mysql.connector.connect(
        host="localhost",
        user="root",
        password="",
        database="smartparking"
    )
    print("✅ Connected to MySQL")
except mysql.connector.Error as e:
    print("❌ MySQL connection failed:", e)


# ---------------------------
# Utils
# ---------------------------
def normalize_car_number(s: str) -> str:
    """digits only, up to 8"""
    if not s:
        return ""
    return re.sub(r"\D", "", s)[:8]

def normalize_phone(p: str) -> str | None:
    if not p:
        return None
    d = re.sub(r"\D", "", str(p))
    if d.startswith("972"):
        d = "0" + d[3:]
    if len(d) == 9 and not d.startswith("0"):
        d = "0" + d
    return d[:10] or None

# ---------------------------
# Home
# ---------------------------
@app.route("/")
def home():
    return "Welcome to the Smart Parking API!", 200

# ---------------------------
# Auth: login
# ---------------------------

@app.route("/adminLogin", methods=["POST"])
def admin_login():
    data = request.get_json() or {}
    identifier = data.get("identifier") or data.get("email") or data.get("phone") or ""
    password = data.get("password", "")

    # ✅ כניסה ייעודית למנהל (ללא גישה למסד נתונים)
    if identifier == "admin" and password == "admin":
        return jsonify({
            "message": "Admin login successful!",
            "success": True,
            "user": {
                "id": 0,
                "name": "Admin",
                "email": "admin",
                "role": "admin"
            }
        }), 200

    # ✅ אחרת — המשך לוגיקה רגילה
    digits = re.sub(r"\D", "", identifier or "")
    if digits.startswith("972"):
        digits = "0" + digits[3:]
    digits = digits[:10]
    is_phone = bool(re.fullmatch(r"0\d{9}", digits))

    cursor = db.cursor(dictionary=True)
    if is_phone:
        v10 = digits
        v9 = digits[1:] if digits.startswith("0") else digits
        v972 = "+972" + (digits[1:] if digits.startswith("0") else digits)
        cursor.execute(
            "SELECT * FROM users WHERE phone IN (%s,%s,%s) AND password=%s LIMIT 1",
            (v10, v9, v972, password),
        )
    else:
        cursor.execute(
            "SELECT * FROM users WHERE email=%s AND password=%s LIMIT 1",
            (identifier, password),
        )

    user = cursor.fetchone()
    cursor.close()

    if not user:
        return jsonify({"message": "Invalid credentials", "success": False}), 401

    return jsonify(
        {
            "message": "Login successful!",
            "success": True,
            "user": {
                "id": user.get("id"),
                "name": user.get("name"),
                "email": user.get("email"),
                "phone": user.get("phone"),
                "car_number": user.get("car_number"),
                "role": "user"
            },
        }
    ), 200

@app.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    identifier = data.get("identifier") or data.get("email") or data.get("phone") or ""
    password = data.get("password", "")

    
    digits = re.sub(r"\D", "", identifier or "")
    if digits.startswith("972"):
        digits = "0" + digits[3:]
    digits = digits[:10]
    is_phone = bool(re.fullmatch(r"0\d{9}", digits))

    cursor = db.cursor(dictionary=True)
    if is_phone:
        v10 = digits
        v9 = digits[1:] if digits.startswith("0") else digits
        v972 = "+972" + (digits[1:] if digits.startswith("0") else digits)
        cursor.execute(
            "SELECT * FROM users WHERE phone IN (%s,%s,%s) AND password=%s LIMIT 1",
            (v10, v9, v972, password),
        )
    else:
        cursor.execute(
            "SELECT * FROM users WHERE email=%s AND password=%s LIMIT 1",
            (identifier, password),
        )

    user = cursor.fetchone()
    cursor.close()

    if not user:
        return jsonify({"message": "Invalid credentials", "success": False}), 401

    # החזרה מינימלית (אם צריך id לצד־לקוח — הוסף כאן)
    return jsonify(
        {
            "message": "Login successful!",
            "success": True,
            "user": {
                "id": user.get("id"),
                "name": user.get("name"),
                "email": user.get("email"),
                "phone": user.get("phone"),
                "car_number": user.get("car_number"),
            },
        }
    ), 200


@app.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    cur = db.cursor(dictionary=True)

    try:
        # קלט + נרמולים
        name       = data['name'].strip()
        address    = data['address'].strip()
        email      = (data.get('email') or '').strip().lower()
        password   = data['password']
        phone      = normalize_phone(data.get('phone'))
        car_number = normalize_car_number(data.get('car_number'))
        car_type   = (data.get('car_type') or '').strip()
        car_year   = int(data['car_year'])

        # ולידציות בסיס
        if not (1990 <= car_year <= 2025):
            return jsonify({"message": "Car year must be between 1990 and 2025"}), 400
        if not car_number or len(car_number) < 6:
            return jsonify({"message": "Car number must be 6–8 digits"}), 400

        # בדיקות קיום
        if email:
            cur.execute("SELECT 1 FROM users WHERE email=%s LIMIT 1", (email,))
            if cur.fetchone():
                return jsonify({"message": "Email already exists"}), 400

        if phone:
            v10 = phone
            v9  = phone[1:] if phone.startswith('0') else phone
            v972 = '+972' + (phone[1:] if phone.startswith('0') else phone)
            cur.execute("SELECT 1 FROM users WHERE phone IN (%s,%s,%s) LIMIT 1", (v10, v9, v972))
            if cur.fetchone():
                return jsonify({"message": "Phone already exists"}), 400

        # שים לב: כעת בודקים כפילות מספר רכב בטבלת cars (לא users)
        cur.execute("SELECT 1 FROM cars WHERE car_number=%s LIMIT 1", (car_number,))
        if cur.fetchone():
            return jsonify({"message": "Car number already exists"}), 400

        # הכנסה ל-users (נשמור גם car_number לתאימות לאחור)
        cur.execute("""
            INSERT INTO users (name, address, phone, email, password, car_number, car_type, car_year)
            VALUES (%s,   %s,      %s,    %s,    %s,       %s,         %s,       %s)
        """, (name, address, phone, email, password, car_number, car_type, car_year))
        user_id = cur.lastrowid

        # הכנסה גם ל-cars (זה החלק שהיה חסר)
        cur.execute("""
            INSERT INTO cars (user_id, car_number, car_type, car_year)
            VALUES (%s,      %s,         %s,        %s)
        """, (user_id, car_number, car_type, car_year))

        db.commit()
        return jsonify({
            "message": "Account created successfully!",
            "user": {"id": user_id, "name": name, "email": email},
            "car":  {"car_number": car_number, "car_type": car_type, "car_year": car_year}
        }), 201

    except Exception as e:
        try: db.rollback()
        except: pass
        return jsonify({"message": "Registration failed", "error": str(e)}), 500
    finally:
        try: cur.close()
        except: pass



@app.route('/admin/dashboard', methods=['GET'])
def admin_dashboard():
    cursor = db.cursor(dictionary=True)

    cursor.execute("SELECT COUNT(*) AS total FROM parking_records")
    total_parkings = cursor.fetchone()['total']

    cursor.execute("SELECT SUM(price) AS revenue FROM parking_records")
    revenue = float(cursor.fetchone()['revenue'] or 0)

    cursor.execute("""
        SELECT spot_type, COUNT(*) AS count
        FROM parking_spots
        GROUP BY spot_type
    """)
    spot_distribution = cursor.fetchall()

    cursor.execute("""
        SELECT COUNT(*) AS active
        FROM parking_records
        WHERE exitTime IS NULL
    """)
    active = cursor.fetchone()['active']

    cursor.execute("""
        SELECT location, COUNT(*) AS count
        FROM parking_records
        GROUP BY location
        ORDER BY count DESC
        LIMIT 1
    """)
    top_lot = cursor.fetchone()

    cursor.execute("""
        SELECT * FROM parking_records
        ORDER BY id DESC
        LIMIT 5
    """)
    recent = cursor.fetchall()

    return jsonify({
        "total_parkings": total_parkings,
        "revenue": revenue,
        "spot_distribution": spot_distribution,
        "active_parkings": active,
        "top_location": top_lot,
        "recent": recent
    })

# Flask backend – API route
@app.route("/api/parking-records")
def get_parking_records():
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM parking_records")
    records = cursor.fetchall()
    return jsonify(records)


@app.route("/api/income-summary")
def income_summary():
    month = request.args.get("month")
    year = request.args.get("year")
    cursor = db.cursor(dictionary=True)
    cursor.execute("""
        SELECT SUM(price) AS total_income, COUNT(*) AS total_records
        FROM parking_records
        WHERE MONTH(entryTime) = %s AND YEAR(entryTime) = %s
    """, (month, year))
    result = cursor.fetchone()
    return jsonify(result)

@app.route("/api/parking-duration-summary")
def duration_summary():
    cursor = db.cursor(dictionary=True)
    cursor.execute("""
        SELECT parking_num, 
               SUM(TIMESTAMPDIFF(MINUTE, entry_time, exit_time)) AS total_minutes,
               COUNT(*) AS visits,
               ROUND(AVG(TIMESTAMPDIFF(MINUTE, entry_time, exit_time)), 2) AS avg_duration
        FROM parking_records
        WHERE exit_time IS NOT NULL
        GROUP BY parking_num
    """)
    results = cursor.fetchall()
    return jsonify(results)


# ---------------------------
# Users: cars (GET/POST)
# ---------------------------
@app.route("/users/<int:user_id>/cars", methods=["GET", "POST"])
def user_cars(user_id):
    cursor = None
    try:
        # בדיקה אם החיבור פעיל
        if not db.is_connected():
            db.reconnect()

        cursor = db.cursor(dictionary=True)

        if request.method == "GET":
            cursor.execute(
                "SELECT id, car_number, car_type, car_year FROM cars WHERE user_id=%s ORDER BY id DESC",
                (user_id,),
            )
            rows = cursor.fetchall()
            cursor.close()
            return jsonify({"cars": rows}), 200

        # ----- POST: הוספת רכב -----
        data = request.get_json() or {}
        car_number = normalize_car_number(data.get("car_number", ""))
        car_type = data.get("car_type", "")
        car_year = int(data.get("car_year", 0) or 0)

        # בדיקות תקינות
        if not (6 <= len(car_number) <= 8):
            cursor.close()
            return jsonify({"message": "Car number must be 6–8 digits"}), 400
        if car_year < 1990 or car_year > 2025:
            cursor.close()
            return jsonify({"message": f"Car year must be between 1990-2025"}), 400
        if not car_type:
            cursor.close()
            return jsonify({"message": "Car type is required"}), 400

        # בדיקה אם המשתמש קיים
        cursor.execute("SELECT 1 FROM users WHERE id=%s", (user_id,))
        if not cursor.fetchone():
            cursor.close()
            return jsonify({"message": "Owner not found"}), 404

        # בדיקה אם מספר רכב כבר קיים
        cursor.execute("SELECT 1 FROM cars WHERE car_number=%s", (car_number,))
        if cursor.fetchone():
            cursor.close()
            return jsonify({"message": "Car number already exists"}), 400

        # הוספת הרכב
        cursor.execute(
            """
            INSERT INTO cars (user_id, car_number, car_type, car_year)
            VALUES (%s, %s, %s, %s)
            """,
            (user_id, car_number, car_type, car_year),
        )
        db.commit()

        # שליפת כל הרכבים אחרי הוספה
        cursor.execute(
            "SELECT id, car_number, car_type, car_year FROM cars WHERE user_id=%s ORDER BY id DESC",
            (user_id,),
        )
        rows = cursor.fetchall()
        cursor.close()
        return jsonify({"message": "Car added", "cars": rows}), 201

    except Exception as e:
        if cursor:
            cursor.close()
        db.rollback()
        return jsonify({"message": "Failed to process request", "error": str(e)}), 500

    
# ---------------------------
# Users: delete car
# ---------------------------
@app.route("/users/<int:user_id>/cars/<int:car_id>", methods=["DELETE"])
def delete_car(user_id, car_id):
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT 1 FROM cars WHERE id=%s AND user_id=%s", (car_id, user_id)
        )
        if not cursor.fetchone():
            cursor.close()
            return jsonify({"message": "Car not found for this owner"}), 404

        cursor.execute("DELETE FROM cars WHERE id=%s", (car_id,))
        db.commit()
        cursor.close()
        return jsonify({"message": "Car deleted"}), 200
    except Exception as e:
        db.rollback()
        cursor.close()
        return jsonify({"message": "Failed to delete car", "error": str(e)}), 500

# ---------------------------
# Users: cards (GET) — SINGLE ROUTE (no duplicates)
# ---------------------------
@app.route("/users/<int:user_id>/cards", methods=["GET"])
def get_cards_by_user(user_id):
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM cards WHERE user_id=%s", (user_id,))
    cards = cursor.fetchall()
    cursor.close()
    return jsonify({"cards": cards}), 200

# ---------------------------
# get_user_details — email OR car_number
# ---------------------------
@app.route("/get_user_details", methods=["GET"])
def get_user_details():
    email = (request.args.get("email") or "").strip().lower()
    car_number = (request.args.get("car_number") or "").strip()

    cursor = db.cursor(dictionary=True)
    try:
        if email:
            cursor.execute("SELECT * FROM users WHERE email=%s LIMIT 1", (email,))
        elif car_number:
            cursor.execute(
                "SELECT * FROM users WHERE car_number=%s LIMIT 1", (car_number,)
            )
        else:
            cursor.close()
            return jsonify({"error": "Missing email or car_number"}), 400

        user = cursor.fetchone()
        cursor.close()
        return jsonify({"user": user}), 200
    except Exception as e:
        cursor.close()
        return jsonify({"error": "Database error", "detail": str(e)}), 500

# ---------------------------
# Search parking by car_number
# ---------------------------
@app.route("/search_parking", methods=["GET"])
def search_parking():
    car_number = request.args.get("car_number", "")
    if not car_number:
        return jsonify({"message": "Car number is required"}), 400

    cursor = db.cursor(dictionary=True)
    cursor.execute(
        """
        SELECT * FROM parking_records
        WHERE car_number=%s
        """,
        (car_number,),
    )
    records = cursor.fetchall()
    cursor.close()
    if records:
        return jsonify(records), 200
    return jsonify({"message": "No parking records found for this car number"}), 404

# ---------------------------
# Cards: by phone/email (JOIN on user_id, not car_number)
# ---------------------------
@app.route("/get_card_details_by_phone", methods=["GET"])
def get_card_details_by_phone():
    phone = request.args.get("phone_number") or request.args.get("phone")
    if not phone:
        return jsonify({"error": "Missing phone parameter"}), 400

    # normalize popular forms
    d = normalize_phone(phone)

    cursor = db.cursor(dictionary=True)
    # match any of common forms in DB (v10/v9/+972)
    v10 = d
    v9 = d[1:] if d and d.startswith("0") else d
    v972 = "+972" + (d[1:] if d and d.startswith("0") else d)

    cursor.execute(
        """
        SELECT c.*
        FROM cards c
        JOIN users u ON u.id = c.user_id
        WHERE u.phone IN (%s,%s,%s)
        """,
        (v10, v9, v972),
    )
    cards = cursor.fetchall()
    cursor.close()
    return jsonify({"cards": cards}), 200

@app.route("/get_card_details_by_email", methods=["GET"])
def get_card_details_by_email():
    email = (request.args.get("email") or "").strip().lower()
    if not email:
        return jsonify({"error": "Missing email parameter"}), 400

    cursor = db.cursor(dictionary=True)
    cursor.execute(
        """
        SELECT c.*
        FROM cards c
        JOIN users u ON u.id = c.user_id
        WHERE u.email=%s
        """,
        (email,),
    )
    cards = cursor.fetchall()
    cursor.close()
    return jsonify({"cards": cards}), 200

# ---------------------------
# Legacy: cards by car_number
# ---------------------------
@app.route("/get_card_details", methods=["GET"])
def get_card_details():
    car_number = request.args.get("car_number")
    if not car_number:
        return jsonify({"error": "Missing car_number"}), 400

    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM cards WHERE car_number=%s", (car_number,))
    rows = cursor.fetchall()
    cursor.close()
    return jsonify({"cards": rows}), 200

# ---------------------------
# Update/Upsert card by car_number (legacy)
# ---------------------------

@app.route("/update_user_details", methods=["PUT"])
def update_user_details():
    data = request.get_json() or {}
    phone = data.get("phone")
    name = data.get("name")
    address = data.get("address")
    password = data.get("password")

    if not phone:
        return jsonify({"success": False, "message": "Phone number is required"}), 400

    try:
        cursor = db.cursor(dictionary=True)

        # עדכון פרטי המשתמש לפי מספר טלפון
        cursor.execute(
            """
            UPDATE users
            SET name = %s, address = %s, password = %s
            WHERE phone = %s
            """,
            (name, address, password, phone)
        )
        db.commit()

        # הבאת המשתמש לאחר העדכון
        cursor.execute(
            "SELECT id, name, address, email, phone FROM users WHERE phone=%s",
            (phone,)
        )
        user = cursor.fetchone()
        cursor.close()

        if user:
            return jsonify({
                "success": True,
                "message": "Details updated successfully",
                "user": user
            }), 200
        else:
            return jsonify({"success": False, "message": "User not found"}), 404

    except Exception as e:
        if cursor:
            cursor.close()
        return jsonify({"success": False, "message": "Server error", "error": str(e)}), 500




@app.route("/update_card_details", methods=["POST"])
def update_card_details():
    data = request.get_json() or {}
    car_number = data.get("car_number")
    card_number = data.get("card_number")
    card_holder = data.get("card_holder")
    cvv = data.get("cvv")
    expiry_date = data.get("expiry_date")

    if not all([car_number, card_number, card_holder, cvv, expiry_date]):
        return jsonify({"message": "All fields are required"}), 400

    cursor = db.cursor(dictionary=True)

    cursor.execute("SELECT * FROM cards WHERE car_number=%s", (car_number,))
    existing = cursor.fetchone()
    try:
        if existing:
            cursor.execute(
                """
                UPDATE cards
                SET card_number=%s, card_holder=%s, cvv=%s, expiry_date=%s
                WHERE car_number=%s
                """,
                (card_number, card_holder, cvv, expiry_date, car_number),
            )
        else:
            # NOTE: This legacy insert won't set user_id. Prefer /add_card below.
            cursor.execute(
                """
                INSERT INTO cards (car_number, card_number, card_holder, cvv, expiry_date)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (car_number, card_number, card_holder, cvv, expiry_date),
            )
        db.commit()
        cursor.close()
        return jsonify({"message": "Card details saved successfully!"}), 200
    except mysql.connector.Error as err:
        db.rollback()
        cursor.close()
        return jsonify({"message": "Database error", "error": str(err)}), 500

# ---------------------------
# Save parking record
# ---------------------------
@app.route("/save_parking_record", methods=["POST"])
def save_parking_record():
    data = request.get_json() or {}

    car_number = data.get("car_number")
    location = data.get("location")
    parking_num = data.get("spot_id")
    entry_time = data.get("entry_time")
    exit_time = data.get("exit_time")
    amount = data.get("amount")

    if not all([car_number, location, entry_time, exit_time, amount, parking_num]):
        return jsonify({"message": "Missing required fields"}), 400

    try:
        entry_dt = datetime.strptime(entry_time, "%Y-%m-%dT%H:%M")
        exit_dt = datetime.strptime(exit_time, "%Y-%m-%dT%H:%M")
    except ValueError as ve:
        return jsonify({"message": "Invalid datetime format", "error": str(ve)}), 400

    if exit_dt <= entry_dt:
        return jsonify({"message": "Exit time must be after entry time"}), 400

    entry_full = entry_dt.strftime("%Y-%m-%d %H:%M:%S")
    exit_full = exit_dt.strftime("%Y-%m-%d %H:%M:%S")

    try:
        price = float(amount)
    except (TypeError, ValueError):
        return jsonify({"message": "Invalid amount format"}), 400

    duration_hours = round((exit_dt - entry_dt).total_seconds() / 3600, 2)

    cursor = db.cursor(dictionary=True)
   # בדיקה אם יש חפיפה לרכב אחר באותו חניה
    cursor.execute(
    """
    SELECT 1 FROM parking_records
    WHERE parking_num=%s
      AND location=%s
      AND %s < exitTime
      AND %s > entryTime
    """,
    (parking_num, location, exit_full, entry_full),
    )
    spot_overlap = cursor.fetchone()
    if spot_overlap:
        cursor.close()
        return jsonify({"message": "Spot is already taken during this time"}), 409


    cursor.execute(
        """
        INSERT INTO parking_records
        (car_number, parking_num, entryTime, exitTime, hours, price, location)
        VALUES (%s,%s,%s,%s,%s,%s,%s)
        """,
        (car_number, parking_num, entry_full, exit_full, duration_hours, price, location),
    )
    db.commit()
    cursor.close()
    return jsonify({"message": "Parking record saved successfully"}), 200

# ---------------------------
# Parking records (latest)
# ---------------------------
@app.route("/get_all_parking_records", methods=["GET"])
def get_all_parking_records():
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"message": "User ID is required"}), 400

    cursor = db.cursor(dictionary=True)
    cursor.execute(
        """
        SELECT pr.*
        FROM parking_records pr
        JOIN cars c ON pr.car_number = c.car_number
        WHERE c.user_id = %s
        ORDER BY pr.id DESC
        LIMIT 15
        """,
        (user_id,),
    )
    records = cursor.fetchall()
    cursor.close()

    return jsonify(records), 200

    def convert_record(r):
        return {
            "id": r["id"],
            "car_number": r["car_number"],
            "location": r["location"],
            "entryTime": r["entryTime"],
            "exitTime": r["exitTime"],
            "hours": float(r["hours"]) if isinstance(r["hours"], Decimal) else r["hours"],
            "price": float(r["price"]) if isinstance(r["price"], Decimal) else r["price"],
        }

    return jsonify([convert_record(r) for r in records]), 200

# ---------------------------
# Email verification
# ---------------------------
@app.route("/send_verification_code", methods=["POST"])
def send_verification_code():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    if not email:
        return jsonify({"message": "Email is required"}), 400

    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT 1 FROM users WHERE email=%s", (email,))
    if not cursor.fetchone():
        cursor.close()
        return jsonify({"message": "Email not found"}), 404
    cursor.close()

    code = str(random.randint(100000, 999999))
    verification_codes[email] = code

    try:
        msg = MIMEText(f"Your verification code is: {code}")
        msg["Subject"] = "SmartParking Verification Code"
        msg["From"] = "hosam.elhiga@gmail.com"
        msg["To"] = email

        server = smtplib.SMTP_SSL("smtp.gmail.com", 465)
        server.login("hosam.elhiga@gmail.com", "azsx qwfu xjzk mhhw")
        server.send_message(msg)
        server.quit()

        return jsonify({"message": "Verification code sent"}), 200
    except Exception as e:
        return jsonify({"message": "Failed to send email", "error": str(e)}), 500

@app.route("/verify_email_code", methods=["POST"])
def verify_email_code():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    code = (data.get("code") or "").strip()

    if not email or not code:
        return jsonify({"message": "Email and code are required"}), 400

    if verification_codes.get(email) == code:
        verification_codes.pop(email, None)
        return jsonify({"message": "Verification successful"}), 200

    return jsonify({"message": "Invalid or expired code"}), 401

@app.route("/verify_password_code", methods=["POST"])
def verify_password_code():
    data = request.get_json() or {}
    email = data.get("email")
    code = data.get("code")
    new_password = data.get("new_password")

    if not all([email, code, new_password]):
        return jsonify({"message": "Email, code and new password are required"}), 400

    if verification_codes.get(email) != code:
        return jsonify({"message": "Invalid or expired verification code"}), 401

    try:
        cursor = db.cursor()
        cursor.execute("UPDATE users SET password=%s WHERE email=%s", (new_password, email))
        db.commit()
        cursor.close()
        verification_codes.pop(email, None)
        return jsonify({"message": "Password updated successfully"}), 200
    except Exception as e:
        return jsonify({"message": "Failed to update password", "error": str(e)}), 500

# ---------------------------
# Verify CVV
# ---------------------------
@app.route("/verify_cvv", methods=["POST"])
def verify_cvv():
    data = request.get_json() or {}
    car_number = data.get("car_number")
    card_number = data.get("card_number")
    input_cvv = data.get("cvv")

    if not all([car_number, card_number, input_cvv]):
        return jsonify({"success": False, "message": "Missing data"}), 400

    try:
        cursor = db.cursor(dictionary=True, buffered=True)
        cursor.execute(
        "SELECT cvv FROM cards WHERE card_number=%s",
        (card_number,),
        )
        record = cursor.fetchone()
        print("DB record:", record)
        cursor.close()

        print("car_number:", car_number, "card_number:", card_number, "cvv:", input_cvv)

        if record and str(record["cvv"]) == str(input_cvv):
            return jsonify({"success": True}), 200
        return jsonify({"success": False, "message": "CVV does not match"}), 401
    except Exception as e:
        if cursor:
            cursor.close()
        return jsonify({"success": False, "message": "Server error", "error": str(e)}), 500


# ---------------------------
# Add card — sets user_id via cars
# ---------------------------
@app.route("/add_card", methods=["POST"])
def add_card():
    from datetime import date

    def digits(s): 
        return re.sub(r"\D", "", s or "")

    def parse_expiry(s):
        if not s:
            return None
        s = s.strip()
        if re.match(r"^\d{4}-\d{2}$", s):
            return datetime.strptime(s + "-01", "%Y-%m-%d").date()
        if re.match(r"^\d{4}-\d{2}-\d{2}$", s):
            return datetime.strptime(s, "%Y-%m-%d").date()
        if re.match(r"^\d{2}/\d{2}$", s):
            return datetime.strptime(s, "%m/%y").date().replace(day=1)
        return None

    data = request.get_json(force=True, silent=False)

    car_number = digits(data.get("car_number", ""))
    card_number = digits(data.get("card_number", ""))
    card_holder = (data.get("card_holder") or "").strip()
    cvv = digits(data.get("cvv", ""))
    expiry_date = parse_expiry(data.get("expiry_date", ""))

    if not (6 <= len(car_number) <= 8):
        return jsonify({"message": "Car number must be 6–8 digits."}), 400
    if not (13 <= len(card_number) <= 19):
        return jsonify({"message": "Card number length must be 13–19 digits."}), 400
    if not re.match(r"^\d{3}$", cvv):
        return jsonify({"message": "CVV must be 3 digits."}), 400
    if not isinstance(expiry_date, date):
        return jsonify({"message": "Expiry date format is invalid."}), 400

    cur = db.cursor(dictionary=True)
    cur.execute("SELECT user_id FROM cars WHERE car_number=%s LIMIT 1", (car_number,))
    r = cur.fetchone()
    user_id = r["user_id"] if r else None

    if not user_id:
        cur.close()
        return jsonify({"message": "User not found for this car number."}), 404

    try:
        cur.execute("""
            INSERT INTO cards (user_id, car_number, card_number, card_holder, cvv, expiry_date)
            VALUES (%s,%s,%s,%s,%s,%s)
        """, (user_id, car_number, card_number, card_holder, cvv, expiry_date))
        db.commit()
        cur.close()
        return jsonify({
            "success": True,
            "message": "Card added successfully."
        }), 201

    except mysql.connector.IntegrityError as e:
        db.rollback()
        cur.close()
        if getattr(e, "errno", None) == 1062:
            return jsonify({
                "success": False,
                "message": "This card is already saved for this car (duplicate)."
            }), 409
        return jsonify({"success": False, "message": "DB constraint error", "error": str(e)}), 500

    except Exception as e:
        db.rollback()
        cur.close()
        return jsonify({"success": False, "message": "Server error while adding card.", "error": str(e)}), 500


# ---------------------------
# Main
# ---------------------------
if __name__ == "__main__":
    app.run(debug=True)
