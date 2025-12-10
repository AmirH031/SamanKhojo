import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MessageCircle, MapPin, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ContactPage: React.FC = () => {
  const navigate = useNavigate();

  const contactMethods = [
    {
      icon: Mail,
      title: 'Email Support',
      description: 'Get help via email',
      action: 'mailto:support@samankhojo.com',
      label: 'support@samankhojo.com',
      color: 'bg-blue-500'
    },
    {
      icon: MessageCircle,
      title: 'WhatsApp',
      description: 'Chat on WhatsApp',
      action: 'https://wa.me/919876543210?text=Hello%20SamanKhojo%20Support',
      label: 'Chat Now',
      color: 'bg-green-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 mobile-safe-area">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
          
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Contact Us
          </h1>
          <p className="text-gray-600">
            We're here to help! Reach out to us anytime.
          </p>
        </motion.div>

        {/* Contact Methods */}
        <div className="space-y-4 mb-8">
          {contactMethods.map((method, index) => (
            <motion.a
              key={index}
              href={method.action}
              target={method.action.startsWith('http') ? '_blank' : undefined}
              rel={method.action.startsWith('http') ? 'noopener noreferrer' : undefined}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="block bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all"
            >
              <div className="flex items-center space-x-4">
                <div className={`${method.color} p-3 rounded-xl`}>
                  <method.icon className="text-white" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {method.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-2">
                    {method.description}
                  </p>
                  <p className="text-blue-600 font-medium">
                    {method.label}
                  </p>
                </div>
              </div>
            </motion.a>
          ))}
        </div>

        {/* Office Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-lg"
        >
          <div className="flex items-center space-x-3 mb-4">
            <MapPin className="text-red-500" size={24} />
            <h3 className="text-lg font-semibold text-gray-900">Our Office</h3>
          </div>
          
          <div className="text-gray-600 space-y-2">
            <p>SamanKhojo Technologies</p>
            <p>Bhanpura, Madhya Pradesh, India</p>
            <p className="text-sm">
              Business Hours: Monday - Saturday, 9:00 AM - 6:00 PM IST
            </p>
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 bg-blue-50 rounded-2xl p-6 border border-blue-200"
        >
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            Frequently Asked Questions
          </h3>
          
          <div className="space-y-3 text-sm">
            <div>
              <h4 className="font-medium text-blue-800 mb-1">
                How do I book items from shops?
              </h4>
              <p className="text-blue-700">
                Search for items, select a shop, and click "Book Now" to send your request via WhatsApp.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-blue-800 mb-1">
                Is my phone number safe?
              </h4>
              <p className="text-blue-700">
                Yes, we use Firebase Authentication and never share your personal information with third parties.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-blue-800 mb-1">
                How do I add my shop to SamanKhojo?
              </h4>
              <p className="text-blue-700">
                Contact us via email or WhatsApp, and our team will help you register your shop.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ContactPage;