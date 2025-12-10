const { Firestore } = require('@google-cloud/firestore');

class FirestoreConnectionPool {
  constructor() {
    this.pools = new Map();
    this.maxConnections = 50; // Maximum concurrent connections
    this.activeConnections = 0;
    this.waitingQueue = [];
    
    // Initialize primary connection pool
    this.initializePool();
  }

  initializePool() {
    // Create optimized Firestore instance with connection pooling
    this.firestore = new Firestore({
      projectId: process.env.FIREBASE_PROJECT_ID,
      // Enable connection pooling and optimize settings
      settings: {
        maxIdleChannels: 10,
        keepAliveTime: 30000,
        keepAliveTimeout: 5000,
        keepAlivePermitWithoutCalls: true,
        maxReceiveMessageLength: 4 * 1024 * 1024,
        maxSendMessageLength: 4 * 1024 * 1024,
      }
    });

    console.log('🔗 Firestore connection pool initialized');
  }

  async getConnection() {
    if (this.activeConnections < this.maxConnections) {
      this.activeConnections++;
      return this.firestore;
    }

    // If pool is full, wait for available connection
    return new Promise((resolve) => {
      this.waitingQueue.push(resolve);
    });
  }

  releaseConnection() {
    this.activeConnections--;
    
    // Process waiting queue
    if (this.waitingQueue.length > 0) {
      const nextResolve = this.waitingQueue.shift();
      this.activeConnections++;
      nextResolve(this.firestore);
    }
  }

  getStats() {
    return {
      activeConnections: this.activeConnections,
      waitingQueue: this.waitingQueue.length,
      maxConnections: this.maxConnections
    };
  }
}

// Singleton instance
const connectionPool = new FirestoreConnectionPool();

// Middleware to provide pooled connection
const withConnection = (req, res, next) => {
  req.getDB = async () => {
    const db = await connectionPool.getConnection();
    
    // Add cleanup to response end
    const originalEnd = res.end;
    res.end = function(...args) {
      connectionPool.releaseConnection();
      return originalEnd.apply(this, args);
    };
    
    return db;
  };
  
  next();
};

module.exports = {
  connectionPool,
  withConnection
};