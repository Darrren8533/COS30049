import serial
import time
import mysql.connector
from datetime import datetime
import re

# Define serial port and baud rate
port = 'COM4'  
baudrate = 9600

# MySQL Database setup
db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': 'parkguide'
}

# More flexible sensor data extraction patterns
patterns = {
    # Try multiple possible formats for temperature
    'temperature': [
        r'🌡 Temp: ([\d.]+)',
        r'Temperature: ([\d.]+)',
        r'Temp: ([\d.]+)',
        r'🌡.*?(\d+\.\d+)'
    ],
    # Try multiple possible formats for humidity
    'humidity': [
        r'💧 Humidity: ([\d.]+)',
        r'Humidity: ([\d.]+)',
        r'💧.*?(\d+\.\d+)'
    ],
    # Try multiple possible formats for motion
    'motion': [
        r'🧍 PIR Status: (Motion Detected|No Motion)',
        r'Motion Detected \(PIR\): (YES|NO)',
        r'PIR Status: (Motion Detected|No Motion)',
        r'Motion Detected'
    ],
    # Try multiple possible formats for rain
    'rain': [
        r'☔ Rain: (YES|NO)',
        r'Rain: (YES|NO)'
    ],
    # Try multiple possible formats for soil moisture
    'soil_moisture': [
        r'🌱 Soil Moisture: (\d+)',
        r'Soil Moisture: (\d+)',
        r'🌱.*?(\d+)'
    ]
}

# Function to verify data insertion by retrieving the latest record
def verify_data_insertion(conn, cursor):
    try:
        # Create a new cursor for this operation to avoid result set conflicts
        verify_cursor = conn.cursor()
        verify_cursor.execute("SELECT * FROM sensor_readings ORDER BY id DESC LIMIT 1")
        record = verify_cursor.fetchone()
        verify_cursor.close()  # Close the cursor when done
        
        if record:
            print("\n== VERIFICATION: Last Record in Database ==")
            print(f"ID: {record[0]}")
            print(f"Timestamp: {record[1]}")
            print(f"Temperature: {record[2]}°C")
            print(f"Humidity: {record[3]}%")
            print(f"Motion: {'YES' if record[4] else 'NO'}")
            print(f"Rain: {'YES' if record[5] else 'NO'}")
            print(f"Soil Moisture: {record[6]}")
            print("== Data successfully inserted and verified ==\n")
            return True
        else:
            print("No records found in database.")
            return False
    except mysql.connector.Error as e:
        print(f"Verification error: {e}")
        return False

# Function to ensure database connection is active and clean
def ensure_db_connection():
    global conn, cursor
    try:
        # Try a simple query to test connection
        try:
            cursor.execute("SELECT 1")
            # Fetch and discard any results to avoid "Unread result found" errors
            cursor.fetchall()
            return True
        except mysql.connector.Error:
            # Close existing connection if it exists
            try:
                if cursor:
                    cursor.close()
                if conn:
                    conn.close()
            except:
                pass
            
            # Create new connection
            print("Reconnecting to database...")
            conn = mysql.connector.connect(**db_config)
            cursor = conn.cursor()
            print("Database reconnection successful")
            return True
    except mysql.connector.Error as e:
        print(f"Failed to reconnect to database: {e}")
        return False

# Function to safely execute a database query with proper error handling
def safe_execute_query(query, params=None):
    global conn, cursor
    
    try:
        # Ensure connection is good
        if not ensure_db_connection():
            return False
            
        # Execute the query
        cursor.execute(query, params)
        
        # Commit the transaction for INSERT/UPDATE/DELETE
        if query.strip().upper().startswith(("INSERT", "UPDATE", "DELETE")):
            conn.commit()
            
        # For SELECT queries, fetch and return results
        if query.strip().upper().startswith("SELECT"):
            return cursor.fetchall()
            
        return True
    except mysql.connector.Error as e:
        print(f"Database query error: {e}")
        return False

