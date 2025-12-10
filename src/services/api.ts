/**
 * Centralized API service with secure configuration
 * Uses relative URLs and proper error handling
 */

import { apiConfig } from '../config/app';
import { auth } from './firebase';

// API client with authentication
class ApiClient {
  private baseUrl: string;
  private timeout: number;

  constructor() {
    this.baseUrl = apiConfig.baseUrl;
    this.timeout = apiConfig.timeout;
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const user = auth.currentUser;
    if (user) {
      try {
        const token = await user.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
      } catch (error) {
        console.warn('Failed to get auth token:', error);
      }
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }

      throw error;
    }
  }

  // GET request
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  // POST request
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT request
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // PATCH request
  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

// Export singleton instance
export const api = new ApiClient();

// Specific API methods
export const authApi = {
  findUser: (email?: string, phoneNumber?: string) =>
    api.post('/auth/find-user', { email, phoneNumber }),

  createProfile: (uid: string, name: string, email?: string, phoneNumber?: string, isGuest?: boolean) =>
    api.post('/auth/create-profile', { uid, name, email, phoneNumber, isGuest }),
};

export const shopsApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return api.get(`/shops${query}`);
  },

  getById: (id: string, type?: string) => {
    const query = type ? `?type=${type}` : '';
    return api.get(`/shops/${id}${query}`);
  },
};

export const searchApi = {
  suggestions: (query: string) =>
    api.get(`/search/suggestions?q=${encodeURIComponent(query)}`),

  universal: (query: string, lat?: number, lng?: number) => {
    const params = new URLSearchParams({ q: query });
    if (lat && lng) {
      params.append('lat', lat.toString());
      params.append('lng', lng.toString());
    }
    return api.get(`/search/universal?${params.toString()}`);
  },

  didYouMean: (query: string) =>
    api.get(`/search/did-you-mean?q=${encodeURIComponent(query)}`),
};

export const itemsApi = {
  getByShop: (shopId: string, type?: string) => {
    const query = type ? `?type=${type}` : '';
    return api.get(`/items/shop/${shopId}${query}`);
  },

  search: (shopId: string, query: string, type?: string) => {
    const params = new URLSearchParams({ q: query });
    if (type) params.append('type', type);
    return api.get(`/items/shop/${shopId}/search/${encodeURIComponent(query)}?${params.toString()}`);
  },

  globalSearch: (query: string, type?: string) => {
    const params = new URLSearchParams({ q: query });
    if (type) params.append('type', type);
    return api.get(`/items/search/${encodeURIComponent(query)}?${params.toString()}`);
  },
};

export const ratingsApi = {
  addShopRating: (shopId: string, userId: string, userName: string, rating: number, review?: string) =>
    api.post(`/ratings/shops/${shopId}`, { userId, userName, rating, review }),

  getShopRatings: (shopId: string, limit?: number) => {
    const query = limit ? `?limit=${limit}` : '';
    return api.get(`/ratings/shops/${shopId}${query}`);
  },

  getUserRating: (shopId: string, userId: string) =>
    api.get(`/ratings/shops/${shopId}/user/${userId}`),

  markHelpful: (shopId: string, reviewId: string) =>
    api.post(`/ratings/shops/${shopId}/reviews/${reviewId}/helpful`),
};

export const feedbackApi = {
  submit: (data: any) =>
    api.post('/feedback', data),

  getUserFeedback: (userId: string) =>
    api.get(`/feedback/user/${userId}`),

  // Admin feedback methods
  getAllFeedback: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return api.get(`/feedback/admin/all${query}`);
  },

  getFeedbackStats: () =>
    api.get('/feedback/admin/stats'),

  updateFeedbackStatus: (feedbackId: string, status: string, adminNotes?: string) =>
    api.patch(`/feedback/admin/${feedbackId}`, { status, adminNotes }),
};

// User role API (replaces frontend admin checks)
export const userApi = {
  getRole: () =>
    api.get('/auth/user/role'),

  getProfile: () =>
    api.get('/auth/user/profile'),

  updateProfile: (data: any) =>
    api.put('/auth/user/profile', data),
};

// Festival API
export const festivalApi = {
  getActive: () =>
    api.get('/festival/active'),

  getAll: () =>
    api.get('/festival/all'),

  getById: (id: string) =>
    api.get(`/festival/${id}`),

  create: (data: any) =>
    api.post('/festival/create', data),

  update: (id: string, data: any) =>
    api.put(`/festival/${id}`, data),

  delete: (id: string) =>
    api.delete(`/festival/${id}`),

  toggle: (id: string) =>
    api.patch(`/festival/${id}/toggle`),

  getAssets: (festivalId: string) =>
    api.get(`/festival/festivals/${festivalId}/assets`),

  uploadAsset: (data: any) =>
    api.post('/festival/assets/upload', data),

  completeAssetUpload: (assetId: string, data: any) =>
    api.post(`/festival/assets/${assetId}/complete`, data),
};

// Admin API (only accessible with proper backend validation)
export const adminApi = {
  getStatus: () =>
    api.get('/admin/status'),

  getAnalytics: () =>
    api.get('/admin/analytics'),

  // Shop management
  addShop: (data: any) =>
    api.post('/admin/shops', data),

  updateShop: (id: string, data: any) =>
    api.put(`/admin/shops/${id}`, data),

  deleteShop: (id: string) =>
    api.delete(`/admin/shops/${id}`),

  // Item management
  addItem: (shopId: string, data: any) =>
    api.post(`/items/shop/${shopId}`, data),

  updateItem: (shopId: string, itemId: string, data: any) =>
    api.put(`/items/shop/${shopId}/item/${itemId}`, data),

  deleteItem: (shopId: string, itemId: string) =>
    api.delete(`/items/shop/${shopId}/item/${itemId}`),

  bulkAddItems: (shopId: string, items: any[]) =>
    api.post(`/items/shop/${shopId}/bulk`, { items }),
};