import React, { useState } from 'react';
import HomeScreen from './screens/HomeScreen';
import MolduraSelection from './screens/MolduraSelection';
import CameraCapture from './screens/CameraCapture';
import PhotoReview from './screens/PhotoReview';
import FinalScreen from './screens/FinalScreen';
import QrCodeScreen from './screens/QrCodeScreen';
import LoginLocalScreen from './screens/LoginLocalScreen';
import LoginScreen from './screens/LoginScreen';
import AdminPanel from './AdminPanel';

import './screens/css/style.css';
import axios from 'axios';

function CameraFlow() {
  const [currentScreen, setCurrentScreen] = useState('login-local'); // começa no login do promotor
  const [previousScreen, setPreviousScreen] = useState('login-local');
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedMoldura, setSelectedMoldura] = useState('/moldura.png');
  const [currentUser, setCurrentUser] = useState(null); // Usuário logado

  // Verificar se há usuário salvo no localStorage ao iniciar
  React.useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');

    if (savedUser && savedToken) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        setCurrentScreen('home');
      } catch (err) {
        console.error('Erro ao carregar usuário salvo:', err);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setCurrentScreen('login-local');
      }
    } else {
      // Se não houver sessão válida, iniciar pelo login local.
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      setCurrentScreen('login-local');
    }
  }, []);

  const handleImageCapture = async (blob) => {
    setIsUploading(true);
  
    try {
      const formData = new FormData();
      formData.append('image', blob, 'foto.jpg');
      formData.append('moldura', selectedMoldura);
      
      // Adicionar userId se usuário estiver logado
      if (currentUser?.id) {
        formData.append('userId', currentUser.id);
      }

      const res = await axios.post('http://localhost:3001/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
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

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setCurrentScreen('home');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setCurrentScreen('login-local');
  };

  const openAdminQr = () => {
    setPreviousScreen(currentScreen);
    setCurrentScreen('admin-qr');
  };

  return (
    <div style={{ padding: 20, textAlign: 'center' }}>

      {currentScreen === 'login-local' && (
        <LoginLocalScreen
          onLoginSuccess={handleLoginSuccess}
          onLogin={openAdminQr}
        />
      )}

      {currentScreen === 'admin-login' && (
        <LoginScreen 
          onBack={() => setCurrentScreen('login-local')} 
          onAdminLoginSuccess={() => setCurrentScreen('admin-panel')}
        />
      )}

      {currentScreen === 'admin-panel' && (
        <AdminPanel />
      )}

      {currentScreen === 'home' && (
        <HomeScreen
          onStart={() => setCurrentScreen('select-moldura')}
          onLogin={openAdminQr}
        />
      )}

      {currentScreen === 'admin-qr' && (
        <QrCodeScreen 
          onBack={() => setCurrentScreen(previousScreen)}
          onDirectLogin={() => setCurrentScreen('admin-login')}
        />
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
          moldura={selectedMoldura}
        />
      )}
      
      {currentScreen === 'review' && (
        <PhotoReview 
          photo={capturedPhoto}
          moldura={selectedMoldura}
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
          moldura={selectedMoldura}
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