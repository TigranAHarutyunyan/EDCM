import { useEffect, useState } from "react";
import api from "../services/api";
import { Link } from "react-router-dom";
import DocumentModal from "../components/DocumentModal";
import DocumentDetailModal from "../components/DocumentDetailModal";
import { useAuth } from "../context/auth";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { MessageSquare } from "lucide-react";

const normalizeStats = (data = {}) => ({
    pending_count: data.pending_count ?? 0,
    my_docs_count: data.my_docs_count ?? 0,
    recent_docs: Array.isArray(data.recent_docs) ? data.recent_docs : [],
});

const normalizeList = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    return [];
};

const Dashboard = () => {
    const { user } = useAuth();
    const { isDarkMode } = useTheme();
    const { t } = useTranslation();
    const [stats, setStats] = useState({
        pending_count: 0,
        my_docs_count: 0,
        recent_docs: [],
    });
    const [viewMode, setViewMode] = useState("all"); // 'all', 'my', or 'portal'
    const [loading, setLoading] = useState(true);
    const [searchId, setSearchId] = useState("");
    const [searchResult, setSearchResult] = useState(null);
    const [searchError, setSearchError] = useState("");
    const [searching, setSearching] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [departments, setDepartments] = useState([]);
    const [documentTypes, setDocumentTypes] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, deptsRes, typesRes, usersRes] = await Promise.all([
                    api.get("dashboard/"),
                    api.get("departments/"),
                    api.get("document-types/"),
                    api.get("users/"),
                ]);
                setStats(normalizeStats(statsRes.data));
                setDepartments(normalizeList(deptsRes.data));
                setDocumentTypes(normalizeList(typesRes.data));
                setUsers(normalizeList(usersRes.data));
            } catch (error) {
                console.error("Error fetching data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const fetchDocuments = async (mode) => {
        try {
            let url = 'documents/';
            if (mode === 'my') url = 'documents/' + (user?.id ? `?assigned_to=${user.id}` : '?owner=me');
            if (mode === 'portal') url = 'portal/inbox/';
            
            const response = await api.get(url);
            setStats(prev => ({
                ...prev,
                recent_docs: normalizeList(response.data)
            }));
        } catch (error) {
            console.error("Error fetching documents", error);
        }
    };

    useEffect(() => {
        if (viewMode === 'all') {
            const fetchStats = async () => {
                const res = await api.get("dashboard/");
                setStats(normalizeStats(res.data));
            };
            fetchStats();
        } else {
            fetchDocuments(viewMode);
        }
    }, [viewMode]);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchId) return;

        setSearching(true);
        setSearchError("");
        setSearchResult(null);

        try {
            const response = await api.get(`documents/${searchId}/`);
            setSearchResult(response.data);
        } catch (error) {
            setSearchError(
                error.response?.status === 404
                    ? "Document not found"
                    : "Error fetching document",
            );
        } finally {
            setSearching(false);
        }
    };

    const handleViewDocument = (doc) => {
        setSelectedDocument(doc);
        setIsDetailModalOpen(true);
    };

    const handleDocumentSuccess = (newDocument) => {
        // Refresh stats after creating document
        setStats((prev) => ({
            ...prev,
            my_docs_count: (prev.my_docs_count || 0) + 1,
            recent_docs: [newDocument, ...normalizeList(prev.recent_docs)].slice(0, 5),
        }));
    };

    if (loading)
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );

    const panelButton =
        user?.role === "Admin"
            ? { kind: "admin", label: "Admin Panel" }
            : user?.role === "Manager"
              ? { kind: "department", label: "Department Panel" }
              : null;

    return (
        <div className={`space-y-6 transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-black">
                        {t('dashboard.title')}
                    </h1>
                    <p className={`mt-1 text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                        Overview of your document activities
                    </p>
                </div>

                {/* Search Bar & Add Button */}
                <div className="flex gap-2 items-end">
                    {panelButton?.kind === "admin" && (
                        <a
                            href="/admin/"
                            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-md hover:from-purple-700 hover:to-pink-700 transition whitespace-nowrap font-medium"
                        >
                            {panelButton.label}
                        </a>
                    )}
                    {panelButton?.kind === "department" && (
                        <Link
                            to="/department/"
                            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-md hover:from-purple-700 hover:to-pink-700 transition whitespace-nowrap font-medium"
                        >
                            {panelButton.label}
                        </Link>
                    )}
                    <form onSubmit={handleSearch} className="flex space-x-2">
                        <input
                            type="text"
                            placeholder="View Document by ID..."
                            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 w-64"
                            value={searchId}
                            onChange={(e) => setSearchId(e.target.value)}
                        />
                        <button
                            type="submit"
                            disabled={searching}
                            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition disabled:opacity-50"
                        >
                            {searching ? "..." : "View"}
                        </button>
                    </form>
                </div>
            </header>

            {/* Search Result Section */}
            {searchError && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4">
                    <p className="text-sm text-red-700">{searchError}</p>
                </div>
            )}

            {searchResult && (
                <div className="bg-white shadow rounded-lg p-6 border-2 border-purple-200 animate-fade-in relative">
                    <button
                        onClick={() => setSearchResult(null)}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                    >
                        ✕
                    </button>
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {searchResult.title}
                            </h2>
                            <p className="text-sm text-gray-500">
                                ID: {searchResult.id} • Department:{" "}
                                {searchResult.department?.name || "N/A"}
                            </p>
                        </div>
                        <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full 
                            ${
                                searchResult.status_details?.code === "APPROVED"
                                    ? "bg-green-100 text-green-800"
                                    : searchResult.status_details?.code ===
                                        "REJECTED"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-yellow-100 text-yellow-800"
                            }`}
                        >
                            {searchResult.status_details?.name || "N/A"}
                        </span>
                    </div>
                    <div className="border-t pt-4">
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">
                            {searchResult.description}
                        </p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {/* Stats Card 1 */}
                <div className={`overflow-hidden shadow-lg rounded-2xl border-l-4 border-purple-500 transition-colors ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white'}`}>
                    <div className="px-5 py-6">
                        <dt className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`}>
                            {t('dashboard.stats.total')}
                        </dt>
                        <dd className="mt-2 text-3xl font-black">
                            {stats.my_docs_count}
                        </dd>
                    </div>
                </div>

                {/* Stats Card 2 */}
                <div className={`overflow-hidden shadow-lg rounded-2xl border-l-4 border-yellow-500 transition-colors ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
                    <div className="px-5 py-6">
                        <dt className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                            {t('dashboard.stats.pending')}
                        </dt>
                        <dd className="mt-2 text-3xl font-black">
                            {stats.pending_count}
                        </dd>
                    </div>
                </div>
                {/* Action Card */}
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 overflow-hidden shadow rounded-lg text-white">
                    <div className="px-4 py-5 sm:p-6 flex flex-col justify-center h-full">
                        <h3 className="text-lg font-medium leading-6">
                            New Document
                        </h3>
                        <div className="mt-2 text-sm text-purple-100 mb-4">
                            Start a new document workflow
                        </div>
                        <div>
                             <button
                                onClick={() => setIsModalOpen(true)}
                                className="w-full text-sm bg-white text-purple-600 px-4 py-2 rounded font-bold hover:bg-gray-100 transition shadow-sm"
                            >
                                + Create New
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className={`shadow-xl rounded-2xl overflow-hidden transition-colors border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
                <div className={`px-6 py-5 border-b flex flex-col md:flex-row justify-between items-center gap-4 ${isDarkMode ? 'border-slate-700' : 'border-gray-100'}`}>
                    <h3 className="text-lg font-bold">
                        {t('nav.documents')}
                    </h3>
                    <div className={`flex rounded-xl p-1 ${isDarkMode ? 'bg-slate-900' : 'bg-gray-100'}`}>
                        <button
                            onClick={() => setViewMode("all")}
                            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${viewMode === 'all' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setViewMode("my")}
                            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${viewMode === 'my' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            {t('nav.documents')}
                        </button>
                        {(user?.role === 'Admin' || user?.is_superuser) && (
                            <button
                                onClick={() => setViewMode("portal")}
                                className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${viewMode === 'portal' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Portal Inbox
                            </button>
                        )}
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className={isDarkMode ? 'bg-slate-900/50' : 'bg-gray-50'}>
                            <tr>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    ID
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Title
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Status
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Type
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Created
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Assigned To
                                </th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700' : 'divide-gray-100'}`}>
                            {normalizeList(stats.recent_docs).length > 0 ? (
                                normalizeList(stats.recent_docs).map((doc) => (
                                    <tr
                                        key={doc.id}
                                        onClick={() => handleViewDocument(doc)}
                                        className={`transition-colors cursor-pointer ${isDarkMode ? 'hover:bg-slate-700/50' : 'hover:bg-gray-50'}`}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-400">
                                            #{doc.id}
                                        </td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                            {doc.title}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <span
                                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                ${
                                                    doc.status_details?.code ===
                                                    "APPROVED"
                                                        ? "bg-green-100 text-green-800"
                                                        : doc.status_details
                                                                ?.code ===
                                                            "REJECTED"
                                                          ? "bg-red-100 text-red-800"
                                                          : doc.status_details
                                                                  ?.code ===
                                                              "PENDING"
                                                            ? "bg-yellow-100 text-yellow-800"
                                                            : "bg-gray-100 text-gray-800"
                                                }`}
                                            >
                                                {doc.status_details?.name ||
                                                    "N/A"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {doc.document_type_details?.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(
                                                doc.created_at,
                                            ).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {doc.assigned_to ? (
                                                <span className="flex items-center text-purple-600 font-medium">
                                                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                                                    {doc.assigned_to.profile?.full_name || doc.assigned_to.username}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 italic">Unassigned</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan="4"
                                        className="px-6 py-4 text-center text-gray-500 text-sm"
                                    >
                                        No documents found. start by creating
                                        one!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Document Modal */}
            <DocumentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleDocumentSuccess}
                departments={departments}
                documentTypes={documentTypes}
                users={users}
            />

            {/* Document Detail Modal */}
            <DocumentDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                document={selectedDocument}
                onUpdate={() => fetchDocuments(viewMode)}
            />
        </div>
    );
};

export default Dashboard;
