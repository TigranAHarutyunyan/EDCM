import { useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../services/api";

const Portal = () => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        client_name: "",
        client_email: "",
        client_phone: "",
        company: "",
        title: "",
        description: "",
    });
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess(null);

        try {
            const data = new FormData();
            Object.entries(formData).forEach(([k, v]) => data.append(k, v || ""));
            for (const f of files) data.append("files", f);

            const resp = await api.post("portal/submit/", data);
            setSuccess(resp.data);
            setFormData({
                client_name: "",
                client_email: "",
                client_phone: "",
                company: "",
                title: "",
                description: "",
            });
            setFiles([]);
        } catch (err) {
            const msg =
                err.response?.data?.detail ||
                err.response?.data?.message ||
                err.response?.data?.title ||
                "Failed to submit. Please try again.";
            setError(typeof msg === "string" ? msg : "Failed to submit. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-3xl mx-auto py-10 px-4">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">{t('portal.title')}</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        {t('portal.subtitle')}
                    </p>
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded">
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}

                {success?.id && (
                    <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-6 rounded-xl border border-green-100 shadow-sm">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-bold text-green-900">
                                    {t('portal.success_title')}
                                </h3>
                                <p className="text-sm text-green-800 mt-1">
                                    {t('portal.success_message')} Reference ID: <span className="font-mono bg-white px-2 py-0.5 rounded border border-green-200">#{success.id}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
                    <div className="h-2 bg-gradient-to-r from-purple-500 to-pink-500 w-full"></div>
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700">{t('portal.name')}</label>
                                <input
                                    name="client_name"
                                    value={formData.client_name}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 border p-2"
                                    disabled={loading}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700">{t('portal.email')}</label>
                                <input
                                    type="email"
                                    name="client_email"
                                    value={formData.client_email}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 border p-2"
                                    disabled={loading}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700">{t('portal.phone')}</label>
                                <input
                                    name="client_phone"
                                    value={formData.client_phone}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 border p-2"
                                    disabled={loading}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700">{t('portal.company')}</label>
                                <input
                                    name="company"
                                    value={formData.company}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 border p-2"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700">
                                {t('portal.doc_title')} <span className="text-red-500">*</span>
                            </label>
                            <input
                                required
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 border p-2"
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700">{t('portal.doc_description')}</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={5}
                                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 border p-2 resize-none"
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700">
                                {t('portal.attachments')}
                            </label>
                            <input
                                type="file"
                                multiple
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                                onChange={(e) => setFiles(Array.from(e.target.files || []))}
                                className="mt-1 block w-full text-sm text-gray-700 file:mr-4 file:rounded-lg file:border-0 file:bg-purple-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-purple-700 hover:file:bg-purple-100"
                                disabled={loading}
                            />
                        </div>

                        <div className="pt-2 flex items-center justify-between">
                            <button
                                type="submit"
                                disabled={loading}
                                className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 transition-all font-inter"
                            >
                                {loading ? t('common.submitting') : t('common.submit')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Portal;