try:
    # Connect to MySQL
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()
    
    # Create more structured table for sensor data if it doesn't exist
    safe_execute_query('''
    CREATE TABLE IF NOT EXISTS sensor_readings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        timestamp DATETIME,
        temperature FLOAT,
        humidity FLOAT,
        motion BOOLEAN,
        rain BOOLEAN,
        soil_moisture INT,
        raw_data TEXT
    )
    ''')
    print("Successfully connected to database and verified tables")
    
    # Initialize serial connection
    ser = serial.Serial(port, baudrate, timeout=1)
    print(f"Connected to {port} at {baudrate} baud")
    
    # Wait for Arduino to initialize
    time.sleep(2)
    
    reading_group = []
    is_collecting_group = False
    
    # Continuously read and print serial data
    while True:
        if ser.in_waiting > 0:
            timestamp = datetime.now()
            line = ser.readline().decode('utf-8', errors='replace').strip()
            print(f"[{timestamp}] {line}")
            
            # Check if this is the start of a reading group (multiple possible markers)
            if "--- Sensor Readings ---" in line or "🔎 ---" in line:
                reading_group = []
                is_collecting_group = True
                print("Started collecting sensor readings")
                continue
            
            # Check if this is the end of a reading group (empty line or specific marker)
            if (line == "" or "---" in line) and is_collecting_group and len(reading_group) > 0:
                is_collecting_group = False
                print("Finished collecting sensor readings, processing data...")
                
                # Print all collected raw data for debugging
                print("\n=== RAW SENSOR DATA ===")
                for i, line in enumerate(reading_group):
                    print(f"Line {i+1}: {line}")
                print("=======================\n")
                
                # Process the collected group
                if reading_group:
                    # Initialize values
                    temperature = None
                    humidity = None
                    motion = None
                    rain = None
                    soil_moisture = None
                    
                    # Join all lines for raw data storage
                    raw_data = "\n".join(reading_group)
                    
                    # First try to extract values from individual lines
                    for line in reading_group:
                        # Try to extract temperature
                        if temperature is None:
                            temp_value = None
                            for pattern in patterns['temperature']:
                                match = re.search(pattern, line)
                                if match:
                                    temp_value = match.group(1)
                                    break
                            
                            if temp_value:
                                try:
                                    temperature = float(temp_value)
                                    print(f"Parsed temperature: {temperature}°C from line: {line}")
                                except ValueError:
                                    print(f"Failed to convert temperature: {temp_value}")
                        
                        # Try to extract humidity
                        if humidity is None:
                            humidity_value = None
                            for pattern in patterns['humidity']:
                                match = re.search(pattern, line)
                                if match:
                                    humidity_value = match.group(1)
                                    break
                            
                            if humidity_value:
                                try:
                                    humidity = float(humidity_value)
                                    print(f"Parsed humidity: {humidity}% from line: {line}")
                                except ValueError:
                                    print(f"Failed to convert humidity: {humidity_value}")
                        
                        # Try to extract motion
                        if motion is None:
                            for pattern in patterns['motion']:
                                match = re.search(pattern, line)
                                if match:
                                    if "Motion Detected" in line:
                                        motion = 1
                                    elif "No Motion" in line:
                                        motion = 0
                                    elif match.groups():
                                        value = match.group(1)
                                        motion = 1 if value in ["YES", "Motion Detected"] else 0
                                    else:
                                        motion = 1
                                    print(f"Parsed motion: {'Detected' if motion else 'None'} from line: {line}")
                                    break
                        
                        # Try to extract rain
                        if rain is None:
                            for pattern in patterns['rain']:
                                match = re.search(pattern, line)
                                if match:
                                    value = match.group(1)
                                    rain = 1 if value == "YES" else 0
                                    print(f"Parsed rain: {'YES' if rain else 'NO'} from line: {line}")
                                    break
                        
                        # Try to extract soil moisture
                        if soil_moisture is None:
                            soil_value = None
                            for pattern in patterns['soil_moisture']:
                                match = re.search(pattern, line)
                                if match:
                                    soil_value = match.group(1)
                                    break
                            
                            if soil_value:
                                try:
                                    soil_moisture = int(soil_value)
                                    print(f"Parsed soil moisture: {soil_moisture} from line: {line}")
                                except ValueError:
                                    print(f"Failed to convert soil moisture: {soil_value}")
                    
                    # If still missing values, try looking in the entire raw data
                    if temperature is None:
                        print("Trying to extract temperature from entire data...")
                        for pattern in patterns['temperature']:
                            match = re.search(pattern, raw_data)
                            if match:
                                try:
                                    temperature = float(match.group(1))
                                    print(f"Parsed temperature from full data: {temperature}°C")
                                    break
                                except ValueError:
                                    continue
                    
                    if humidity is None:
                        print("Trying to extract humidity from entire data...")
                        for pattern in patterns['humidity']:
                            match = re.search(pattern, raw_data)
                            if match:
                                try:
                                    humidity = float(match.group(1))
                                    print(f"Parsed humidity from full data: {humidity}%")
                                    break
                                except ValueError:
                                    continue
                    
                    if soil_moisture is None:
                        print("Trying to extract soil moisture from entire data...")
                        for pattern in patterns['soil_moisture']:
                            match = re.search(pattern, raw_data)
                            if match:
                                try:
                                    soil_moisture = int(match.group(1))
                                    print(f"Parsed soil moisture from full data: {soil_moisture}")
                                    break
                                except ValueError:
                                    continue
                    
                    # Use default values if certain sensors aren't available
                    if rain is None:
                        rain = 0  # Default to no rain if not detected
                        print("Rain data not found, defaulting to NO")
                    
                    if motion is None and "Motion Detected" in raw_data:
                        motion = 1
                        print("Motion data extracted from raw text: Motion Detected")
                    elif motion is None:
                        motion = 0  # Default to no motion if not detected
                        print("Motion data not found, defaulting to NO")
                    
                    # Final data summary
                    print("\n=== PARSED SENSOR DATA ===")
                    print(f"Temperature: {temperature}°C")
                    print(f"Humidity: {humidity}%")
                    print(f"Motion: {'YES' if motion else 'NO'}")
                    print(f"Rain: {'YES' if rain else 'NO'}")
                    print(f"Soil Moisture: {soil_moisture}")
                    print("=========================\n")
                    
                    # Only insert if we have valid temperature and humidity readings
                    if temperature is not None and humidity is not None and soil_moisture is not None:
                        # Use our safe query execution function
                        insert_success = safe_execute_query('''
                        INSERT INTO sensor_readings 
                        (timestamp, temperature, humidity, motion, rain, soil_moisture, raw_data) 
                        VALUES (%s, %s, %s, %s, %s, %s, %s)
                        ''', (timestamp, temperature, humidity, motion, rain, soil_moisture, raw_data))
                        
                        if insert_success:
                            print(f"[{timestamp}] Stored sensor readings in database:")
                            print(f"  Temperature: {temperature}°C")
                            print(f"  Humidity: {humidity}%")
                            print(f"  Motion: {'YES' if motion else 'NO'}")
                            print(f"  Rain: {'YES' if rain else 'NO'}")
                            print(f"  Soil Moisture: {soil_moisture}")
                            print("-" * 40)
                            
                            # Verify data insertion
                            verify_data_insertion(conn, cursor)
                        else:
                            print("Failed to insert data into database")
                    else:
                        print(f"[{timestamp}] Incomplete sensor data, not storing in database")
                        print(f"  Temperature: {temperature}")
                        print(f"  Humidity: {humidity}")
                        print(f"  Motion: {motion}")
                        print(f"  Rain: {rain}")
                        print(f"  Soil Moisture: {soil_moisture}")
                
                continue
            
            # If we're collecting a group, add this line
            if is_collecting_group:
                reading_group.append(line)

except mysql.connector.Error as e:
    # Handle database connection errors
    print(f"Database error: {e}")
except serial.SerialException as e:
    # Handle serial connection errors
    print(f"Serial error: {e}")
except KeyboardInterrupt:
    # Handle user termination (Ctrl+C)
    print("\nProgram terminated by user")
except Exception as e:
    # Handle other unexpected errors
    print(f"Unexpected error: {e}")
finally:
    # Ensure serial port is closed when the program exits
    if 'ser' in locals() and ser.is_open:
        ser.close()
        print("Serial port closed")
    
    # Close database connection
    if 'conn' in locals() and 'cursor' in locals():
        try:
            cursor.close()
            conn.close()
            print("Database connection closed")
        except:
            print("Error while closing database connection")
