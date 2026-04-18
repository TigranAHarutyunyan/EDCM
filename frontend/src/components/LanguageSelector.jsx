import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { ChevronDown, Check } from 'lucide-react';

const LanguageSelector = () => {
    const { i18n } = useTranslation();
    const { isDarkMode } = useTheme();

    const languages = [
        { code: 'en', name: 'English', flag: '🇺🇸' },
        { code: 'hy', name: 'Հայերեն', flag: '🇦🇲' },
        { code: 'ru', name: 'Русский', flag: '🇷🇺' }
    ];

    const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

    return (
        <div className="relative group">
            <button className={`flex items-center space-x-2 px-3 py-2 rounded-xl transition-all duration-300 border ${
                isDarkMode 
                ? 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-500 hover:bg-slate-800' 
                : 'bg-white border-gray-100 text-gray-600 hover:bg-gray-50 shadow-sm'
            }`}>
                <span className="text-lg leading-none">{currentLang.flag}</span>
                <span className="text-xs font-black uppercase tracking-widest hidden md:inline">{currentLang.code === 'hy' ? 'AM' : currentLang.code}</span>
                <ChevronDown className="h-3 w-3 opacity-50 group-hover:rotate-180 transition-transform duration-300" />
            </button>
            
            <div className={`absolute right-0 mt-3 w-44 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 transform origin-top-right group-hover:translate-y-0 translate-y-2 border ${
                isDarkMode ? 'bg-slate-800 border-slate-700 shadow-black/40' : 'bg-white border-gray-100 shadow-gray-200/50'
            }`}>
                <div className="py-2 px-2 flex flex-col space-y-1">
                    {languages.map((lng) => (
                        <button
                            key={lng.code}
                            onClick={() => i18n.changeLanguage(lng.code)}
                            className={`flex items-center justify-between px-4 py-3 text-sm font-bold rounded-xl transition-all ${
                                lng.code === i18n.language 
                                    ? (isDarkMode ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' : 'bg-purple-600 text-white shadow-lg shadow-purple-600/20') 
                                    : (isDarkMode ? 'text-slate-400 hover:bg-slate-700 hover:text-white' : 'text-gray-600 hover:bg-purple-50 hover:text-purple-600')
                            }`}
                        >
                            <div className="flex items-center space-x-3">
                                <span className="text-lg">{lng.flag}</span>
                                <span>{lng.name}</span>
                            </div>
                            {lng.code === i18n.language && <Check className="h-4 w-4" />}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LanguageSelector;
