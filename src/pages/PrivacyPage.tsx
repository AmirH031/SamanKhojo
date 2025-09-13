import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Lock, Eye, Database, AlertCircle, Globe, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PrivacyPage: React.FC = () => {
  const navigate = useNavigate();

  const sections = [
    {
      icon: Database,
      title: 'Information We Collect',
      content: 'We collect information you provide (account details, contact info, preferences, WhatsApp opt‑in status), content you submit (messages to us), and technical data (device, log, and usage information). For WhatsApp features, we collect your phone number and messaging preferences.'
    },
    {
      icon: Eye,
      title: 'How We Use Your Information',
      content: 'To provide and improve our services, personalize experiences, send permitted WhatsApp messages (after opt‑in), process transactions, provide support, and ensure safety and integrity. For business‑initiated WhatsApp messages, we rely on your consent; for service or security notices, we may rely on legitimate interests or legal obligations as applicable. With your consent, we may use anonymized or aggregated data to enhance our service quality and user experience. We do not sell your personal data or share it in violation of this Privacy Policy.'
    },
    {
      icon: Shield,
      title: 'Information Sharing',
      content: 'We do not sell your personal information. To deliver WhatsApp features, we share certain data (e.g., your phone number, message templates, metadata) with WhatsApp LLC/Meta as our service provider/processor. We may share data with vendors that help us operate our services, subject to confidentiality and data protection commitments, or when required by law.'
    },
    {
      icon: Lock,
      title: 'Data Security',
      content: 'We implement appropriate technical and organizational measures to protect your data. WhatsApp provides transport security and end‑to‑end encryption for personal chats; however, business messaging and template processing may involve Meta/WhatsApp servers as part of service delivery. No method of transmission or storage is 100% secure.'
    },
    {
      icon: Globe,
      title: 'International Transfers',
      content: 'Your information may be transferred to, stored, and processed in countries other than your own (including the United States and other jurisdictions where WhatsApp/Meta or our providers operate). Where required, we use appropriate safeguards for such transfers.'
    },
    {
      icon: Phone,
      title: 'Your Choices: Opt‑in & Opt‑out',
      content: 'We only send business‑initiated WhatsApp messages after your explicit opt‑in. You can opt out at any time by replying STOP or UNSUBSCRIBE in WhatsApp, or by contacting support. We will promptly honor your request.'
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
            <h1 className="text-xl font-bold text-gray-900">Privacy Policy</h1>
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
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Shield className="text-white" size={24} />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Privacy Policy</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Your privacy is important to us. This policy explains how we collect, use, and protect your information, including when you use our WhatsApp channel.
          </p>
        </motion.div>

        {/* Last Updated */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-purple-50 border border-purple-200 rounded-2xl p-4 text-center"
        >
          <div className="flex items-center justify-center space-x-2 text-purple-700">
            <AlertCircle size={16} />
            <span className="text-sm font-medium">Last updated: September 2025</span>
          </div>
        </motion.div>

        {/* Privacy Sections */}
        <div className="space-y-6">
          {sections.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.05 }}
              className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-lg"
            >
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center shadow-sm">
                  <section.icon className="text-purple-600" size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">{section.title}</h3>
                  <p className="text-gray-700 leading-relaxed">{section.content}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Data Rights */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-lg"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Data Rights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Access your personal data</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Correct inaccurate data</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Request deletion</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Data portability</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Withdraw consent / opt‑out</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Lodge complaints</span>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-4">
            Contact us via the in‑app Contact page to exercise your rights. We may require verification before acting on your request.
          </p>
        </motion.div>

        {/* Contact Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-8 text-white text-center shadow-2xl"
        >
          <h3 className="text-xl font-bold mb-4">Privacy Questions?</h3>
          <p className="text-purple-100 mb-6">
            If you have any questions about this Privacy Policy or WhatsApp messaging, please contact us.
          </p>
          <button
            onClick={() => navigate('/contact')}
            className="bg-white text-purple-600 px-6 py-3 rounded-xl hover:bg-purple-50 transition-colors font-medium shadow-lg"
          >
            Contact Us
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default PrivacyPage;