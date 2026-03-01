import { useEffect, useState } from "react";
import api from "../services/api";
import { Link } from "react-router-dom";
import DocumentModal from "../components/DocumentModal";
import DocumentDetailModal from "../components/DocumentDetailModal";
<<<<<<< HEAD
import { useAuth } from "../context/auth";
=======
>>>>>>> parent of 5b274b7 (fix admin panel issue and create /departamanent endpoint)

const Dashboard = () => {
    const [stats, setStats] = useState({
        pending_count: 0,
        my_docs_count: 0,
        recent_docs: [],
    });
    const [viewMode, setViewMode] = useState("all"); // 'all' or 'my'
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
                setStats(statsRes.data);
                setDepartments(deptsRes.data.results || deptsRes.data);
                setDocumentTypes(typesRes.data.results || typesRes.data);
                setUsers(usersRes.data.results || usersRes.data);
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
            const url = mode === 'my' ? 'documents/?owner=me' : 'documents/';
            const response = await api.get(url);
            setStats(prev => ({
                ...prev,
                recent_docs: response.data.results || response.data
            }));
        } catch (error) {
            console.error("Error fetching documents", error);
        }
    };

    useEffect(() => {
        fetchDocuments(viewMode);
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
            recent_docs: [newDocument, ...prev.recent_docs].slice(0, 5),
        }));
    };

    if (loading)
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-end gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Dashboard
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Overview of your document activities
                    </p>
                </div>

                {/* Search Bar & Add Button */}
                <div className="flex gap-2 items-end">
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
                            <h2 className="text-xl font-bold text-gray-900">
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
                <div className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-purple-500">
                    <div className="px-4 py-5 sm:p-6">
                        <dt className="text-sm font-medium text-gray-500 truncate">
                            My Documents
                        </dt>
                        <dd className="mt-1 text-3xl font-semibold text-gray-900">
                            {stats.my_docs_count}
                        </dd>
                    </div>
                </div>

                {/* Stats Card 2 */}
                <div className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-yellow-500">
                    <div className="px-4 py-5 sm:p-6">
                        <dt className="text-sm font-medium text-gray-500 truncate">
                            Pending Approval
                        </dt>
                        <dd className="mt-1 text-3xl font-semibold text-gray-900">
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

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Documents
                    </h3>
                    <div className="flex bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode("all")}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${viewMode === 'all' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            All Documents
                        </button>
                        <button
                            onClick={() => setViewMode("my")}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${viewMode === 'my' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            My Documents
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
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
                        <tbody className="bg-white divide-y divide-gray-200">
                            {stats.recent_docs.length > 0 ? (
                                stats.recent_docs.map((doc) => (
                                    <tr
                                        key={doc.id}
                                        onClick={() => handleViewDocument(doc)}
                                        className="hover:bg-gray-50 transition cursor-pointer"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">
                                            #{doc.id}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
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
