import { useEffect, useState } from "react";
import api from "../services/api";
import DocumentModal from "../components/DocumentModal";

const Documents = () => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [departments, setDepartments] = useState([]);
    const [documentTypes, setDocumentTypes] = useState([]);

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            const params = {};
            if (startDate) params.start_date = startDate;
            if (endDate) params.end_date = endDate;
            
            const response = await api.get("documents/", { params });
            // API returns paginated results { count, next, previous, results } by default in DRF if pagination is on
            // But based on Dashboard.jsx usage, it might be returning flat list or we need to handle pagination.
            // Dashboard.jsx: `setStats(statsRes.data)` where statsRes.data has `recent_docs`.
            // Let's check `api.get` response in Dashboard again.
            // Wait, DocumentListCreateView inherits from ListCreateAPIView.
            // Is pagination enabled? settings.py says:
            // 'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
            // 'PAGE_SIZE': 20,
            // So response.data will have .results.
            
            setDocuments(response.data.results || response.data);
            
        } catch (error) {
            console.error("Error fetching documents", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Fetch dependencies for modal
        const fetchDeps = async () => {
            try {
                const [deptsRes, typesRes] = await Promise.all([
                    api.get("departments/"),
                    api.get("document-types/"),
                ]);
                setDepartments(deptsRes.data.results || deptsRes.data);
                setDocumentTypes(typesRes.data.results || typesRes.data);
            } catch (error) {
                console.error("Error fetching dependencies", error);
            }
        };
        fetchDeps();
        fetchDocuments();
    }, []);

    // Refetch when filters change
    useEffect(() => {
        fetchDocuments();
    }, [startDate, endDate]);

    const handleDocumentSuccess = (newDocument) => {
        // Re-fetch or prepend
        // Prepending is faster feedback
        setDocuments((prev) => [newDocument, ...prev]);
        setIsModalOpen(false);
    };

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-end gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Documents
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Manage and view all your documents
                    </p>
                </div>

                <div className="flex gap-2 items-end">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition whitespace-nowrap font-medium"
                    >
                        + Add Document
                    </button>
                </div>
            </header>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow flex flex-wrap gap-4 items-center">
                <span className="text-sm font-medium text-gray-700">Filter by Creation Date:</span>
                <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500">From</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-purple-500 focus:border-purple-500"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500">To</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-purple-500 focus:border-purple-500"
                    />
                </div>
                {(startDate || endDate) && (
                    <button
                        onClick={() => { setStartDate(""); setEndDate(""); }}
                        className="text-sm text-purple-600 hover:text-purple-800"
                    >
                        Clear Filters
                    </button>
                )}
            </div>

            {/* Documents List */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                {loading ? (
                     <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {documents.length > 0 ? (
                                    documents.map((doc) => (
                                        <tr key={doc.id} className="hover:bg-gray-50 transition">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{doc.title}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                    ${doc.status_details?.code === 'APPROVED' ? 'bg-green-100 text-green-800' : 
                                                      doc.status_details?.code === 'REJECTED' ? 'bg-red-100 text-red-800' : 
                                                      doc.status_details?.code === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                                                      'bg-gray-100 text-gray-800'}`}>
                                                    {doc.status_details?.name || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {doc.document_type_details?.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(doc.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {doc.department?.name || '-'}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-4 text-center text-gray-500 text-sm">
                                            No documents found matching your criteria.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <DocumentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleDocumentSuccess}
                departments={departments}
                documentTypes={documentTypes}
            />
        </div>
    );
};

export default Documents;
