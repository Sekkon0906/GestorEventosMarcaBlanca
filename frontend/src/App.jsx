import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import GLoader from './components/ui/GLoader.jsx';

import PublicLayout       from './components/layout/PublicLayout.jsx';
import AppLayout          from './components/layout/AppLayout.jsx';

import LandingHomePage    from './pages/public/LandingHomePage.jsx';
import ComoFuncionaPage   from './pages/public/ComoFuncionaPage.jsx';
import ProductoPage       from './pages/public/ProductoPage.jsx';
import ExplorarPage       from './pages/public/ExplorarPage.jsx';
import EventoPublicoPage  from './pages/public/EventoPublicoPage.jsx';
import MiTicketPage       from './pages/public/MiTicketPage.jsx';
import PlanesPage         from './pages/public/PlanesPage.jsx';
import FAQPage            from './pages/public/FAQPage.jsx';

import AuthPage             from './pages/AuthPage.jsx';
import RecuperarPage        from './pages/RecuperarPage.jsx';
import ResetPasswordPage    from './pages/ResetPasswordPage.jsx';
import ConfirmarPage        from './pages/ConfirmarPage.jsx';
import CompletarPerfilPage  from './pages/CompletarPerfilPage.jsx';
import DashboardPage        from './pages/DashboardPage.jsx';
import EventsListPage     from './pages/events/EventsListPage.jsx';
import EventCreatePage    from './pages/events/EventCreatePage.jsx';
import EventDetailPage    from './pages/events/EventDetailPage.jsx';
import EventEditPage      from './pages/events/EventEditPage.jsx';
import UsersPage          from './pages/users/UsersPage.jsx';
import SettingsPage       from './pages/settings/SettingsPage.jsx';

function AuthLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <GLoader size="lg" />
    </div>
  );
}

function PrivateRoute({ children, allowIncomplete = false }) {
  const { token, loading, usuario } = useAuth();
  const { pathname } = useLocation();
  if (loading) return <AuthLoader />;
  if (!token) return <Navigate to="/login" replace />;

  /* Si el perfil está incompleto (típico de signup con Google), forzamos
     pasar por /completar-perfil antes de entrar a la app. */
  if (!allowIncomplete && usuario && !usuario.perfilCompleto && pathname !== '/completar-perfil') {
    return <Navigate to="/completar-perfil" replace />;
  }
  return children;
}

function PublicOnlyRoute({ children }) {
  const { token, loading, usuario } = useAuth();
  if (loading) return <AuthLoader />;
  if (!token) return children;
  /* Si está logueado pero falta completar perfil, mándalo allí. */
  if (usuario && !usuario.perfilCompleto) return <Navigate to="/completar-perfil" replace />;
  return <Navigate to="/dashboard" replace />;
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
              <Route path="/mi-ticket/:codigo" element={<MiTicketPage />} />
              <Route path="/planes"            element={<PlanesPage />} />
              <Route path="/faq"               element={<FAQPage />} />
            </Route>

            {/* Auth pages (unified with panel-swap animation) */}
            <Route path="/login"        element={<PublicOnlyRoute><AuthPage /></PublicOnlyRoute>} />
            <Route path="/register"     element={<PublicOnlyRoute><AuthPage /></PublicOnlyRoute>} />
            <Route path="/acceder"      element={<Navigate to="/login" replace />} />
            <Route path="/recuperar"        element={<RecuperarPage />} />
            <Route path="/restablecer"      element={<ResetPasswordPage />} />
            <Route path="/confirmar"        element={<ConfirmarPage />} />
            <Route path="/completar-perfil" element={
              <PrivateRoute allowIncomplete><CompletarPerfilPage /></PrivateRoute>
            } />

            {/* App protegida */}
            <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
              <Route path="/dashboard"        element={<DashboardPage />} />
              <Route path="/eventos"          element={<EventsListPage />} />
              <Route path="/eventos/nuevo"      element={<EventCreatePage />} />
              <Route path="/eventos/:id"        element={<EventDetailPage />} />
              <Route path="/eventos/:id/editar" element={<EventEditPage />} />
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
