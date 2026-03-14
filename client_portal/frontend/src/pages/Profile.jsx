import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { User, Mail, Building, Bell, ChevronLeft, FileCheck } from 'lucide-react';

const Profile = () => {
  const { user, logout } = useAuth();
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
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center text-blue-600 font-bold">
                <ChevronLeft className="h-5 w-5 mr-1" />
                Back to Dashboard
              </Link>
            </div>
            <div className="flex items-center">
              <button 
                onClick={logout} 
                className="text-sm text-red-600 font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
          {/* Header Banner */}
          <div className="h-32 bg-blue-600"></div>
          
          <div className="px-8 pb-8">
            <div className="relative -mt-12 mb-8 flex items-end">
              <div className="h-24 w-24 rounded-2xl bg-white p-1 shadow-lg border">
                <div className="h-full w-full rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                   <User className="h-12 w-12" />
                </div>
              </div>
              <div className="ml-6 pb-2">
                <h1 className="text-3xl font-bold text-gray-900">{user.full_name}</h1>
                <p className="text-blue-600 font-medium">{user.username}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Info Section */}
              <div className="space-y-6">
                <h3 className="text-lg font-bold border-b pb-2">Account Information</h3>
                <div className="space-y-4">
                  <div className="flex items-center text-gray-600">
                    <Mail className="h-5 w-5 mr-3 text-gray-400" />
                    <div>
                      <p className="text-xs uppercase font-bold text-gray-400">Email Address</p>
                      <p>{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Building className="h-5 w-5 mr-3 text-gray-400" />
                    <div>
                      <p className="text-xs uppercase font-bold text-gray-400">Company</p>
                      <p>{user.company || "Not specified"}</p>
                    </div>
                  </div>
                </div>

                <h3 className="text-lg font-bold border-b pb-2 pt-4 flex items-center">
                    <Bell className="h-5 w-5 mr-2" />
                    Notifications
                </h3>
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-700">
                   You have no new notifications. You will stay updated here when your documents are routed or approved.
                </div>
              </div>

              {/* Stats/Status Section */}
              <div className="space-y-6">
                <h3 className="text-lg font-bold border-b pb-2 flex items-center">
                    <FileCheck className="h-5 w-5 mr-2" />
                    Submission Summary
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-xl border">
                    <p className="text-sm font-bold text-gray-500">Total Submissions</p>
                    <p className="text-2xl font-black text-blue-600">{documents.length}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border">
                    <p className="text-sm font-bold text-gray-500">Approved</p>
                    <p className="text-2xl font-black text-green-600">
                       {documents.filter(d => d.status_code === 'APPROVED').length}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                    <h4 className="text-sm font-bold text-gray-400 uppercase mb-3">Recent Items</h4>
                    <div className="space-y-2">
                        {documents.slice(0, 3).map(doc => (
                            <div key={doc.id} className="flex justify-between items-center text-sm p-2 border-b">
                                <span className="truncate max-w-[150px] font-medium">{doc.title}</span>
                                <span className={`text-[10px] px-2 py-1 rounded-full font-bold bg-gray-100 border`}>
                                    {doc.status_name}
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
