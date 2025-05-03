import React, { useRef, useEffect, useState } from 'react';
import Countdown from './Countdown';
import './css/style.css';
import './css/capture.css';

function CameraCapture({ onCapture, onCancel, moldura }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [molduraImg, setMolduraImg] = useState(null);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdownValue, setCountdownValue] = useState(3);

  useEffect(() => {
    // Carrega a moldura selecionada
    const img = new Image();
    img.src = moldura || '/moldura.png';
    img.onload = () => setMolduraImg(img);

    // Configura a câmera
    const constraints = { 
      video: { 
        aspectRatio: 9 / 16,
        facingMode: 'environment'
      } 
    };

    let stream;
    navigator.mediaDevices.getUserMedia(constraints)
      .then(s => {
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(error => {
        console.error("Erro ao acessar a câmera:", error);
        alert("Não foi possível acessar a câmera.");
      });

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [moldura]);

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas) return null;

    const context = canvas.getContext('2d');
    const width = video.videoWidth;
    const height = video.videoHeight;

    canvas.width = width;
    canvas.height = height;

    context.drawImage(video, 0, 0, width, height);
    if (molduraImg) {
      context.drawImage(molduraImg, 0, 0, width, height);
    }

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.95);
    });
  };

  const startCountdown = () => {
    setIsCountingDown(true);
    setCountdownValue(3);
    
    const timer = setInterval(() => {
      setCountdownValue(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          capturePhoto().then(onCapture);
          setIsCountingDown(false);
          return 3;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <div className="camera-container">
      <div className="video-wrapper">
        <video 
          ref={videoRef}
          className="camera-feed"
          autoPlay
          playsInline
          muted
          style={{ aspectRatio: '9/16' }}
        />
        
        {isCountingDown && (
          <div className="countdown-overlay">
            <Countdown value={countdownValue} />
          </div>
        )}
      </div>
      
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      {!isCountingDown && (
        <div className="camera-controls">
          <button className="btn-camera" onClick={startCountdown}></button>
          <button className="btn-refazer" onClick={onCancel}>Cancelar</button>
        </div>
      )}
    </div>
  );
}

export default CameraCapture;