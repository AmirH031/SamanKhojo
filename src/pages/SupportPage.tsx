import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, MessageCircle, Phone, Mail, Clock, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SupportPage: React.FC = () => {
  const navigate = useNavigate();

  const supportOptions = [
    {
      icon: MessageCircle,
      title: 'WhatsApp Support',
      description: 'Get instant help via WhatsApp',
      action: 'Chat Now',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      href: 'https://wa.me/919876543210?text=Hello%20SamanKhojo%20Support'
    },
    {
      icon: Mail,
      title: 'Email Support',
      description: 'Send us your queries via email',
      action: 'Send Email',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      href: 'mailto:support@samankhojo.com'
    }
  ];

  const faqItems = [
    {
      question: 'How do I book items from a shop?',
      answer: 'Browse shops, select items, add to bag, and contact them. The shop will confirm availability and you can coordinate pickup directly with them.'
    },
    {
      question: 'Do you deliver products?',
      answer: 'No, we don\'t deliver products. SamanKhojo helps you find shops and products, and book them for pickup. You need to collect items directly from the shop.'
    },
    {
      question: 'How can I track my booking?',
      answer: 'Once your booking is confirmed, you will receive updates via WhatsApp. You can also check your booking history in the app.'
    },
    {
      question: 'What if I want to cancel my booking?',
      answer: 'You can cancel your booking before pickup. Contact the shop directly via WhatsApp or reach out to our support team.'
    },
    {
      question: 'How do I find shops near me?',
      answer: 'Use our location-based search to find shops nearby. You can also search by shop name, product, or category.'
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
            <h1 className="text-xl font-bold text-gray-900">Help & Support</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Support Options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-md rounded-3xl p-4 md:p-6 border border-white/20 shadow-xl"
        >
          <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4">Get Help</h2>
          <div className="space-y-3">
            {supportOptions.map((option, index) => (
              <motion.a
                key={option.title}
                href={option.href}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ x: 5 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center justify-between p-3 md:p-4 rounded-2xl hover:bg-gray-50/80 transition-all group border border-gray-100"
              >
                <div className="flex items-center space-x-3 md:space-x-4">
                  <div className={`w-10 h-10 md:w-12 md:h-12 ${option.bgColor} rounded-2xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow`}>
                    <option.icon className={option.color} size={18} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm md:text-base">{option.title}</h3>
                    <p className="text-xs md:text-sm text-gray-600">{option.description}</p>
                  </div>
                </div>
                <span className="text-xs md:text-sm font-medium text-blue-600 bg-blue-50 px-2 md:px-3 py-1 rounded-full">
                  {option.action}
                </span>
              </motion.a>
            ))}
          </div>
        </motion.div>

        {/* Support Hours */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 backdrop-blur-md rounded-3xl p-4 md:p-6 border border-white/20 shadow-xl"
        >
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-orange-50 rounded-2xl flex items-center justify-center">
              <Clock className="text-orange-600" size={18} />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Support Hours</h2>
          </div>
          <div className="space-y-2 text-sm md:text-base">
            <div className="flex justify-between">
              <span className="text-gray-600">Monday - Saturday</span>
              <span className="font-medium text-gray-900">9:00 AM - 9:00 PM</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Sunday</span>
              <span className="font-medium text-gray-900">10:00 AM - 6:00 PM</span>
            </div>
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/80 backdrop-blur-md rounded-3xl p-4 md:p-6 border border-white/20 shadow-xl"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center">
              <HelpCircle className="text-indigo-600" size={18} />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-4">
            {faqItems.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0"
              >
                <h3 className="font-semibold text-gray-900 mb-2 text-sm md:text-base">{faq.question}</h3>
                <p className="text-gray-600 text-xs md:text-sm leading-relaxed">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Office Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/80 backdrop-blur-md rounded-3xl p-4 md:p-6 border border-white/20 shadow-xl"
        >
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-red-50 rounded-2xl flex items-center justify-center">
              <Mail className="text-red-600" size={18} />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Contact Information</h2>
          </div>
          <div className="text-gray-600 space-y-2 text-sm md:text-base">
            <p className="font-medium">SamanKhojo Technologies</p>
            <p>Bhanpura, Madhya Pradesh, India</p>
            <p className="text-xs md:text-sm">
              Business Hours: Monday - Saturday, 9:00 AM - 6:00 PM IST
            </p>
            <p className="text-xs md:text-sm text-blue-600">
              Response time: Usually within 2-4 hours
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SupportPage;