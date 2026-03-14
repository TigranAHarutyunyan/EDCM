import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import Portal from './pages/Portal';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import Profile from './pages/Profile';
import DepartmentPanel from './pages/DepartmentPanel';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ErrorBoundary>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/portal" element={<Portal />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              {/* React should no longer own /admin – that URL is reserved for Django's admin. */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              {/* Add more protected routes here later */}
              <Route path="/documents" element={<Documents />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/department/*" element={<DepartmentPanel />} />
              <Route
                path="/documents/new"
                element={
                  <div className="text-center py-10">
                    New Document form coming soon...
                  </div>
                }
              />
            </Route>
          </Routes>
        </ErrorBoundary>
      </AuthProvider>
    </Router>
  );
}

export default App;
