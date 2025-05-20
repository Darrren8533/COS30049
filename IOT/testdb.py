import mysql.connector
from datetime import datetime, timedelta

# MySQL Database setup
db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': 'parkguide'
}

def check_database_connection():
    """Test if database connection works"""
    try:
        conn = mysql.connector.connect(**db_config)
        print("✅ Database connection successful")
        return conn
    except mysql.connector.Error as e:
        print(f"❌ Database connection failed: {e}")
        return None

def count_records():
    """Count total records in sensor_readings table"""
    try:
        conn = check_database_connection()
        if not conn:
            return
        
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM sensor_readings")
        count = cursor.fetchone()[0]
        print(f"\n📊 Total records in sensor_readings: {count}")
        
        cursor.close()
        conn.close()
    except mysql.connector.Error as e:
        print(f"Error counting records: {e}")

def get_latest_records(limit=5):
    """Retrieve and display the latest records"""
    try:
        conn = check_database_connection()
        if not conn:
            return
        
        cursor = conn.cursor()
        cursor.execute(f"SELECT * FROM sensor_readings ORDER BY id DESC LIMIT {limit}")
        records = cursor.fetchall()
        
        if records:
            print(f"\n📋 Latest {len(records)} sensor records:")
            print("-" * 80)
            print(f"{'ID':<5} {'Timestamp':<20} {'Temp(°C)':<10} {'Humidity(%)':<12} {'Motion':<8} {'Rain':<6} {'Soil Moisture':<15}")
            print("-" * 80)
            
            for record in records:
                id, timestamp, temp, humidity, motion, rain, soil, _ = record
                print(f"{id:<5} {timestamp.strftime('%Y-%m-%d %H:%M:%S'):<20} {temp:<10.1f} {humidity:<12.1f} {'YES' if motion else 'NO':<8} {'YES' if rain else 'NO':<6} {soil:<15}")
            
            print("-" * 80)
        else:
            print("\n❌ No records found in the database")
        
        cursor.close()
        conn.close()
    except mysql.connector.Error as e:
        print(f"Error retrieving records: {e}")

def get_records_by_time_range(hours=24):
    """Get records from the last specified hours"""
    try:
        conn = check_database_connection()
        if not conn:
            return
        
        cursor = conn.cursor()
        
        # Calculate time range
        end_time = datetime.now()
        start_time = end_time - timedelta(hours=hours)
        
        cursor.execute("""
            SELECT * FROM sensor_readings 
            WHERE timestamp BETWEEN %s AND %s
            ORDER BY timestamp DESC
        """, (start_time, end_time))
        
        records = cursor.fetchall()
        
        if records:
            print(f"\n⏰ Records from the last {hours} hours: {len(records)} found")
            print("-" * 80)
            print(f"{'ID':<5} {'Timestamp':<20} {'Temp(°C)':<10} {'Humidity(%)':<12} {'Motion':<8} {'Rain':<6} {'Soil Moisture':<15}")
            print("-" * 80)
            
            for record in records:
                id, timestamp, temp, humidity, motion, rain, soil, _ = record
                print(f"{id:<5} {timestamp.strftime('%Y-%m-%d %H:%M:%S'):<20} {temp:<10.1f} {humidity:<12.1f} {'YES' if motion else 'NO':<8} {'YES' if rain else 'NO':<6} {soil:<15}")
            
            print("-" * 80)
        else:
            print(f"\n❌ No records found in the last {hours} hours")
        
        cursor.close()
        conn.close()
    except mysql.connector.Error as e:
        print(f"Error retrieving time-based records: {e}")

def calculate_statistics():
    """Calculate basic statistics from sensor data"""
    try:
        conn = check_database_connection()
        if not conn:
            return
        
        cursor = conn.cursor()
        
        # Get statistics for numerical values
        cursor.execute("""
            SELECT 
                AVG(temperature) as avg_temp,
                MIN(temperature) as min_temp,
                MAX(temperature) as max_temp,
                AVG(humidity) as avg_humidity,
                MIN(humidity) as min_humidity,
                MAX(humidity) as max_humidity,
                AVG(soil_moisture) as avg_soil,
                MIN(soil_moisture) as min_soil,
                MAX(soil_moisture) as max_soil,
                SUM(CASE WHEN motion = 1 THEN 1 ELSE 0 END) as motion_count,
                SUM(CASE WHEN rain = 1 THEN 1 ELSE 0 END) as rain_count,
                COUNT(*) as total_records
            FROM sensor_readings
        """)
        
        stats = cursor.fetchone()
        
        if stats and stats[-1] > 0:  # If total_records > 0
            print("\n📈 Sensor Data Statistics:")
            print("-" * 50)
            print(f"Total Records: {stats[11]}")
            print(f"Temperature (°C): Avg={stats[0]:.1f}, Min={stats[1]:.1f}, Max={stats[2]:.1f}")
            print(f"Humidity (%): Avg={stats[3]:.1f}, Min={stats[4]:.1f}, Max={stats[5]:.1f}")
            print(f"Soil Moisture: Avg={stats[6]:.1f}, Min={stats[7]}, Max={stats[8]}")
            print(f"Motion Detected: {stats[9]} times ({(stats[9]/stats[11]*100):.1f}% of readings)")
            print(f"Rain Detected: {stats[10]} times ({(stats[10]/stats[11]*100):.1f}% of readings)")
            print("-" * 50)
        else:
            print("\n❌ No data available for statistics")
        
        cursor.close()
        conn.close()
    except mysql.connector.Error as e:
        print(f"Error calculating statistics: {e}")

if __name__ == "__main__":
    print("===== IoT Sensor Database Verification Tool =====")
    
    # Run all checks
    count_records()
    get_latest_records(10)
    get_records_by_time_range(24)
    calculate_statistics()
    
    print("\n✅ Database verification complete") 