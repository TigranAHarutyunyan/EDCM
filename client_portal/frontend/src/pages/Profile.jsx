import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api';
import { User, Mail, Building, Bell, ChevronLeft, FileCheck, Moon, Sun } from 'lucide-react';
import LanguageSelector from '../components/LanguageSelector';

const Profile = () => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await api.get('/my-documents');
        setDocuments(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDocs();
  }, []);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <nav className={`shadow border-b transition-colors ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className={`flex items-center font-bold transition-colors ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}>
                <ChevronLeft className="h-5 w-5 mr-1" />
                {t('dashboard')}
              </Link>
            </div>
            <div className="flex items-center space-x-6">
              <LanguageSelector />
              <button 
                onClick={toggleTheme}
                className={`p-2 rounded-xl border transition-all ${isDarkMode ? 'bg-slate-700 border-slate-600 text-yellow-500' : 'bg-white border-gray-200 text-gray-500'}`}
              >
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              <button 
                onClick={logout} 
                className={`text-sm font-bold transition-colors ${isDarkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-800'}`}
              >
                {t('logout')}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className={`shadow-2xl rounded-3xl overflow-hidden border transition-all duration-300 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
          {/* Header Banner */}
          <div className="h-32 bg-gradient-to-r from-blue-700 to-indigo-600"></div>
          
          <div className="px-8 pb-10">
            <div className="relative -mt-16 mb-8 flex items-end">
              <div className={`h-32 w-32 rounded-3xl p-1 shadow-2xl border transition-colors ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-white'}`}>
                <div className={`h-full w-full rounded-2xl flex items-center justify-center transition-colors ${isDarkMode ? 'bg-slate-900 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                   <User className="h-16 w-16" />
                </div>
              </div>
              <div className="ml-6 pb-2">
                <h1 className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{user.full_name}</h1>
                <p className={`font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{user.username}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Info Section */}
              <div className="space-y-8">
                <div>
                  <h3 className={`text-lg font-black border-b pb-2 mb-6 ${isDarkMode ? 'border-slate-700 text-white' : 'border-gray-100 text-gray-900'}`}>{t('account_details')}</h3>
                  <div className="space-y-6">
                    <div className="flex items-center">
                      <div className={`p-3 rounded-xl mr-4 ${isDarkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
                        <Mail className={`h-5 w-5 ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <p className={`text-[10px] uppercase font-black tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>{t('email_address')}</p>
                        <p className={`font-bold ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>{user.email}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className={`text-lg font-black border-b pb-2 mb-6 flex items-center ${isDarkMode ? 'border-slate-700' : 'border-gray-100'}`}>
                      <Bell className="h-5 w-5 mr-3 text-blue-500" />
                      {t('notifications')}
                  </h3>
                  <div className={`rounded-2xl p-6 text-sm font-medium border ${
                    isDarkMode ? 'bg-blue-900/10 border-blue-900/30 text-blue-300' : 'bg-blue-50 border-blue-100 text-blue-700'
                  }`}>
                    {t('no_notifications')}.
                  </div>
                </div>
              </div>

              {/* Stats/Status Section */}
              <div className="space-y-8">
                <h3 className={`text-lg font-black border-b pb-2 mb-6 flex items-center ${isDarkMode ? 'border-slate-700' : 'border-gray-100'}`}>
                    <FileCheck className="h-5 w-5 mr-3 text-green-500" />
                    {t('activity_summary')}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-6 rounded-2xl border transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-100'}`}>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>{t('total')}</p>
                    <p className={`text-3xl font-black ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{documents.length}</p>
                  </div>
                  <div className={`p-6 rounded-2xl border transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-100'}`}>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>{t('approved')}</p>
                    <p className={`text-3xl font-black ${isDarkMode ? 'text-green-500' : 'text-green-600'}`}>
                       {documents.filter(d => d.status_code === 'APPROVED').length}
                    </p>
                  </div>
                </div>

                <div>
                    <h4 className={`text-[10px] font-black uppercase tracking-widest mb-4 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>{t('recent_activity')}</h4>
                    <div className="space-y-3">
                        {documents.slice(0, 3).map(doc => (
                            <div key={doc.id} className={`flex justify-between items-center text-sm p-4 rounded-xl border transition-colors ${
                              isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-100'
                            }`}>
                                <span className={`truncate max-w-[150px] font-bold ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>{doc.title}</span>
                                <span className={`text-[10px] px-3 py-1 rounded-lg font-black uppercase tracking-tighter ${
                                  isDarkMode ? 'bg-slate-800 text-slate-400 border border-slate-700' : 'bg-gray-100 text-gray-500 border border-gray-200'
                                }`}>
                                    {t(doc.status_code?.toLowerCase() || 'pending')}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
