import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, Shield, Users, AlertCircle, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TermsPage: React.FC = () => {
  const navigate = useNavigate();

  const sections = [
    {
      title: 'Acceptance of Terms',
      content: 'By accessing and using SamanKhojo, you agree to these Terms & Conditions and all policies referenced here. If you do not agree, please do not use the Service.'
    },
    {
      title: 'Use License',
      content: 'Permission is granted to access and use SamanKhojo for personal, non-commercial purposes, subject to these Terms.'
    },
    {
      title: 'User Accounts',
      content: 'You are responsible for safeguarding your account credentials and for all activities that occur under your account.'
    },
    {
      title: 'Privacy Policy',
      content: 'Your use of the Service is also governed by our Privacy Policy. Please review it to understand how we handle your information.'
    },
    {
      title: 'WhatsApp Business & Cloud API',
      content: 'We use WhatsApp Business services (including the Cloud API hosted by Meta) to provide automated and human-assisted messaging. By opting in, you understand that messages may be processed and transmitted via WhatsApp/Meta infrastructure. Your use of WhatsApp features on our Service is subject to WhatsApp Business Terms, the WhatsApp Business Messaging Policy, and Meta hosting terms. You must provide accurate contact information and use our WhatsApp channel only for permitted purposes.'
    },
    {
      title: 'Consent, Opt‑in & Opt‑out Controls',
      content: 'We will only send you business‑initiated messages on WhatsApp after you give explicit opt‑in consent. You can withdraw consent at any time by replying with STOP or UNSUBSCRIBE in WhatsApp, or by contacting us through our support channel. We will honor opt‑out requests promptly and stop sending business‑initiated messages except for required service notices (e.g., security or transactional updates when legally permissible).'
    },
    {
      title: 'Permitted Message Types & Templates',
      content: 'Certain outbound messages require pre‑approved WhatsApp templates. We will only use templates for the stated purposes (e.g., updates, alerts, reminders) and will not send prohibited content. Promotional or marketing messages will be sent only where allowed and in accordance with your consent settings.'
    },
    {
      title: 'Prohibited Uses',
      content: 'You may not use our Service or WhatsApp channel for illegal activities, spam, harassment, misrepresentation, harmful or deceptive practices, or content that violates WhatsApp policies (including restricted or illegal products/services). We may suspend or terminate access for violations.'
    },
    {
      title: 'Third‑Party Services & Fees',
      content: 'Our WhatsApp features rely on third‑party services provided by WhatsApp LLC/Meta. Message delivery or availability is not guaranteed and may be subject to carrier or platform limitations. Standard data or carrier fees may apply.'
    },
    {
      title: 'Data Processing & International Transfers',
      content: 'To deliver WhatsApp features, personal data (such as phone number, message content, and metadata) may be processed by WhatsApp/Meta as our processor or service provider and may be transferred to and stored in countries outside your own. See our Privacy Policy for details.'
    },
    {
      title: 'Disclaimer & Limitation of Liability',
      content: 'Platform Role Only: We act solely as a connector between users and shopkeepers. We do not own, endorse, or guarantee any items, services, prices, availability, or representations listed on our platform. All interactions, bookings, or transactions are conducted directly between you and the shopkeeper; we bear no responsibility. No Warranties or Guarantees: All content and services are provided on an "as-is, as-available" basis with no warranties, express or implied, including accuracy, merchantability, or fitness for purpose. Accuracy & Reliability: While we aim for accuracy, we do not guarantee that item descriptions, pricing, or availability are complete or current. Use is at your own risk. No Liability for Third-Party Actions: We shall not be liable for any damages—direct, indirect, incidental, or consequential—arising from your use of the platform, your interactions with shopkeepers, or reliance on information provided. Use of Your Data for Improvement: With your consent, we may use anonymized or aggregated data to enhance our service. We do not sell your personal data or share it in violation of our Privacy Policy. Handling Complaints: Any issues or complaints regarding products or services must be resolved directly with the shopkeeper. We are not responsible for third-party content or actions.'
    },
    {
      title: 'Termination',
      content: 'We may suspend or terminate your account or WhatsApp messaging access immediately if you breach these Terms, applicable law, or WhatsApp policies.'
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
            <h1 className="text-xl font-bold text-gray-900">Terms & Conditions</h1>
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
          <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <FileText className="text-white" size={24} />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Terms & Conditions</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Please read these terms carefully before using SamanKhojo.
          </p>
        </motion.div>

        {/* Last Updated */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center"
        >
          <div className="flex items-center justify-center space-x-2 text-blue-700">
            <AlertCircle size={16} />
            <span className="text-sm font-medium">Last updated: September 2025</span>
          </div>
        </motion.div>

        {/* Terms Sections */}
        <div className="space-y-6">
          {sections.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.05 }}
              className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-lg"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                {index === 4 && <Shield size={18} className="text-teal-600" />}
                {index === 5 && <MessageCircle size={18} className="text-green-600" />}
                {index === 6 && <FileText size={18} className="text-indigo-600" />}
                {index === 7 && <Users size={18} className="text-rose-600" />}
                {index === 10 && <AlertCircle size={18} className="text-amber-600" />}
                {section.title}
              </h3>
              <p className="text-gray-700 leading-relaxed">{section.content}</p>
            </motion.div>
          ))}
        </div>

        {/* Contact Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 text-white text-center shadow-2xl"
        >
          <h3 className="text-xl font-bold mb-4">Questions About Our Terms?</h3>
          <p className="text-blue-100 mb-6">
            If you have any questions about these Terms & Conditions, including WhatsApp messaging, please contact us.
          </p>
          <button
            onClick={() => navigate('/contact')}
            className="bg-white text-blue-600 px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors font-medium shadow-lg"
          >
            Contact Support
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default TermsPage;