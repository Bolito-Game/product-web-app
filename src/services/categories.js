// src/services/categories.js - Barrel export for easy imports
export { initializeCategories, useCategories, forceRefreshCategories } from '../app/initialize.js';
export { CategoriesSyncService } from './CategoriesSyncService.js';
export { backgroundSyncManager } from './BackgroundSyncManager.js';

// For React components
export { useCategoriesContext, CategoriesProvider } from '../contexts/CategoriesContext.jsx';

// Export GraphQL functions for convenience
export { getAllCategoriesByLanguage, getMetadata } from '../api/graphqlService.js';