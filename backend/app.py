from flask import Flask, request, jsonify
import mysql.connector
from flask_cors import CORS
import random
import smtplib
from email.mime.text import MIMEText
from datetime import datetime, timedelta
from decimal import Decimal

# App and config
app = Flask(__name__)
CORS(app)
verification_codes = {}

# DB connection
db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="",
    database="smartparking"
)

@app.route('/')
def home():
    return "Welcome to the Smart Parking API!", 200

# User login
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email, password = data['email'], data['password']

    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM users WHERE email = %s AND password = %s", (email, password))
    user = cursor.fetchone()

    if user:
        return jsonify({
            "message": "Login successful!",
            "success": True,
            "user": {
                "name": user['name'],
                "email": user['email'],
                "car_number": user['car_number']
            }
        }), 200
    else:
        return jsonify({"message": "Invalid credentials", "success": False}), 401

# Register user
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    try:
        name, address, email, password = data['name'], data['address'], data['email'], data['password']
        car_number, car_type, car_year = data['car_number'], data['car_type'], int(data['car_year'])
        if car_year < 1990 or car_year > 2025:
            return jsonify({"message": "Car year must be between 1990 and 2025"}), 400

        cursor = db.cursor()
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        if cursor.fetchone():
            return jsonify({"message": "Email already exists"}), 400

        cursor.execute("SELECT * FROM users WHERE car_number = %s", (car_number,))
        if cursor.fetchone():
            return jsonify({"message": "Car number already exists"}), 400

        cursor.execute("""
            INSERT INTO users (name, address, email, password, car_number, car_type, car_year)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (name, address, email, password, car_number, car_type, car_year))
        db.commit()
        return jsonify({"message": "Account created successfully!"}), 201

    except Exception as e:
        return jsonify({"message": "Registration failed", "error": str(e)}), 500

@app.route('/get_user_details', methods=['GET'])
def get_user_details():
    car_number = request.args.get('car_number')
    if not car_number:
        return jsonify({"message": "Car number is required"}), 400
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM users WHERE car_number = %s", (car_number,))
    user = cursor.fetchone()
    return jsonify({"user": user}) if user else (jsonify({"message": "User not found"}), 404)

@app.route('/update_user_details', methods=['PUT'])
def update_user_details():
    data = request.get_json()
    required_fields = ['name', 'address', 'email', 'car_number', 'car_type', 'car_year', 'password']
    if not all(field in data for field in required_fields):
        return jsonify({"message": "Missing fields"}), 400

    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM users WHERE car_number = %s", (data['car_number'],))
    if not cursor.fetchone():
        return jsonify({"message": "User not found"}), 404

    cursor.execute("""
        UPDATE users
        SET name = %s, address = %s, password = %s, email = %s, car_type = %s, car_year = %s
        WHERE car_number = %s
    """, (data['name'], data['address'], data['password'], data['email'], data['car_type'], data['car_year'], data['car_number']))
    db.commit()
    cursor.execute("SELECT * FROM users WHERE car_number = %s", (data['car_number'],))
    return jsonify({"message": "User details updated successfully", "user": cursor.fetchone()}), 200

@app.route('/search_parking', methods=['GET'])
def search_parking():
    # Get car_number from query parameters
    car_number = request.args.get('car_number', '')  # Get car_number from the query parameter

    if not car_number:
        return jsonify({"message": "Car number is required"}), 400  # Return error if car_number is not provided

    # Query the parking_records table for all records with the provided car_number
    cursor = db.cursor(dictionary=True)

    # Query the database to fetch all parking records that match the car_number
    cursor.execute("""
        SELECT * FROM parking_records
        WHERE car_number = %s
    """, (car_number,))

    records = cursor.fetchall()  # Fetch all matching records

    if records:
        return jsonify(records)  # Return the data as JSON if records found
    else:
        return jsonify({"message": "No parking records found for this car number"}), 404  # Return a message if no records found
    
@app.route('/get_card_details', methods=['GET'])
def get_card_details():
    car_number = request.args.get('car_number')

    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM cards WHERE car_number = %s", (car_number,))
    card = cursor.fetchone()

    if card:
        return jsonify({"card": card}), 200
    else:
        return jsonify({"message": "No card details found"}), 404

@app.route('/update_card_details', methods=['POST'])
def update_card_details():
    data = request.get_json()

    # Extract data from the request
    car_number = data.get('car_number')
    card_number = data.get('card_number')
    card_holder = data.get('card_holder')
    cvv = data.get('cvv')
    expiry_date = data.get('expiry_date')

    # Validate all fields are provided
    if not all([car_number, card_number, card_holder, cvv, expiry_date]):
        return jsonify({"message": "All fields are required"}), 400

    cursor = db.cursor(dictionary=True)

    # Check if the card details already exist for this car_number
    cursor.execute("SELECT * FROM cards WHERE car_number = %s", (car_number,))
    existing_card = cursor.fetchone()

    try:
        if existing_card:
            # ✅ If card exists, update it
            cursor.execute("""
                UPDATE cards 
                SET card_number=%s, card_holder=%s, cvv=%s, expiry_date=%s 
                WHERE car_number=%s
            """, (card_number, card_holder, cvv, expiry_date, car_number))
        else:
            # ✅ If no card exists, insert a new record
            cursor.execute("""
                INSERT INTO cards (car_number, card_number, card_holder, cvv, expiry_date) 
                VALUES (%s, %s, %s, %s, %s)
            """, (car_number, card_number, card_holder, cvv, expiry_date))

        db.commit()  # Save changes
        return jsonify({"message": "Card details saved successfully!"}), 200

    except mysql.connector.Error as err:
        return jsonify({"message": "Database error", "error": str(err)}), 500



# @app.route('/save_parking_record', methods=['POST'])
# def save_parking_record():
#     try:
#         data = request.get_json()
#         print("📦 Received:", data)

#         car_number = data.get('car_number')
#         location = data.get('location')
#         entry_time = data.get('entry_time')
#         exit_time = data.get('exit_time')
#         price = float(data.get('amount'))

#         if not all([car_number, location, entry_time, exit_time, price]):
#             return jsonify({'message': 'Missing required fields'}), 400

#         # ✅ המרה לפורמט שעה בלבד
#         try:
#             entry_dt = datetime.fromisoformat(entry_time)
#             exit_dt = datetime.fromisoformat(exit_time)
#         except ValueError as ve:
#             print("❌ datetime parse error:", ve)
#             return jsonify({'message': 'Invalid datetime format'}), 400

#         entry_only_time = entry_dt.strftime('%H:%M:%S')
#         exit_only_time = exit_dt.strftime('%H:%M:%S')

#         # ✅ חישוב מספר שעות
#         duration_hours = round((exit_dt - entry_dt).total_seconds() / 3600, 2)

#         print(f"✅ Parsed entry: {entry_only_time}, exit: {exit_only_time}, hours: {duration_hours}, price: {price}")

#         cursor = db.cursor()
#         query = """
#             INSERT INTO parking_records (car_number, location, entryTime, exitTime, hours, price)
#             VALUES (%s, %s, %s, %s, %s, %s)
#         """
#         cursor.execute(query, (
#             car_number,
#             location,
#             entry_only_time,
#             exit_only_time,
#             duration_hours,
#             price
#         ))
#         db.commit()
#         cursor.close()

#         return jsonify({'message': 'Parking record saved successfully'}), 200

#     except Exception as e:
#         import traceback
#         traceback.print_exc()
#         return jsonify({'message': 'Error saving parking record', 'error': str(e)}), 500


@app.route('/save_parking_record', methods=['POST'])
def save_parking_record():
    try:
        data = request.get_json()

        car_number = data.get('car_number')
        location = data.get('location')
        entry_time = data.get('entry_time')  # '2025-06-01T15:00'
        exit_time = data.get('exit_time')
        price = float(data.get('amount'))

        if not all([car_number, location, entry_time, exit_time, price]):
            return jsonify({'message': 'Missing required fields'}), 400

        from datetime import datetime
        entry_dt = datetime.fromisoformat(entry_time)
        exit_dt = datetime.fromisoformat(exit_time)
        entry_only_time = entry_dt.strftime('%H:%M:%S')
        exit_only_time = exit_dt.strftime('%H:%M:%S')
        duration_hours = round((exit_dt - entry_dt).total_seconds() / 3600, 2)

        cursor = db.cursor(dictionary=True)

        # ✅ Check for overlap: any record where (new entry < existing exit) AND (new exit > existing entry)
        cursor.execute("""
            SELECT * FROM parking_records
            WHERE car_number = %s
              AND %s < exitTime
              AND %s > entryTime
        """, (car_number, exit_only_time, entry_only_time))
        
        overlap = cursor.fetchone()
        if overlap:
            return jsonify({'message': 'Car is already parked during this time'}), 409

        # ✅ Insert the new parking record
        cursor.execute("""
            INSERT INTO parking_records (car_number, location, entryTime, exitTime, hours, price)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            car_number,
            location,
            entry_only_time,
            exit_only_time,
            duration_hours,
            price
        ))
        db.commit()
        cursor.close()

        return jsonify({'message': 'Parking record saved successfully'}), 200

    except Exception as e:
        print("🔥 ERROR:", str(e))
        return jsonify({'message': 'Error saving parking record', 'error': str(e)}), 500

from datetime import timedelta
from decimal import Decimal

@app.route('/get_all_parking_records', methods=['GET'])
def get_all_parking_records():
    try:
        from datetime import timedelta
        from decimal import Decimal

        car_number = request.args.get('car_number')

        if not car_number:
            return jsonify({'message': 'Car number is required'}), 400

        cursor = db.cursor(dictionary=True)
        cursor.execute("""
            SELECT * FROM parking_records
            WHERE car_number = %s
            ORDER BY id DESC
            LIMIT 15
        """, (car_number,))
        records = cursor.fetchall()

        def convert_record(record):
            return {
                "id": record["id"],
                "car_number": record["car_number"],
                "location": record["location"],
                "entryTime": str(record["entryTime"]) if isinstance(record["entryTime"], timedelta) else record["entryTime"],
                "exitTime": str(record["exitTime"]) if isinstance(record["exitTime"], timedelta) else record["exitTime"],
                "hours": float(record["hours"]) if isinstance(record["hours"], Decimal) else record["hours"],
                "price": float(record["price"]) if isinstance(record["price"], Decimal) else record["price"],
            }

        return jsonify([convert_record(r) for r in records]), 200

    except Exception as e:
        print("❌ Error fetching parking records:", e)
        return jsonify({"message": "Error fetching records", "error": str(e)}), 500

@app.route('/send_verification_code', methods=['POST'])
def send_verification_code():
    data = request.get_json()
    email = data.get('email')
    if not email:
        return jsonify({'message': 'Email is required'}), 400

    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
    if not cursor.fetchone():
        return jsonify({'message': 'Email not found'}), 404

    code = str(random.randint(100000, 999999))
    verification_codes[email] = code

    try:
        msg = MIMEText(f'Your verification code is: {code}')
        msg['Subject'] = 'SmartParking Verification Code'
        msg['From'] = 'hosam.elhiga@gmail.com'
        msg['To'] = email

        server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
        server.login('hosam.elhiga@gmail.com', 'sxdb kdyn nbfo aezb')
        server.send_message(msg)
        server.quit()

        return jsonify({'message': 'Verification code sent'}), 200
    except Exception as e:
        return jsonify({'message': 'Failed to send email', 'error': str(e)}), 500

@app.route('/verify_email_code', methods=['POST'])
def verify_email_code():
    data = request.get_json()
    email, code = data.get('email'), data.get('code')
    if not email or not code:
        return jsonify({'message': 'Email and code are required'}), 400
    if verification_codes.get(email) == code:
        verification_codes.pop(email, None)
        return jsonify({'message': 'Verification successful'}), 200
    return jsonify({'message': 'Invalid or expired code'}), 401

@app.route('/verify_password_code', methods=['POST'])
def verify_password_code():
    data = request.get_json()
    email = data.get('email')
    code = data.get('code')
    new_password = data.get('new_password')

    if not all([email, code, new_password]):
        return jsonify({'message': 'Email, code and new password are required'}), 400

    # DEBUG: Show stored vs received code
    print(f"DEBUG: stored={verification_codes.get(email)}, received={code}")

    stored_code = verification_codes.get(email)
    if not stored_code or stored_code != code:
        return jsonify({'message': 'Invalid or expired verification code'}), 401

    try:
        cursor = db.cursor()
        cursor.execute("UPDATE users SET password = %s WHERE email = %s", (new_password, email))
        db.commit()

        # Remove the code after use
        verification_codes.pop(email, None)

        return jsonify({'message': 'Password updated successfully'}), 200
    except Exception as e:
        print("🔥 ERROR:", str(e))
        return jsonify({'message': 'Failed to update password', 'error': str(e)}), 500

@app.route('/verify_cvv', methods=['POST'])
def verify_cvv():
    data = request.get_json()
    car_number = data.get('car_number')
    input_cvv = data.get('cvv')

    if not car_number or not input_cvv:
        return jsonify({'success': False, 'message': 'Missing car number or CVV'}), 400

    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT cvv FROM cards WHERE car_number = %s", (car_number,))
    record = cursor.fetchone()

    if record and record['cvv'] == input_cvv:
        return jsonify({'success': True}), 200
    else:
        return jsonify({'success': False, 'message': 'CVV does not match'}), 401


if __name__ == '__main__':
    app.run(debug=True)