import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'
import HomePage from './pages/HomePage/HomePage'
import LoginPage from './pages/LoginPage/LoginPage'
import RegisterPage from './pages/RegisterPage/RegisterPage'
import AdminLoginPage from './pages/AdminLoginPage/AdminLoginPage'
import AdminDashboard from './pages/AdminDashboard/AdminDashboard'
import GuideDashboard from './pages/GuideDashboard/GuideDashboard'

// Create a Main component that can use router hooks
function Main() {
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Check user status on component mount and route changes
  useEffect(() => {
    checkUserStatus();
  }, [location.pathname]);
  
  // Check user login status
  const checkUserStatus = () => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setUserRole(user.role);
    } else {
      setUserRole(null);
    }
  };

  // Listen for localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      checkUserStatus();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Create a custom event for internal communication
    window.addEventListener('userStateChanged', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userStateChanged', handleStorageChange);
    };
  }, []);

  const handleLogout = async () => {
    try {
      // Call backend logout API
      await axios.post('http://localhost:3000/api/logout');
      
      // Clear local storage
      localStorage.removeItem('user');
      setUserRole(null);
      
      // Trigger custom event
      window.dispatchEvent(new Event('userStateChanged'));
      
      // Use navigate instead of window.location
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      // Clear local storage even if API call fails
      localStorage.removeItem('user');
      setUserRole(null);
      
      // Trigger custom event
      window.dispatchEvent(new Event('userStateChanged'));
      
      navigate('/');
    }
  };

  return (
    <>
      <nav className="navbar">
        <div className="nav-logo">Park Guide System</div>
        <ul className="nav-links">
          <li><Link to="/">Home</Link></li>
          {!userRole && (
            <>
              <li><Link to="/login">Guide Login</Link></li>
              <li><Link to="/admin-login">Admin Login</Link></li>
            </>
          )}
          {userRole && (
            <li><button className="logout-btn" onClick={handleLogout}>Logout</button></li>
          )}
        </ul>
      </nav>
      
      <div className="app-container">
        <div className="content">
          <Routes>
            <Route path="/" element={<HomePage onUserStateChange={checkUserStatus} />} />
            <Route path="/login" element={<LoginPage onUserStateChange={checkUserStatus} />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/admin-login" element={<AdminLoginPage onUserStateChange={checkUserStatus} />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/guide-dashboard" element={<GuideDashboard />} />
          </Routes>
        </div>
      </div>
    </>
  );
}

// App component as a container for BrowserRouter
function App() {
  return (
    <BrowserRouter>
      <Main />
    </BrowserRouter>
  );
}

export default App
