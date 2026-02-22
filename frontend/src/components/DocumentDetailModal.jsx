import { useState, useEffect, useCallback } from "react";
import api from "../services/api";

const DocumentDetailModal = ({ isOpen, onClose, document: initialDocument, onUpdate }) => {
    const [document, setDocument] = useState(initialDocument);
    const [activeTab, setActiveTab] = useState("details"); // 'details', 'history', 'comments'
    const [commentText, setCommentText] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({});

    const documentId = initialDocument?.id;

    const fetchDocumentDetails = useCallback(async () => {
        if (!documentId) return;
        try {
            const response = await api.get(`documents/${documentId}/`);
            setDocument(response.data);
        } catch (err) {
            console.error("Error fetching document details", err);
        }
    }, [documentId]);

    useEffect(() => {
        if (documentId && isOpen) {
            fetchDocumentDetails();
        }
    }, [documentId, isOpen, fetchDocumentDetails]);

    useEffect(() => {
        if (document) {
            setEditData({
                title: document.title,
                description: document.description,
                status: document.status_details?.id,
            });
        }
    }, [document]);

    const handleTake = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await api.post(`documents/${document.id}/take/`);
            setDocument(response.data);
            onUpdate();
        } catch (err) {
            setError(err?.response?.data?.error || "Error taking document");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const response = await api.patch(`documents/${document.id}/`, editData);
            setDocument(response.data);
            setIsEditing(false);
            onUpdate();
        } catch {
            setError("Error updating document");
        } finally {
            setLoading(false);
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;

        setLoading(true);
        try {
            await api.post(`documents/${document.id}/comment/`, { text: commentText });
            setCommentText("");
            fetchDocumentDetails();
        } catch {
            setError("Error adding comment");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !document) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="fixed inset-0 bg-gray-900 bg-opacity-75 backdrop-blur-sm" onClick={onClose}></div>
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:w-full sm:max-w-2xl border border-gray-100" onClick={e => e.stopPropagation()}>
                    <div className="h-2 bg-gradient-to-r from-purple-500 to-pink-500 w-full"></div>
                    
                    <div className="flex justify-between items-center px-8 py-6 border-b">
                        <div className="flex-1 mr-4">
                            {isEditing ? (
                                <input
                                    className="text-2xl font-bold text-gray-900 w-full border-b focus:outline-none focus:border-purple-500"
                                    value={editData.title}
                                    onChange={(e) => setEditData({...editData, title: e.target.value})}
                                />
                            ) : (
                                <h2 className="text-2xl font-bold text-gray-900">{document.title}</h2>
                            )}
                            <p className="text-sm text-gray-500">ID: #{document.id} • {document.status_details?.name}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                            {!isEditing && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="text-purple-600 hover:text-purple-800 text-sm font-bold"
                                >
                                    Edit
                                </button>
                            )}
                            {isEditing && (
                                <>
                                    <button
                                        onClick={handleUpdate}
                                        disabled={loading}
                                        className="text-green-600 hover:text-green-800 text-sm font-bold"
                                    >
                                        Save
                                    </button>
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="text-gray-500 hover:text-gray-700 text-sm font-bold"
                                    >
                                        Cancel
                                    </button>
                                </>
                            )}
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className="px-8 py-4 bg-gray-50 border-b flex space-x-4">
                        {['details', 'history', 'comments'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 text-sm font-medium rounded-md transition ${activeTab === tab ? 'bg-purple-100 text-purple-700' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>

                    <div className="px-8 py-6 min-h-[300px] max-h-[500px] overflow-y-auto">
                        {error && <div className="mb-4 text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}

                        {activeTab === 'details' && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Description</h3>
                                    {isEditing ? (
                                        <textarea
                                            className="mt-2 w-full border rounded-lg p-3 text-sm focus:ring-purple-500 focus:border-purple-500"
                                            rows="4"
                                            value={editData.description}
                                            onChange={(e) => setEditData({...editData, description: e.target.value})}
                                        />
                                    ) : (
                                        <p className="mt-2 text-gray-700 whitespace-pre-wrap">{document.description || "No description provided."}</p>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Creator</h3>
                                        <p className="mt-1 text-gray-900">{document.creator?.profile?.full_name || document.creator?.username}</p>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Assigned To</h3>
                                        <div className="flex items-center mt-1">
                                            <p className="text-gray-900">{document.assigned_to?.profile?.full_name || document.assigned_to?.username || "Unassigned"}</p>
                                            {!document.assigned_to && (
                                                <button 
                                                    onClick={handleTake}
                                                    disabled={loading}
                                                    className="ml-3 text-xs bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700 disabled:opacity-50"
                                                >
                                                    Take Document
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'history' && (
                            <div className="space-y-4">
                                {document.history?.length > 0 ? (
                                    document.history.map((log) => (
                                        <div key={log.id} className="flex space-x-3 border-l-2 border-purple-200 pl-4 py-1">
                                            <div className="flex-1">
                                                <div className="flex justify-between">
                                                    <span className="text-sm font-bold text-gray-900">{log.action}</span>
                                                    <span className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleString()}</span>
                                                </div>
                                                <p className="text-sm text-gray-600">{log.details}</p>
                                                <p className="text-xs text-gray-400">By {log.user?.username}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500">No history available.</p>
                                )}
                            </div>
                        )}

                        {activeTab === 'comments' && (
                            <div className="space-y-6">
                                <form onSubmit={handleAddComment} className="space-y-3">
                                    <textarea
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        placeholder="Add a comment..."
                                        className="w-full border rounded-lg p-3 text-sm focus:ring-purple-500 focus:border-purple-500"
                                        rows="3"
                                    ></textarea>
                                    <button
                                        type="submit"
                                        disabled={loading || !commentText.trim()}
                                        className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-purple-700 disabled:opacity-50"
                                    >
                                        Post Comment
                                    </button>
                                </form>
                                <div className="space-y-4">
                                    {document.comments?.map((comment) => (
                                        <div key={comment.id} className="bg-gray-50 p-4 rounded-lg">
                                            <div className="flex justify-between mb-1">
                                                <span className="text-sm font-bold text-gray-900">{comment.user?.profile?.full_name || comment.user?.username}</span>
                                                <span className="text-xs text-gray-500">{new Date(comment.created_at).toLocaleString()}</span>
                                            </div>
                                            <p className="text-sm text-gray-700">{comment.text}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DocumentDetailModal;
