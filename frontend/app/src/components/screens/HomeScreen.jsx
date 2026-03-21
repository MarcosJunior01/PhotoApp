import React from 'react';
import './css/style.css';
import logo from './img/logo.png';
import adm from './img/adm.png';


function HomeScreen({ onStart, onLogin }) {
  return (
    <div className='content'>
      <div>
            <button className="logout-btn"
                    onClick={() => {
                      localStorage.removeItem('token');
                      localStorage.removeItem('user');
                      window.location.href = '/';
                    }}
                  >
                    ↪ Sair
            </button>
            
              <img 
                src={adm} 
                alt='Admin' 
                className='admin-icon' 
                onClick={onLogin} 
              />
      </div>
      <img className='logo' alt='logo' src={logo} />
      <div className="text-container">
        <h1 className="texto-central">Totem</h1>
        <p className="texto-inferior">Fotográfico</p>
      </div>
      
      <button className='btn-geral' onClick={onStart}>
        INICIAR
      </button>
    </div>
  );
}

export default HomeScreen;