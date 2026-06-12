import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { FilePlus, FileText, CheckCircle, Clock, Bell, User, Moon, Sun, Languages, MessageSquare, ChevronLeft } from 'lucide-react';

import LanguageSelector from '../components/LanguageSelector';

const normalizeList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
};

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const [documents, setDocuments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '' });
  const [files, setFiles] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    fetchDocuments();
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000); 
    return () => clearInterval(interval);
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await api.get('/my-documents');
      const nextDocuments = normalizeList(res.data);
      setDocuments(nextDocuments);
      return nextDocuments;
    } catch (err) {
      console.error(err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(normalizeList(res.data));
    } catch (err) {}
  };

  const markAsRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage('');
    
    const data = new FormData();
    data.append('title', formData.title);
    data.append('description', formData.description);
    for (let i = 0; i < files.length; i++) {
        data.append('files', files[i]);
    }

    try {
      await api.post('/submit', data);
      setFormData({ title: '', description: '' });
      setFiles([]);
      setShowSuccessOverlay(true);
      fetchDocuments();
      // Auto-hide success overlay after 4 seconds
      setTimeout(() => setShowSuccessOverlay(false), 4000);
    } catch (err) {
      setErrorMessage(err.response?.data?.detail || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!selectedDoc || !replyText.trim()) {
      setErrorMessage(t('reply_required'));
      return;
    }

    setReplySubmitting(true);
    setErrorMessage('');

    try {
      await api.post(`/documents/${selectedDoc.id}/reply`, { text: replyText.trim() });
      setReplyText('');
      const nextDocuments = await fetchDocuments();
      const refreshedDoc = nextDocuments.find((doc) => doc.id === selectedDoc.id);
      if (refreshedDoc) {
        setSelectedDoc(refreshedDoc);
      }
      fetchNotifications();
    } catch (err) {
      const detail = err.response?.data?.detail;
      const normalizedDetail =
        typeof detail === 'string'
          ? detail
          : detail?.text?.[0] || detail?.email?.[0] || t('reply_failed');
      setErrorMessage(normalizedDetail);
    } finally {
      setReplySubmitting(false);
    }
  };

  const getStatusIcon = (code) => {
    switch(code) {
        case 'APPROVED': return <CheckCircle className="h-5 w-5 text-green-500" />;
        case 'REJECTED': return <Bell className="h-5 w-5 text-red-600 font-bold" />; // Red icon for rejected
        default: return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-slate-900 text-white' : 'bg-gray-50 text-gray-900'} pb-12 transition-colors duration-300`}>
      <nav className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white shadow'} relative z-10 border-b`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-16 flex-col gap-3 py-3 sm:h-16 sm:flex-row sm:items-center sm:justify-between sm:py-0">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 sm:text-xl">EDCM Portal</span>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 transition sm:hidden"
              >
                <Bell className="h-6 w-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-5 w-5 bg-red-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold animate-pulse ring-2 ring-white">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              {/* Language Selector */}
              <LanguageSelector />

              {/* Theme Toggle */}
              <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition">
                {isDarkMode ? <Sun className="h-5 w-5 text-yellow-400" /> : <Moon className="h-5 w-5 text-gray-500" />}
              </button>

              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative hidden p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 transition sm:block"
              >
                <Bell className="h-6 w-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-5 w-5 bg-red-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold animate-pulse ring-2 ring-white">
                    {unreadCount}
                  </span>
                )}
              </button>
              
              <Link to="/profile" className="text-sm font-medium flex items-center py-2 px-3 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition text-gray-700 dark:text-gray-300">
                 <User className="h-4 w-4 mr-1" />
                 {t('profile')}
              </Link>
              
              <div className="ml-auto flex items-center gap-3 border-l border-gray-200 pl-3 dark:border-slate-700 sm:ml-0 sm:gap-4 sm:pl-4">
                <span className="text-xs hidden md:inline">{t('hi')}, <span className="font-bold text-blue-600">{user.full_name}</span></span>
                <button 
                    onClick={logout} 
                    className="text-sm text-red-600 hover:text-red-500 font-bold"
                >
                    {t('logout')}
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {showNotifications && (
          <div className={`absolute left-3 right-3 top-[calc(100%+0.5rem)] w-auto shadow-2xl rounded-3xl border overflow-hidden transform transition-all animate-in fade-in slide-in-from-top-4 duration-300 z-50 sm:left-auto sm:right-4 sm:top-16 sm:w-96 ${
            isDarkMode ? 'bg-slate-800 border-slate-700 shadow-blue-900/10' : 'bg-white border-gray-100 shadow-gray-200'
          }`}>
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
              <div className="flex justify-between items-center">
                <h3 className="text-white font-black uppercase tracking-widest text-xs">
                  {t('notifications')}
                </h3>
                {unreadCount > 0 && (
                  <span className="bg-white/20 text-white text-[10px] font-black px-2 py-1 rounded-lg">
                    {unreadCount} {t('unread')}
                  </span>
                )}
              </div>
            </div>
            <div className="max-h-[30rem] overflow-y-auto custom-scrollbar">
              {notifications.length > 0 ? (
                <div className="divide-y divide-gray-100 dark:divide-slate-700">
                  {notifications.map(n => (
                    <div 
                      key={n.id} 
                      onClick={() => markAsRead(n.id)}
                      className={`p-5 cursor-pointer transition-all duration-200 relative group overflow-hidden ${
                        !n.is_read 
                        ? (isDarkMode ? 'bg-blue-600/5 hover:bg-blue-600/10' : 'bg-blue-50/50 hover:bg-blue-50') 
                        : (isDarkMode ? 'hover:bg-slate-700/50' : 'hover:bg-gray-50')
                      }`}
                    >
                      {!n.is_read && (
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-600" />
                      )}
                      <div className="flex gap-4">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                          !n.is_read ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : (isDarkMode ? 'bg-slate-900 text-slate-500' : 'bg-gray-100 text-gray-400')
                        }`}>
                          <Bell className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm leading-relaxed mb-2 ${!n.is_read ? 'font-bold' : (isDarkMode ? 'text-slate-400' : 'text-gray-600')}`}>
                            {n.text}
                          </p>
                          <div className="flex items-center justify-between">
                            {n.document_id && (
                              <div className="flex items-center space-x-1.5">
                                <FileText className="h-3 w-3 text-blue-500" />
                                <span className="text-[10px] font-black text-blue-500 uppercase tracking-tighter">
                                   Doc #{n.document_id}
                                </span>
                              </div>
                            )}
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center px-10">
                  <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300 opacity-20" />
                  <p className="text-sm font-bold text-gray-400 italic">{t('no_notifications')}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Success Overlay */}
      {showSuccessOverlay && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowSuccessOverlay(false)}></div>
           <div className={`relative w-full max-w-sm p-10 rounded-[2.5rem] shadow-2xl text-center transform transition-all animate-in zoom-in-95 duration-300 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
              <div className="h-24 w-24 bg-green-500 rounded-[2rem] mx-auto mb-8 flex items-center justify-center shadow-2xl shadow-green-500/40 animate-bounce">
                 <CheckCircle className="h-12 w-12 text-white" />
              </div>
              <h3 className={`text-3xl font-black mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{t('success_title')}</h3>
              <p className={`text-base font-bold leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                 {t('success_message')}
              </p>
              <button 
                 onClick={() => setShowSuccessOverlay(false)}
                 className="mt-10 w-full py-5 bg-green-500 text-white rounded-2xl font-black hover:bg-green-600 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-green-500/20"
              >
                 {t('close')}
              </button>
           </div>
        </div>
      )}

      {errorMessage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
           <div className="bg-red-500 text-white p-5 rounded-2xl flex items-center justify-between shadow-2xl shadow-red-500/20 animate-in slide-in-from-top-4 duration-300">
              <div className="flex items-center">
                 <div className="p-2 bg-white/20 rounded-lg mr-4">
                    <Bell className="h-5 w-5 mr-3" />
                 </div>
                 <span className="text-sm font-black uppercase tracking-wide">{errorMessage}</span>
              </div>
              <button onClick={() => setErrorMessage('')} className="p-2 hover:bg-white/10 rounded-xl transition">
                 <ChevronLeft className="h-5 w-5 rotate-90" />
              </button>
           </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Submission Form */}
          <div className="lg:col-span-1">
            <div className={`shadow rounded-xl p-6 transition ${isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white'}`}>
              <h2 className="text-lg font-bold flex items-center mb-6">
                <FilePlus className="mr-2 h-5 w-5 text-blue-600" />
                {t('submit_document')}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium opacity-70">{t('title')}</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    placeholder={t('enter_title')}
                    className={`mt-1 block w-full rounded-lg border p-2 outline-none transition ${isDarkMode ? 'bg-slate-900 border-slate-700 focus:border-blue-500' : 'bg-gray-50 border-gray-300 focus:bg-white focus:ring-2 focus:ring-blue-500'}`}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium opacity-70">{t('description')}</label>
                  <textarea
                    rows="3"
                    value={formData.description}
                    placeholder={t('describe_request')}
                    className={`mt-1 block w-full rounded-lg border p-2 outline-none transition ${isDarkMode ? 'bg-slate-900 border-slate-700 focus:border-blue-500' : 'bg-gray-50 border-gray-300 focus:bg-white focus:ring-2 focus:ring-blue-500'}`}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium opacity-70">{t('attachments')}</label>
                  <input
                    type="file"
                    multiple
                    className={`mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold ${isDarkMode ? 'file:bg-slate-700 file:text-blue-400' : 'file:bg-blue-50 file:text-blue-700'} hover:file:opacity-80 cursor-pointer`}
                    onChange={(e) => setFiles(e.target.files)}
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-bold shadow-lg shadow-blue-600/20"
                >
                  {submitting ? t('submitting') : t('send_to_edcm')}
                </button>
              </form>
            </div>
          </div>

          {/* Document List */}
          <div className="lg:col-span-2">
            <div className={`shadow rounded-xl overflow-hidden transition ${isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white'}`}>
               <div className={`px-6 py-4 border-b flex justify-between items-center ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                  <h2 className="text-lg font-bold flex items-center">
                    <FileText className="mr-2 h-5 w-5 text-blue-600" />
                    {t('documents')}
                  </h2>
                  <button onClick={fetchDocuments} className="text-sm text-blue-600 hover:underline">{t('refresh')}</button>
               </div>
               <div className={`divide-y ${isDarkMode ? 'divide-slate-700' : 'divide-gray-200'}`}>
                  {loading ? (
                    <div className="p-10 text-center opacity-50">{t('loading')}...</div>
                  ) : documents.length > 0 ? (
                    documents.map(doc => (
                      <div 
                        key={doc.id} 
                        onClick={() => {
                          setSelectedDoc(doc);
                          setReplyText('');
                        }}
                        className={`p-6 transition cursor-pointer group ${isDarkMode ? 'hover:bg-slate-700/50' : 'hover:bg-blue-50/30'}`}
                      >
                         <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex-1">
                               <div className="flex items-center space-x-2">
                                 <h3 className={`font-bold transition ${isDarkMode ? 'group-hover:text-blue-400' : 'group-hover:text-blue-700 text-gray-900'}`}>{doc.title}</h3>
                                 {doc.message_count > 0 && (
                                   <span className="flex items-center bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                     <MessageSquare className="h-3 w-3 mr-1" />
                                     {doc.message_count}
                                   </span>
                                 )}
                               </div>
                               <p className="text-xs text-gray-500 mt-1">ID: #{doc.id} • {t('date')}: {new Date(doc.updated_at).toLocaleDateString()}</p>
                            </div>
                            <div className={`inline-flex w-fit items-center space-x-2 px-3 py-1 rounded-full border transition ${isDarkMode ? 'bg-slate-900 border-slate-700 group-hover:bg-slate-800' : 'bg-gray-100 border-gray-200 group-hover:bg-white'}`}>
                               {getStatusIcon(doc.status_code)}
                               <span className="text-sm font-bold">{t(doc.status_code?.toLowerCase() || 'pending')}</span>
                            </div>
                         </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-10 text-center opacity-30">
                        <FileText className="h-10 w-10 mx-auto mb-2" />
                        {t('no_documents')}
                    </div>
                  )}
               </div>
            </div>
          </div>

        </div>
      </div>

      {/* Document Detail Modal for Clients */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setSelectedDoc(null)}></div>
          <div className="flex min-h-full items-end justify-center p-0 sm:items-center sm:p-4">
            <div className={`relative w-full max-w-2xl overflow-hidden border transition shadow-2xl sm:rounded-2xl ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
              <div className="h-2 bg-blue-600 w-full"></div>
              
              <div className="flex flex-col gap-4 px-4 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-8 sm:py-6">
                <div className="min-w-0">
                  <h2 className={`text-xl font-bold break-words sm:text-2xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedDoc.title}</h2>
                  <p className="text-sm text-gray-400 mt-1">{t('submission_id')}: #{selectedDoc.id}</p>
                </div>
                <div className={`inline-flex w-fit items-center space-x-2 px-3 py-1 rounded-full border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-blue-50 border-blue-100 text-blue-700'}`}>
                   {getStatusIcon(selectedDoc.status_code)}
                   <span className="text-sm font-bold">{t(selectedDoc.status_code?.toLowerCase() || 'pending')}</span>
                </div>
              </div>

              <div className={`grid grid-cols-1 gap-4 border-y px-4 py-4 sm:grid-cols-2 sm:px-8 ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-gray-50'}`}>
                 <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('date')}</span>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>{new Date(selectedDoc.updated_at).toLocaleString()}</p>
                 </div>
                 <div className="sm:text-right">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('reference')}</span>
                    <p className="text-sm font-medium text-blue-500 font-mono break-all">EDCM-PRT-{selectedDoc.id}</p>
                 </div>
              </div>

              <div className="max-h-[70vh] overflow-y-auto px-4 py-5 space-y-6 sm:max-h-[60vh] sm:px-8 sm:py-6">
                {/* Description */}
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{t('description_label')}</h3>
                  <div className={`border rounded-xl p-4 text-sm whitespace-pre-wrap min-h-[80px] ${isDarkMode ? 'bg-slate-900 border-slate-700 text-gray-300' : 'bg-white text-gray-700'}`}>
                    {selectedDoc.description || t('no_description')}
                  </div>
                </div>

                {/* Attachments */}
                {selectedDoc.attachments && selectedDoc.attachments.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{t('attachments')}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                       {selectedDoc.attachments.map(att => (
                          <div key={att.id} className={`flex items-center p-3 border rounded-xl transition shadow-sm group ${isDarkMode ? 'bg-slate-900 border-slate-700 hover:bg-slate-700' : 'bg-gray-50 hover:bg-white'}`}>
                             <div className="bg-blue-600/10 p-2 rounded-lg mr-3 text-blue-600 group-hover:scale-110 transition">
                                <FileText className="h-4 w-4" />
                             </div>
                             <div className="flex-1 overflow-hidden">
                                <p className={`text-xs font-bold truncate ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>{att.name}</p>
                                <p className="text-[10px] text-gray-500">{(att.size / 1024).toFixed(1)} KB</p>
                             </div>
                             <a 
                                href={att.url} 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded"
                             >
                                {t('open')}
                             </a>
                          </div>
                       ))}
                    </div>
                  </div>
                )}

                {/* Staff Feedback / Comments */}
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{t('communication_history')}</h3>
                  <div className="space-y-4">
                    {selectedDoc.comments && selectedDoc.comments.length > 0 ? (
                      selectedDoc.comments.map(c => (
                        <div
                          key={c.id}
                          className={`rounded-xl p-4 border ${
                            c.sender_type === 'client'
                              ? (isDarkMode ? 'bg-emerald-900/10 border-emerald-900/40' : 'bg-emerald-50/60 border-emerald-100')
                              : (isDarkMode ? 'bg-blue-900/10 border-blue-900/40' : 'bg-blue-50/50 border-blue-100')
                          }`}
                        >
                           <div className="flex justify-between items-center mb-2">
                              <span className={`text-xs font-bold ${c.sender_type === 'client' ? 'text-emerald-600' : 'text-blue-600'}`}>
                                {c.sender_type === 'client' ? t('you') : c.sender_name} ({c.sender_type === 'client' ? t('client') : t('staff')})
                              </span>
                              <span className="text-[10px] text-gray-500">{new Date(c.created_at).toLocaleString()}</span>
                           </div>
                           <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{c.text}</p>
                        </div>
                      ))
                    ) : (
                      <div className={`text-center py-8 text-sm italic border-2 border-dashed rounded-xl ${isDarkMode ? 'border-slate-700 text-gray-500' : 'border-gray-200 text-gray-400'}`}>
                        {t('awaiting_staff')}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{t('reply_to_team')}</h3>
                  <form onSubmit={handleReplySubmit} className="space-y-3">
                    <textarea
                      rows="4"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={t('write_reply')}
                      className={`block w-full rounded-xl border p-4 text-sm outline-none transition ${
                        isDarkMode
                          ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-100 focus:border-blue-500'
                      }`}
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={replySubmitting || !replyText.trim()}
                        className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {replySubmitting ? t('sending') : t('send_message')}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              <div className={`flex justify-end border-t px-4 py-4 sm:px-8 ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-gray-50'}`}>
                <button 
                  onClick={() => setSelectedDoc(null)}
                  className={`py-2 px-8 rounded-lg font-bold transition shadow-sm border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                >
                  {t('close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
