#include <DHT.h>  
#include <SoftwareSerial.h>  
// ----- Sensor Pin Definitions -----  
#define DHTPIN 4  
#define DHTTYPE DHT11  
DHT dht(DHTPIN, DHTTYPE);  
#define TRIG_PIN 9  
#define ECHO_PIN 10  
#define PIR_PIN 5  
#define RAIN_PIN 8      
#define SOIL_PIN A1    
   // digital D0 from rain module  
    // analog IN from M5 Earth sensor  
#define STATUS_LED 13      // optional: onboard LED for system status  
// ----- XBee via Software Serial ----- 
SoftwareSerial xbee(6, 7);  // RX, TX  
void setup() 
{   Serial.begin(9600);   
xbee.begin(9600);  
pinMode(TRIG_PIN, OUTPUT);   
pinMode(ECHO_PIN, INPUT);  
pinMode(PIR_PIN, INPUT);   
pinMode(RAIN_PIN, INPUT);  
pinMode(STATUS_LED, OUTPUT);  
dht.begin();  
Serial.println("System Initialized.");   
xbee.println("System Initialized.");  
}  
void loop() {  
digitalWrite(STATUS_LED, HIGH);  // Blink LED to show system is active  
// ----- DHT11 -----   float temperature = 
dht.readTemperature();   float humidity = 
dht.readHumidity();  
if (isnan(temperature) || isnan(humidity)) {  
Serial.println("Failed to read from DHT11 
sensor!");     temperature = -999;     humidity = -999;  
}  
// ----- PIR Motion -----  
int motion = digitalRead(PIR_PIN);  
// ----- Rain Sensor -----   int isRaining = digitalRead(RAIN_PIN);  // 
LOW = Rain, HIGH = No rain  
// ----- Soil Moisture -----   int soilValue = 
analogRead(SOIL_PIN);  // Lower = wetter  
// ----- Print to Serial Monitor -----  
Serial.println("\n----- Sensor Readings -----");  
Serial.print("Temperature: "); Serial.print(temperature); Serial.println(" °C");  
Serial.print("Humidity: "); Serial.print(humidity); Serial.println(" %");  
Serial.print("Motion Detected: "); Serial.println(motion == HIGH ? "YES" : "NO");  
Serial.print("Rain: "); Serial.println(isRaining == LOW ? "YES" : "NO");  
Serial.print("Soil Moisture (Analog): "); Serial.println(soilValue);   Serial.println("---------------------------");  
// ----- Send to XBee -----   xbee.println("Sensor Data:");   xbee.print("Temp: "); 
xbee.print(temperature); xbee.print(" C, ");   xbee.print("Humidity: "); 
xbee.print(humidity); xbee.print(" %, ");   xbee.print("Motion: "); xbee.print(motion == 
HIGH ? "YES" : "NO"); xbee.print(", ");   xbee.print("Rain: "); xbee.print(isRaining 
== LOW ? "YES" : "NO"); xbee.print(", ");   xbee.print("Soil: "); 
xbee.println(soilValue);  
digitalWrite(STATUS_LED, LOW);  // Blink off   
delay(2000);  // Wait 2 seconds before next read  
}