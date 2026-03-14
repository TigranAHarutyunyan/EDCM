import { useState } from "react";
import api from "../services/api";

const DocumentModal = ({
    isOpen,
    onClose,
    onSuccess,
    departments,
    documentTypes,
    users,
}) => {
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        department: "",
        document_type: "",
        confidentiality_level: "PUBLIC",
        assigned_to_id: "",
    });
    const [attachmentFiles, setAttachmentFiles] = useState([]);
    const [createdDocument, setCreatedDocument] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const resetForm = () => {
        setFormData({
            title: "",
            description: "",
            department: "",
            document_type: "",
            confidentiality_level: "PUBLIC",
            assigned_to_id: "",
        });
        setAttachmentFiles([]);
        setCreatedDocument(null);
        setError("");
    };

    const handleModalClose = () => {
        if (loading) return;
        resetForm();
        onClose();
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleFilesChange = (e) => {
        const files = Array.from(e.target.files || []);
        setAttachmentFiles(files);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            let doc = createdDocument;

            if (!doc) {
                const payload = {
                    title: formData.title,
                    description: formData.description,
                    document_type: formData.document_type || null,
                    confidentiality_level: formData.confidentiality_level || "PUBLIC",
                    assigned_to_id: formData.assigned_to_id || null,
                    // Department is derived on the backend
                };

                const response = await api.post("documents/", payload);
                doc = response.data;
                setCreatedDocument(doc);
                onSuccess(doc);
            }

            if (attachmentFiles.length > 0) {
                for (const file of attachmentFiles) {
                    const fd = new FormData();
                    fd.append("file", file);
                    await api.post(`documents/${doc.id}/attachments/`, fd);
                }
            }

            resetForm();
            onClose();
        } catch (err) {
            // Try to surface a useful backend error message, including validation errors
            let message =
                err.response?.data?.detail ||
                err.response?.data?.message ||
                null;

            if (!message && err.response?.data && typeof err.response.data === "object") {
                const firstKey = Object.keys(err.response.data)[0];
                const firstVal = err.response.data[firstKey];
                if (Array.isArray(firstVal)) {
                    message = firstVal[0];
                } else if (typeof firstVal === "string") {
                    message = firstVal;
                }
            }

            setError(message || "Error creating document. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop with blur */}
            <div 
                className="fixed inset-0 bg-gray-900 bg-opacity-75 backdrop-blur-sm transition-opacity"
                onClick={handleModalClose}
            ></div>

            {/* Modal Container */}
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                <div 
                    className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-2xl border border-gray-100"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Decorative Header Bar */}
                    <div className="h-2 bg-gradient-to-r from-purple-500 to-pink-500 w-full"></div>

                    {/* Header */}
                    <div className="flex justify-between items-center px-8 py-6 border-b border-gray-100">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                                Create New Document
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Fill in the details below to create a new document record.
                            </p>
                        </div>
                        <button
                            onClick={handleModalClose}
                            disabled={loading}
                            className="rounded-full p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none"
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mx-8 mt-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="px-8 py-6 space-y-6">
                        {createdDocument?.id && (
                            <div className="rounded-lg border border-purple-200 bg-purple-50 px-4 py-3 text-sm text-purple-800">
                                Document created (ID: #{createdDocument.id}). You can upload attachments now.
                            </div>
                        )}
                        {/* Title Section */}
                        <div className="space-y-1">
                            <label className="block text-sm font-semibold text-gray-700">
                                Document Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                placeholder="e.g., Q1 Financial Report"
                                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm py-2.5 px-3 border transition-colors"
                                disabled={loading}
                            />
                        </div>

                        {/* Description Section */}
                        <div className="space-y-1">
                            <label className="block text-sm font-semibold text-gray-700">
                                Description
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Provide a brief summary of the document content..."
                                rows="4"
                                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm py-2.5 px-3 border transition-colors resize-none"
                                disabled={loading}
                            />
                        </div>

                        {/* Grid for Dropdowns */}
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            {/* Department */}
                            <div className="space-y-1">
                                <label className="block text-sm font-semibold text-gray-700">
                                    Department
                                </label>
                                <div className="relative">
                                    <select
                                        name="department"
                                        value={formData.department}
                                        onChange={handleChange}
                                        className="block w-full appearance-none rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm py-2.5 pl-3 pr-10 border transition-colors bg-white"
                                        disabled={loading}
                                    >
                                        <option value="">Select Department</option>
                                        {departments &&
                                            departments.map((dept) => (
                                                <option key={dept.id} value={dept.id}>
                                                    {dept.name}
                                                </option>
                                            ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Document Type */}
                            <div className="space-y-1">
                                <label className="block text-sm font-semibold text-gray-700">
                                    Document Type
                                </label>
                                <div className="relative">
                                    <select
                                        name="document_type"
                                        value={formData.document_type}
                                        onChange={handleChange}
                                        className="block w-full appearance-none rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm py-2.5 pl-3 pr-10 border transition-colors bg-white"
                                        disabled={loading}
                                    >
                                        <option value="">Select Type</option>
                                        {documentTypes &&
                                            documentTypes.map((type) => (
                                                <option key={type.id} value={type.id}>
                                                    {type.name}
                                                </option>
                                            ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="block text-sm font-semibold text-gray-700">
                                    Assign To
                                </label>
                                <div className="relative">
                                    <select
                                        name="assigned_to_id"
                                        value={formData.assigned_to_id}
                                        onChange={handleChange}
                                        className="block w-full appearance-none rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm py-2.5 pl-3 pr-10 border transition-colors bg-white"
                                        disabled={loading}
                                    >
                                        <option value="">Self / Unassigned</option>
                                        {users &&
                                            users.map((user) => (
                                                <option key={user.id} value={user.id}>
                                                    {user.profile?.full_name || user.username} ({user.profile?.position || 'Employee'})
                                                </option>
                                            ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Confidentiality Level */}
                            <div className="space-y-1 sm:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700">
                                    Confidentiality Level <span className="text-red-500">*</span>
                                </label>
                                <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
                                    {['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'SECRET'].map((level) => (
                                        <div 
                                            key={level}
                                            onClick={() => !loading && setFormData(prev => ({ ...prev, confidentiality_level: level }))}
                                            className={`
                                                cursor-pointer rounded-lg border p-3 text-center text-sm font-medium transition-all
                                                ${formData.confidentiality_level === level 
                                                    ? 'border-purple-600 bg-purple-50 text-purple-700 ring-1 ring-purple-600' 
                                                    : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'}
                                                ${loading ? 'opacity-50 cursor-not-allowed' : ''}
                                            `}
                                        >
                                            {level.charAt(0) + level.slice(1).toLowerCase()}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Attachments */}
                        <div className="space-y-1">
                            <label className="block text-sm font-semibold text-gray-700">
                                Attachments (PDF, Word, Excel, PowerPoint)
                            </label>
                            <input
                                type="file"
                                multiple
                                onChange={handleFilesChange}
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                                className="block w-full text-sm text-gray-700 file:mr-4 file:rounded-lg file:border-0 file:bg-purple-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-purple-700 hover:file:bg-purple-100"
                                disabled={loading}
                            />
                            {attachmentFiles.length > 0 && (
                                <p className="text-xs text-gray-500">
                                    Selected: {attachmentFiles.map((f) => f.name).join(", ")}
                                </p>
                            )}
                        </div>

                        {/* Footer Buttons */}
                        <div className="mt-8 flex items-center justify-end gap-3 border-t border-gray-100 pt-6">
                            <button
                                type="button"
                                onClick={handleModalClose}
                                disabled={loading}
                                className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 transition-all transform active:scale-95"
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Creating...
                                    </>
                                ) : (
                                    createdDocument ? "Upload Attachments" : "Create Document"
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default DocumentModal;
