import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineCommandLine,
  HiOutlineArrowPath,
  HiOutlineFunnel,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineInformationCircle,
  HiOutlineQueueList,
  HiOutlineTrash,
  HiOutlineArrowDownTray,
  HiOutlineXMark,
} from 'react-icons/hi2';
import './css/Logspanel.css';

/* ─── HELPERS ─── */
const getStatusClass = (code) => {
  if (!code) return '';
  if (code >= 200 && code < 300) return 'lg-status-2xx';
  if (code >= 300 && code < 400) return 'lg-status-3xx';
  if (code >= 400 && code < 500) return 'lg-status-4xx';
  return 'lg-status-5xx';
};

const getMethodClass = (method) => {
  const m = (method || '').toUpperCase();
  return `lg-method lg-method-${m}`;
};

const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
};

const shortId = (id) => id ? id.slice(0, 8) + '…' : '—';

const bodyPreview = (body) => {
  if (!body || body === 'null') return null;
  try {
    const str = typeof body === 'string' ? body : JSON.stringify(body);
    return str.length > 40 ? str.slice(0, 40) + '…' : str;
  } catch { return String(body).slice(0, 40); }
};

const formatBody = (body) => {
  if (!body || body === 'null') return null;
  try {
    const obj = typeof body === 'string' ? JSON.parse(body) : body;
    return JSON.stringify(obj, null, 2);
  } catch { return String(body); }
};

/* ─── CONFIRM MODAL ─── */
const ConfirmModal = ({ message, onConfirm, onCancel }) => (
  <div className="lg-modal-overlay" onClick={onCancel}>
    <div className="lg-confirm-modal" onClick={e => e.stopPropagation()}>
      <div className="lg-confirm-icon">
        <HiOutlineTrash size={28} />
      </div>
      <p className="lg-confirm-message">{message}</p>
      <div className="lg-confirm-actions">
        <button className="lg-btn lg-btn-ghost" onClick={onCancel}>Cancelar</button>
        <button className="lg-btn lg-btn-danger" onClick={onConfirm}>Apagar</button>
      </div>
    </div>
  </div>
);

