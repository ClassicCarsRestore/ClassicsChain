import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import enCommon from '@/locales/en/common.json';
import enNavigation from '@/locales/en/navigation.json';
import enLanding from '@/locales/en/landing.json';
import enAuth from '@/locales/en/auth.json';
import enDashboard from '@/locales/en/dashboard.json';
import enVehicle from '@/locales/en/vehicle.json';
import enConcepts from '@/locales/en/concepts.json';
import enEntities from '@/locales/en/entities.json';
import enErrors from '@/locales/en/errors.json';

import ptCommon from '@/locales/pt/common.json';
import ptNavigation from '@/locales/pt/navigation.json';
import ptLanding from '@/locales/pt/landing.json';
import ptAuth from '@/locales/pt/auth.json';
import ptDashboard from '@/locales/pt/dashboard.json';
import ptVehicle from '@/locales/pt/vehicle.json';
import ptConcepts from '@/locales/pt/concepts.json';
import ptEntities from '@/locales/pt/entities.json';
import ptErrors from '@/locales/pt/errors.json';

const resources = {
  en: {
    common: enCommon,
    navigation: enNavigation,
    landing: enLanding,
    auth: enAuth,
    dashboard: enDashboard,
    vehicle: enVehicle,
    concepts: enConcepts,
    entities: enEntities,
    errors: enErrors,
  },
  pt: {
    common: ptCommon,
    navigation: ptNavigation,
    landing: ptLanding,
    auth: ptAuth,
    dashboard: ptDashboard,
    vehicle: ptVehicle,
    concepts: ptConcepts,
    entities: ptEntities,
    errors: ptErrors,
  },
};

i18n
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Pass i18n instance to react-i18next
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'navigation', 'landing', 'auth', 'dashboard', 'vehicle', 'concepts', 'entities', 'errors'],

    detection: {
      // Detection order and caches
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    react: {
      useSuspense: false, // Disable suspense for now
    },
  });

export default i18n;
