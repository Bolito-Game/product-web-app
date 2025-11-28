// src/database/categories.js
import { initDB } from './index.js';

const CATEGORIES_STORE_NAME = 'categories';

export const saveCategories = async (categoriesData) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CATEGORIES_STORE_NAME, 'readwrite');
    const store = tx.objectStore(CATEGORIES_STORE_NAME);
    
    let totalSaved = 0;
    
    Object.entries(categoriesData).forEach(([lang, data]) => {
      if (data.items && Array.isArray(data.items)) {
        data.items.forEach(item => {
          store.put({
            category: item.category,        // ✅ PRIMARY KEY
            lang,
            text: item.text,
            lastUpdated: data.lastUpdated,
            fetchedAt: data.fetchedAt || new Date().toISOString()
          });
          totalSaved++;
        });
      }
    });
    
    tx.oncomplete = () => {
      console.log(`💾 Saved ${totalSaved} category records`);
      resolve(totalSaved);
    };
    tx.onerror = (e) => reject(e.target.error);
  });
};

export const getCategoriesByLanguage = async (lang) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CATEGORIES_STORE_NAME, 'readonly');
    const store = tx.objectStore(CATEGORIES_STORE_NAME);
    const index = store.index('lang');
    const request = index.openCursor(IDBKeyRange.only(lang));
    
    const categories = [];
    
    request.onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor) {
        categories.push(cursor.value);
        cursor.continue();
      } else {
        const sorted = categories.sort((a, b) => a.category.localeCompare(b.category));
        resolve(sorted);
      }
    };
    
    request.onerror = (e) => reject(e.target.error);
  });
};

export const getCategoriesByLanguageWithMetadata = async (lang) => {
  const categories = await getCategoriesByLanguage(lang);
  if (!categories.length) return null;
  
  const metadata = categories[0];
  
  return {
    items: categories.map(cat => ({
      category: cat.category,
      text: cat.text
    })),
    nextToken: null,
    lastUpdated: metadata.lastUpdated,
    fetchedAt: metadata.fetchedAt
  };
};

export const getCategoryById = async (categoryId) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CATEGORIES_STORE_NAME, 'readonly');
    const store = tx.objectStore(CATEGORIES_STORE_NAME);
    const request = store.get(categoryId);
    
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = (e) => reject(e.target.error);
  });
};

export const getCategoriesLastUpdated = async (lang) => {
  try {
    const categories = await getCategoriesByLanguage(lang);
    return categories.length > 0 ? categories[0].lastUpdated : null;
  } catch {
    return null;
  }
};

export const getCategoriesFetchedAt = async (lang) => {
  try {
    const categories = await getCategoriesByLanguage(lang);
    return categories.length > 0 ? categories[0].fetchedAt : null;
  } catch {
    return null;
  }
};

export const clearCategoriesByLanguage = async (lang) => {
  const categories = await getCategoriesByLanguage(lang);
  if (!categories.length) return;

  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CATEGORIES_STORE_NAME, 'readwrite');
    const store = tx.objectStore(CATEGORIES_STORE_NAME);
    
    let deleted = 0;
    categories.forEach(cat => {
      store.delete(cat.category);
      deleted++;
    });
    
    tx.oncomplete = () => {
      console.log(`🗑️ Deleted ${deleted} categories for ${lang}`);
      resolve(deleted);
    };
    tx.onerror = (e) => reject(e.target.error);
  });
};

export const clearCategories = async () => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CATEGORIES_STORE_NAME, 'readwrite');
    const store = tx.objectStore(CATEGORIES_STORE_NAME);
    store.clear();
    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject(e.target.error);
  });
};

