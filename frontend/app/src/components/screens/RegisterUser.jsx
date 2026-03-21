import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import logo from './img/logo.png';
import './css/registerUser.css';
import { HiOutlineCamera, HiOutlineShieldCheck } from 'react-icons/hi2';

const RegisterUser = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'promotor',
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError]   = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  /* ─── CHANGE ─── */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    // limpa erro do campo ao editar
    setFieldErrors(prev => ({ ...prev, [name]: '' }));
    setSubmitError('');
    setSubmitSuccess('');
  };

  /* ─── VALIDATE ─── */
  const validate = () => {
    const errors = {};
    if (!form.name.trim())             errors.name = 'Nome é obrigatório';
    if (!form.email.trim())            errors.email = 'E-mail é obrigatório';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errors.email = 'E-mail inválido';
    if (!form.password)                errors.password = 'Senha é obrigatória';
    else if (form.password.length < 6) errors.password = 'Mínimo de 6 caracteres';
    if (form.confirmPassword !== form.password) errors.confirmPassword = 'As senhas não coincidem';
    return errors;
  };

  /* ─── SUBMIT ─── */
  const handleSubmit = async () => {
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const apiBase = process.env.REACT_APP_API_URL || `${window.location.protocol}//${window.location.hostname}:3001`;

      await axios.post(
        `${apiBase}/auth/register`,
        { name: form.name, email: form.email, password: form.password, role: form.role },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSubmitSuccess(`Usuário "${form.name}" cadastrado com sucesso!`);
      setForm({ name: '', email: '', password: '', confirmPassword: '', role: 'promotor' });
      setFieldErrors({});
    } catch (err) {
      const msg = err.response?.data?.error || 'Erro ao cadastrar usuário';
      setSubmitError(msg);
    } finally {
      setLoading(false);
    }
  };

  /* ─── RENDER ─── */
  return (
    <div className="ru-root">

      {/* HEADER */}
      <header className="ru-header">
        <div className="ru-logo">
          <div className="ru-logo-icon">
            <img alt="logo" src={logo} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          
        </div>
        <div className="ru-header-right">
          <button className="lg-nav-btn" onClick={() => navigate('/admin/panel')}>
            Painel
          </button>
          <button
            className="ru-logout-btn"
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              window.location.href = '/';
            }}
          >
            ↪ Sair
          </button>
        </div>
      </header>

      {/* MAIN */}
      <main className="ru-main">
        <div className="ru-card">

          <div className="ru-card-header">
            <h1 className="ru-card-title">Cadastrar Usuário</h1>
            <p className="ru-card-subtitle">Crie um acesso para um administrador ou promotor</p>
          </div>

          {/* FEEDBACK */}
          {submitError && (
            <div className="ru-alert ru-alert-error" style={{ marginBottom: 20 }}>
              <span className="ru-alert-icon">⚠</span>
              {submitError}
            </div>
          )}
          {submitSuccess && (
            <div className="ru-alert ru-alert-success" style={{ marginBottom: 20 }}>
              <span className="ru-alert-icon">✓</span>
              {submitSuccess}
            </div>
          )}

          <div className="ru-form">

            {/* NOME */}
            <div className="ru-field">
              <label>Nome completo</label>
              <input
                name="name"
                type="text"
                placeholder="Ex: João Silva"
                value={form.name}
                onChange={handleChange}
                className={fieldErrors.name ? 'error' : ''}
                autoComplete="off"
              />
              {fieldErrors.name && <p className="ru-field-error">{fieldErrors.name}</p>}
            </div>

            {/* EMAIL */}
            <div className="ru-field">
              <label>E-mail</label>
              <input
                name="email"
                type="email"
                placeholder="usuario@exemplo.com"
                value={form.email}
                onChange={handleChange}
                className={fieldErrors.email ? 'error' : ''}
                autoComplete="off"
              />
              {fieldErrors.email && <p className="ru-field-error">{fieldErrors.email}</p>}
            </div>

            {/* SENHA */}
            <div className="ru-field">
              <label>Senha</label>
              <input
                name="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={form.password}
                onChange={handleChange}
                className={fieldErrors.password ? 'error' : ''}
                autoComplete="new-password"
              />
              {fieldErrors.password && <p className="ru-field-error">{fieldErrors.password}</p>}
            </div>

            {/* CONFIRMAR SENHA */}
            <div className="ru-field">
              <label>Confirmar senha</label>
              <input
                name="confirmPassword"
                type="password"
                placeholder="Repita a senha"
                value={form.confirmPassword}
                onChange={handleChange}
                className={fieldErrors.confirmPassword ? 'error' : ''}
                autoComplete="new-password"
              />
              {fieldErrors.confirmPassword && <p className="ru-field-error">{fieldErrors.confirmPassword}</p>}
            </div>

            <div className="ru-divider" />

            {/* PAPEL */}
            <div className="ru-field">
              <label>Tipo de acesso</label>
              <div className="ru-role-group">

                <div className="ru-role-option">
                    <input
                        type="radio"
                        id="role-promotor"
                        name="role"
                        value="promotor"
                        checked={form.role === 'promotor'}
                        onChange={handleChange}
                    />
                    <label className="ru-role-label" htmlFor="role-promotor">
                        <span className="ru-role-icon"><HiOutlineCamera size={22} /></span>
                        <span className="ru-role-name">Promotor</span>
                        <span className="ru-role-desc">Acesso ao totem</span>
                    </label>
                    </div>

                    <div className="ru-role-option">
                    <input
                        type="radio"
                        id="role-admin"
                        name="role"
                        value="admin"
                        checked={form.role === 'admin'}
                        onChange={handleChange}
                    />
                    <label className="ru-role-label" htmlFor="role-admin">
                        <span className="ru-role-icon"><HiOutlineShieldCheck size={22} /></span>
                        <span className="ru-role-name">Admin</span>
                        <span className="ru-role-desc">Acesso total</span>
                    </label>
                    </div>

              </div>
            </div>

            {/* SUBMIT */}
            <button
              className="ru-submit-btn"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="ru-spinner" />
                  Cadastrando…
                </>
              ) : (
                'Cadastrar usuário'
              )}
            </button>

          </div>
        </div>
      </main>

    </div>
  );
};

export default RegisterUser;