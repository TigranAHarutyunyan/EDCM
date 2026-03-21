import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

const GoogleCallback = () => {
  const [error, setError] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { setUser } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      // 1. Extract the 'code' from Google's redirect URL
      const params = new URLSearchParams(location.search);
      const code = params.get('code');

      if (!code) {
        setError('No authorization code received from Google.');
        return;
      }

      try {
        // 2. Exchange code with our Backend for a JWT Token
        const response = await api.get(`/auth/google/callback?code=${code}`);
        const { access_token } = response.data;

        // 3. Save token and user info
        localStorage.setItem('token', access_token);
        
        // 4. Fetch the full user profile
        const userResp = await api.get('/me');
        setUser(userResp.data);

        // 5. Success! Take them to the dashboard
        navigate('/');
      } catch (err) {
        console.error('Full Google Login Error Detail:', err);
        const detail = err.response?.data?.detail || err.message || 'Unknown error';
        setError(`Authentication failed: ${detail}. Please try again.`);
      }
    };

    handleCallback();
  }, [location, navigate, setUser]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Login Failed</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => navigate('/login')}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
          >
            Go back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
      <h2 className="text-xl font-semibold text-gray-700">Verifying with Google...</h2>
      <p className="text-gray-500 mt-2">Almost there, securing your portal access.</p>
    </div>
  );
};

export default GoogleCallback;
