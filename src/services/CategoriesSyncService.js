// src/services/CategoriesSyncService.js
import { 
  saveCategories, 
  getCategoriesByLanguage,
  getCategoriesByLanguageWithMetadata,
  getCategoriesLastUpdated, 
  getCategoriesFetchedAt,
  clearCategoriesByLanguage,
  clearCategories
} from '../database/categories.js';
import { getUserLocale, getAllCategoriesByLanguage, getMetadata } from '../api/graphqlService.js';

export class CategoriesSyncService {
  static loadedLanguages = new Set();
  static loadingPromises = new Map(); // ✅ Prevent concurrent requests

  // ✅ MAIN METHOD - Handles language change automatically
  static async getCategories(lang = null) {
    const targetLang = lang || getUserLocale().lang;
    
    // ✅ PREVENT DUPLICATE REQUESTS
    if (this.loadingPromises.has(targetLang)) {
      console.log(`⏳ Already loading categories for ${targetLang}, waiting...`);
      return await this.loadingPromises.get(targetLang);
    }

    // ✅ DETECT LANGUAGE CHANGE
    const languageChanged = !this.loadedLanguages.has(targetLang);
    
    if (languageChanged) {
      console.log(`🌐 Language changed to: ${targetLang}`);
      this.loadedLanguages.add(targetLang);
    }

    let cachedCategories = await this.getCachedCategories(targetLang);
    if (cachedCategories) {
      this.triggerBackgroundUpdateIfNeeded(targetLang);
      return cachedCategories;
    }

    // ✅ CREATE PROMISE TO PREVENT DUPLICATES
    const promise = (async () => {
      try {
        console.log(`📥 No cache for ${targetLang}, fetching fresh data...`);
        const freshData = await this.fetchAndCacheCategories(targetLang);
        return freshData;
      } finally {
        this.loadingPromises.delete(targetLang);
      }
    })();

    this.loadingPromises.set(targetLang, promise);
    return await promise;
  }

  static async getCachedCategories(lang) {
    try {
      const categories = await getCategoriesByLanguageWithMetadata(lang);
      if (categories) {
        console.log(`✅ Cache hit for ${lang} (${categories.items.length} categories)`);
        return categories;
      }
    } catch (idbError) {
      console.warn(`IndexedDB read failed for ${lang}:`, idbError);
    }

    // Fallback to localStorage
    try {
      const data = localStorage.getItem(`categories_${lang}`);
      if (data) {
        console.log(`✅ localStorage cache hit for ${lang}`);
        return JSON.parse(data);
      }
    } catch (lsError) {
      console.warn(`localStorage read failed for ${lang}:`, lsError);
    }

    return null;
  }

  static async fetchAndCacheCategories(lang) {
    try {
      console.log(`📥 Fetching fresh categories for ${lang}...`);
      const categoriesData = await this.fetchAllCategoriesForLanguage(lang);
      
      console.log(`💾 Storing ${categoriesData.items.length} categories for ${lang}, lastUpdated: ${categoriesData.lastUpdated}`);
      
      try {
        await saveCategories({ [lang]: categoriesData });
      } catch (idbError) {
        console.warn(`IndexedDB failed for ${lang}, using localStorage fallback:`, idbError);
        localStorage.setItem(`categories_${lang}`, JSON.stringify(categoriesData));
      }
      
      return categoriesData;
    } catch (error) {
      console.error(`❌ Failed to fetch and cache categories for ${lang}:`, error);
      throw error;
    }
  }

