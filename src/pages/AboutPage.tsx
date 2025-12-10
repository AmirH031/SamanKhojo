import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Heart, Target, Award, Smartphone, Globe, ShieldCheck, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AboutPage: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: MapPin,
      title: 'Local Discovery',
      description: 'Find nearby shops and services instantly with AI‑powered location‑based search.',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: Smartphone,
      title: 'WhatsApp Integration',
      description: 'Connect with us on WhatsApp to start chatting. You can reply STOP at any time to unsubscribe. We use approved templates and follow WhatsApp Business policies.',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: Globe,
      title: 'Multilingual Support',
      description: 'Search in Hindi, English, or mixed languages with intelligent AI understanding.',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      icon: ShieldCheck,
      title: 'Verified Shops',
      description: 'All shops are verified for authenticity and quality service standards.',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  const values = [
    {
      icon: Target,
      title: 'Our Mission',
      description: 'To bridge the gap between local businesses and customers through technology, making local shopping accessible and convenient for everyone.'
    },
    {
      icon: Heart,
      title: 'Our Values',
      description: 'We support local businesses, build community connections, and provide trustworthy service with privacy‑first messaging.'
    },
    {
      icon: Award,
      title: 'Our Vision',
      description: "To become India's most trusted platform for local business discovery, empowering small businesses and enriching local communities."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 mobile-safe-area">
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
            <h1 className="text-xl font-bold text-gray-900">About Us</h1>
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
          <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <MessageCircle className="text-white" size={28} />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Welcome to <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">SamanKhojo</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Your trusted companion for discovering local shops and services. We connect you with businesses through privacy‑first, opt‑in WhatsApp conversations.
          </p>
        </motion.div>

        {/* What We Do */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-xl"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">What We Do</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="flex items-start space-x-4 p-4 rounded-2xl hover:bg-gray-50/80 transition-all"
              >
                <div className={`w-12 h-12 ${feature.bgColor} rounded-2xl flex items-center justify-center shadow-sm`}>
                  <feature.icon className={feature.color} size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">{feature.title}</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Mission, Values, Vision */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {values.map((value, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-white/20 shadow-xl text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <value.icon className="text-white" size={24} />
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-3">{value.title}</h4>
              <p className="text-gray-600 text-sm leading-relaxed">{value.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Company Info */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl p-8 border border-blue-200"
        >
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Story</h3>
            <p className="text-gray-700 leading-relaxed max-w-3xl mx-auto">
              SamanKhojo was born from the belief that discovering local shops should be simple and privacy-friendly. By combining AI with WhatsApp, we create a consent-based connection between customers and local entrepreneurs. You’re always in control of your messaging preferences.
            </p>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { number: '500+', label: 'Local Shops' },
            { number: '10K+', label: 'Happy Users' },
            { number: '50+', label: 'Cities' },
            { number: '24/7', label: 'Support' }
          ].map((stat, index) => (
            <div key={index} className="bg-white/80 backdrop-blur-md rounded-2xl p-6 text-center border border-white/20 shadow-lg">
              <div className="text-2xl font-bold text-blue-600 mb-1">{stat.number}</div>
              <div className="text-gray-600 text-sm">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-center"
        >
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 text-white shadow-2xl">
            <h3 className="text-2xl font-bold mb-4">Ready to Explore?</h3>
            <p className="text-blue-100 mb-6">
              “Join thousands who trust SamanKhojo. Receive WhatsApp updates or chat with us anytime—reply STOP to unsubscribe..
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/')}
                className="bg-white text-blue-600 px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors font-medium shadow-lg"
              >
                Start Exploring
              </button>
              <button
                onClick={() => navigate('/support')}
                className="bg-white/20 text-white px-6 py-3 rounded-xl hover:bg-white/30 transition-colors font-medium border border-white/30"
              >
                Get Support
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AboutPage;