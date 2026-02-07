import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { Projects } from './pages/Projects';
import { TimeTracking } from './pages/TimeTracking';
import { Calendar } from './pages/Calendar';
import { Users } from './pages/Users';
import { Customers } from './pages/Customers';

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
        <Route path="/" element={<DashboardRoute />} />
        <Route path="/projekte" element={<Projects />} />
        <Route path="/zeiterfassung" element={<TimeTracking />} />
        <Route path="/kalender" element={<Calendar />} />
        <Route path="/benutzer" element={<Users />} />
        <Route path="/kunden" element={<Customers />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
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
