import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import Profile from './pages/Profile';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            {/* React should no longer own /admin – that URL is reserved for Django's admin. */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            {/* Add more protected routes here later */}
            <Route
              path="/documents"
              element={<Documents />}
            />
            <Route
              path="/profile"
              element={<Profile />}
            />
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
      </AuthProvider>
    </Router>
  );
}

export default App;
