import { useState, useEffect } from "react";
import api from "../services/api";
import { useTheme } from "../context/ThemeContext";
import { Bell, CheckCircle, Info, AlertTriangle, FileText, ChevronLeft, Check } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Notifications = () => {
    const { isDarkMode } = useTheme();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadNotifications = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await api.get("notifications/");
            setNotifications(response.data.results || response.data);
        } catch (err) {
            setError(t('notifications.errors.load'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadNotifications();
    }, []);

    const markRead = async (id) => {
        try {
            await api.post(`notifications/${id}/read/`);
            loadNotifications();
        } catch (err) {
            setError(t('notifications.errors.update'));
        }
    };

    const getIcon = (type) => {
        switch(type?.code) {
            case 'NEW_DOCUMENT': return <FileText className="h-5 w-5 text-blue-500" />;
            case 'NEEDS_APPROVAL': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
            case 'DOCUMENT_APPROVED': return <CheckCircle className="h-5 w-5 text-green-500" />;
            default: return <Bell className="h-5 w-5 text-purple-500" />;
        }
    };

    return (
        <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
            <div className="max-w-4xl mx-auto py-12 px-4">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <Link to="/dashboard" className="flex items-center text-sm font-bold text-purple-600 hover:text-purple-400 mb-2 transition-colors">
                            <ChevronLeft className="h-4 w-4 mr-1" /> {t('notifications.backToDashboard')}
                        </Link>
                        <h1 className="text-4xl font-black tracking-tight">{t('notifications.systemTitle')}</h1>
                        <p className={`mt-2 font-medium ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                            {t('notifications.subtitle')}
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 font-bold flex items-center">
                        <AlertTriangle className="h-5 w-5 mr-3" />
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
                        <p className="font-bold text-slate-500 uppercase tracking-widest text-xs">{t('notifications.loading')}</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className={`text-center py-20 rounded-3xl border-2 border-dashed ${isDarkMode ? 'bg-slate-800/30 border-slate-700 text-slate-500' : 'bg-white border-gray-200 text-gray-400'}`}>
                        <Bell className="h-16 w-16 mx-auto mb-4 opacity-20" />
                        <p className="text-xl font-bold italic">{t('notifications.empty')}</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {notifications.map((n) => (
                            <div
                                key={n.id}
                                className={`group p-6 rounded-3xl border transition-all duration-300 shadow-sm relative overflow-hidden ${
                                    n.is_read 
                                    ? (isDarkMode ? 'bg-slate-800/50 border-slate-700 opacity-60' : 'bg-white border-gray-100 opacity-80') 
                                    : (isDarkMode ? 'bg-slate-800 border-purple-500/30 shadow-purple-500/5' : 'bg-white border-purple-200 shadow-purple-600/5')
                                }`}
                            >
                                {!n.is_read && (
                                    <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-600" />
                                )}
                                <div className="flex gap-5">
                                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${isDarkMode ? 'bg-slate-900 border border-slate-700' : 'bg-gray-50 border border-gray-100'}`}>
                                        {getIcon(n.notification_type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className={`text-lg font-black ${isDarkMode ? (n.is_read ? 'text-slate-400' : 'text-white') : (n.is_read ? 'text-gray-500' : 'text-gray-900')}`}>
                                                {n.payload || t('notifications.activityAlert')}
                                            </h3>
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border transition-all ${
                                                n.is_read 
                                                ? (isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-500' : 'bg-gray-100 border-gray-200 text-gray-400') 
                                                : 'bg-purple-600 border-purple-500 text-white shadow-lg'
                                            }`}>
                                                {n.is_read ? t('notifications.archived') : t('notifications.newActivity')}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <p className={`text-sm font-bold ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                                                {n.document?.title || t('notifications.systemWide')}
                                            </p>
                                            <span className="h-1 w-1 rounded-full bg-slate-400" />
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-tighter">
                                                {new Date(n.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                        
                                        {!n.is_read && (
                                            <div className="mt-4 flex gap-3">
                                                <button
                                                    onClick={() => markRead(n.id)}
                                                    className="flex items-center px-4 py-2 bg-purple-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-purple-500 transition-all shadow-lg active:scale-95"
                                                >
                                                    <Check className="h-3 w-3 mr-2" /> {t('notifications.markAsRead')}
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/documents`)}
                                                    className={`flex items-center px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all border ${
                                                        isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-white'
                                                    }`}
                                                >
                                                    {t('notifications.viewDetails')}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;