/* ─── COMPONENT ─── */
const LogsPanel = () => {
  const navigate = useNavigate();
  const [logs, setLogs]               = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize]       = useState(25);
  const [total, setTotal]             = useState(0);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showModal, setShowModal]     = useState(false);

  /* selection */
  const [selectedIds, setSelectedIds]   = useState(new Set());
  const [confirmAction, setConfirmAction] = useState(null);

  /* filters */
  const [routeFilter,  setRouteFilter]  = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate,    setStartDate]    = useState('');
  const [endDate,      setEndDate]      = useState('');

  /* sort */
  const [sortField, setSortField] = useState('created_at');
  const [sortDir,   setSortDir]   = useState('desc');

  /* stats */
  const [stats, setStats] = useState({ total: 0, success: 0, errors: 0, redirects: 0 });

  const apiBase = process.env.REACT_APP_API_URL || `${window.location.protocol}//${window.location.hostname}:3001`;
  const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

  /* ─── FETCH ─── */
  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${apiBase}/admin/logs`, {
        headers: getHeaders(),
        params: {
          page: currentPage, limit: pageSize,
          route:     routeFilter  || undefined,
          method:    methodFilter || undefined,
          status:    statusFilter || undefined,
          startDate: startDate    || undefined,
          endDate:   endDate      || undefined,
          sortField, sortDir,
        },
      });
      const data     = response.data;
      const logsData = data.logs || [];
      setLogs(logsData);
      setTotal(data.total || 0);
      setSelectedIds(new Set());

      const s = logsData.reduce((acc, log) => {
        acc.total++;
        if (log.status_code >= 200 && log.status_code < 300)      acc.success++;
        else if (log.status_code >= 300 && log.status_code < 400) acc.redirects++;
        else if (log.status_code >= 400)                           acc.errors++;
        return acc;
      }, { total: 0, success: 0, errors: 0, redirects: 0 });
      setStats(s);
    } catch (err) {
      setError('Erro ao carregar logs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, routeFilter, methodFilter, statusFilter, startDate, endDate, sortField, sortDir]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  /* ─── SELECTION ─── */
  const toggleSelect = (id, e) => {
    e.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds(selectedIds.size === logs.length ? new Set() : new Set(logs.map(l => l.id)));
  };

  const clearSelection = () => setSelectedIds(new Set());

  const allSelected  = logs.length > 0 && selectedIds.size === logs.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  /* ─── DELETE ─── */
  const handleDeleteSelected = async () => {
    try {
      setLoading(true);
      await axios.delete(`${apiBase}/admin/logs`, {
        headers: getHeaders(),
        data: { ids: Array.from(selectedIds) },
      });
      setConfirmAction(null);
      setSelectedIds(new Set());
      await fetchLogs();
    } catch (err) {
      console.error(err);
      alert('Erro ao apagar logs selecionados.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    try {
      setLoading(true);
      await axios.delete(`${apiBase}/admin/logs`, {
        headers: getHeaders(),
        data: { all: true },
      });
      setConfirmAction(null);
      await fetchLogs();
    } catch (err) {
      console.error(err);
      alert('Erro ao apagar todos os logs.');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (type) => {
    if (type === 'selected') {
      setConfirmAction({
        message: `Apagar ${selectedIds.size} log${selectedIds.size > 1 ? 's' : ''} selecionado${selectedIds.size > 1 ? 's' : ''}? Esta ação não pode ser desfeita.`,
        onConfirm: handleDeleteSelected,
      });
    } else {
      setConfirmAction({
        message: `Apagar TODOS os ${total} logs? Esta ação não pode ser desfeita.`,
        onConfirm: handleDeleteAll,
      });
    }
  };

  /* ─── SORT ─── */
  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
    setCurrentPage(1);
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <span className="lg-sort-icon">↕</span>;
    return <span className="lg-sort-icon">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  /* ─── PAGINATION ─── */
  const totalPages = Math.ceil(total / pageSize);
  const getPaginationPages = () => {
    const delta = 1, pages = [];
    for (let i = Math.max(1, currentPage - delta); i <= Math.min(totalPages, currentPage + delta); i++) pages.push(i);
    return pages;
  };

  /* ─── FILTERS ─── */
  const clearFilters = () => {
    setRouteFilter(''); setMethodFilter(''); setStatusFilter('');
    setStartDate(''); setEndDate(''); setCurrentPage(1);
  };
  const hasFilters = routeFilter || methodFilter || statusFilter || startDate || endDate;

  /* ─── CSV ─── */
  const convertLogsToCSV = (logsArray) => {
    const columns = ['id', 'created_at', 'route', 'method', 'status_code', 'ip', 'body'];
    const esc = (v) => {
      if (v === null || v === undefined) return '';
      const t = typeof v === 'object' ? JSON.stringify(v) : String(v);
      return `"${t.replace(/"/g, '""')}"`;
    };
    return [columns.map(c => `"${c}"`).join(','), ...logsArray.map(l => columns.map(c => esc(l[c])).join(','))].join('\n');
  };

  const downloadLogsCsv = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${apiBase}/admin/logs`, {
        headers: getHeaders(),
        params: { route: routeFilter || undefined, method: methodFilter || undefined, status: statusFilter || undefined, startDate: startDate || undefined, endDate: endDate || undefined, sortField, sortDir, page: 1, limit: 10000 }
      });
      const logsToDownload = response.data.logs || [];
      if (!logsToDownload.length) { alert('Nenhum log disponível.'); return; }
      const blob = new Blob([convertLogsToCSV(logsToDownload)], { type: 'text/csv;charset=utf-8;' });
      const url  = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href  = url;
      link.setAttribute('download', `logs_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Erro ao baixar logs.');
    } finally {
      setLoading(false);
    }
  };

  /* ─── LOADING / ERROR ─── */
  if (loading && logs.length === 0) {
    return (
      <div className="lg-root">
        <div className="lg-loading">
          <div className="lg-spinner" />
          <p className="lg-loading-text">Carregando logs…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="lg-root">
        <div className="lg-loading">
          <HiOutlineExclamationCircle style={{ fontSize: 48, color: 'var(--danger)', opacity: 0.6 }} />
          <p className="lg-loading-text">{error}</p>
        </div>
      </div>
    );
  }

  /* ─── RENDER ─── */
  return (
    <div className="lg-root">

      {/* HEADER */}
      <header className="lg-header">
        <div className="lg-logo">
          <div className="lg-logo-icon" />
        </div>
        <div className="lg-header-right">
          <div className="lg-badge">
            <div className="lg-badge-dot" />
            {total} registros
          </div>
          <button className="lg-nav-btn" onClick={() => navigate('/admin/panel')}>
            Painel
          </button>
          <button className="lg-logout-btn" onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.href = '/'; }}>
             Sair
          </button>
        </div>
      </header>

      <main className="lg-main">

        {/* PAGE TITLE */}
        <div className="lg-page-title">
          <h1>Logs do Sistema</h1>
          <p>Monitoramento de requisições e eventos da API</p>
        </div>

        {/* STATS */}
        <div className="lg-stats">
          <div className="lg-stat-card">
            <div className="lg-stat-label">Total de Logs</div>
            <div className="lg-stat-number">{total}</div>
            <div className="lg-stat-icon"><HiOutlineQueueList /></div>
          </div>
          <div className="lg-stat-card success">
            <div className="lg-stat-label">Sucesso (2xx)</div>
            <div className="lg-stat-number">{stats.success}</div>
            <div className="lg-stat-icon"><HiOutlineCheckCircle /></div>
          </div>
          <div className="lg-stat-card warning">
            <div className="lg-stat-label">Redirecionamentos (3xx)</div>
            <div className="lg-stat-number">{stats.redirects}</div>
            <div className="lg-stat-icon"><HiOutlineInformationCircle /></div>
          </div>
          <div className="lg-stat-card danger">
            <div className="lg-stat-label">Erros (4xx / 5xx)</div>
            <div className="lg-stat-number">{stats.errors}</div>
            <div className="lg-stat-icon"><HiOutlineExclamationCircle /></div>
          </div>
        </div>

        {/* TOOLBAR */}
        <div className="lg-toolbar">
          <div className="lg-field">
            <label>Data Inicial</label>
            <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setCurrentPage(1); }} />
          </div>
          <div className="lg-field">
            <label>Data Final</label>
            <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setCurrentPage(1); }} />
          </div>
          <div className="lg-field" style={{ flex: 2 }}>
            <label>Rota</label>
            <input type="text" placeholder="/photos, /auth/login…" value={routeFilter} onChange={e => { setRouteFilter(e.target.value); setCurrentPage(1); }} />
          </div>
          <div className="lg-field">
            <label>Método</label>
            <select value={methodFilter} onChange={e => { setMethodFilter(e.target.value); setCurrentPage(1); }}>
              <option value="">Todos</option>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>
          <div className="lg-field">
            <label>Status</label>
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}>
              <option value="">Todos</option>
              <option value="2xx">2xx Sucesso</option>
              <option value="3xx">3xx Redirecionamento</option>
              <option value="4xx">4xx Erro cliente</option>
              <option value="5xx">5xx Erro servidor</option>
            </select>
          </div>
          <div className="lg-toolbar-actions">
            {hasFilters && (
              <button className="lg-btn lg-btn-ghost" onClick={clearFilters}>
                <HiOutlineFunnel size={14} /> Limpar
              </button>
            )}
            <button className="lg-btn lg-btn-accent" onClick={() => { setCurrentPage(1); fetchLogs(); }}>
              <HiOutlineArrowPath size={14} /> Atualizar
            </button>
            <button className="lg-btn lg-btn-success" onClick={downloadLogsCsv}>
              <HiOutlineArrowDownTray size={14} /> CSV
            </button>
            <button className="lg-btn lg-btn-danger-outline" onClick={() => confirmDelete('all')}>
              <HiOutlineTrash size={14} /> Apagar tudo
            </button>
          </div>
        </div>

        {/* SELECTION BAR — aparece quando há itens selecionados */}
        {selectedIds.size > 0 && (
          <div className="lg-selection-bar">
            <div className="lg-selection-info">
              <span className="lg-selection-count">{selectedIds.size}</span>
              log{selectedIds.size > 1 ? 's' : ''} selecionado{selectedIds.size > 1 ? 's' : ''}
            </div>
            <div className="lg-selection-actions">
              <button className="lg-btn lg-btn-danger" onClick={() => confirmDelete('selected')}>
                <HiOutlineTrash size={14} /> Apagar selecionados
              </button>
              <button className="lg-btn lg-btn-ghost" onClick={clearSelection}>
                <HiOutlineXMark size={14} /> Cancelar
              </button>
            </div>
          </div>
        )}

        {/* INFO ROW */}
        <div className="lg-info-row">
          <p className="lg-results-info">
            Exibindo <strong>{logs.length}</strong> de <strong>{total}</strong> logs
          </p>
          <div className="lg-page-size">
            <label>Por página</label>
            <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}>
              {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>

        {/* TABLE */}
        <div className="lg-table-wrap">
          {logs.length === 0 ? (
            <div className="lg-empty">
              <div className="lg-empty-icon"><HiOutlineCommandLine /></div>
              <p className="lg-empty-title">Nenhum log encontrado</p>
              <p className="lg-empty-sub">Tente ajustar os filtros ou aguarde novas requisições.</p>
            </div>
          ) : (
            <table className="lg-table">
              <thead>
                <tr>
                  <th className="lg-th-check">
                    <div
                      className={`lg-checkbox ${allSelected ? 'checked' : someSelected ? 'indeterminate' : ''}`}
                      onClick={toggleSelectAll}
                    />
                  </th>
                  <th>ID</th>
                  <th className={`sortable${sortField === 'created_at' ? ' sort-active' : ''}`} onClick={() => handleSort('created_at')}>
                    Data <SortIcon field="created_at" />
                  </th>
                  <th className={`sortable${sortField === 'route' ? ' sort-active' : ''}`} onClick={() => handleSort('route')}>
                    Rota <SortIcon field="route" />
                  </th>
                  <th className={`sortable${sortField === 'method' ? ' sort-active' : ''}`} onClick={() => handleSort('method')}>
                    Método <SortIcon field="method" />
                  </th>
                  <th className={`sortable${sortField === 'status_code' ? ' sort-active' : ''}`} onClick={() => handleSort('status_code')}>
                    Status <SortIcon field="status_code" />
                  </th>
                  <th>IP</th>
                  <th>Body</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => {
                  const isSelected = selectedIds.has(log.id);
                  const preview    = bodyPreview(log.body);
                  return (
                    <tr
                      key={log.id}
                      className={isSelected ? 'selected' : ''}
                      onClick={() => { setSelectedLog(log); setShowModal(true); }}
                    >
                      <td className="lg-td-check" onClick={e => toggleSelect(log.id, e)}>
                        <div className={`lg-checkbox ${isSelected ? 'checked' : ''}`} />
                      </td>
                      <td className="lg-td-id">{shortId(log.id)}</td>
                      <td className="lg-td-date">{formatDate(log.created_at)}</td>
                      <td className="lg-td-route">{log.route || '—'}</td>
                      <td><span className={getMethodClass(log.method)}>{log.method || '—'}</span></td>
                      <td>
                        <span className={`lg-status ${getStatusClass(log.status_code)}`}>
                          <span className="lg-status-dot" />
                          {log.status_code ?? '—'}
                        </span>
                      </td>
                      <td className="lg-td-ip">{log.ip || '—'}</td>
                      <td>
                        {preview
                          ? <span className="lg-body-preview">{preview}</span>
                          : <span className="lg-body-null">null</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="lg-pagination-row">
            <div />
            <div className="lg-pagination">
              <button className="lg-page-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>←</button>
              {currentPage > 2 && (<><button className="lg-page-btn" onClick={() => setCurrentPage(1)}>1</button><span style={{ color: 'var(--text-muted)', padding: '0 2px' }}>…</span></>)}
              {getPaginationPages().map(p => (
                <button key={p} className={`lg-page-btn${p === currentPage ? ' active' : ''}`} onClick={() => setCurrentPage(p)}>{p}</button>
              ))}
              {currentPage < totalPages - 1 && (<><span style={{ color: 'var(--text-muted)', padding: '0 2px' }}>…</span><button className="lg-page-btn" onClick={() => setCurrentPage(totalPages)}>{totalPages}</button></>)}
              <button className="lg-page-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>→</button>
            </div>
          </div>
        )}

      </main>

      {/* DETAIL MODAL */}
      {showModal && selectedLog && (
        <div className="lg-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="lg-modal" onClick={e => e.stopPropagation()}>
            <div className="lg-modal-header">
              <span className="lg-modal-title">
                <HiOutlineCommandLine size={18} style={{ color: 'var(--accent)' }} />
                Detalhe do Log
              </span>
              <button className="lg-modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="lg-modal-body">
              <div>
                <div className="lg-modal-section-title">Identificação</div>
                <div className="lg-modal-grid">
                  <div className="lg-modal-field full">
                    <span className="lg-modal-key">ID</span>
                    <span className="lg-modal-value mono">{selectedLog.id}</span>
                  </div>
                  <div className="lg-modal-field">
                    <span className="lg-modal-key">Data / Hora</span>
                    <span className="lg-modal-value">{formatDate(selectedLog.created_at)}</span>
                  </div>
                  <div className="lg-modal-field">
                    <span className="lg-modal-key">User ID</span>
                    <span className="lg-modal-value mono">{selectedLog.user_id || '—'}</span>
                  </div>
                </div>
              </div>
              <div>
                <div className="lg-modal-section-title">Requisição</div>
                <div className="lg-modal-grid">
                  <div className="lg-modal-field">
                    <span className="lg-modal-key">Rota</span>
                    <span className="lg-modal-value mono">{selectedLog.route || '—'}</span>
                  </div>
                  <div className="lg-modal-field">
                    <span className="lg-modal-key">Método</span>
                    <span className={getMethodClass(selectedLog.method)} style={{ display: 'inline-flex', marginTop: 4 }}>
                      {selectedLog.method || '—'}
                    </span>
                  </div>
                  <div className="lg-modal-field">
                    <span className="lg-modal-key">IP</span>
                    <span className="lg-modal-value mono">{selectedLog.ip || '—'}</span>
                  </div>
                  <div className="lg-modal-field">
                    <span className="lg-modal-key">Status</span>
                    <span className={`lg-status ${getStatusClass(selectedLog.status_code)}`} style={{ display: 'inline-flex', marginTop: 4 }}>
                      <span className="lg-status-dot" />
                      {selectedLog.status_code ?? '—'}
                    </span>
                  </div>
                </div>
              </div>
              {selectedLog.body && selectedLog.body !== 'null' && (
                <div>
                  <div className="lg-modal-section-title">Body</div>
                  <pre className="lg-json-block">{formatBody(selectedLog.body)}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {confirmAction && (
        <ConfirmModal
          message={confirmAction.message}
          onConfirm={confirmAction.onConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}

    </div>
  );
};

export default LogsPanel;