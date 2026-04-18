import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import api from '../api';

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [status, setStatus] = useState('loading'); // loading, success, error
    const [message, setMessage] = useState('');
    const { isDarkMode, toggleTheme } = useTheme();

    useEffect(() => {
        const verify = async () => {
            if (!token) {
                setStatus('error');
                setMessage('Invalid verification link. No token provided.');
                return;
            }

            try {
                const response = await api.get(`/verify-email?token=${token}`);
                setStatus('success');
                setMessage(response.data.message || 'Email verified successfully!');
            } catch (err) {
                setStatus('error');
                setMessage(err.response?.data?.detail || 'Verification failed. The link may be expired or invalid.');
            }
        };
        verify();
    }, [token]);

    return (
        <div className={`min-h-screen flex flex-col justify-center py-12 px-6 transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
            <div className="absolute top-4 right-4">
                <button 
                  onClick={toggleTheme}
                  className={`p-2 rounded-xl border transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-yellow-500' : 'bg-white border-gray-200 text-gray-500'}`}
                >
                  {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </button>
            </div>

            <div className="max-w-md w-full mx-auto text-center">
                <div className={`p-8 rounded-2xl shadow-xl border transition-colors ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
                    {status === 'loading' && (
                        <div className="flex flex-col items-center">
                            <Loader2 className="h-16 w-16 text-blue-500 animate-spin mb-4" />
                            <h2 className="text-2xl font-bold mb-2">Verifying...</h2>
                            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Please wait while we validate your email.</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="flex flex-col items-center">
                            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                            <h2 className="text-2xl font-bold mb-2 text-green-500">Success!</h2>
                            <p className={`mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{message}</p>
                            <Link 
                                to="/login" 
                                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-500/30"
                            >
                                Continue to Log In
                            </Link>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="flex flex-col items-center">
                            <XCircle className="h-16 w-16 text-red-500 mb-4" />
                            <h2 className="text-2xl font-bold mb-2 text-red-500">Verification Failed</h2>
                            <p className={`mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{message}</p>
                            <Link 
                                to="/register" 
                                className="w-full bg-gray-600 text-white py-3 rounded-xl font-bold hover:bg-gray-700 transition"
                            >
                                Back to Registration
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;
