import React from 'react';
import { useLocation } from 'react-router-dom';
import CameraFlow from './components/CameraFlow';
import AdminLogin from './components/screens/LoginScreen';
import AdminPanel from './components/AdminPanel';
import LogsPanel from './components/screens/Logspanel';
import RegisterUser from './components/screens/RegisterUser';

function App() {
  const location = useLocation();
  const isAdminLogin    = location.pathname === '/admin/login';
  const isAdminPanel    = location.pathname === '/admin/panel';
  const isLogsPanel     = location.pathname === '/admin/logs';
  const isRegisterUser  = location.pathname === '/admin/usuarios/novo';

  if (isAdminLogin)   return <AdminLogin />;
  if (isAdminPanel)   return <AdminPanel />;
  if (isLogsPanel)    return <LogsPanel />;
  if (isRegisterUser) return <RegisterUser />;

  return <CameraFlow />;
}

export default App;