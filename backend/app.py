from flask import Flask, request, jsonify
import mysql.connector
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Connect to the database
db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="",
    database="smartparking"
)

@app.route('/')
def home():
    return "Welcome to the Smart Parking API!", 200

# Login endpoint
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()  # Get data from request
    email = data['email']
    password = data['password']

    # Check credentials in the database
    cursor = db.cursor(dictionary=True)  # Fetch results as a dictionary
    cursor.execute("SELECT * FROM users WHERE email = %s AND password = %s", (email, password))
    user = cursor.fetchone()  # Fetch one matching user

    if user:
        # Return the user's data including name and car_number
        return jsonify({
            "message": "Login successful!",
            "success": True,
            "user": {
                "name": user['name'],
                "email": user['email'],
                "car_number": user['car_number'],
                # Include other user details as needed
            }
        }), 200
    else:
        return jsonify({"message": "Invalid credentials", "success": False}), 401


# Register endpoint
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()  # Get data from request
    name = data['name']
    address = data['address']
    email = data['email']
    password = data['password']
    car_number = data['car_number']
    car_type = data['car_type']
    car_year = data['car_year']

    # Convert car_year to an integer for comparison
    try:
        car_year = int(car_year)  # Convert to integer
    except ValueError:
        return jsonify({"message": "Car year must be a valid number."}), 400

    # Validate car_year range after conversion
    if car_year < 1990 or car_year > 2025:
        return jsonify({"message": "Car year must be between 1990 and 2025"}), 400

    cursor = db.cursor()

    # Check if the email already exists
    cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
    existing_user = cursor.fetchone()
    if existing_user:
        return jsonify({"message": "Email already exists"}), 400

    # Check if the car number already exists
    cursor.execute("SELECT * FROM users WHERE car_number = %s", (car_number,))
    existing_car = cursor.fetchone()
    if existing_car:
        return jsonify({"message": "Car number already exists"}), 400

    # Insert new user with car details into the database
    cursor.execute(
        "INSERT INTO users (name, address, email, password, car_number, car_type, car_year) "
        "VALUES (%s, %s, %s, %s, %s, %s, %s)",
        (name, address, email, password, car_number, car_type, car_year)
    )
    db.commit()  # Save changes to the database

    # Returning a message saying the account has been created successfully and the email is created
    return jsonify({
        "message": "Account created successfully! The email has been created."
    }), 201


# Endpoint to fetch user details using car_number
@app.route('/get_user_details', methods=['GET'])
def get_user_details():
    car_number = request.args.get('car_number')  # Get car_number from the query parameter
    if not car_number:
        return jsonify({"message": "Car number is required"}), 400

    cursor = db.cursor(dictionary=True)

    # Fetch user details by car_number
    cursor.execute("""
        SELECT * FROM users
        WHERE car_number = %s
    """, (car_number,))

    user = cursor.fetchone()  # Fetch the user details

    if user:
        return jsonify({"user": user}), 200
    else:
        return jsonify({"message": "User not found"}), 404


# Endpoint to update user details (PUT method)
@app.route('/update_user_details', methods=['PUT'])
def update_user_details():
    data = request.get_json()  # Get data from the request

    # Extract data from request
    name = data.get('name')
    address = data.get('address')
    email = data.get('email')
    car_number = data.get('car_number')
    car_type = data.get('car_type')
    car_year = data.get('car_year')

    if not car_number:
        return jsonify({"message": "Car number is required"}), 400

    cursor = db.cursor(dictionary=True)

    # Check if the user exists
    cursor.execute("SELECT * FROM users WHERE car_number = %s", (car_number,))
    user = cursor.fetchone()

    if not user:
        return jsonify({"message": "User not found"}), 404

    # Update user details in the database
    cursor.execute("""
        UPDATE users
        SET name = %s, address = %s, email = %s, car_type = %s, car_year = %s
        WHERE car_number = %s
    """, (name, address, email, car_type, car_year, car_number))

    db.commit()  # Save changes to the database

    # Return the updated user details
    cursor.execute("SELECT * FROM users WHERE car_number = %s", (car_number,))
    updated_user = cursor.fetchone()

    return jsonify({"message": "User details updated successfully", "user": updated_user}), 200

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
        entry_time = data.get('entry_time')  # e.g., '2025-05-25T18:00'
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

        cursor = db.cursor()
        query = """
            INSERT INTO parking_records (car_number, location, entryTime, exitTime, hours, price)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        cursor.execute(query, (
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
        cursor = db.cursor(dictionary=True)
        cursor.execute("""
            SELECT * FROM parking_records 
            LIMIT 15
        """)
        records = cursor.fetchall()

        # Convert non-JSON-serializable fields
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

        records = [convert_record(r) for r in records]

        return jsonify(records), 200

    except Exception as e:
        print("❌ Error fetching parking records:", e)
        return jsonify({"message": "Error fetching records", "error": str(e)}), 500




if __name__ == '__main__':
    app.run(debug=True)
