import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { FilePlus, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '' });
  const [files, setFiles] = useState([]);

  useEffect(() => {
    fetchDocuments();
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
        case 'REJECTED': return <AlertCircle className="h-5 w-5 text-red-500" />;
        default: return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-xl font-bold text-blue-600">Client Portal</span>
            </div>
            <div className="flex items-center space-x-6">
              <Link to="/profile" className="text-sm text-gray-700 hover:text-blue-600 font-medium flex items-center">
                 <User className="h-4 w-4 mr-1" />
                 Profile
              </Link>
              <div className="flex items-center space-x-4 border-l pl-6">
                <span className="text-sm text-gray-700">Hi, {user.full_name}</span>
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
      </nav>

      <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Submission Form */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg p-6">
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
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    rows="3"
                    value={formData.description}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Attachments</label>
                  <input
                    type="file"
                    multiple
                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    onChange={(e) => setFiles(e.target.files)}
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition disabled:opacity-50 font-bold"
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
                      <div key={doc.id} className="p-6 hover:bg-gray-50 transition">
                         <div className="flex justify-between items-start">
                            <div>
                               <h3 className="font-bold text-gray-900">{doc.title}</h3>
                               <p className="text-xs text-gray-500 mt-1">ID: #{doc.id} • Last Update: {new Date(doc.updated_at).toLocaleDateString()}</p>
                            </div>
                            <div className="flex items-center space-x-2 bg-gray-100 px-3 py-1 rounded-full border">
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
    </div>
  );
};

export default Dashboard;
