import React, { useState } from 'react';
import './css/style.css';
import './css/login.css';
import logo from './img/logo.png';
import email from './img/email.png';
import senha from './img/senha.png';

function LoginScreen({ onBack, onAdminLoginSuccess }) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpar erro quando usuário começa a digitar
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const apiBase = process.env.REACT_APP_API_URL || `${window.location.protocol}//${window.location.hostname}:3001`;
      const response = await fetch(`${apiBase}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Verificar se é admin
        if (data.user.role !== 'admin') {
          setError('Acesso negado. Apenas administradores podem fazer login aqui.');
          return;
        }

        // Salvar dados do usuário e token
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);

        // Redirecionar para painel admin
        if (onAdminLoginSuccess) {
          onAdminLoginSuccess(data.user);
        } else {
          // Fallback para redirecionamento direto
          window.location.href = '/admin/panel';
        }
      } else {
        setError(data.error || 'Erro ao fazer login');
      }
    } catch (err) {
      console.error('Erro na requisição:', err);
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='login-container'>

      <div className='login-header'>
        <div className='logo-box'>
            <img className='logo' alt='logo' src={logo} />
        </div>
      </div>

      <h1 className='login-title'>Login Administrativo</h1>

      <form className='login-form' onSubmit={handleSubmit}>

        <div className='input-group'>
          <input
            type='email'
            name='email'
            placeholder='Email'
            value={formData.email}
            onChange={handleInputChange}
            disabled={loading}
          />
          <img src={email} alt='email icon' className='input-icon' />
        </div>

        <div className='input-group'>
          <input
            type='password'
            name='password'
            placeholder='Senha'
            value={formData.password}
            onChange={handleInputChange}
            disabled={loading}
          />
          <img src={senha} alt='senha icon' className='input-icon' />
        </div>

        {error && (
          <div className='error-message'>
            {error}
          </div>
        )}

        <div className='login-options'>
          <label>
            <input type='checkbox' />
            Lembrar
          </label>

          <span className='forgot'>Esqueci minha senha</span>
        </div>

      </form>

      <button
        className='btn-geral login-btn'
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? 'Entrando...' : 'Entrar'}
      </button>

      {onBack && (
        <div style={{ marginTop: '12px' }}>
          <a
            href='#'
            onClick={(e) => {
              e.preventDefault();
              onBack();
            }}
            style={{
              color: '#000',
              textDecoration: 'underline',
              fontSize: '0.9rem',
              fontWeight: 'bold'
            }}
          >
            Voltar para login do promotor
          </a>
        </div>
      )}

    </div>
  );
}

export default LoginScreen;