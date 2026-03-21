import React, { useState, useEffect } from 'react';
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
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Ao montar, verifica se há credenciais salvas
  useEffect(() => {
    const savedEmail    = localStorage.getItem('admin_remember_email');
    const savedPassword = localStorage.getItem('admin_remember_password');
    if (savedEmail && savedPassword) {
      try {
        setFormData({ email: atob(savedEmail), password: atob(savedPassword) });
        setRemember(true);
      } catch {
        localStorage.removeItem('admin_remember_email');
        localStorage.removeItem('admin_remember_password');
      }
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, password: formData.password })
      });

      const data = await response.json();

      if (response.ok) {
        if (data.user.role !== 'admin') {
          setError('Acesso negado. Apenas administradores podem fazer login aqui.');
          return;
        }

        // Salvar ou limpar credenciais conforme "Lembrar"
        if (remember) {
          localStorage.setItem('admin_remember_email',    btoa(formData.email));
          localStorage.setItem('admin_remember_password', btoa(formData.password));
        } else {
          localStorage.removeItem('admin_remember_email');
          localStorage.removeItem('admin_remember_password');
        }

        localStorage.setItem('user',  JSON.stringify(data.user));
        localStorage.setItem('token', data.token);

        if (onAdminLoginSuccess) {
          onAdminLoginSuccess(data.user);
        } else {
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
          <div className='error-message'>{error}</div>
        )}

        <div className='login-options'>
          <label>
            <input
              type='checkbox'
              checked={remember}
              onChange={e => setRemember(e.target.checked)}
            />
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
            onClick={(e) => { e.preventDefault(); onBack(); }}
            style={{ color: '#000', textDecoration: 'underline', fontSize: '0.9rem', fontWeight: 'bold' }}
          >
            Voltar para login do promotor
          </a>
        </div>
      )}

    </div>
  );
}

export default LoginScreen;
