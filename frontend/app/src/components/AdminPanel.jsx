import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './screens/css/admin.css';
import logo from './screens/img/logo.png';
import { HiOutlinePhoto, HiOutlineCalendarDays, HiOutlineFunnel } from 'react-icons/hi2';

const AdminPanel = () => {
  const navigate = useNavigate();
  const [photos, setPhotos] = useState([]);
  const [filteredPhotos, setFilteredPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [skeletonVisible, setSkeletonVisible] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [totalPhotos, setTotalPhotos] = useState(0);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [stats, setStats] = useState({ totalPhotos: 0, todayPhotos: 0 });

  useEffect(() => {
    fetchPhotos();
  }, [currentPage, pageSize]);

  useEffect(() => {
    applyFilters();
  }, [photos, startDate, endDate, userFilter]);

  const fetchPhotos = async () => {
    try {
      setSkeletonVisible(true);
      setLoading(true);
      const token = localStorage.getItem('token');
      const apiBase = process.env.REACT_APP_API_URL || `${window.location.protocol}//${window.location.hostname}:3001`;

      // Buscar estatísticas
      const statsResponse = await axios.get(`${apiBase}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(statsResponse.data);

      // Buscar fotos paginadas
      const response = await axios.get(`${apiBase}/photos`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page: currentPage, limit: pageSize }
      });
      const paginatedPhotos = response.data.photos || [];
      setPhotos(paginatedPhotos);
      setTotalPhotos(response.data.total || 0);
    } catch (err) {
      setError('Erro ao carregar fotos');
      console.error(err);
    } finally {
      setLoading(false);
      setTimeout(() => setSkeletonVisible(false), 300);
    }
  };

  const applyFilters = () => {
    let filtered = [...photos];
    if (startDate) filtered = filtered.filter(p => new Date(p.created_at) >= new Date(startDate));
    if (endDate) filtered = filtered.filter(p => new Date(p.created_at) <= new Date(endDate));
    if (userFilter) filtered = filtered.filter(p =>
      p.user_email?.toLowerCase().includes(userFilter.toLowerCase()) ||
      p.user_name?.toLowerCase().includes(userFilter.toLowerCase())
    );
    setFilteredPhotos(filtered);
  };

  const handlePhotoClick = async (photo) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/admin/qrcode/photo/${photo.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQrCodeUrl(response.data.qrCodeDataUrl);
      setSelectedPhoto(photo);
      setShowModal(true);
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar QR Code da foto');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedPhoto(null);
    setQrCodeUrl('');
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setUserFilter('');
  };

  const totalPages = Math.ceil(totalPhotos / pageSize);

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const getPaginationPages = () => {
    const pages = [];
    const delta = 1;
    for (let i = Math.max(1, currentPage - delta); i <= Math.min(totalPages, currentPage + delta); i++) {
      pages.push(i);
    }
    return pages;
  };

  if (loading && photos.length === 0) {
    return (
      <div className="ap-root">
        <div className="ap-loading">
          <div className="ap-spinner" />
          <p className="ap-loading-text">Carregando fotos…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ap-root">
        <div className="ap-loading">
          <div style={{ fontSize: 48 }}>⚠️</div>
          <p className="ap-loading-text">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel ap-root">

        {/* HEADER */}
        <header className="ap-header">
          <div className="ap-logo">
            <div className="ap-logo-icon">
                <div className='logo-box'>
                    <img className='ap-logo-icon' alt='logo' src={logo} />
                </div>
            </div>
           
          </div>
          <div className="ap-header-right">
            <div className="ap-badge">
              <div className="ap-badge-dot" />
              Sistema ativo
            </div>
            <button className="ap-nav-btn" onClick={() => navigate('/admin/usuarios/novo')}>
              +Usuário
            </button>
            <button
              className="ap-nav-btn"
              onClick={() => navigate('/admin/logs')}
            >
               Logs
            </button>
            <button
              className="ap-logout-btn"
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

        <main className="ap-main">

          {/* PAGE TITLE */}
          <div className="ap-page-title">
            <h1>Painel Administrativo</h1>
            <p>Gerencie e visualize as fotos capturadas no totem</p>
          </div>

          {/* STATS */}
            <div className="ap-stats">
              <div className="ap-stat-card">
                <div className="ap-stat-label">Total de Fotos</div>
                <div className="ap-stat-number">{stats.totalPhotos}</div>
                <div className="ap-stat-icon"><HiOutlinePhoto /></div>
              </div>
              <div className="ap-stat-card">
                <div className="ap-stat-label">Fotos Hoje</div>
                <div className="ap-stat-number">{stats.todayPhotos}</div>
                <div className="ap-stat-icon"><HiOutlineCalendarDays /></div>
              </div>
              <div className="ap-stat-card accent">
                <div className="ap-stat-label">Filtradas</div>
                <div className="ap-stat-number">{filteredPhotos.length}</div>
                <div className="ap-stat-icon"><HiOutlineFunnel /></div>
              </div>
            </div>

          {/* TOOLBAR */}
          <div className="ap-toolbar">
            <div className="ap-field">
              <label>Data Inicial</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="ap-field">
              <label>Data Final</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
            <div className="ap-field" style={{ flex: 2 }}>
              <label>Usuário</label>
              <input
                type="text"
                placeholder="Buscar por nome ou e-mail…"
                value={userFilter}
                onChange={e => setUserFilter(e.target.value)}
              />
            </div>
            <div className="ap-toolbar-actions">
              {(startDate || endDate || userFilter) && (
                <button className="ap-btn ap-btn-ghost" onClick={clearFilters}>
                  ✕ Limpar
                </button>
              )}
              <button className="ap-btn ap-btn-accent" onClick={fetchPhotos}>
                ↻ Atualizar
              </button>
            </div>
          </div>

          {/* PAGINATION ROW */}
          <div className="ap-pagination-row">
            <div className="ap-page-size">
              <label>Por página</label>
              <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}>
                {[6, 12, 24, 48].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            <p className="ap-results-info">
              Exibindo <strong>{filteredPhotos.length}</strong> de <strong>{totalPhotos}</strong> fotos
            </p>

            {totalPages > 1 && (
              <div className="ap-pagination">
                <button className="ap-page-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                  ←
                </button>
                {currentPage > 2 && <><button className="ap-page-btn" onClick={() => setCurrentPage(1)}>1</button><span style={{ color: 'var(--text-muted)', padding: '0 2px' }}>…</span></>}
                {getPaginationPages().map(p => (
                  <button key={p} className={`ap-page-btn${p === currentPage ? ' active' : ''}`} onClick={() => setCurrentPage(p)}>{p}</button>
                ))}
                {currentPage < totalPages - 1 && <><span style={{ color: 'var(--text-muted)', padding: '0 2px' }}>…</span><button className="ap-page-btn" onClick={() => setCurrentPage(totalPages)}>{totalPages}</button></>}
                <button className="ap-page-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                  →
                </button>
              </div>
            )}
          </div>

          {/* GRID */}
          <div className="ap-grid">
            {skeletonVisible && photos.length === 0
              ? Array.from({ length: pageSize }).map((_, i) => (
                  <div key={i} className="ap-skeleton-card">
                    <div className="ap-skeleton ap-skeleton-img" />
                    <div className="ap-skeleton-info">
                      <div className="ap-skeleton" style={{ height: 12, width: '60%' }} />
                      <div className="ap-skeleton" style={{ height: 10, width: '80%' }} />
                    </div>
                  </div>
                ))
              : filteredPhotos.length === 0
                ? (
                  <div className="ap-empty">
                    <div className="ap-empty-icon">🔍</div>
                    <p className="ap-empty-title">Nenhuma foto encontrada</p>
                    <p className="ap-empty-sub">Tente ajustar os filtros ou aguarde novas capturas.</p>
                  </div>
                )
                : filteredPhotos.map(photo => (
                    <div key={photo.id} className="ap-photo-card" onClick={() => handlePhotoClick(photo)}>
                      <div className="ap-photo-thumb-wrap">
                        <img
                          className="ap-photo-thumb"
                          src={photo.url || photo.cloudinary_url}
                          alt={`Foto ${photo.id}`}
                          loading="lazy"
                        />
                        <div className="ap-photo-overlay">
                          <div className="ap-photo-qr-hint">
                             Ver QR Code
                          </div>
                        </div>
                      </div>
                      <div className="ap-photo-info">
                        <div className="ap-photo-user">
                          <div className="ap-avatar">{getInitials(photo.user_name)}</div>
                          <span className="ap-photo-user-name">{photo.user_name || 'Usuário'}</span>
                        </div>
                        <div className="ap-photo-meta">
                          🕐 {new Date(photo.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))
            }
          </div>

        </main>

        {/* MODAL */}
        {showModal && selectedPhoto && (
          <div className="ap-modal-overlay" onClick={closeModal}>
            <div className="ap-modal" onClick={e => e.stopPropagation()}>
              <div className="ap-modal-header">
                <span className="ap-modal-title">Detalhes da Foto</span>
                <button className="ap-modal-close" onClick={closeModal}>×</button>
              </div>
              <div className="ap-modal-body">
                <div className="ap-modal-left">
                  <img
                    className="ap-modal-photo"
                    src={selectedPhoto.cloudinary_url || selectedPhoto.url}
                    alt="Foto selecionada"
                  />
                </div>
                <div className="ap-modal-right">
                  {qrCodeUrl && (
                    <div className="ap-modal-qr-section">
                      <span className="ap-modal-qr-label">QR Code</span>
                      <div className="ap-qr-wrap">
                        <img className="ap-qr-img" src={qrCodeUrl} alt="QR Code" />
                      </div>
                    </div>
                  )}
                  <div className="ap-modal-details">
                    <div className="ap-detail-row">
                      <span className="ap-detail-key">ID</span>
                      <span className="ap-detail-value">#{selectedPhoto.id}</span>
                    </div>
                    <div className="ap-detail-row">
                      <span className="ap-detail-key">Usuário</span>
                      <span className="ap-detail-value">{selectedPhoto.user_name || '—'}</span>
                    </div>
                    <div className="ap-detail-row">
                      <span className="ap-detail-key">E-mail</span>
                      <span className="ap-detail-value">{selectedPhoto.user_email || '—'}</span>
                    </div>
                    <div className="ap-detail-row">
                      <span className="ap-detail-key">Data e Hora</span>
                      <span className="ap-detail-value">
                        {new Date(selectedPhoto.created_at).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
  );
};

export default AdminPanel;