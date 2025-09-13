import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  Star, 
  AlertCircle, 
  Bug, 
  Lightbulb, 
  Filter,
  Calendar,
  User,
  Mail,
  ExternalLink
} from 'lucide-react';
import { api } from '../../services/api';

interface Feedback {
  id: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  type: 'suggestion' | 'complaint' | 'bug' | 'feature' | 'general';
  category: 'website' | 'shops' | 'search' | 'booking' | 'performance' | 'other';
  subject: string;
  message: string;
  rating?: number;
  status: 'pending' | 'reviewed' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  updatedAt?: string;
  adminNotes?: string;
  userAgent?: string;
  url?: string;
}

interface FeedbackStats {
  total: number;
  byType: Record<string, number>;
  byCategory: Record<string, number>;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  averageRating: number;
}

const FeedbackDashboard: React.FC = () => {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    status: '',
    type: '',
    category: '',
    priority: ''
  });

  useEffect(() => {
    fetchFeedback();
    fetchStats();
  }, [filter]);

  const fetchFeedback = async () => {
    try {
      const params = new URLSearchParams();
      if (filter.status) params.append('status', filter.status);
      if (filter.type) params.append('type', filter.type);
      if (filter.category) params.append('category', filter.category);
      
      const queryString = params.toString();
      const endpoint = queryString ? `/feedback/admin/all?${queryString}` : '/feedback/admin/all';
      
      const response = await api.get<{ success: boolean; feedback: Feedback[] }>(endpoint);
      
      if (response.success) {
        setFeedback(response.feedback);
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
      setFeedback([]);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get<{ success: boolean; stats: FeedbackStats }>('/feedback/admin/stats');
      
      if (response.success) {
        setStats(response.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFeedbackStatus = async (feedbackId: string, status: string, adminNotes?: string) => {
    try {
      await api.patch(`/feedback/admin/${feedbackId}`, { status, adminNotes });
      fetchFeedback();
      fetchStats();
    } catch (error) {
      console.error('Error updating feedback:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'suggestion': return <Lightbulb size={16} className="text-yellow-600" />;
      case 'complaint': return <AlertCircle size={16} className="text-red-600" />;
      case 'bug': return <Bug size={16} className="text-orange-600" />;
      case 'feature': return <Star size={16} className="text-blue-600" />;
      default: return <MessageSquare size={16} className="text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Feedback</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <MessageSquare className="text-blue-600" size={24} />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.averageRating.toFixed(1)}
                </p>
              </div>
              <Star className="text-yellow-600" size={24} />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.byStatus.pending || 0}
                </p>
              </div>
              <AlertCircle className="text-orange-600" size={24} />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.byStatus.resolved || 0}
                </p>
              </div>
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-green-600 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <div className="flex items-center space-x-2 mb-4">
          <Filter size={20} className="text-gray-600" />
          <h3 className="font-semibold text-gray-900">Filters</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          <select
            value={filter.type}
            onChange={(e) => setFilter({ ...filter, type: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            <option value="suggestion">Suggestion</option>
            <option value="complaint">Complaint</option>
            <option value="bug">Bug Report</option>
            <option value="feature">Feature Request</option>
            <option value="general">General</option>
          </select>

          <select
            value={filter.category}
            onChange={(e) => setFilter({ ...filter, category: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            <option value="website">Website</option>
            <option value="shops">Shops</option>
            <option value="search">Search</option>
            <option value="booking">Booking</option>
            <option value="performance">Performance</option>
            <option value="other">Other</option>
          </select>

          <button
            onClick={() => setFilter({ status: '', type: '', category: '', priority: '' })}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Feedback List */}
      <div className="space-y-4">
        {feedback.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start space-x-3">
                {getTypeIcon(item.type)}
                <div>
                  <h4 className="font-semibold text-gray-900">{item.subject}</h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                      {item.priority}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                    <span className="text-xs text-gray-500">{item.category}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {item.rating && (
                  <div className="flex items-center space-x-1">
                    <Star size={14} className="text-yellow-500 fill-current" />
                    <span className="text-sm text-gray-600">{item.rating}</span>
                  </div>
                )}
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <Calendar size={12} />
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <p className="text-gray-700 mb-4">{item.message}</p>

            {/* User Info */}
            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3 mb-4">
              <div className="flex items-center space-x-3">
                <User size={16} className="text-gray-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {item.userName || 'Anonymous'}
                  </p>
                  {item.userEmail && (
                    <div className="flex items-center space-x-1">
                      <Mail size={12} className="text-gray-500" />
                      <p className="text-xs text-gray-600">{item.userEmail}</p>
                    </div>
                  )}
                </div>
              </div>
              
              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800"
                >
                  <ExternalLink size={12} />
                  <span>View Page</span>
                </a>
              )}
            </div>

            {/* Admin Actions */}
            <div className="flex items-center space-x-2">
              <select
                value={item.status}
                onChange={(e) => updateFeedbackStatus(item.id, e.target.value)}
                className="px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="reviewed">Reviewed</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </motion.div>
        ))}

        {feedback.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No feedback found</h3>
            <p className="text-gray-600">
              {Object.values(filter).some(v => v) 
                ? 'Try adjusting your filters' 
                : 'No feedback has been submitted yet'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackDashboard;