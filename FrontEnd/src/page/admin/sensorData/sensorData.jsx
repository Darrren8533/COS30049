import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import AdminSidebar from '../../../components/AdminSidebar/AdminSidebar';
import './sensorData.css';

// API base URL
const API_BASE_URL = 'http://localhost:3000'; // Modify according to your backend server address

// Custom icons for different sensor types
const SoilMoistureIcon = () => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor">
    <path d="M12,20C8.69,20 6,17.31 6,14C6,10 12,3.25 12,3.25C12,3.25 18,10 18,14C18,17.31 15.31,20 12,20Z" />
  </svg>
);

const RainIcon = () => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor">
    <path d="M12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,2L14.39,5.42C13.65,5.15 12.84,5 12,5C11.16,5 10.35,5.15 9.61,5.42L12,2M3.34,7L7.5,6.65C6.9,7.16 6.36,7.78 5.94,8.5C5.5,9.24 5.25,10 5.11,10.79L3.34,7M3.36,17L5.12,13.23C5.26,14 5.53,14.78 5.95,15.5C6.37,16.24 6.91,16.86 7.5,17.37L3.36,17M20.65,7L18.88,10.79C18.74,10 18.47,9.23 18.05,8.5C17.63,7.78 17.1,7.15 16.5,6.64L20.65,7M20.64,17L16.5,17.36C17.09,16.85 17.62,16.22 18.04,15.5C18.46,14.77 18.73,14 18.87,13.21L20.64,17M12,22L9.59,18.56C10.33,18.83 11.14,19 12,19C12.82,19 13.63,18.83 14.37,18.56L12,22Z" />
  </svg>
);

const MotionIcon = () => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor">
    <path d="M13.5,5.5C14.59,5.5 15.5,4.58 15.5,3.5C15.5,2.38 14.59,1.5 13.5,1.5C12.39,1.5 11.5,2.38 11.5,3.5C11.5,4.58 12.39,5.5 13.5,5.5M9.89,19.38L10.89,15L13,17V23H15V15.5L12.89,13.5L13.5,10.5C14.79,12 16.79,13 19,13V11C17.09,11 15.5,10 14.69,8.58L13.69,7C13.29,6.38 12.69,6 12,6C11.69,6 11.5,6.08 11.19,6.08L6,8.28V13H8V9.58L9.79,8.88L8.19,17L3.29,16L2.89,18L9.89,19.38Z" />
  </svg>
);

// New icon replacements
const FireIcon = () => <span className="icon-container" style={{ fontSize: '18px', color: '#ff4d4f' }}>🔥</span>;
const ThunderIcon = () => <span className="icon-container" style={{ fontSize: '18px', color: '#1890ff' }}>⚡</span>;
const DashboardIcon = () => <span className="icon-container" style={{ fontSize: '18px' }}>📊</span>;
const WarningIcon = () => <span className="icon-container" style={{ fontSize: '18px', color: '#faad14' }}>⚠️</span>;

const SensorData = () => {
  const [activeLink, setActiveLink] = useState('sensorData');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [latestData, setLatestData] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [dateRange, setDateRange] = useState([null, null]);
  const [chartData, setChartData] = useState([]);
  const [apiAvailable, setApiAvailable] = useState(true);
  const [activeTab, setActiveTab] = useState('1');

  // Fetch latest sensor data
  const fetchLatestData = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/api/sensor-data/latest`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        setApiAvailable(false);
        throw new Error('Server did not return JSON. API might not be available.');
      }
      
      const data = await response.json();
      // console.log(data);
      setLatestData(data);
      setApiAvailable(true);
      setError(null);
    } catch (err) {
      console.error('Error fetching latest sensor data:', err);
      setApiAvailable(false);
      setError(`Failed to load latest sensor data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch historical data based on date range
  const fetchHistoricalData = async (startDate = null, endDate = null) => {
    try {
      setLoading(true);
      
      let url = `${API_BASE_URL}/api/sensor-data/history`;
      
      if (startDate && endDate) {
        url += `?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        setApiAvailable(false);
        throw new Error('Server did not return JSON. API might not be available.');
      }
      
      const data = await response.json();
      // console.log(data);
      setHistoricalData(data);
      
      // Prepare data for charts
      const chartData = processDataForCharts(data);
      setChartData(chartData);
      
      setApiAvailable(true);
      setError(null);
    } catch (err) {
      console.error('Error fetching historical sensor data:', err);
      setApiAvailable(false);
      setError(`Failed to load historical sensor data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Process data for chart visualization
  const processDataForCharts = (data) => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return [];
    }
    
    // Ensure data is sorted by time
    const sortedData = [...data].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    return sortedData.map(item => ({
      timestamp: new Date(item.timestamp).toLocaleTimeString(),
      temperature: Number(item.temperature),
      humidity: Number(item.humidity),
      soilMoisture: Number(item.soilMoisture),
      motion: item.motion === 'YES' ? 1 : 0,
      rain: item.rain === 'YES' ? 1 : 0
    }));
  };

  // Handle date range change
  const handleDateRangeChange = (e, position) => {
    const newDateRange = [...dateRange];
    const date = new Date(e.target.value);
    
    if (position === 'start') {
      newDateRange[0] = date;
    } else if (position === 'end') {
      newDateRange[1] = date;
    }
    
    setDateRange(newDateRange);
    
    // Trigger query only when both dates are selected
    if (newDateRange[0] && newDateRange[1]) {
      fetchHistoricalData(newDateRange[0], newDateRange[1]);
    }
  };

  // Reset date range
  const resetDateRange = () => {
    setDateRange([null, null]);
    // Clear the values of date input fields
    document.querySelectorAll('.date-input').forEach(input => {
      input.value = '';
    });
    fetchHistoricalData();
  };

  // Fetch data when component mounts
  useEffect(() => {
    fetchLatestData();
    fetchHistoricalData();
    
    // Poll for latest data every 30 seconds
    const interval = setInterval(() => {
      fetchLatestData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (value, type) => {
    switch (type) {
      case 'temperature':
        return value > 30 ? 'danger' : value < 10 ? 'warning' : 'success';
      case 'humidity':
        return value > 85 ? 'warning' : value < 40 ? 'warning' : 'success';
      case 'soilMoisture':
        return value > 1500 ? 'danger' : value < 800 ? 'warning' : 'success';
      case 'motion':
        return value === 'YES' ? 'warning' : 'success';
      case 'rain':
        return value === 'YES' ? 'info' : 'success';
      default:
        return 'success';
    }
  };

  const renderTempHumidityChart = () => (
    <div className="chart-container">
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timestamp" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="temperature" stroke="#ff7300" name="Temperature (°C)" />
            <Line yAxisId="right" type="monotone" dataKey="humidity" stroke="#387908" name="Humidity (%)" />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="no-data-container">No data available</div>
      )}
    </div>
  );

  const renderSoilMoistureChart = () => (
    <div className="chart-container">
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timestamp" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="soilMoisture" stroke="#8884d8" name="Soil Moisture" />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="no-data-container">No data available</div>
      )}
    </div>
  );

  const renderEventsChart = () => (
    <div className="chart-container">
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timestamp" />
            <YAxis domain={[0, 1]} />
            <Tooltip />
            <Legend />
            <Line type="step" dataKey="motion" stroke="#ff4d4f" name="Motion (1=YES, 0=NO)" />
            <Line type="step" dataKey="rain" stroke="#1890ff" name="Rain (1=YES, 0=NO)" />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="no-data-container">No data available</div>
      )}
    </div>
  );

  return (
    <div className="admin-layout">
      <AdminSidebar activeLink={activeLink} setActiveLink={setActiveLink} />
      <div className="admin-content">
        <div className="page-header">
          <h1 className="page-title">Greenhouse Sensor Monitoring</h1>
          <button 
            className="action-button"
            onClick={() => {
              fetchLatestData();
              fetchHistoricalData();
            }}
          >
            <WarningIcon /> Refresh Data
          </button>
        </div>

        {!apiAvailable && (
          <div className="warning-alert">
            <p style={{margin: 0}}><strong><WarningIcon /> Backend API Unavailable</strong></p>
            <p style={{margin: '8px 0 0 0'}}>The sensor data API is not available. Please check the connection to the backend server.</p>
          </div>
        )}
        
        {error && (
          <div className="error-alert">
            <p style={{margin: 0}}>{error}</p>
          </div>
        )}
        
        <div className="content-panel">
          <div className="section-header">
            <h2 className="section-title">Current Readings</h2>
            <span className="meta-text">
              {latestData ? `Last updated: ${new Date(latestData.timestamp).toLocaleString()}` : ''}
            </span>
          </div>
          
          {loading && !latestData ? (
            <div className="loading-container">
              Loading...
            </div>
          ) : latestData ? (
            <div className="cards-container">
              <div className="cards-row">
                {/* Temperature Card */}
                <div className={`sensor-card ${getStatusColor(latestData.temperature, 'temperature')}`}>
                  <div className="card-header">
                    <div className="flex-center">
                      <FireIcon />
                      <span>Temperature</span>
                    </div>
                  </div>
                  <div className="card-body">
                    <h3 className="card-value">{latestData.temperature.toFixed(1)} °C</h3>
                    <p className="reading-time">Last updated: {new Date(latestData.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
                
                {/* Humidity Card */}
                <div className={`sensor-card ${getStatusColor(latestData.humidity, 'humidity')}`}>
                  <div className="card-header">
                    <div className="flex-center">
                      <ThunderIcon />
                      <span>Humidity</span>
                    </div>
                  </div>
                  <div className="card-body">
                    <h3 className="card-value">{latestData.humidity.toFixed(1)} %</h3>
                    <p className="reading-time">Last updated: {new Date(latestData.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
                
                {/* Motion Card */}
                <div className={`sensor-card ${getStatusColor(latestData.motion, 'motion')}`}>
                  <div className="card-header">
                    <div className="flex-center">
                      <MotionIcon style={{ fontSize: '18px', color: '#faad14' }} />
                      <span>Motion</span>
                    </div>
                  </div>
                  <div className="card-body">
                    <h3 className="card-value">{latestData.motion}</h3>
                    <p className="reading-time">Last updated: {new Date(latestData.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
              </div>
              
              <div className="cards-row">                
                {/* Rain Card */}
                <div className={`sensor-card ${getStatusColor(latestData.rain, 'rain')}`}>
                  <div className="card-header">
                    <div className="flex-center">
                      <RainIcon style={{ fontSize: '18px', color: '#1890ff' }} />
                      <span>Rain</span>
                    </div>
                  </div>
                  <div className="card-body">
                    <h3 className="card-value">{latestData.rain}</h3>
                    <p className="reading-time">Last updated: {new Date(latestData.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
                
                {/* Soil Moisture Card */}
                <div className={`sensor-card ${getStatusColor(latestData.soilMoisture, 'soilMoisture')}`}>
                  <div className="card-header">
                    <div className="flex-center">
                      <SoilMoistureIcon style={{ fontSize: '18px', color: '#52c41a' }} />
                      <span>Soil Moisture</span>
                    </div>
                  </div>
                  <div className="card-body">
                    <h3 className="card-value">{latestData.soilMoisture}</h3>
                    <p className="reading-time">Last updated: {new Date(latestData.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
                
                {/* 空白卡片用于保持布局平衡 */}
                <div className="sensor-card" style={{visibility: 'hidden'}}>
                  <div className="card-header"></div>
                  <div className="card-body"></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="no-data-container">
              No sensor data available
            </div>
          )}
        </div>

        <div className="content-panel">
          <div className="section-header">
            <h2 className="section-title">Sensor Data Analysis</h2>
          </div>
          <div>
            <div className="tab-buttons">
              <button 
                className={`tab-button ${activeTab === '1' ? 'active' : ''}`}
                onClick={() => setActiveTab('1')}
              >
                Temperature & Humidity
              </button>
              <button 
                className={`tab-button ${activeTab === '2' ? 'active' : ''}`}
                onClick={() => setActiveTab('2')}
              >
                Soil Moisture
              </button>
              <button 
                className={`tab-button ${activeTab === '3' ? 'active' : ''}`}
                onClick={() => setActiveTab('3')}
              >
                Events (Motion/Rain)
              </button>
            </div>
            <div>
              {activeTab === '1' && renderTempHumidityChart()}
              {activeTab === '2' && renderSoilMoistureChart()}
              {activeTab === '3' && renderEventsChart()}
            </div>
          </div>
        </div>
        
        <div className="content-panel">
          <div className="section-header">
            <h2 className="section-title">Historical Data</h2>
            <div className="table-filters">
              <input 
                type="date" 
                className="date-input"
                onChange={(e) => handleDateRangeChange(e, 'start')} 
                value={dateRange[0] ? dateRange[0].toISOString().slice(0, 10) : ''}
              />
              <span>to</span>
              <input 
                type="date" 
                className="date-input"
                onChange={(e) => handleDateRangeChange(e, 'end')} 
                value={dateRange[1] ? dateRange[1].toISOString().slice(0, 10) : ''}
              />
              <button 
                className="secondary-button"
                onClick={resetDateRange}
              >
                Reset
              </button>
            </div>
          </div>
          
          {loading ? (
            <div className="loading-container">Loading...</div>
          ) : historicalData.length > 0 ? (
            <div className="table-container">
              <table className="sensor-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Temperature (°C)</th>
                    <th>Humidity (%)</th>
                    <th>Motion</th>
                    <th>Rain</th>
                    <th>Soil Moisture</th>
                  </tr>
                </thead>
                <tbody>
                  {historicalData.map(item => (
                    <tr key={item.id}>
                      <td>{new Date(item.timestamp).toLocaleString()}</td>
                      <td>{item.temperature.toFixed(1)}</td>
                      <td>{item.humidity.toFixed(1)}</td>
                      <td>{item.motion}</td>
                      <td>{item.rain}</td>
                      <td>{item.soilMoisture}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="no-data-container">No historical data available</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SensorData;
