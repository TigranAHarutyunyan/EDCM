import { useState } from 'react';
import { useAuth } from '../context/auth';
import { useTheme } from '../context/ThemeContext';
import { useNavigate, Link } from 'react-router-dom';
import { Sun, Moon, LogIn } from 'lucide-react';

const Login = () => {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const { login } = useAuth();
    const { isDarkMode, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            await login(formData.username, formData.password);
            navigate('/dashboard');
        } catch (err) {
            console.error('Login error:', err);
            const errorMsg = err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || 'Invalid credentials. Please try again.';
            setError(errorMsg);
        }
    };

    return (
        <div className={`min-h-screen flex items-center justify-center transition-all duration-500 ${isDarkMode ? 'bg-slate-900' : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500'}`}>
            {/* Theme Toggle Button */}
            <div className="absolute top-8 right-8">
                <button 
                    onClick={toggleTheme}
                    className={`p-3 rounded-2xl border backdrop-blur-md transition-all hover:scale-110 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-yellow-500' : 'bg-white/80 border-white text-gray-500 shadow-xl'}`}
                >
                    {isDarkMode ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
                </button>
            </div>

            <div className={`p-10 rounded-3xl shadow-2xl w-full max-w-md border backdrop-blur-2xl transition-all duration-300 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white/90 border-white/20'}`}>
                <div className="text-center mb-10">
                    <div className="flex justify-center mb-4">
                        <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-purple-500/10' : 'bg-purple-100'}`}>
                             <LogIn className={`h-10 w-10 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                        </div>
                    </div>
                    <h2 className={`text-4xl font-black mb-2 ${isDarkMode ? 'text-white' : 'text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600'}`}>
                        Welcome Back
                    </h2>
                    <p className={`font-bold transition-colors ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Sign in to access your dashboard</p>
                </div>
                
                {error && (
                    <div className="bg-red-500/10 border-l-4 border-red-500 text-red-500 p-4 mb-6 rounded-xl font-bold text-sm" role="alert">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className={`block text-xs font-black uppercase tracking-widest mb-1 ${isDarkMode ? 'text-slate-500' : 'text-gray-700'}`} htmlFor="username">
                            Username
                        </label>
                        <input
                            type="text"
                            name="username"
                            id="username"
                            value={formData.username}
                            onChange={handleChange}
                            className={`w-full px-5 py-4 rounded-2xl border font-bold outline-none transition-all focus:ring-4 ${
                                isDarkMode 
                                ? 'bg-slate-900 border-slate-700 text-white focus:ring-purple-500/20 focus:border-purple-500' 
                                : 'bg-gray-50 border-gray-200 text-gray-900 focus:ring-purple-200 focus:border-purple-500'
                            }`}
                            placeholder="Enter your username"
                            required
                        />
                    </div>
                    
                    <div>
                        <label className={`block text-xs font-black uppercase tracking-widest mb-1 ${isDarkMode ? 'text-slate-500' : 'text-gray-700'}`} htmlFor="password">
                            Password
                        </label>
                        <input
                            type="password"
                            name="password"
                            id="password"
                            value={formData.password}
                            onChange={handleChange}
                            className={`w-full px-5 py-4 rounded-2xl border font-bold outline-none transition-all focus:ring-4 ${
                                isDarkMode 
                                ? 'bg-slate-900 border-slate-700 text-white focus:ring-purple-500/20 focus:border-purple-500' 
                                : 'bg-gray-50 border-gray-200 text-gray-900 focus:ring-purple-200 focus:border-purple-500'
                            }`}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black py-4 rounded-2xl hover:scale-[1.02] transform transition-all shadow-xl active:scale-95 duration-200 uppercase tracking-widest"
                    >
                        Sign In
                    </button>
                </form>

                <div className={`mt-10 text-center text-sm font-bold ${isDarkMode ? 'text-slate-500' : 'text-gray-600'}`}>
                    Need to submit a document as a client?{" "}
                    <Link to="/portal" className="text-purple-500 hover:text-purple-400 underline underline-offset-4 decoration-2">
                        Open Public Portal
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
