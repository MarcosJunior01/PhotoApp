import React, { useState, useEffect } from 'react';
import './css/style.css';
import './css/login.css';
import logo from './img/logo.png';
import adm from './img/adm.png';
import email from './img/email.png';
import senha from './img/senha.png';

function LoginLocalScreen({ onLoginSuccess, onLogin }) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Ao montar, verifica se há credenciais salvas
  useEffect(() => {
    const savedEmail    = localStorage.getItem('remember_email');
    const savedPassword = localStorage.getItem('remember_password');
    if (savedEmail && savedPassword) {
      try {
        setFormData({
          email:    atob(savedEmail),
          password: atob(savedPassword),
        });
        setRemember(true);
      } catch {
        // valor corrompido — limpa
        localStorage.removeItem('remember_email');
        localStorage.removeItem('remember_password');
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
        // Salvar ou limpar credenciais conforme "Lembrar"
        if (remember) {
          localStorage.setItem('remember_email',    btoa(formData.email));
          localStorage.setItem('remember_password', btoa(formData.password));
        } else {
          localStorage.removeItem('remember_email');
          localStorage.removeItem('remember_password');
        }

        localStorage.setItem('user',  JSON.stringify(data.user));
        localStorage.setItem('token', data.token);

        if (onLoginSuccess) onLoginSuccess(data.user);
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
    <div className='content login-container'>

      {/* Ícone de Admin no topo direito */}
      <img
        src={adm}
        alt='Admin'
        className='admin-icon'
        onClick={onLogin}
      />

      {/* Logo */}
      <div className='login-header'>
        <div className='logo-box'>
          <img className='logo' alt='logo' src={logo} />
        </div>
      </div>

      {/* Título */}
      <h1 className='login-title'>Login do Promotor</h1>

      {/* Formulário */}
      <form className='login-form' onSubmit={handleSubmit}>

        {/* Email */}
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

        {/* Senha */}
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

        {/* Mensagem de erro */}
        {error && (
          <div className='error-message'>{error}</div>
        )}

        {/* Opções */}
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

      {/* Botão */}
      <button
        className='btn-geral login-btn'
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? 'Entrando...' : 'Entrar'}
      </button>

    </div>
  );
}

export default LoginLocalScreen;