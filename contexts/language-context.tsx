'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { dictionaries, type Dictionary, type Language } from '@/lib/i18n'

interface LanguageContextValue {
  lang: Language
  dir: 'ltr' | 'rtl'
  t: Dictionary
  setLang: (lang: Language) => void
}

const STORAGE_KEY = 'mrq-language'

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('en')

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === 'fa' || stored === 'en') setLangState(stored)
  }, [])

  const dir = lang === 'fa' ? 'rtl' : 'ltr'

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = dir
  }, [lang, dir])

  const setLang = useCallback((next: Language) => {
    setLangState(next)
    window.localStorage.setItem(STORAGE_KEY, next)
  }, [])

  const value = useMemo(() => ({ lang, dir, t: dictionaries[lang], setLang }) as const, [lang, dir, setLang])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used within LanguageProvider')
  return context
}
