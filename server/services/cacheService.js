/**
 * Cache Service for NLU results and product embeddings
 * Implements caching for improved performance
 */

const NodeCache = require('node-cache');

class CacheService {
  constructor() {
    // NLU results cache - shorter TTL for dynamic results
    this.nluCache = new NodeCache({
      stdTTL: parseInt(process.env.NLU_CACHE_TTL) || 600, // 10 minutes default
      checkperiod: 120, // Check for expired keys every 2 minutes
      useClones: false, // Better performance, but be careful with object mutations
      maxKeys: 1000 // Limit cache size
    });

    // Product embeddings cache - longer TTL for stable data
    this.embeddingCache = new NodeCache({
      stdTTL: parseInt(process.env.EMBEDDING_CACHE_TTL) || 3600, // 1 hour default
      checkperiod: 300, // Check for expired keys every 5 minutes
      useClones: false,
      maxKeys: 5000 // More embeddings can be cached
    });

    // Search results cache - medium TTL
    this.searchCache = new NodeCache({
      stdTTL: parseInt(process.env.SEARCH_CACHE_TTL) || 300, // 5 minutes default
      checkperiod: 60,
      useClones: false,
      maxKeys: 2000
    });

    // Performance metrics cache
    this.metricsCache = new NodeCache({
      stdTTL: 60, // 1 minute for metrics
      checkperiod: 30,
      useClones: false,
      maxKeys: 100
    });

    this.setupEventHandlers();
  }

  setupEventHandlers() {
    // Log cache events for monitoring
    this.nluCache.on('set', (key, value) => {
      console.log(`📦 NLU Cache SET: ${key}`);
    });

    this.nluCache.on('expired', (key, value) => {
      console.log(`⏰ NLU Cache EXPIRED: ${key}`);
    });

    this.embeddingCache.on('set', (key, value) => {
      console.log(`🧠 Embedding Cache SET: ${key}`);
    });

    this.searchCache.on('set', (key, value) => {
      console.log(`🔍 Search Cache SET: ${key}`);
    });
  }

  // NLU Results Caching
  getNLUResult(query, userId) {
    const cacheKey = this.generateNLUCacheKey(query, userId);
    const cached = this.nluCache.get(cacheKey);
    
    if (cached) {
      console.log(`✅ NLU Cache HIT: ${cacheKey}`);
      return {
        ...cached,
        fromCache: true,
        cacheHit: true
      };
    }
    
    console.log(`❌ NLU Cache MISS: ${cacheKey}`);
    return null;
  }

  setNLUResult(query, userId, result) {
    const cacheKey = this.generateNLUCacheKey(query, userId);
    
    // Don't cache error results or low confidence results
    if (result.error || (result.confidence && result.confidence < 0.3)) {
      console.log(`⚠️ Not caching low confidence/error result: ${cacheKey}`);
      return false;
    }

    // Remove non-cacheable properties
    const cacheableResult = {
      ...result,
      fromCache: false,
      cacheHit: false,
      cachedAt: new Date().toISOString()
    };

    return this.nluCache.set(cacheKey, cacheableResult);
  }

  generateNLUCacheKey(query, userId) {
    const normalizedQuery = query.toLowerCase().trim().replace(/\s+/g, ' ');
    const userPrefix = userId ? `user:${userId}` : 'anonymous';
    return `nlu:${userPrefix}:${Buffer.from(normalizedQuery).toString('base64')}`;
  }

  // Product Embeddings Caching
  getProductEmbedding(productId) {
    const cacheKey = `embedding:${productId}`;
    const cached = this.embeddingCache.get(cacheKey);
    
    if (cached) {
      console.log(`✅ Embedding Cache HIT: ${productId}`);
      return cached;
    }
    
    console.log(`❌ Embedding Cache MISS: ${productId}`);
    return null;
  }

  setProductEmbedding(productId, embedding) {
    const cacheKey = `embedding:${productId}`;
    
    if (!embedding || !Array.isArray(embedding.embedding)) {
      console.log(`⚠️ Invalid embedding data for product: ${productId}`);
      return false;
    }

    const cacheableEmbedding = {
      ...embedding,
      cachedAt: new Date().toISOString()
    };

    return this.embeddingCache.set(cacheKey, cacheableEmbedding);
  }

  // Batch operations for embeddings
  getMultipleEmbeddings(productIds) {
    const results = {};
    const missingIds = [];

    productIds.forEach(productId => {
      const cached = this.getProductEmbedding(productId);
      if (cached) {
        results[productId] = cached;
      } else {
        missingIds.push(productId);
      }
    });

    return { cached: results, missing: missingIds };
  }

  setMultipleEmbeddings(embeddingsMap) {
    let successCount = 0;
    
    Object.entries(embeddingsMap).forEach(([productId, embedding]) => {
      if (this.setProductEmbedding(productId, embedding)) {
        successCount++;
      }
    });

    console.log(`📦 Cached ${successCount}/${Object.keys(embeddingsMap).length} embeddings`);
    return successCount;
  }

  // Search Results Caching
  getSearchResults(query, filters = {}) {
    const cacheKey = this.generateSearchCacheKey(query, filters);
    const cached = this.searchCache.get(cacheKey);
    
    if (cached) {
      console.log(`✅ Search Cache HIT: ${cacheKey}`);
      return {
        ...cached,
        fromCache: true
      };
    }
    
    console.log(`❌ Search Cache MISS: ${cacheKey}`);
    return null;
  }

