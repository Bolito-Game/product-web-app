// src/hooks/useLanguageCategories.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { CategoriesSyncService } from '../services/CategoriesSyncService.js';
import { getUserLocale } from '../api/graphqlService.js';

export const useLanguageCategories = (preferredLang = null) => {
  const [categories, setCategories] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentLang, setCurrentLang] = useState(null);
  const loadedLanguagesRef = useRef(new Set());

  // ✅ Get current language (stable reference)
  const getCurrentLanguage = useCallback(() => {
    return preferredLang || getUserLocale().lang;
  }, [preferredLang]);

  // ✅ Update current language only when it actually changes
  useEffect(() => {
    const newLang = getCurrentLanguage();
    if (newLang && newLang !== currentLang) {
      console.log(`🌐 Language changed from ${currentLang || 'null'} to ${newLang}`);
      setCurrentLang(newLang);
    }
  }, [getCurrentLanguage, currentLang]);

  // ✅ Load categories for specific language
  const loadCategories = useCallback(async (lang) => {
    if (!lang) return null;

    setLoading(true);
    setError(null);

    try {
      console.log(`📥 Loading categories for ${lang}...`);
      const result = await CategoriesSyncService.getCategories(lang);
      setCategories(result);
      
      // ✅ Update loaded languages
      loadedLanguagesRef.current.add(lang);
      
      console.log(`✅ Loaded ${result.items.length} categories for ${lang}`);
      return result;
    } catch (err) {
      console.error(`❌ Failed to load categories for ${lang}:`, err);
      setError(err.message || 'Failed to load categories');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Auto-load when language changes
  useEffect(() => {
    if (currentLang) {
      loadCategories(currentLang);
    }
  }, [currentLang, loadCategories]);

  // ✅ Get loaded languages (stable)
  const getLoadedLanguages = useCallback(() => {
    return Array.from(loadedLanguagesRef.current);
  }, []);

  return {
    categories,
    loading,
    error,
    language: currentLang,
    loadedLanguages: getLoadedLanguages(),
    reload: loadCategories,
    isLanguageLoaded: currentLang ? loadedLanguagesRef.current.has(currentLang) : false
  };
};