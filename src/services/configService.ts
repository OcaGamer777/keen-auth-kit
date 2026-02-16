import { supabase } from '@/integrations/supabase/client';

export interface AppConfig {
  key: string;
  value: any;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

// Configuration keys
export const CONFIG_KEYS = {
  DEFAULT_TOPIC: 'default_topic',
  APP_NAME: 'app_name',
  MAX_DAILY_EXERCISES_FREE: 'max_daily_exercises_free',
  ENABLE_TTS: 'enable_tts',
  CONTACT_EMAIL: 'contact_email',
} as const;

type ConfigKey = typeof CONFIG_KEYS[keyof typeof CONFIG_KEYS];

// In-memory cache for fast access
let configCache: Map<string, any> = new Map();
let cacheInitialized = false;
let cachePromise: Promise<void> | null = null;

export const configService = {
  /**
   * Initialize the cache by loading all config from database
   * This should be called once at app startup
   */
  async initCache(): Promise<void> {
    if (cacheInitialized) return;
    
    // Prevent multiple simultaneous initializations
    if (cachePromise) return cachePromise;
    
    cachePromise = (async () => {
      try {
        const { data, error } = await supabase
          .from('app_config' as any)
          .select('*');
        
        if (error) throw error;
        
        const configs = (data || []) as unknown as AppConfig[];
        configs.forEach((config) => {
          configCache.set(config.key, config.value);
        });
        
        cacheInitialized = true;
        console.log('Config cache initialized with', configs.length, 'values');
      } catch (error) {
        console.error('Error initializing config cache:', error);
        // Set default values as fallback
        configCache.set(CONFIG_KEYS.DEFAULT_TOPIC, 'Die Betonung');
        configCache.set(CONFIG_KEYS.APP_NAME, 'German Learning App');
        configCache.set(CONFIG_KEYS.MAX_DAILY_EXERCISES_FREE, 10);
        configCache.set(CONFIG_KEYS.ENABLE_TTS, true);
        cacheInitialized = true;
      } finally {
        cachePromise = null;
      }
    })();
    
    return cachePromise;
  },

  /**
   * Get a config value (from cache for speed)
   */
  async get<T = any>(key: ConfigKey): Promise<T | null> {
    await this.initCache();
    return configCache.get(key) ?? null;
  },

  /**
   * Get a config value synchronously (only works after cache is initialized)
   * Returns null if cache not ready
   */
  getSync<T = any>(key: ConfigKey): T | null {
    if (!cacheInitialized) return null;
    return configCache.get(key) ?? null;
  },

  /**
   * Get all config values
   */
  async getAll(): Promise<AppConfig[]> {
    try {
      const { data, error } = await supabase
        .from('app_config' as any)
        .select('*')
        .order('key');
      
      if (error) throw error;
      return (data || []) as unknown as AppConfig[];
    } catch (error) {
      console.error('Error getting all config:', error);
      return [];
    }
  },

  /**
   * Set a config value (updates both DB and cache)
   */
  async set(key: ConfigKey, value: any, description?: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('app_config' as any)
        .upsert({ 
          key, 
          value, 
          description,
          updated_at: new Date().toISOString()
        } as any, { 
          onConflict: 'key' 
        });
      
      if (error) throw error;
      
      // Update cache
      configCache.set(key, value);
      
      return true;
    } catch (error) {
      console.error('Error setting config:', error);
      return false;
    }
  },

  /**
   * Update multiple config values at once
   */
  async setMultiple(configs: Array<{ key: ConfigKey; value: any; description?: string }>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('app_config' as any)
        .upsert(
          configs.map(c => ({
            key: c.key,
            value: c.value,
            description: c.description,
            updated_at: new Date().toISOString()
          })) as any,
          { onConflict: 'key' }
        );
      
      if (error) throw error;
      
      // Update cache
      configs.forEach(c => {
        configCache.set(c.key, c.value);
      });
      
      return true;
    } catch (error) {
      console.error('Error setting multiple configs:', error);
      return false;
    }
  },

  /**
   * Invalidate and reload the cache
   */
  async refreshCache(): Promise<void> {
    cacheInitialized = false;
    configCache.clear();
    await this.initCache();
  },

  /**
   * Check if cache is ready
   */
  isCacheReady(): boolean {
    return cacheInitialized;
  }
};
