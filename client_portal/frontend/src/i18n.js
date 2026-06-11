import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

const localeBasePath = `${import.meta.env.BASE_URL}locales/{{lng}}/translation.json`;

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'hy', 'ru'],
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    backend: {
      loadPath: `${localeBasePath}?v=${new Date().getTime()}`,
    },
  });

export default i18n;
