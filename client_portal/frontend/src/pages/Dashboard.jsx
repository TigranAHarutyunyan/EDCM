import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { FilePlus, FileText, CheckCircle, Clock, Bell, User } from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '' });
  const [files, setFiles] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);

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
      setDocuments(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(Array.isArray(res.data) ? res.data : []);
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
      fetchDocuments();
      alert('Document submitted successfully!');
    } catch (err) {
      alert('Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (code) => {
    switch(code) {
        case 'APPROVED': return <CheckCircle className="h-5 w-5 text-green-500" />;
        case 'REJECTED': return <Bell className="h-5 w-5 text-red-500" />;
        default: return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <nav className="bg-white shadow relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Client Portal</span>
            </div>
            <div className="flex items-center space-x-6">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-500 hover:text-blue-600 transition"
              >
                <Bell className="h-6 w-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-5 w-5 bg-red-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold animate-pulse ring-2 ring-white">
                    {unreadCount}
                  </span>
                )}
              </button>
              
              <Link to="/profile" className="text-sm text-gray-700 hover:text-blue-600 font-medium flex items-center">
                 <User className="h-4 w-4 mr-1" />
                 Profile
              </Link>
              <div className="flex items-center space-x-4 border-l pl-6">
                <span className="text-sm text-gray-700">Hi, <span className="font-bold text-blue-600">{user.full_name}</span></span>
                <button 
                    onClick={logout} 
                    className="text-sm text-red-600 hover:text-red-500 font-medium"
                >
                    Logout
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Notifications Popover */}
        {showNotifications && (
          <div className="absolute right-4 top-16 w-80 bg-white shadow-2xl rounded-b-xl border border-gray-100 overflow-hidden transform transition-all">
            <div className="bg-blue-600 p-4">
              <h3 className="text-white font-bold flex items-center">
                Notifications
              </h3>
            </div>
            <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
              {notifications.length > 0 ? (
                notifications.map(n => (
                  <div 
                    key={n.id} 
                    onClick={() => markAsRead(n.id)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition ${!n.is_read ? 'bg-blue-50/30' : ''}`}
                  >
                    <p className={`text-sm ${!n.is_read ? 'font-bold text-gray-900' : 'text-gray-600'}`}>{n.text}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                  </div>
                ))
              ) : (
                <div className="p-10 text-center text-gray-400 text-sm italic">No notifications yet.</div>
              )}
            </div>
          </div>
        )}
      </nav>

      <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Submission Form */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg p-6 hover:shadow-md transition">
              <h2 className="text-lg font-bold flex items-center mb-6">
                <FilePlus className="mr-2 h-5 w-5 text-blue-600" />
                Submit Document
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    placeholder="Enter document title"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    rows="3"
                    value={formData.description}
                    placeholder="Briefly describe your request..."
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Attachments</label>
                  <input
                    type="file"
                    multiple
                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                    onChange={(e) => setFiles(e.target.files)}
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition disabled:opacity-50 font-bold shadow-sm"
                >
                  {submitting ? 'Submitting...' : 'Send to EDCM'}
                </button>
              </form>
            </div>
          </div>

          {/* Document List */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg overflow-hidden">
               <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-lg font-bold flex items-center">
                    <FileText className="mr-2 h-5 w-5 text-blue-600" />
                    My Submissions
                  </h2>
                  <button onClick={fetchDocuments} className="text-sm text-blue-600 hover:underline">Refresh</button>
               </div>
               <div className="divide-y divide-gray-200">
                  {loading ? (
                    <div className="p-10 text-center text-gray-500">Loading documents...</div>
                  ) : documents.length > 0 ? (
                    documents.map(doc => (
                      <div 
                        key={doc.id} 
                        onClick={() => setSelectedDoc(doc)}
                        className="p-6 hover:bg-blue-50/30 transition cursor-pointer group"
                      >
                         <div className="flex justify-between items-start">
                            <div>
                               <h3 className="font-bold text-gray-900 group-hover:text-blue-700 transition">{doc.title}</h3>
                               <p className="text-xs text-gray-500 mt-1">ID: #{doc.id} • Last Update: {new Date(doc.updated_at).toLocaleDateString()}</p>
                            </div>
                            <div className="flex items-center space-x-2 bg-gray-100 px-3 py-1 rounded-full border group-hover:bg-white transition">
                               {getStatusIcon(doc.status_code)}
                               <span className="text-sm font-semibold">{doc.status_name}</span>
                            </div>
                         </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-10 text-center text-gray-400">
                        <FileText className="h-10 w-10 mx-auto mb-2 opacity-20" />
                        No documents submitted yet.
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
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
              <div className="h-2 bg-blue-600 w-full"></div>
              
              <div className="px-8 py-6 flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedDoc.title}</h2>
                  <p className="text-sm text-gray-500 mt-1">Submission ID: #{selectedDoc.id}</p>
                </div>
                <div className="flex items-center space-x-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-100">
                   {getStatusIcon(selectedDoc.status_code)}
                   <span className="text-sm font-bold">{selectedDoc.status_name}</span>
                </div>
              </div>

              <div className="px-8 py-4 bg-gray-50 border-y grid grid-cols-2 gap-4">
                 <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Last Update</span>
                    <p className="text-sm font-medium text-gray-900">{new Date(selectedDoc.updated_at).toLocaleString()}</p>
                 </div>
                 <div className="text-right">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Client Portal Reference</span>
                    <p className="text-sm font-medium text-gray-900 text-blue-600 font-mono">EDCM-PRT-{selectedDoc.id}</p>
                 </div>
              </div>

              <div className="px-8 py-6 space-y-6 max-h-[60vh] overflow-y-auto">
                {/* Description */}
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Description</h3>
                  <div className="bg-white border rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap min-h-[80px]">
                    {selectedDoc.description || "No description provided."}
                  </div>
                </div>

                {/* Attachments */}
                {selectedDoc.attachments && selectedDoc.attachments.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Attachments</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                       {selectedDoc.attachments.map(att => (
                          <div key={att.id} className="flex items-center p-3 border rounded-xl bg-gray-50 hover:bg-white transition shadow-sm group">
                             <div className="bg-blue-100 p-2 rounded-lg mr-3 text-blue-600 group-hover:scale-110 transition">
                                <FileText className="h-4 w-4" />
                             </div>
                             <div className="flex-1 overflow-hidden">
                                <p className="text-xs font-bold text-gray-900 truncate">{att.name}</p>
                                <p className="text-[10px] text-gray-400">{(att.size / 1024).toFixed(1)} KB</p>
                             </div>
                             <a 
                                href={att.url} 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded"
                             >
                                Open
                             </a>
                          </div>
                       ))}
                    </div>
                  </div>
                )}

                {/* Staff Feedback / Comments */}
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Communication History</h3>
                  <div className="space-y-4">
                    {selectedDoc.comments && selectedDoc.comments.length > 0 ? (
                      selectedDoc.comments.map(c => (
                        <div key={c.id} className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
                           <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-bold text-blue-600">{c.sender_name} (Staff)</span>
                              <span className="text-[10px] text-gray-400">{new Date(c.created_at).toLocaleString()}</span>
                           </div>
                           <p className="text-sm text-gray-700">{c.text}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-gray-400 text-sm italic border-2 border-dashed rounded-xl">
                        Awaiting official staff response...
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-8 py-4 bg-gray-50 flex justify-end">
                <button 
                  onClick={() => setSelectedDoc(null)}
                  className="bg-white border border-gray-300 text-gray-700 py-2 px-6 rounded-lg font-bold hover:bg-gray-100 transition shadow-sm"
                >
                  Close
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
