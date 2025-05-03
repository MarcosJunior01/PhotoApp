import React, { useEffect, useState } from 'react';
import './css/finalScreen.css';
import moldQr from './img/moldQr.png';

function FinalScreen({ qrCode, photo, onFinish }) {
  const [photoUrl, setPhotoUrl] = useState(null);
  const [showObrigado, setShowObrigado] = useState(true);

  useEffect(() => {
    if (photo) {
      const url = URL.createObjectURL(photo);
      setPhotoUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [photo]);

  useEffect(() => {
    const timerObrigado = setTimeout(() => {
      setShowObrigado(false);
    }, 3000);

    const timerFinish = setTimeout(() => {
      if (typeof onFinish === 'function') {
        onFinish();
      }
    }, 30000);

    return () => {
      clearTimeout(timerObrigado);
      clearTimeout(timerFinish);
    };
  }, [onFinish]);

  const handleFinish = () => {
    if (typeof onFinish === 'function') {
      onFinish();
    }
  };

  return (
    <div className="final-screen-container">
      {/* Overlay de "Obrigado!" */}
      {showObrigado && (
        <div className="obrigado-overlay">
          <div className="obrigado-content">
            <h2>Obrigado!</h2>
            <h4>Ficamos felizes por usar no Totem!</h4>
          </div>
        </div>
      )}

      {/* Conteúdo principal */}
      <div className="photo-container">
        {photoUrl && (
          <>
            <img src={photoUrl} alt="Sua foto" className="final-photo" />
            
          </>
        )}
        
        {qrCode && (
          <div className="qr-code-container">
            <img src={qrCode} alt="QR Code" className="qr-code-image" />
            <img src={moldQr} alt="Moldura QR Code" className="qr-code-frame" />
          </div>
        )}
      </div>
      
      <button onClick={handleFinish} className="btn-fim">
        Finalizar
      </button>
    </div>
  );
}

export default FinalScreen;