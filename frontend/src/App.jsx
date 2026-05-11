import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import AppLayout from './components/layout/AppLayout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import EventsListPage from './pages/events/EventsListPage.jsx';
import EventCreatePage from './pages/events/EventCreatePage.jsx';
import EventDetailPage from './pages/events/EventDetailPage.jsx';
import UsersPage from './pages/users/UsersPage.jsx';
import SettingsPage from './pages/settings/SettingsPage.jsx';

function PrivateRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { token } = useAuth();
  return !token ? children : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

          <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard"        element={<DashboardPage />} />
            <Route path="/eventos"          element={<EventsListPage />} />
            <Route path="/eventos/nuevo"    element={<EventCreatePage />} />
            <Route path="/eventos/:id"      element={<EventDetailPage />} />
            <Route path="/usuarios"         element={<UsersPage />} />
            <Route path="/configuracion"    element={<SettingsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
