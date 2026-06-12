import { useState, useEffect } from "react";
import api from "../services/api";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";

const Profile = () => {
    const { isDarkMode } = useTheme();
    const { t } = useTranslation();
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({
        full_name: "",
        position: "",
        bio: "",
    });
    const [profilePicture, setProfilePicture] = useState(null);
    const [profilePicturePreview, setProfilePicturePreview] = useState("");

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await api.get("profile/");
            setProfileData(response.data);
            
            const userObj = response.data?.user;
            const profObj = userObj?.profile;

            setFormData({
                full_name: profObj?.full_name || "",
                position: profObj?.position || "",
                bio: profObj?.bio || "",
            });
        } catch (err) {
            setError(t('error.fetch_profile') || "Error fetching profile details.");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const data = new FormData();
            data.append("full_name", formData.full_name);
            data.append("position", formData.position);
            data.append("bio", formData.bio);
            if (profilePicture) {
                data.append("profile_picture", profilePicture);
            }

            await api.patch("profile/", data);
            setEditing(false);
            setProfilePicture(null);
            setProfilePicturePreview("");
            fetchProfile();
        } catch (err) {
            const detail = err.response?.data?.detail;
            const pictureError = err.response?.data?.profile_picture;
            setError(
                Array.isArray(pictureError)
                    ? pictureError[0]
                    : pictureError || detail || t('error.update_profile') || "Error updating profile",
            );
        } finally {
            setLoading(false);
        }
    };

    const handleProfilePictureChange = (e) => {
        const file = e.target.files?.[0] || null;
        setProfilePicture(file);
        setProfilePicturePreview(file ? URL.createObjectURL(file) : "");
    };

    if (loading) return (
        <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
    );

    if (!profileData || !profileData.user) {
        return (
            <div className="max-w-4xl mx-auto py-10 px-4">
                <div className={`shadow-xl rounded-2xl overflow-hidden border p-6 transition-colors ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
                    <h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{t('nav.profile')}</h1>
                    <p className={`mt-2 text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                        {error || "Unable to load your profile right now."}
                    </p>
                    <button
                        type="button"
                        onClick={() => {
                            setLoading(true);
                            setError("");
                            fetchProfile();
                        }}
                        className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-purple-700 transition"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const user = profileData.user;
    const profile = user.profile;
    const createdDocs = profileData.created_documents || [];
    const assignedDocs = profileData.assigned_documents || [];

    return (
        <div className={`max-w-4xl mx-auto py-10 px-4 transition-colors ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {error && (
                <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}
            <div className={`shadow-2xl rounded-3xl overflow-hidden border transition-all duration-300 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
                <div className="h-40 bg-gradient-to-r from-purple-700 via-indigo-600 to-pink-600"></div>
                <div className="px-8 pb-10">
                    <div className="relative -mt-20 mb-8 items-end flex">
                        <img 
                            src={profilePicturePreview || profile?.profile_picture || "https://ui-avatars.com/api/?name=" + (profile?.full_name || user.username) + "&background=random"} 
                            alt="Profile" 
                            className={`w-40 h-40 rounded-3xl object-cover border-8 shadow-2xl transition-colors ${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-white bg-white'}`}
                        />
                        {!editing && (
                            <button 
                                onClick={() => setEditing(true)}
                                className={`absolute -bottom-2 translate-x-32 p-3 rounded-2xl shadow-xl transition-all hover:scale-110 ${isDarkMode ? 'bg-slate-900 text-purple-400' : 'bg-white text-purple-600'}`}
                                title={t('profile.edit_profile')}
                            >
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                            </button>
                        )}
                    </div>

                    {editing ? (
                        <form onSubmit={handleUpdate} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className={`block text-xs font-black uppercase tracking-widest mb-1 ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>{t('profile.full_name')}</label>
                                    <input 
                                        type="text" 
                                        className={`block w-full rounded-xl border px-4 py-3 outline-none transition-all focus:ring-2 focus:ring-purple-500 ${
                                            isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                                        }`}
                                        value={formData.full_name}
                                        onChange={e => setFormData({...formData, full_name: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className={`block text-xs font-black uppercase tracking-widest mb-1 ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>{t('profile.position')}</label>
                                    <input 
                                        type="text" 
                                        className={`block w-full rounded-xl border px-4 py-3 outline-none transition-all focus:ring-2 focus:ring-purple-500 ${
                                            isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                                        }`}
                                        value={formData.position}
                                        onChange={e => setFormData({...formData, position: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className={`block text-xs font-black uppercase tracking-widest mb-1 ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>{t('profile.bio')}</label>
                                <textarea 
                                    className={`block w-full rounded-xl border px-4 py-3 outline-none transition-all focus:ring-2 focus:ring-purple-500 ${
                                        isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                                    }`}
                                    rows="4"
                                    value={formData.bio}
                                    onChange={e => setFormData({...formData, bio: e.target.value})}
                                ></textarea>
                            </div>
                            <div>
                                <label className={`block text-xs font-black uppercase tracking-widest mb-1 ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>{t('profile.profile_picture')}</label>
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={handleProfilePictureChange}
                                    className={`block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-bold ${
                                        isDarkMode ? 'file:bg-slate-900 file:text-purple-400' : 'file:bg-purple-50 file:text-purple-700'
                                    }`}
                                />
                            </div>
                            <div className="flex gap-4 pt-6">
                                <button type="submit" className="flex-1 bg-purple-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-purple-500 shadow-xl transition-all">{t('profile.save_changes')}</button>
                                <button type="button" onClick={() => { setEditing(false); setProfilePicture(null); setProfilePicturePreview(""); }} className={`flex-1 px-8 py-4 rounded-2xl font-black transition-all ${isDarkMode ? 'bg-slate-900 text-slate-400 hover:text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{t('common.cancel')}</button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-10">
                            <div>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h1 className={`text-4xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{profile?.full_name || user.username}</h1>
                                        <p className="text-xl text-purple-500 font-bold mt-1">{profile?.position || "Member"} • {profile?.department?.name || "No Department"}</p>
                                        <p className={`mt-2 font-medium ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{user.email}</p>
                                    </div>
                                    <div className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${isDarkMode ? 'bg-slate-900/50 text-slate-400' : 'bg-gray-100 text-gray-400'}`}>
                                        {profile?.role || "Employee"}
                                    </div>
                                </div>
                            </div>
                            
                            {profile?.bio && (
                                <div>
                                    <h3 className={`text-xs font-black uppercase tracking-widest mb-2 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>{t('profile.about')}</h3>
                                    <p className={`text-lg leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>{profile.bio}</p>
                                </div>
                            )}

                            <div className={`grid grid-cols-1 md:grid-cols-2 gap-10 pt-10 border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-100'}`}>
                                <div>
                                    <h3 className={`text-xl font-black mb-6 flex items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                        <div className="p-2 rounded-lg bg-purple-500/10 mr-3">
                                            <svg className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        {t('profile.created')}
                                    </h3>
                                    <div className="space-y-3">
                                        {createdDocs.length > 0 ? (
                                            createdDocs.map(doc => (
                                                <div key={doc.id} className={`p-4 rounded-2xl border transition-colors flex justify-between items-center ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-100'}`}>
                                                    <span className={`font-bold ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>{doc.title}</span>
                                                    <span className={`text-[10px] font-black uppercase tracking-tighter px-2 py-1 rounded-lg border ${
                                                        isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-white border-gray-200 text-gray-500'
                                                    }`}>{doc.status_details?.name}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-slate-500 italic">{t('profile.no_created')}</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <h3 className={`text-xl font-black mb-6 flex items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                        <div className="p-2 rounded-lg bg-pink-500/10 mr-3">
                                            <svg className="h-6 w-6 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                        {t('profile.assigned')}
                                    </h3>
                                    <div className="space-y-3">
                                        {assignedDocs.length > 0 ? (
                                            assignedDocs.map(doc => (
                                                <div key={doc.id} className={`p-4 rounded-2xl border transition-colors flex justify-between items-center ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-100'}`}>
                                                    <span className={`font-bold ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>{doc.title}</span>
                                                    <span className={`text-[10px] font-black uppercase tracking-tighter px-2 py-1 rounded-lg border ${
                                                        isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-white border-gray-200 text-gray-500'
                                                    }`}>{doc.status_details?.name}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-slate-500 italic">{t('profile.no_assigned')}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;
;
