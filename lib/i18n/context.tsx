'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { setFormatLocale } from '@/lib/format';
import { translations, Locale } from './translations';

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  locale: 'tr',
  setLocale: () => {},
  t: (key: string) => key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('tr');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem('app-locale');
      if (saved === 'en' || saved === 'tr') {
        setLocaleState(saved);
        setFormatLocale(saved);
        document.documentElement.lang = saved;
      } else {
        setFormatLocale('tr');
        document.documentElement.lang = 'tr';
      }
    } catch {
      setFormatLocale('tr');
      document.documentElement.lang = 'tr';
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    setFormatLocale(locale);
    document.documentElement.lang = locale;
  }, [locale, mounted]);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    setFormatLocale(newLocale);
    try {
      localStorage.setItem('app-locale', newLocale);
      document.documentElement.lang = newLocale;
    } catch {}
  }, []);

  const t = useCallback((key: string): string => {
    return translations[locale]?.[key] ?? translations['tr']?.[key] ?? key;
  }, [locale]);

  // During SSR, always use Turkish to avoid hydration mismatch
  const contextValue = {
    locale: mounted ? locale : 'tr' as Locale,
    setLocale,
    t: mounted ? t : (key: string) => translations['tr']?.[key] ?? key,
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
