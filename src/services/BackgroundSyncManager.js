// src/services/BackgroundSyncManager.js
import { CategoriesSyncService } from './CategoriesSyncService.js';

class BackgroundSyncManager {
  constructor() {
    this.syncInterval = null;
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    
    // Check immediately
    this.checkAllLanguagesUpdate();
    
    // Check every 6 hours for ALL loaded languages
    this.syncInterval = setInterval(() => {
      this.checkAllLanguagesUpdate();
    }, 6 * 60 * 60 * 1000); // 6 hours
    
    console.log('✅ Background sync started for all languages');
  }

  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.isRunning = false;
    console.log('⏹️ Background sync stopped');
  }

  async checkAllLanguagesUpdate() {
    try {
      const loadedLanguages = CategoriesSyncService.getLoadedLanguages();
      
      if (loadedLanguages.length === 0) {
        console.log('📭 No languages loaded, skipping sync');
        return;
      }

      console.log(`🔄 Background sync check for ${loadedLanguages.length} languages: [${loadedLanguages.join(', ')}]`);
      
      // Check each language in parallel
      const updatePromises = loadedLanguages.map(lang => 
        CategoriesSyncService.triggerBackgroundUpdateIfNeeded(lang)
      );
      
      await Promise.allSettled(updatePromises);
      console.log('✅ Background sync completed for all languages');
      
    } catch (error) {
      console.error('❌ Background sync check failed:', error);
    }
  }
}

export const backgroundSyncManager = new BackgroundSyncManager();