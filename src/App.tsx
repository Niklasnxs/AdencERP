import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { Projects } from './pages/Projects';
import { Calendar } from './pages/Calendar';
import { Users } from './pages/Users';
import { Customers } from './pages/Customers';
import { Rules } from './pages/Rules';
import { CockpitGuide } from './pages/CockpitGuide';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

function DashboardRoute() {
  const { isAdmin } = useAuth();
  return isAdmin ? <AdminDashboard /> : <Dashboard />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route path="/" element={<Navigate to="/kalender" replace />} />
        <Route path="/uebersicht" element={<DashboardRoute />} />
        <Route path="/projekte" element={<Projects />} />
        <Route path="/zeiterfassung" element={<Navigate to="/kalender" replace />} />
        <Route path="/kalender" element={<Calendar />} />
        <Route path="/anleitung-cockpit" element={<CockpitGuide />} />
        <Route path="/regelwerk" element={<Rules />} />
        <Route path="/benutzer" element={<Users />} />
        <Route path="/kunden" element={<Customers />} />
      </Route>
      <Route path="*" element={<Navigate to="/kalender" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
