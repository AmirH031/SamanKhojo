const { db } = require('../firebaseAdmin');

// Check quota and respond accordingly
async function checkQuotaAndRespond(phoneNumber) {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const dailyLimit = parseInt(process.env.FREE_DAILY_LIMIT) || 1000;
    
    // Get today's usage stats
    const usageRef = db.collection('usageStats').doc(today);
    const usageDoc = await usageRef.get();
    
    let currentUsage = 0;
    let userUsage = 0;
    
    if (usageDoc.exists) {
      const data = usageDoc.data();
      currentUsage = data.totalMessages || 0;
      userUsage = data.userMessages?.[phoneNumber] || 0;
    }
    
    // Check if daily limit exceeded
    if (currentUsage >= dailyLimit) {
      return false;
    }
    
    // Check per-user limit (prevent spam)
    const userDailyLimit = 50;
    if (userUsage >= userDailyLimit) {
      return false;
    }
    
    // Increment usage counters
    await incrementUsage(today, phoneNumber);
    
    return true;
    
  } catch (error) {
    console.error('❌ Quota check error:', error);
    // Allow on error to prevent blocking legitimate users
    return true;
  }
}

// Increment usage statistics
async function incrementUsage(date, phoneNumber) {
  try {
    const usageRef = db.collection('usageStats').doc(date);
    
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(usageRef);
      
      if (doc.exists) {
        const data = doc.data();
        const newTotalMessages = (data.totalMessages || 0) + 1;
        const userMessages = data.userMessages || {};
        userMessages[phoneNumber] = (userMessages[phoneNumber] || 0) + 1;
        
        transaction.update(usageRef, {
          totalMessages: newTotalMessages,
          userMessages: userMessages,
          lastUpdated: new Date()
        });
      } else {
        transaction.set(usageRef, {
          date: date,
          totalMessages: 1,
          userMessages: { [phoneNumber]: 1 },
          createdAt: new Date(),
          lastUpdated: new Date()
        });
      }
    });
    
    
  } catch (error) {
    console.error('❌ Failed to increment usage:', error);
  }
}

// Get usage statistics
async function getUsageStats(days = 7) {
  try {
    const stats = [];
    const today = new Date();
    
    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const usageRef = db.collection('usageStats').doc(dateStr);
      const doc = await usageRef.get();
      
      if (doc.exists) {
        const data = doc.data();
        stats.push({
          date: dateStr,
          totalMessages: data.totalMessages || 0,
          uniqueUsers: Object.keys(data.userMessages || {}).length,
          topUsers: getTopUsers(data.userMessages || {})
        });
      } else {
        stats.push({
          date: dateStr,
          totalMessages: 0,
          uniqueUsers: 0,
          topUsers: []
        });
      }
    }
    
    return stats.reverse(); // Oldest first
    
  } catch (error) {
    console.error('❌ Failed to get usage stats:', error);
    return [];
  }
}

// Get top users by message count
function getTopUsers(userMessages, limit = 5) {
  return Object.entries(userMessages)
    .sort(([,a], [,b]) => b - a)
    .slice(0, limit)
    .map(([phone, count]) => ({
      phone: phone.replace(/(\d{2})(\d{5})(\d{5})/, '$1*****$3'), // Mask phone number
      messageCount: count
    }));
}

// Reset daily usage (for testing or manual reset)
async function resetDailyUsage(date) {
  try {
    const usageRef = db.collection('usageStats').doc(date);
    await usageRef.delete();
    console.log(`🔄 Usage stats reset for ${date}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to reset usage stats:', error);
    return false;
  }
}

// Get current quota status
async function getQuotaStatus() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const dailyLimit = parseInt(process.env.FREE_DAILY_LIMIT) || 1000;
    
    const usageRef = db.collection('usageStats').doc(today);
    const doc = await usageRef.get();
    
    const currentUsage = doc.exists ? (doc.data().totalMessages || 0) : 0;
    const remainingQuota = Math.max(0, dailyLimit - currentUsage);
    const usagePercentage = (currentUsage / dailyLimit) * 100;
    
    return {
      date: today,
      currentUsage,
      dailyLimit,
      remainingQuota,
      usagePercentage: Math.round(usagePercentage * 100) / 100,
      quotaExceeded: currentUsage >= dailyLimit
    };
    
  } catch (error) {
    console.error('❌ Failed to get quota status:', error);
    return null;
  }
}

// Clean up old usage stats (keep last 30 days)
async function cleanupOldStats() {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    const cutoffStr = cutoffDate.toISOString().split('T')[0];
    
    const usageRef = db.collection('usageStats');
    const snapshot = await usageRef.where('date', '<', cutoffStr).get();
    
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log(`🧹 Cleaned up ${snapshot.size} old usage stats records`);
    
  } catch (error) {
    console.error('❌ Failed to cleanup old stats:', error);
  }
}

module.exports = {
  checkQuotaAndRespond,
  incrementUsage,
  getUsageStats,
  getQuotaStatus,
  resetDailyUsage,
  cleanupOldStats
};