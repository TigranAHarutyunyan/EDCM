import { useEffect, useState } from "react";
import api from "../services/api";
import DocumentModal from "../components/DocumentModal";
import DocumentDetailModal from "../components/DocumentDetailModal";
import { useTheme } from "../context/ThemeContext";

const Documents = () => {
    const { isDarkMode } = useTheme();
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [departments, setDepartments] = useState([]);
    const [documentTypes, setDocumentTypes] = useState([]);
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

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
    }, []);

    // Refetch when filters change
    useEffect(() => {
        let cancelled = false;

        const fetchDocuments = async () => {
            setLoading(true);
            try {
                const params = {};
                if (startDate) params.start_date = startDate;
                if (endDate) params.end_date = endDate;

                const response = await api.get("documents/", { params });
                if (!cancelled) {
                    setDocuments(response.data.results || response.data);
                }
            } catch (error) {
                if (!cancelled) console.error("Error fetching documents", error);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchDocuments();

        return () => {
            cancelled = true;
        };
    }, [startDate, endDate]);

    const handleDocumentSuccess = (newDocument) => {
        setDocuments((prev) => [newDocument, ...prev]);
        setIsModalOpen(false);
    };

    const handleViewDocument = (doc) => {
        setSelectedDocument(doc);
        setIsDetailModalOpen(true);
    };

    return (
        <div className={`space-y-6 transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            <header className="flex justify-between items-end gap-4">
                <div>
                    <h1 className="text-3xl font-black">
                        Documents
                    </h1>
                    <p className={`mt-1 text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
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
            <div className={`p-5 rounded-2xl shadow-xl flex flex-wrap gap-4 items-center border transition-colors ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
                <span className={`text-sm font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-gray-700'}`}>Filter by Creation Date:</span>
                <div className="flex items-center gap-2">
                    <label className={`text-xs font-semibold ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>From</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className={`border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-colors ${
                            isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                        }`}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <label className={`text-xs font-semibold ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>To</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className={`border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-colors ${
                            isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                        }`}
                    />
                </div>
                {(startDate || endDate) && (
                    <button
                        onClick={() => { setStartDate(""); setEndDate(""); }}
                        className="text-sm font-bold text-purple-600 hover:text-purple-400 transition-colors"
                    >
                        Clear Filters
                    </button>
                )}
            </div>

            {/* Documents List */}
            <div className={`shadow-xl rounded-2xl overflow-hidden transition-colors border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
                {loading ? (
                     <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className={isDarkMode ? 'bg-slate-900/50' : 'bg-gray-50'}>
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Title</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Created</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Department</th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700' : 'divide-gray-100'}`}>
                                {documents.length > 0 ? (
                                    documents.map((doc) => (
                                        <tr 
                                            key={doc.id} 
                                            onClick={() => handleViewDocument(doc)}
                                            className={`transition-colors cursor-pointer ${isDarkMode ? 'hover:bg-slate-700/50' : 'hover:bg-gray-50'}`}
                                        >
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{doc.title}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-bold rounded-full 
                                                    ${doc.status_details?.code === 'APPROVED' ? 'bg-green-100 text-green-800' : 
                                                      doc.status_details?.code === 'REJECTED' ? 'bg-red-100 text-red-800' : 
                                                      doc.status_details?.code === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                                                      'bg-gray-100 text-gray-800'}`}>
                                                    {doc.status_details?.name || 'N/A'}
                                                </span>
                                            </td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                                {doc.document_type_details?.name}
                                            </td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                                {new Date(doc.created_at).toLocaleDateString()}
                                            </td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
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

            <DocumentDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                document={selectedDocument}
                onUpdate={() => {}} // Could refetch if needed
            />
        </div>
    );
};

export default Documents;
