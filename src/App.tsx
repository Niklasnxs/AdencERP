import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { Projects } from './pages/Projects';
import { TimeTracking } from './pages/TimeTracking';
import { EmployeeTimes } from './pages/EmployeeTimes';
import { Calendar } from './pages/Calendar';
import { Users } from './pages/Users';

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
        path="/"
        element={
          <PrivateRoute>
            <Layout>
              <DashboardRoute />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/projekte"
        element={
          <PrivateRoute>
            <Layout>
              <Projects />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/zeiterfassung"
        element={
          <PrivateRoute>
            <Layout>
              <TimeTracking />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/mitarbeiterzeiten"
        element={
          <PrivateRoute>
            <Layout>
              <EmployeeTimes />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/kalender"
        element={
          <PrivateRoute>
            <Layout>
              <Calendar />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/benutzer"
        element={
          <PrivateRoute>
            <Layout>
              <Users />
            </Layout>
          </PrivateRoute>
        }
      />
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
