import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { Bell, Check, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const NotificationBell = () => {
    const { isDarkMode } = useTheme();
    const { t } = useTranslation();
    const [unreadCount, setUnreadCount] = useState(0);
    const [recentNotifications, setRecentNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    const fetchNotifications = async () => {
        try {
            const countRes = await api.get('notifications/unread-count/');
            setUnreadCount(countRes.data.unread_count || 0);

            const listRes = await api.get('notifications/?page_size=5');
            setRecentNotifications(listRes.data.results || listRes.data);
        } catch (err) {
            console.error("Error fetching notifications", err);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        
        return () => {
            clearInterval(interval);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleMarkRead = async (e, id) => {
        e.stopPropagation();
        try {
            await api.post(`notifications/${id}/read/`);
            fetchNotifications();
        } catch (err) {
            console.error("Error marking as read", err);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`relative p-2.5 rounded-xl transition-all duration-300 transform active:scale-95 ${
                    isDarkMode 
                    ? 'hover:bg-slate-700 text-slate-400 hover:text-purple-400' 
                    : 'hover:bg-purple-50 text-gray-400 hover:text-purple-600'
                }`}
                aria-label={t('notifications.title')}
            >
                <Bell className="h-6 w-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-black text-white shadow-lg animate-pulse ring-2 ring-white hover:ring-purple-400 transition-all">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className={`absolute right-0 mt-3 w-80 rounded-2xl shadow-2xl overflow-hidden border transition-all z-50 transform origin-top-right ${
                    isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'
                }`}>
                    <div className={`px-4 py-3 border-b flex justify-between items-center ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-100'}`}>
                        <span className={`text-sm font-black uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{t('notifications.title')}</span>
                        <Link to="/notifications" onClick={() => setIsOpen(false)} className="text-xs font-bold text-purple-600 hover:text-purple-400 flex items-center">
                            {t('notifications.viewAll')} <ExternalLink className="h-3 w-3 ml-1" />
                        </Link>
                    </div>

                    <div className="max-h-96 overflow-y-auto scrollbar-hide">
                        {recentNotifications.length > 0 ? (
                            recentNotifications.map((n) => (
                                <div
                                    key={n.id}
                                    onClick={() => { navigate('/notifications'); setIsOpen(false); }}
                                    className={`px-4 py-4 border-b flex gap-3 cursor-pointer transition-colors ${
                                        n.is_read 
                                        ? (isDarkMode ? 'hover:bg-slate-700/50 grayscale opacity-60' : 'hover:bg-gray-50 opacity-70') 
                                        : (isDarkMode ? 'bg-purple-500/5 hover:bg-purple-500/10' : 'bg-purple-50 hover:bg-purple-100/50')
                                    } ${isDarkMode ? 'border-slate-700' : 'border-gray-50'}`}
                                >
                                    <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${n.is_read ? 'bg-transparent' : 'bg-purple-600 shadow-sm'}`} />
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-xs font-black uppercase tracking-tighter mb-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                            {n.document?.title || t('notifications.update')}
                                        </p>
                                        <p className={`text-sm font-bold truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                            {n.payload}
                                        </p>
                                        <p className="text-[10px] mt-1 text-slate-500 uppercase font-bold">
                                            {new Date(n.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    {!n.is_read && (
                                        <button 
                                            onClick={(e) => handleMarkRead(e, n.id)}
                                            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-400 hover:text-purple-600 transition-colors"
                                            title={t('notifications.markRead')}
                                        >
                                            <Check className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className={`px-4 py-10 text-center text-sm font-bold ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                                {t('notifications.allCaughtUp')}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
