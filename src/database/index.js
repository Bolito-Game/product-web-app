// src/database/index.js
const DB_NAME = 'MyOrdersDB';
const CATEGORIES_STORE_NAME = 'categories';
const DB_VERSION = 3;

export const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      const oldVersion = e.oldVersion;
      
      console.log(`📊 Database upgrade from version ${oldVersion} to ${DB_VERSION}`);
      
      // Categories store with category as primary key
      if (db.objectStoreNames.contains(CATEGORIES_STORE_NAME)) {
        db.deleteObjectStore(CATEGORIES_STORE_NAME);
        console.log('🗑️ Deleted old categories store');
      }
      
      const store = db.createObjectStore(CATEGORIES_STORE_NAME, { 
        keyPath: 'category'  // ✅ Primary key for fast lookup
      });
      
      // ✅ SEARCH INDEXES
      store.createIndex('lang', 'lang', { unique: false });
      store.createIndex('text', 'text', { unique: false });
      store.createIndex('lastUpdated', 'lastUpdated', { unique: false });
      store.createIndex('fetchedAt', 'fetchedAt', { unique: false });
      
      console.log('✅ Categories store created with category key structure');
    };

    request.onsuccess = (e) => {
      console.log(`✅ Database ready (version ${DB_VERSION})`);
      resolve(e.target.result);
    };
    
    request.onerror = (e) => {
      console.error('❌ Database initialization failed:', e.target.error);
      reject(e.target.error);
    };
  });
};


export { 
  saveCategories, 
  getCategoriesByLanguage, 
  getCategoriesByLanguageWithMetadata,
  getCategoriesLastUpdated, 
  getCategoriesFetchedAt,
  clearCategories,
  clearCategoriesByLanguage,
  getCategoryById,
  searchCategories  
} from './categories.js';

export default { initDB };