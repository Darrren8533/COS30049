import React from 'react';
import './SimpleCard.css';

const SimpleCard = ({ title, content, imgUrl }) => {
  return (
    <div className="simple-card">
      {imgUrl && <img src={imgUrl} alt={title} className="card-image" />}
      <div className="card-body">
        <h3 className="card-title">{title}</h3>
        <p className="card-content">{content}</p>
        <button className="card-button">View Details</button>
      </div>
    </div>
  );
};

export default SimpleCard; 