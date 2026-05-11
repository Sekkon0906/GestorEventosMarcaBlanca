import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';

import PublicLayout       from './components/layout/PublicLayout.jsx';
import AppLayout          from './components/layout/AppLayout.jsx';

import LandingHomePage    from './pages/public/LandingHomePage.jsx';
import ComoFuncionaPage   from './pages/public/ComoFuncionaPage.jsx';
import ProductoPage       from './pages/public/ProductoPage.jsx';
import ExplorarPage       from './pages/public/ExplorarPage.jsx';
import EventoPublicoPage  from './pages/public/EventoPublicoPage.jsx';
import PlanesPage         from './pages/public/PlanesPage.jsx';
import FAQPage            from './pages/public/FAQPage.jsx';

import AuthPage           from './pages/AuthPage.jsx';
import DashboardPage      from './pages/DashboardPage.jsx';
import EventsListPage     from './pages/events/EventsListPage.jsx';
import EventCreatePage    from './pages/events/EventCreatePage.jsx';
import EventDetailPage    from './pages/events/EventDetailPage.jsx';
import UsersPage          from './pages/users/UsersPage.jsx';
import SettingsPage       from './pages/settings/SettingsPage.jsx';

function PrivateRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

function PublicOnlyRoute({ children }) {
  const { token } = useAuth();
  return !token ? children : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Public site */}
            <Route element={<PublicLayout />}>
              <Route path="/"                  element={<LandingHomePage />} />
              <Route path="/como-funciona"     element={<ComoFuncionaPage />} />
              <Route path="/producto"          element={<ProductoPage />} />
              <Route path="/explorar"          element={<ExplorarPage />} />
              <Route path="/explorar/:slug"    element={<EventoPublicoPage />} />
              <Route path="/planes"            element={<PlanesPage />} />
              <Route path="/faq"               element={<FAQPage />} />
            </Route>

            {/* Auth pages (unified with panel-swap animation) */}
            <Route path="/login"    element={<PublicOnlyRoute><AuthPage /></PublicOnlyRoute>} />
            <Route path="/register" element={<PublicOnlyRoute><AuthPage /></PublicOnlyRoute>} />
            <Route path="/acceder"  element={<Navigate to="/login" replace />} />

            {/* App protegida */}
            <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
              <Route path="/dashboard"        element={<DashboardPage />} />
              <Route path="/eventos"          element={<EventsListPage />} />
              <Route path="/eventos/nuevo"    element={<EventCreatePage />} />
              <Route path="/eventos/:id"      element={<EventDetailPage />} />
              <Route path="/usuarios"         element={<UsersPage />} />
              <Route path="/configuracion"    element={<SettingsPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
