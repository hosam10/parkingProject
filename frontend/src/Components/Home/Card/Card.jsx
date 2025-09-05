import React, { useState } from "react";
import "./Card.css";
import { useNavigate } from "react-router-dom";

const Card = ({ img, title, handle, spots, available }) => {
        const [imageError, setImageError] = useState(false);
        const [imageLoading, setImageLoading] = useState(true);
        const [isHovered, setIsHovered] = useState(false);
        const navigate = useNavigate();
    
        const handleClicked = () => {
            navigate(handle);
        };

        const handleImageError = (e) => {
            console.error('Image failed to load:', img);
            setImageError(true);
            setImageLoading(false);
        };

        const handleImageLoad = () => {
            console.log('Image loaded successfully:', img);
            setImageLoading(false);
        };

        // Calculate availability percentage
        const availabilityPercentage = spots ? Math.round((available / spots) * 100) : 0;
        const isLowAvailability = availabilityPercentage < 30;
        const isHighAvailability = availabilityPercentage > 70;

        // Fallback placeholder
        const PlaceholderImage = () => (
            <div className="image-placeholder">
                <div className="placeholder-icon">🏢</div>
                <div className="placeholder-text">Parking Location</div>
            </div>
        );

  return (
    <div 
      onClick={handleClicked} 
      className={`card-container ${isHovered ? 'hovered' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
        <div className="card-image-container">
          {imageError ? (
              <PlaceholderImage />
          ) : (
              <img 
                  src={img} 
                  alt={title} 
                  onError={handleImageError}
                  onLoad={handleImageLoad}
                  style={{ display: imageLoading ? 'none' : 'block' }}
              />
          )}
          {imageLoading && !imageError && (
              <div className="image-loading">
                  <div className="loading-spinner"></div>
                  <div>Loading...</div>
              </div>
          )}
          
          {/* Availability Badge */}
          {spots && (
            <div className={`availability-badge ${isLowAvailability ? 'low' : isHighAvailability ? 'high' : 'medium'}`}>
              {available} available
            </div>
          )}
        </div>

        <div className="card-content">
          <h3 className="card-title">{title}</h3>
          {spots && (
            <div className="card-stats">
              <div className="stat">
                <span className="stat-value">{available}</span>
                <span className="stat-label">Available</span>
              </div>
              <div className="stat">
                <span className="stat-value">{spots}</span>
                <span className="stat-label">Total</span>
              </div>
            </div>
          )}
          <button className="card-button">
            Select Section
            <svg className="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
    </div>
  );
};

export default Card;