  static async shouldUpdateCategories(lang) {
    try {
      const cachedData = await getCategoriesByLanguageWithMetadata(lang);
      if (!cachedData || !cachedData.lastUpdated) {
        console.log(`📋 No cached data for ${lang}, needs update`);
        return true;
      }

      const localLastUpdated = cachedData.lastUpdated;

      // PRIORITY 1: METADATA API
      try {
        const metadata = await getMetadata();
        if (metadata?.categoriesLastUpdated) {
          const serverTime = new Date(metadata.categoriesLastUpdated).getTime();
          const localTime = new Date(localLastUpdated).getTime();
          
          if (serverTime > localTime) {
            console.log(`✅ Metadata: ${lang} needs update`);
            return true;
          }
          
          console.log(`✅ Metadata: ${lang} is up to date`);
          return false;
        }
      } catch (metadataError) {
        console.warn(`Metadata API failed for ${lang}:`, metadataError);
      }

      // PRIORITY 2: CATEGORIES API
      try {
        const latestCategories = await getAllCategoriesByLanguage();
        if (latestCategories?.lastUpdated) {
          const serverTime = new Date(latestCategories.lastUpdated).getTime();
          const localTime = new Date(localLastUpdated).getTime();
          
          if (serverTime > localTime) {
            console.log(`✅ Categories API: ${lang} needs update`);
            return true;
          }
          
          console.log(`✅ Categories API: ${lang} is up to date`);
          return false;
        }
      } catch (categoriesError) {
        console.warn(`Categories API check failed for ${lang}:`, categoriesError);
      }

      console.log(`⏸️ Both APIs unavailable for ${lang}, keeping cache`);
      return false;
      
    } catch (error) {
      console.error(`Error checking update for ${lang}:`, error);
      return false;
    }
  }

  static async triggerBackgroundUpdateIfNeeded(lang) {
    try {
      const needsUpdate = await this.shouldUpdateCategories(lang);
      
      if (needsUpdate) {
        console.log(`🔄 Triggering background update for ${lang}`);
        this.backgroundUpdateCategories(lang).catch(error => {
          console.error(`Background update failed for ${lang}:`, error);
        });
      } else {
        console.log(`✅ No update needed for ${lang}`);
      }
    } catch (error) {
      console.error(`Error checking background update for ${lang}:`, error);
    }
  }

  static async backgroundUpdateCategories(lang) {
    try {
      console.log(`🔄 Background updating categories for ${lang}...`);
      
      await clearCategoriesByLanguage(lang);
      const categoriesData = await this.fetchAllCategoriesForLanguage(lang);
      
      try {
        await saveCategories({ [lang]: categoriesData });
        console.log(`✅ Background update completed for ${lang}. New lastUpdated: ${categoriesData.lastUpdated}`);
      } catch (idbError) {
        console.warn(`IndexedDB failed for ${lang}, using localStorage:`, idbError);
        localStorage.setItem(`categories_${lang}`, JSON.stringify(categoriesData));
      }
    } catch (error) {
      console.error(`❌ Background update failed for ${lang}:`, error);
      throw error;
    }
  }

  static async fetchAllCategoriesForLanguage(lang) {
    let allCategories = [];
    let nextToken = null;
    let lastUpdated = null;

    do {
      const result = await getAllCategoriesByLanguage(nextToken);
      if (!result) throw new Error(`Failed to fetch categories page for ${lang}`);
      
      allCategories = [...allCategories, ...result.items];
      nextToken = result.nextToken;
      if (result.lastUpdated) lastUpdated = result.lastUpdated;
    } while (nextToken);

    return {
      items: allCategories,
      nextToken: null,
      lastUpdated,
      fetchedAt: new Date().toISOString()
    };
  }

  static async forceRefreshCategories(lang = null) {
    const targetLang = lang || getUserLocale().lang;
    console.log(`🔄 Force refreshing categories for ${targetLang}...`);
    
    await clearCategoriesByLanguage(targetLang);
    const freshData = await this.fetchAllCategoriesForLanguage(targetLang);
    await saveCategories({ [targetLang]: freshData });
    
    console.log(`✅ Force refresh completed for ${targetLang}`);
    return freshData;
  }

  static async clearAllLanguages() {
    this.loadedLanguages.clear();
    await clearCategories();
    console.log('🧹 All language caches cleared');
  }

  static getLoadedLanguages() {
    return Array.from(this.loadedLanguages);
  }
}