import React from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Search, 
  MessageCircle, 
  Star, 
  ShoppingCart,
  MapPin,
  Phone,
  CheckCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HowToUsePage: React.FC = () => {
  const navigate = useNavigate();

  const steps = [
    {
      icon: Search,
      title: 'Search for Items',
      description: 'Type what you need in Hindi, English, or mixed language. Our AI understands natural queries like "1kg aata chahiye".',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: MapPin,
      title: 'Find Nearby Shops',
      description: 'Browse shops near your location. View shop details, timings, and available items.',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: ShoppingCart,
      title: 'Add to Bag',
      description: 'Add items from multiple shops to your bag. Review your selections before contacting.',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      icon: MessageCircle,
      title: 'Book via WhatsApp',
      description: 'Send your booking to shops via WhatsApp. Shop owners will confirm availability and pricing.',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      icon: Phone,
      title: 'Get Confirmation',
      description: 'Receive confirmation from shop owners. Coordinate pickup time and details directly with them.',
      color: 'text-teal-600',
      bgColor: 'bg-teal-50'
    },
    {
      icon: Star,
      title: 'Rate & Review',
      description: 'After your experience, rate the shop and leave a review to help other customers.',
      color: 'text-pink-600',
      bgColor: 'bg-pink-50'
    }
  ];

  const tips = [
    {
      title: 'Use Natural Language',
      description: 'Search like you would ask a friend: "Kya tumhare paas sugar hai?" or "Need 2kg rice"'
    },
    {
      title: 'Check Shop Timings',
      description: 'Always verify shop opening hours before visiting or calling'
    },
    {
      title: 'Save Favorites',
      description: 'Add frequently visited shops to your favorites for quick access'
    },
    {
      title: 'Leave Reviews',
      description: 'Help the community by sharing your experience with local shops'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-xl border-b border-gray-200/50 z-40 shadow-sm">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-700" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">How to Use</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <CheckCircle className="text-white" size={24} />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">How to Use SamanKhojo</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Follow these simple steps to discover local shops and book items effortlessly.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="space-y-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className={`flex items-center space-x-6 ${
                index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'
              }`}
            >
              <div className="flex-1">
                <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-lg">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="text-2xl font-bold text-gray-400">
                      {String(index + 1).padStart(2, '0')}
                    </div>
                    <div className={`w-12 h-12 ${step.bgColor} rounded-xl flex items-center justify-center shadow-sm`}>
                      <step.icon className={step.color} size={20} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">{step.title}</h3>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{step.description}</p>
                </div>
              </div>
              
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block w-px h-16 bg-gradient-to-b from-gray-300 to-transparent"></div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Tips Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white/80 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-xl"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">💡 Pro Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tips.map((tip, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + index * 0.1 }}
                className="flex items-start space-x-3 p-4 rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-100"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="text-white" size={16} />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">{tip.title}</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">{tip.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="text-center"
        >
          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-3xl p-8 text-white shadow-2xl">
            <h3 className="text-2xl font-bold mb-4">Ready to Start?</h3>
            <p className="text-orange-100 mb-6">
              Now that you know how it works, start exploring local shops in your area!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/')}
                className="bg-white text-orange-600 px-6 py-3 rounded-xl hover:bg-orange-50 transition-colors font-medium shadow-lg"
              >
                Start Exploring
              </button>
              <button
                onClick={() => navigate('/shops')}
                className="bg-white/20 text-white px-6 py-3 rounded-xl hover:bg-white/30 transition-colors font-medium border border-white/30"
              >
                Browse Shops
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default HowToUsePage;