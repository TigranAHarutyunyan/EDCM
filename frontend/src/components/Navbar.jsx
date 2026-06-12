import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";
import { Sun, Moon } from "lucide-react";
import NotificationBell from "./NotificationBell";
import LanguageSelector from "./LanguageSelector";

const Navbar = () => {
    const { user, logout } = useAuth();
    const { isDarkMode, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const handleLogout = async () => {
        await logout();
        navigate("/login");
    };

    const isHeadOfDepartment = user && (user.role === 'Admin' || user.role === 'Manager' || user.is_superuser);

    return (
        <nav className={`backdrop-blur-md sticky top-0 z-40 transition-colors duration-300 border-b ${isDarkMode ? 'bg-slate-900/80 border-slate-800 text-white' : 'bg-white/80 border-gray-100'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link
                            to="/dashboard"
                            className="flex-shrink-0 flex items-center group"
                        >
                            <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 group-hover:from-indigo-600 group-hover:to-purple-600 transition-all duration-300">
                                EDCM
                            </span>
                        </Link>
                        <div className="hidden sm:ml-8 sm:flex sm:space-x-4">
                            <Link
                                to="/dashboard"
                                className={`${isDarkMode ? 'text-slate-400 hover:text-white' : 'text-gray-600 hover:text-purple-600'} px-3 py-2 rounded-lg text-sm font-semibold transition-colors`}
                            >
                                {t('nav.dashboard')}
                            </Link>
                            <Link
                                to="/documents"
                                className={`${isDarkMode ? 'text-slate-400 hover:text-white' : 'text-gray-600 hover:text-purple-600'} px-3 py-2 rounded-lg text-sm font-semibold transition-colors`}
                            >
                                {t('nav.documents')}
                            </Link>
                            {isHeadOfDepartment && (
                                <Link
                                    to="/department"
                                    className={`${isDarkMode ? 'text-slate-400 hover:text-white' : 'text-gray-600 hover:text-purple-600'} px-3 py-2 rounded-lg text-sm font-semibold transition-colors`}
                                >
                                    {t('nav.departments')}
                                </Link>
                            )}
                            <Link
                                to="/profile"
                                className={`${isDarkMode ? 'text-slate-400 hover:text-white' : 'text-gray-600 hover:text-purple-600'} px-3 py-2 rounded-lg text-sm font-semibold transition-colors`}
                            >
                                {t('nav.profile')}
                            </Link>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 md:space-x-4">
                        <button 
                            onClick={toggleTheme}
                             className={`p-2 rounded-xl transition-all duration-300 ${isDarkMode ? 'hover:bg-slate-800 text-yellow-400' : 'hover:bg-gray-100 text-gray-500'}`}
                        >
                            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                        </button>
                        <div className="hidden sm:block">
                            <LanguageSelector />
                        </div>
                        <NotificationBell />
                        <div className="flex items-center space-x-4 pl-4 border-l border-gray-100">
                            <div className="hidden lg:flex flex-col items-end">
                                <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">{t('nav.loggedInAs')}</span>
                                <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                    {user?.username}
                                </span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200"
                                title={t('nav.logout')}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
