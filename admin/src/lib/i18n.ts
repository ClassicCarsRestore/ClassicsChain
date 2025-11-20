import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import enCommon from '@/locales/en/common.json';
import enNavigation from '@/locales/en/navigation.json';
import enEntities from '@/locales/en/entities.json';
import enUsers from '@/locales/en/users.json';
import enHome from '@/locales/en/home.json';
import enVehicles from '@/locales/en/vehicles.json';
import enOAuth2 from '@/locales/en/oauth2.json';
import enErrors from '@/locales/en/errors.json';

import ptCommon from '@/locales/pt/common.json';
import ptNavigation from '@/locales/pt/navigation.json';
import ptEntities from '@/locales/pt/entities.json';
import ptUsers from '@/locales/pt/users.json';
import ptHome from '@/locales/pt/home.json';
import ptVehicles from '@/locales/pt/vehicles.json';
import ptOAuth2 from '@/locales/pt/oauth2.json';
import ptErrors from '@/locales/pt/errors.json';

const resources = {
  en: {
    common: enCommon,
    navigation: enNavigation,
    entities: enEntities,
    users: enUsers,
    home: enHome,
    vehicles: enVehicles,
    oauth2: enOAuth2,
    errors: enErrors,
  },
  pt: {
    common: ptCommon,
    navigation: ptNavigation,
    entities: ptEntities,
    users: ptUsers,
    home: ptHome,
    vehicles: ptVehicles,
    oauth2: ptOAuth2,
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
    ns: ['common', 'navigation', 'entities', 'users', 'home', 'vehicles', 'oauth2', 'errors'],

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
