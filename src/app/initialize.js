// src/app/initialize.js
import { initDB } from '../database/index.js';
import { CategoriesSyncService } from '../services/CategoriesSyncService.js';
import { backgroundSyncManager } from '../services/BackgroundSyncManager.js';
import { getUserLocale } from '../api/graphqlService.js';

export const initializeCategories = async () => {
  try {
    console.log('🚀 Initializing categories system...');
    
    // 1. Initialize IndexedDB
    console.log('📊 Initializing IndexedDB...');
    await initDB();
    console.log('✅ IndexedDB initialized successfully');

    // 2. Start background sync manager
    console.log('⏰ Starting background sync manager...');
    backgroundSyncManager.start();
    console.log('✅ Background sync manager started');

    // 3. Pre-warm categories for CURRENT language
    const { lang } = getUserLocale();
    console.log(`🌐 Current locale: ${lang}`);
    
    // This will be handled by useLanguageCategories hook
    // No need to pre-warm here anymore
    
    return { success: true };
  } catch (error) {
    console.error('❌ Categories initialization failed:', error);
    throw error;
  }
};

// Hook for React components (simplified)
export const useCategories = () => {
  return {
    forceRefresh: (lang) => CategoriesSyncService.forceRefreshCategories(lang),
    clearAllLanguages: () => CategoriesSyncService.clearAllLanguages(),
    getLoadedLanguages: () => CategoriesSyncService.getLoadedLanguages(),
  };
};

// Expose utilities
export const forceRefreshCategories = (lang = null) => 
  CategoriesSyncService.forceRefreshCategories(lang);

export const clearAllCategoryCaches = () => 
  CategoriesSyncService.clearAllLanguages();

export const getLoadedLanguages = () => 
  CategoriesSyncService.getLoadedLanguages();

export const cleanupCategories = () => {
  console.log('🧹 Cleaning up categories system...');
  backgroundSyncManager.stop();
  CategoriesSyncService.loadedLanguages.clear();
};

// Ensure initialized
let isInitialized = false;
export const ensureCategoriesInitialized = async () => {
  if (isInitialized) {
    console.log('✅ Categories system already initialized');
    return true;
  }
  try {
    await initializeCategories();
    isInitialized = true;
    return true;
  } catch (error) {
    console.error('❌ Failed to ensure categories initialization:', error);
    isInitialized = false;
    return false;
  }
};

export default {
  initializeCategories,
  useCategories,
  forceRefreshCategories,
  ensureCategoriesInitialized,
  cleanupCategories,
  clearAllCategoryCaches,
  getLoadedLanguages,
};