export const searchCategories = async (searchTerm, minimumMatchLength = 2) => {
  if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.trim().length < minimumMatchLength) {
    return [];
  }

  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CATEGORIES_STORE_NAME, 'readonly');
    const store = tx.objectStore(CATEGORIES_STORE_NAME);
    
    // ✅ SEARCH ALL RECORDS - NO LANGUAGE FILTER
    const request = store.openCursor();
    
    const allCategories = [];
    
    request.onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor) {
        allCategories.push(cursor.value);
        cursor.continue();
      } else {
        console.log(`🔍 Searching ${allCategories.length} categories (all languages) for "${searchTerm}"`);
        
        const searchLower = searchTerm.toLowerCase().trim();
        const matches = [];
        
        allCategories.forEach((cat, index) => {
          const categoryLower = cat.category.toLowerCase();
          const textLower = cat.text.toLowerCase();
          
          // DEBUG LOG (remove after testing)
          console.log(`🔍 [${cat.lang}] "${cat.category}" -> "${cat.text}"`);
          
          let matchFound = false;
          let matchType = '';
          let matchScore = 0;
          let matchedField = '';
          
          // 1. EXACT MATCH
          if (categoryLower === searchLower || textLower === searchLower) {
            matchType = 'exact';
            matchScore = 100;
            matchedField = categoryLower === searchLower ? 'category' : 'text';
            matchFound = true;
          }
          // 2. STARTS WITH MATCH
          else if (categoryLower.startsWith(searchLower) || textLower.startsWith(searchLower)) {
            matchType = 'startsWith';
            matchScore = 95;
            matchedField = categoryLower.startsWith(searchLower) ? 'category' : 'text';
            matchFound = true;
          }
          // 3. CONTAINS MATCH
          else if (categoryLower.includes(searchLower) || textLower.includes(searchLower)) {
            matchType = 'contains';
            matchScore = 85;
            matchedField = categoryLower.includes(searchLower) ? 'category' : 'text';
            matchFound = true;
          }
          // 4. FUZZY MATCH
          else {
            const categoryMatch = calculateMatchScore(searchLower, categoryLower);
            const textMatch = calculateMatchScore(searchLower, textLower);
            
            const bestScore = Math.max(categoryMatch.score, textMatch.score);
            if (bestScore >= 60) {
              matchType = 'fuzzy';
              matchScore = bestScore;
              matchedField = categoryMatch.score > textMatch.score ? 'category' : 'text';
              matchFound = true;
            }
          }
          
          if (matchFound) {
            matches.push({
              ...cat,
              matchScore,
              matchType,
              matchedField,
              searchTerm
            });
          }
        });
        
        // Sort: exact → startsWith → contains → fuzzy
        const sortedMatches = matches.sort((a, b) => {
          const typeOrder = { exact: 4, startsWith: 3, contains: 2, fuzzy: 1 };
          const aType = typeOrder[a.matchType] || 0;
          const bType = typeOrder[b.matchType] || 0;
          
          if (aType !== bType) return bType - aType;
          return b.matchScore - a.matchScore;
        });
        
        console.log(`✅ Found ${sortedMatches.length} matches:`, 
          sortedMatches.map(m => ({
            category: m.category,
            text: m.text,
            lang: m.lang,
            type: m.matchType,
            score: m.matchScore,
            field: m.matchedField
          }))
        );
        
        resolve(sortedMatches);
      }
    };
    
    request.onerror = (e) => {
      console.error('❌ Search error:', e.target.error);
      reject(e.target.error);
    };
  });
};

// Enhanced fuzzy matching
const calculateMatchScore = (search, target) => {
  if (!search || !target) return { score: 0 };
  
  let score = 0;
  let consecutive = 0;
  let matchesFound = 0;
  
  for (let i = 0; i < search.length; i++) {
    const searchChar = search[i];
    let foundIndex = -1;
    
    // Look for character starting from previous match
    for (let j = (consecutive === 0 ? 0 : consecutive); j < target.length; j++) {
      if (target[j] === searchChar) {
        foundIndex = j;
        break;
      }
    }
    
    if (foundIndex !== -1) {
      matchesFound++;
      consecutive = foundIndex + 1;
      // Score based on position, consecutiveness, and match ratio
      const positionBonus = 1 - (foundIndex / target.length);
      const consecutiveBonus = Math.min(consecutive / search.length, 1);
      score += 100 * positionBonus * consecutiveBonus * (1 / search.length);
    } else {
      consecutive = 0;
    }
  }
  
  // Bonus for complete substring matches
  if (target.includes(search)) score += 15;
  
  return { score: Math.min(Math.round(score), 100) };
};