import React, { useState, useEffect } from 'react';
import './css/style.css';

function PhotoReview({ photo, moldura, onRetake, onApprove }) {
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (photo) {
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target.result);
      reader.readAsDataURL(photo);
    }
  }, [photo]);

  return (
    <div className="review-container">
      {previewUrl && (
        <div className="photo-preview-container">
          <img 
            src={previewUrl} 
            alt="Preview" 
            className="review-photo" 
          />
          <img 
            src={moldura || '/moldura.png'} 
            alt="Moldura" 
            className="review-frame"
          />
        </div>
      )}
      
      <div className="review-buttons">
        <button onClick={onRetake} className='btn-refazer'>Refazer</button>
        <button onClick={() => onApprove(photo)} className='btn-geral'>
          Aprovar
        </button>
      </div>
    </div>
  );
}

export default PhotoReview;