  setSearchResults(query, filters, results) {
    const cacheKey = this.generateSearchCacheKey(query, filters);
    
    // Don't cache empty results or error results
    if (!results || !Array.isArray(results.results) || results.results.length === 0) {
      console.log(`⚠️ Not caching empty search results: ${cacheKey}`);
      return false;
    }

    const cacheableResults = {
      ...results,
      fromCache: false,
      cachedAt: new Date().toISOString()
    };

    return this.searchCache.set(cacheKey, cacheableResults);
  }

  generateSearchCacheKey(query, filters) {
    const normalizedQuery = query.toLowerCase().trim();
    const filterString = JSON.stringify(filters || {});
    const combined = `${normalizedQuery}:${filterString}`;
    return `search:${Buffer.from(combined).toString('base64')}`;
  }

  // Performance Metrics Caching
  getMetrics(metricType) {
    return this.metricsCache.get(`metrics:${metricType}`);
  }

  setMetrics(metricType, metrics) {
    return this.metricsCache.set(`metrics:${metricType}`, {
      ...metrics,
      timestamp: new Date().toISOString()
    });
  }

  // Cache Statistics and Management
  getCacheStats() {
    return {
      nlu: {
        keys: this.nluCache.keys().length,
        hits: this.nluCache.getStats().hits,
        misses: this.nluCache.getStats().misses,
        hitRate: this.calculateHitRate(this.nluCache.getStats())
      },
      embeddings: {
        keys: this.embeddingCache.keys().length,
        hits: this.embeddingCache.getStats().hits,
        misses: this.embeddingCache.getStats().misses,
        hitRate: this.calculateHitRate(this.embeddingCache.getStats())
      },
      search: {
        keys: this.searchCache.keys().length,
        hits: this.searchCache.getStats().hits,
        misses: this.searchCache.getStats().misses,
        hitRate: this.calculateHitRate(this.searchCache.getStats())
      },
      metrics: {
        keys: this.metricsCache.keys().length,
        hits: this.metricsCache.getStats().hits,
        misses: this.metricsCache.getStats().misses,
        hitRate: this.calculateHitRate(this.metricsCache.getStats())
      }
    };
  }

  calculateHitRate(stats) {
    const total = stats.hits + stats.misses;
    return total > 0 ? (stats.hits / total * 100).toFixed(2) : 0;
  }

  // Cache invalidation methods
  invalidateNLUCache(pattern) {
    const keys = this.nluCache.keys();
    const matchingKeys = pattern ? keys.filter(key => key.includes(pattern)) : keys;
    
    matchingKeys.forEach(key => this.nluCache.del(key));
    console.log(`🗑️ Invalidated ${matchingKeys.length} NLU cache entries`);
    
    return matchingKeys.length;
  }

  invalidateEmbeddingCache(productIds) {
    if (!Array.isArray(productIds)) {
      productIds = [productIds];
    }

    let invalidatedCount = 0;
    productIds.forEach(productId => {
      const cacheKey = `embedding:${productId}`;
      if (this.embeddingCache.del(cacheKey)) {
        invalidatedCount++;
      }
    });

    console.log(`🗑️ Invalidated ${invalidatedCount} embedding cache entries`);
    return invalidatedCount;
  }

  invalidateSearchCache(pattern) {
    const keys = this.searchCache.keys();
    const matchingKeys = pattern ? keys.filter(key => key.includes(pattern)) : keys;
    
    matchingKeys.forEach(key => this.searchCache.del(key));
    console.log(`🗑️ Invalidated ${matchingKeys.length} search cache entries`);
    
    return matchingKeys.length;
  }

  // Clear all caches
  clearAllCaches() {
    const stats = {
      nlu: this.nluCache.keys().length,
      embeddings: this.embeddingCache.keys().length,
      search: this.searchCache.keys().length,
      metrics: this.metricsCache.keys().length
    };

    this.nluCache.flushAll();
    this.embeddingCache.flushAll();
    this.searchCache.flushAll();
    this.metricsCache.flushAll();

    console.log(`🗑️ Cleared all caches:`, stats);
    return stats;
  }

  // Warmup cache with frequently accessed data
  async warmupCache(products = []) {
    console.log(`🔥 Warming up cache with ${products.length} products...`);
    
    let warmedUp = 0;
    
    // Pre-generate embeddings for popular products
    for (const product of products.slice(0, 100)) { // Limit to top 100
      try {
        // This would typically be called during app startup
        // with actual embedding generation
        const mockEmbedding = {
          embedding: new Array(100).fill(0.1),
          metadata: {
            name: product.name,
            category: product.category,
            price: product.price
          }
        };
        
        if (this.setProductEmbedding(product.id, mockEmbedding)) {
          warmedUp++;
        }
      } catch (error) {
        console.error(`Failed to warmup cache for product ${product.id}:`, error);
      }
    }

    console.log(`🔥 Cache warmup completed: ${warmedUp} products cached`);
    return warmedUp;
  }

  // Health check for cache service
  healthCheck() {
    const stats = this.getCacheStats();
    const totalKeys = stats.nlu.keys + stats.embeddings.keys + stats.search.keys;
    
    return {
      status: 'healthy',
      totalCachedItems: totalKeys,
      caches: {
        nlu: {
          status: this.nluCache ? 'active' : 'inactive',
          items: stats.nlu.keys,
          hitRate: `${stats.nlu.hitRate}%`
        },
        embeddings: {
          status: this.embeddingCache ? 'active' : 'inactive',
          items: stats.embeddings.keys,
          hitRate: `${stats.embeddings.hitRate}%`
        },
        search: {
          status: this.searchCache ? 'active' : 'inactive',
          items: stats.search.keys,
          hitRate: `${stats.search.hitRate}%`
        }
      },
      memoryUsage: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };
  }
}

// Export singleton instance
module.exports = new CacheService();