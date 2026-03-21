import React, { useState } from 'react';
import './css/molduraSelection.css';

function MolduraSelection({ onSelectMoldura, onBack }) {
  const molduras = [
    { id: 1, nome: 'Moldura Clássica', thumbnail: '/molduras/moldura1.png' },
    { id: 2, nome: 'Moldura Moderna', thumbnail: '/molduras/moldura2.png' },
    { id: 3, nome: 'Moldura Divertida', thumbnail: '/molduras/moldura3.png' },
    { id: 4, nome: 'Moldura Elegante', thumbnail: '/molduras/moldura4.png' }
  ];

  const [selected, setSelected] = useState(null);

  const handleSelect = (id) => {
    setSelected(id);
  };

  const handleConfirm = () => {
    if (selected) {
      onSelectMoldura(`/molduras/moldura${selected}.png`);
    }
  };

  return (
    <div className="moldura-selection-container">
      <h2 className="selection-title">Escolha sua Moldura</h2>
      
      <div className="molduras-grid">
        {molduras.map((moldura) => (
          <div 
            key={moldura.id}
            className={`moldura-option ${selected === moldura.id ? 'selected' : ''}`}
            onClick={() => handleSelect(moldura.id)}
          >
            <img 
              src={moldura.thumbnail} 
              alt={moldura.nome}
              className="moldura-thumbnail"
            />
            <span className="moldura-name">{moldura.nome}</span>
          </div>
        ))}
      </div>

      <div className="selection-buttons">
        <button onClick={onBack} className="btnvoltar">Voltar</button>
        <button 
          onClick={handleConfirm} 
          className="btn-confirmar"
          disabled={!selected}
        >
          Confirmar
        </button>
      </div>
    </div>
  );
}

export default MolduraSelection;