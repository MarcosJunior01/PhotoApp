import React, { useState } from 'react';
import HomeScreen from './screens/HomeScreen';
import MolduraSelection from './screens/MolduraSelection';
import CameraCapture from './screens/CameraCapture';
import PhotoReview from './screens/PhotoReview';
import FinalScreen from './screens/FinalScreen';
import './screens/css/style.css';
import axios from 'axios';

function CameraFlow() {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedMoldura, setSelectedMoldura] = useState('/moldura.png'); // Moldura padrão

  const handleImageCapture = async (blob) => {
    setIsUploading(true);
  
    try {
      const formData = new FormData();
      formData.append('image', blob, 'foto.jpg');
      formData.append('moldura', selectedMoldura); // Envia a moldura selecionada

      const res = await axios.post('http://localhost:3001/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
  
      setQrCode(res.data.qrCodeDataUrl);
      setCurrentScreen('final');
    } catch (err) {
      console.error('Erro no upload:', err);
      alert('Erro ao enviar foto: ' + (err.response?.data?.error || err.message));
      setCurrentScreen('review');
    } finally {
      setIsUploading(false);
    }
  };

  const handleApprovePhoto = (blob) => {
    setCurrentScreen('uploading');
    handleImageCapture(blob);
  };

  return (
    <div style={{ padding: 20, textAlign: 'center' }}>
      {currentScreen === 'home' && (
        <HomeScreen onStart={() => setCurrentScreen('select-moldura')} />
      )}
      
      {currentScreen === 'select-moldura' && (
        <MolduraSelection
          onSelectMoldura={(moldura) => {
            setSelectedMoldura(moldura);
            setCurrentScreen('capture');
          }}
          onBack={() => setCurrentScreen('home')}
        />
      )}
      
      {currentScreen === 'capture' && (
        <CameraCapture 
          onCapture={(photo) => {
            setCapturedPhoto(photo);
            setCurrentScreen('review');
          }}
          onCancel={() => setCurrentScreen('select-moldura')}
          moldura={selectedMoldura} // Passa a moldura selecionada
        />
      )}
      
      {currentScreen === 'review' && (
        <PhotoReview 
          photo={capturedPhoto}
          moldura={selectedMoldura} // Passa a moldura para a revisão
          onRetake={() => setCurrentScreen('capture')}
          onApprove={handleApprovePhoto}
        />
      )}
      
      {currentScreen === 'uploading' && (
        <div className="uploading-screen">
          <p>Enviando imagem...</p>
          <div className="loading-spinner"></div>
        </div>
      )}
      
      {currentScreen === 'final' && qrCode && (
        <FinalScreen 
          qrCode={qrCode}
          photo={capturedPhoto}
          moldura={selectedMoldura} // Passa a moldura para a tela final
          onFinish={() => {
            setQrCode(null);
            setCapturedPhoto(null);
            setCurrentScreen('home');
          }}
        />
      )}
    </div>
  );
}

export default CameraFlow;