import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ParkGuideSidebar from '../../../components/ParkGuideSidebar/ParkGuideSidebar';
import './identification.css';

const Identification = () => {
  const [activeLink, setActiveLink] = useState('identification');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed');
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size cannot exceed 5MB');
      return;
    }
    
    setSelectedFile(file);
    setError(null);
    setResult(null);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setError('Please select an image');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append('image', selectedFile);
      
      // Send API request
      const response = await fetch('http://localhost:3000/api/identify-orchid', {
        method: 'POST',
        body: formData,
      });
      
      // Check if request was successful
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Identification request failed');
      }
      
      // Parse the response
      const data = await response.json();
      setResult(data.orchid);
    } catch (err) {
      console.error('Identification error:', err);
      setError(err.message || 'An error occurred during identification');
    } finally {
      setLoading(false);
    }
  };

  // Handle reset
  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    setResult(null);
  };

  return (
    <div className="dashboard-container">
      <ParkGuideSidebar activeLink={activeLink} />
      
      <div className="main-content">
        <div className="header">
          <div className="header-title">
            <h1>Plant Identification</h1>
            <p>Upload an orchid image for automatic identification</p>
          </div>
        </div>
        
        <div className="identification-container">
          <div className="upload-section">
            <div className="upload-card">
              <h2>Upload Image</h2>
              <p>Please upload a clear orchid image for the most accurate identification results</p>
              
              <form onSubmit={handleSubmit}>
                <div className="file-upload-wrapper">
                  <input 
                    type="file" 
                    accept="image/*" 
                    id="image-upload" 
                    onChange={handleFileChange}
                    className="file-upload-input"
                  />
                  <label htmlFor="image-upload" className="file-upload-label">
                    {previewUrl ? 'Change Image' : 'Select Image'}
                  </label>
                </div>
                
                {previewUrl && (
                  <div className="preview-container">
                    <img src={previewUrl} alt="Preview" className="image-preview" />
                    <button 
                      type="button" 
                      className="remove-btn"
                      onClick={handleReset}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                )}
                
                {error && (
                  <div className="error-message">
                    <i className="fas fa-exclamation-circle"></i>
                    <span>{error}</span>
                  </div>
                )}
                
                <div className="action-buttons">
                  <button 
                    type="submit" 
                    className="identify-btn"
                    disabled={!selectedFile || loading}
                  >
                    {loading ? (
                      <>
                        <div className="spinner"></div>
                        <span>Identifying...</span>
                      </>
                    ) : (
                      <>
                        <i className="fas fa-search"></i>
                        <span>Start Identification</span>
                      </>
                    )}
                  </button>
                  
                  {selectedFile && !loading && (
                    <button 
                      type="button" 
                      className="reset-btn"
                      onClick={handleReset}
                    >
                      <i className="fas fa-redo"></i>
                      <span>Reset</span>
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
          
          {result && (
            <div className="result-section">
              <div className="result-card">
                <div className="result-header">
                  <h2>Identification Result</h2>
                  <div className="confidence-badge">
                    Confidence: {(result.confidence > 1 ? result.confidence.toFixed(2) : (result.confidence * 100).toFixed(2))}%
                  </div>
                </div>
                
                <div className="result-name">
                  <h3>{result.label}</h3>
                  <div className="scientific-name">{result.id}</div>
                </div>
                
                <div className="result-details">
                  <div className="detail-section">
                    <h4>Description</h4>
                    <p>{result.info.description}</p>
                  </div>
                  
                  <div className="detail-section">
                    <h4>Habitat</h4>
                    <p>{result.info.habitat}</p>
                  </div>
                  
                  <div className="detail-section">
                    <h4>Care Guide</h4>
                    <p>{result.info.care}</p>
                  </div>
                </div>
                
                <div className="result-actions">
                  <button 
                    className="save-btn"
                    onClick={() => alert('Feature under development...')}
                  >
                    <i className="fas fa-save"></i>
                    <span>Save Result</span>
                  </button>
                  
                  <button 
                    className="share-btn"
                    onClick={() => alert('Feature under development...')}
                  >
                    <i className="fas fa-share-alt"></i>
                    <span>Share Result</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="tips-section">
          <h3>Photography Tips</h3>
          <div className="tips-container">
            <div className="tip-card">
              <div className="tip-icon">
                <i className="fas fa-camera"></i>
              </div>
              <h4>Clear Shots</h4>
              <p>Ensure the image is clear, without blurriness, and avoid overexposure or shadows</p>
            </div>
            
            <div className="tip-card">
              <div className="tip-icon">
                <i className="fas fa-sun"></i>
              </div>
              <h4>Proper Lighting</h4>
              <p>Take photos in natural light, avoid using flash</p>
            </div>
            
            <div className="tip-card">
              <div className="tip-icon">
                <i className="fas fa-expand"></i>
              </div>
              <h4>Appropriate Distance</h4>
              <p>Maintain an appropriate distance to ensure the flower is clearly visible in the frame</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Identification;
