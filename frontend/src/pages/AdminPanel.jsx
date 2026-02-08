import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const AdminPanel = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('users');
    const [users, setUsers] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showUserForm, setShowUserForm] = useState(false);
    const [showDeptForm, setShowDeptForm] = useState(false);
    
    // User Form State
    const [userFormData, setUserFormData] = useState({
        username: '',
        email: '',
        password: '',
        full_name: '',
        role: 'Employee',
        department_id: user?.profile?.department?.id || ''
    });

    // Department Form State
    const [deptFormData, setDeptFormData] = useState({
        name: '',
        description: ''
    });

    const [error, setError] = useState(null);

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'users') {
                await Promise.all([fetchUsers(), fetchDepartments()]);
            } else if (activeTab === 'departments') {
                await fetchDepartments();
            } else if (activeTab === 'documents') {
                await fetchDocuments();
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await api.get('users/');
            setUsers(response.data);
        } catch (err) {
            console.error('Error fetching users:', err);
        }
    };

    const fetchDepartments = async () => {
        try {
            const response = await api.get('departments/');
            setDepartments(response.data);
        } catch (err) {
            console.error('Error fetching departments:', err);
        }
    };

    const fetchDocuments = async () => {
        try {
            const response = await api.get('documents/');
            setDocuments(response.data);
        } catch (err) {
            console.error('Error fetching documents:', err);
        }
    };

    // User Handlers
    const handleUserSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            await api.post('users/', userFormData);
            setShowUserForm(false);
            setUserFormData({
                username: '',
                email: '',
                password: '',
                full_name: '',
                role: 'Employee',
                department_id: ''
            });
            fetchUsers();
        } catch (err) {
            setError(err.response?.data?.username?.[0] || 'Failed to create user');
        }
    };

    const handleUserDelete = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        try {
            await api.delete(`users/${userId}/`);
            fetchUsers();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to delete user');
        }
    };

    // Department Handlers
    const handleDeptSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('departments/', deptFormData);
            setShowDeptForm(false);
            setDeptFormData({ name: '', description: '' });
            fetchDepartments();
        } catch (err) {
            alert('Failed to create department');
        }
    };

    const handleDeptDelete = async (deptId) => {
        if (!window.confirm('Deleting a department might affect users and documents. Continue?')) return;
        try {
            await api.delete(`departments/${deptId}/`);
            fetchDepartments();
        } catch (err) {
            alert('Failed to delete department. It might still have associated documents.');
        }
    };

    // Document Handlers
    const handleDocDelete = async (docId) => {
        if (!window.confirm('Are you sure you want to delete this document globally?')) return;
        try {
            await api.delete(`documents/${docId}/`);
            fetchDocuments();
        } catch (err) {
            alert('Failed to delete document');
        }
    };

    const isAdmin = user?.role?.toLowerCase() === 'admin';
    const isManager = user?.role?.toLowerCase() === 'manager';

    if (!isAdmin && !isManager) {
        return (
            <div className="text-center py-10">
                <h2 className="text-2xl font-bold text-red-600">Access Denied</h2>
                <p className="text-gray-600 mt-2">You do not have permission to access this page.</p>
            </div>
        );
    }

    const availableTabs = isAdmin 
        ? ['users', 'departments', 'documents'] 
        : ['users', 'documents'];

    const renderTabs = () => (
        <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
                {availableTabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`
                            whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize
                            ${activeTab === tab 
                                ? 'border-purple-500 text-purple-600' 
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                        `}
                    >
                        {tab}
                    </button>
                ))}
            </nav>
        </div>
    );

    const renderUsers = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Users</h2>
                <button
                    onClick={() => setShowUserForm(!showUserForm)}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                >
                    {showUserForm ? 'Cancel' : '+ Add User'}
                </button>
            </div>

            {showUserForm && (
                <div className="bg-white p-6 shadow rounded-lg border border-gray-100">
                    <form onSubmit={handleUserSubmit} className="grid grid-cols-2 gap-4">
                        <input
                            type="text" placeholder="Username" required
                            className="px-3 py-2 border rounded-lg"
                            value={userFormData.username}
                            onChange={(e) => setUserFormData({...userFormData, username: e.target.value})}
                        />
                        <input
                            type="email" placeholder="Email" required
                            className="px-3 py-2 border rounded-lg"
                            value={userFormData.email}
                            onChange={(e) => setUserFormData({...userFormData, email: e.target.value})}
                        />
                        <input
                            type="password" placeholder="Password" required
                            className="px-3 py-2 border rounded-lg"
                            value={userFormData.password}
                            onChange={(e) => setUserFormData({...userFormData, password: e.target.value})}
                        />
                        <input
                            type="text" placeholder="Full Name"
                            className="px-3 py-2 border rounded-lg"
                            value={userFormData.full_name}
                            onChange={(e) => setUserFormData({...userFormData, full_name: e.target.value})}
                        />
                        <select
                            className="px-3 py-2 border rounded-lg"
                            value={userFormData.role}
                            onChange={(e) => setUserFormData({...userFormData, role: e.target.value})}
                        >
                            <option value="Employee">Employee</option>
                            <option value="Manager">Manager</option>
                            <option value="Admin">Admin</option>
                        </select>
                        <select
                            className="px-3 py-2 border rounded-lg"
                            value={userFormData.department_id}
                            onChange={(e) => setUserFormData({...userFormData, department_id: e.target.value})}
                            disabled={isManager}
                        >
                            <option value="">No Department</option>
                            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                        <button type="submit" className="col-span-2 bg-purple-600 text-white py-2 rounded-lg">Create User</button>
                    </form>
                </div>
            )}

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">User</th>
                            <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">Role</th>
                            <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">Department</th>
                            <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {users.map(u => (
                            <tr key={u.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-gray-900">{u.username}</div>
                                    <div className="text-sm text-gray-500">{u.email}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 text-xs rounded-full ${u.profile?.role === 'Admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                                        {u.profile?.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">{u.profile?.department?.name || '-'}</td>
                                <td className="px-6 py-4 text-sm">
                                    <button onClick={() => handleUserDelete(u.id)} className="text-red-600 hover:text-red-900" disabled={u.username === user.username}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderDepartments = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Departments</h2>
                <button
                    onClick={() => setShowDeptForm(!showDeptForm)}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                >
                    {showDeptForm ? 'Cancel' : '+ Add Department'}
                </button>
            </div>

            {showDeptForm && (
                <div className="bg-white p-6 shadow rounded-lg border border-gray-100">
                    <form onSubmit={handleDeptSubmit} className="grid grid-cols-1 gap-4">
                        <input
                            type="text" placeholder="Department Name" required
                            className="px-3 py-2 border rounded-lg"
                            value={deptFormData.name}
                            onChange={(e) => setDeptFormData({...deptFormData, name: e.target.value})}
                        />
                        <textarea
                            placeholder="Description"
                            className="px-3 py-2 border rounded-lg"
                            value={deptFormData.description}
                            onChange={(e) => setDeptFormData({...deptFormData, description: e.target.value})}
                        />
                        <button type="submit" className="bg-purple-600 text-white py-2 rounded-lg">Create Department</button>
                    </form>
                </div>
            )}

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">Name</th>
                            <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">Description</th>
                            <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {departments.map(d => (
                            <tr key={d.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm font-medium text-gray-900">{d.name}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{d.description || '-'}</td>
                                <td className="px-6 py-4 text-sm">
                                    <button onClick={() => handleDeptDelete(d.id)} className="text-red-600 hover:text-red-900">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderDocuments = () => (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold">All Documents</h2>
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">Title</th>
                            <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">Creator</th>
                            <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {documents.map(doc => (
                            <tr key={doc.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm font-medium text-gray-900">{doc.title}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{doc.creator?.username}</td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                                        {doc.status_details?.name}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm">
                                    <button onClick={() => handleDocDelete(doc.id)} className="text-red-600 hover:text-red-900">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">
                    {isAdmin ? 'Admin Control Panel' : 'Department Management'}
                </h1>
                <p className="mt-2 text-gray-600">
                    {isAdmin 
                        ? 'System-wide management of users, departments, and documents.' 
                        : `Management of users and documents for ${user?.profile?.department?.name || 'your department'}.`}
                </p>
            </div>

            {renderTabs()}

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
            ) : (
                <>
                    {activeTab === 'users' && renderUsers()}
                    {activeTab === 'departments' && renderDepartments()}
                    {activeTab === 'documents' && renderDocuments()}
                </>
            )}
        </div>
    );
};

export default AdminPanel;
