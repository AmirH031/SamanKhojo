import { adminApi } from './api';


/**
 * Admin API methods (now uses centralized API service)
 */
export const adminApiService = {
  // Feedback management
  async getAllFeedback(filters?: {
    status?: string;
    type?: string;
    category?: string;
    limit?: number;
  }) {
    return adminApi.getAllFeedback(filters);
  },

  async getFeedbackStats() {
    return adminApi.getFeedbackStats();
  },

  async updateFeedback(feedbackId: string, updates: {
    status?: string;
    adminNotes?: string;
  }) {
    return adminApi.updateFeedback(feedbackId, updates);
  },

  // Item management
  async addItem(itemData: any) {
    return adminApi.addItem(itemData.shopId, itemData);
  },

  async updateItem(itemId: string, updates: any) {
    return adminApi.updateItem(shopId, itemId, updates);
  },

  async deleteItem(itemId: string) {
    return adminApi.deleteItem(shopId, itemId);
  },

  async bulkAddItems(shopId: string, items: any[]) {
    return adminApi.bulkAddItems(shopId, items);
  },

  async getAdminStatus() {
    return adminApi.getStatus();
  },

  async getAdminAnalytics() {
    return adminApi.getAnalytics();
  },
};