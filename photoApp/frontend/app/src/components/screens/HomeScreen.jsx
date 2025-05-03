import React from 'react';
import './css/style.css';
import logo from './img/logo.png';

function HomeScreen({ onStart }) {
  return (
    <div className='content'>
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