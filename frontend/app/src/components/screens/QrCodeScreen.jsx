import React, { useState } from 'react';
import './css/style.css';
import './css/qrcode.css';
import logo from './img/logo.png';

function QRCodeScreen({ onBack, onDirectLogin }) {
  const [qrUrl, setQrUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGerarQR = async () => {
    setLoading(true);
    try {
      const apiBase = process.env.REACT_APP_API_URL || `${window.location.protocol}//${window.location.hostname}:3001`;
      const res = await fetch(`${apiBase}/admin/qrcode`);
      const data = await res.json();
      setQrUrl(data.qrCodeDataUrl);
    } catch (err) {
      console.error('Erro ao gerar QR Code:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="qr-container">

      <div className="qr-header">
        <div className='logo-box'>
          <img className='logo' alt='logo' src={logo} />
        </div>
      </div>

      <div className="qr-wrapper">
        <div className="qr-box">
          {qrUrl && (
            <img src={qrUrl} alt="QR Code Admin" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          )}
        </div>
      </div>

      <p className="qrInstruction">
        {qrUrl
          ? 'Escaneie o QR Code para acessar o painel administrativo'
          : 'Clique em gerar para exibir o QR Code'}
      </p>

      <button onClick={handleGerarQR} className="btn-gerar-qr" disabled={loading}>
        <span className="btn-gerar-qr-text">
          {loading ? 'Gerando...' : 'Gerar QR Code'}
        </span>
      </button>

      <button onClick={onBack} className="btn-voltar">
        <span className="btn-voltar-text">
          Voltar
        </span>
      </button>
        <div className="direct-login-link">
        Ou clique para abrir o <a href="#" onClick={(e) => {
          e.preventDefault();
          onDirectLogin();
        }}>painel no totem</a>
      </div>
    </div>
  );
}

export default QRCodeScreen;