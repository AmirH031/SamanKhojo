import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, Shield, AlertCircle, MessageCircle, Lock, Eye, Database, Globe, Phone, Scale, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TermsPrivacyPage: React.FC = () => {
  const navigate = useNavigate();

  const termsSection = [
    {
      title: 'Acceptance of Terms',
      content: 'By accessing and using SamanKhojo, you agree to these Terms & Conditions and Privacy Policy. If you do not agree, please do not use the Service.'
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
      title: 'User Responsibilities',
      content: 'Users must ensure that any communication or transaction with shopkeepers or government offices through SamanKhojo is conducted lawfully and respectfully. SamanKhojo does not guarantee product quality, pricing accuracy, or availability and is not liable for personal disputes, fraud, or losses arising from third-party dealings. Users may report suspicious listings or behavior using the in-app report tools or WhatsApp support. SamanKhojo may, at its discretion, review such reports and take appropriate actions, but is not obligated to mediate or resolve disputes.'
    },
    {
      title: 'No Service Fees',
      content: 'We do not charge users any fees for accessing or using our platform. SamanKhojo is free for all users to discover and connect with local shops.'
    },
    {
      title: 'Platform Role & Limitation of Liability',
      content: 'SamanKhojo operates as an online intermediary and discovery platform under the Information Technology Act, 2000. We do not control or participate in any transactions between users, shops, or government offices. We shall not be liable for any loss, damage, fraud, delay, or misrepresentation caused by third parties listed on our platform. In no event shall SamanKhojo or its affiliates be liable for any indirect, incidental, or consequential damages.'
    },
    {
      title: 'Shopkeeper & Vendor Responsibilities',
      content: 'All shop owners or service providers listed on SamanKhojo must provide accurate business information, pricing, and availability. They are solely responsible for compliance with applicable laws (including taxation, licensing, and consumer protection). SamanKhojo does not verify or guarantee continuous compliance and is not responsible for misrepresentation, fraud, or loss resulting from vendor activities.'
    },
    {
      title: 'Government Offices & Public Services',
      content: 'SamanKhojo may display publicly available information about government offices, departments, or public service centers solely for user convenience. We are not affiliated with, endorsed by, or officially connected to any government entity unless explicitly stated. Information regarding government offices (timings, addresses, contacts) is based on publicly available data and may not always be up to date. Users should verify details from the official government sources before relying on them.'
    },
    {
      title: 'WhatsApp Business & Cloud API',
      content: 'We use WhatsApp Business services (including the Cloud API hosted by Meta) to provide automated and human-assisted messaging. By opting in, you understand that messages may be processed and transmitted via WhatsApp/Meta infrastructure. Your use of WhatsApp features on our Service is subject to WhatsApp Business Terms, the WhatsApp Business Messaging Policy, and Meta hosting terms. By engaging with our WhatsApp channel, you also agree to WhatsApp\'s own Privacy Policy and Terms of Service. For details on how we handle your WhatsApp data, please refer to our Privacy Policy section below.'
    },
    {
      title: 'Consent, Opt‑in & Opt‑out Controls',
      content: 'We will only send you business‑initiated messages on WhatsApp after you give explicit opt‑in consent. You can withdraw consent at any time by replying with STOP or UNSUBSCRIBE in WhatsApp, or by contacting us through our support channel. Your opt-in/opt-out preferences are handled as described in our Privacy Policy section regarding "Your Choices: Opt‑in & Opt‑out".'
    },
    {
      title: 'Shop Timings & Data Disclaimer',
      content: 'Shop timings and data may vary due to seasonal demand, availability, and external factors. Information displayed on our platform is approximate and for reference purposes only. For the most accurate details regarding shop hours, product availability, and pricing, we recommend contacting the shopkeeper directly through the provided contact methods.'
    },
    {
      title: 'Prohibited Uses',
      content: 'You may not use our Service or WhatsApp channel for illegal activities, spam, harassment, misrepresentation, harmful or deceptive practices, or content that violates WhatsApp policies.'
    },
    {
      title: 'Legal Cooperation',
      content: 'SamanKhojo complies with lawful requests and may share limited user or vendor data with law enforcement or government agencies when required by applicable law, court order, or valid legal process. We ensure that such disclosures are minimal and consistent with user privacy rights.'
    },
    {
      title: 'Disclaimer & Limitation of Liability',
      content: 'Platform Role Only: We act solely as a connector between users and shopkeepers. We do not own, endorse, or guarantee any items, services, prices, availability, or representations listed on our platform. All interactions, bookings, or transactions are conducted directly between you and the shopkeeper; we bear no responsibility. No Warranties or Guarantees: All content and services are provided on an "as-is, as-available" basis with no warranties, express or implied.'
    },
    {
      title: 'Termination',
      content: 'We may suspend or terminate your account or WhatsApp messaging access immediately if you breach these Terms, applicable law, or WhatsApp policies.'
    },
    {
      title: 'Governing Law',
      content: 'These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts in Madhya Pradesh, India.'
    },
    {
      title: 'Disclaimer of Disputes and Fraud',
      content: 'SamanKhojo does not mediate or resolve disputes between users, shops, or any listed third party. We are not responsible for any fraudulent activity, miscommunication, or monetary loss resulting from user-to-shop, user-to-office, or user-to-user interactions. All parties are encouraged to exercise due diligence and report unlawful activities to appropriate authorities.'
    }
  ];

  const privacySections = [
    {
      icon: Database,
      title: 'Information We Collect',
      content: 'We collect information you provide (account details, contact info, preferences, WhatsApp opt‑in status), content you submit (messages to us), and technical data (device, log, and usage information). For WhatsApp features, we collect your phone number and messaging preferences as outlined in our Terms & Conditions regarding WhatsApp Business & Cloud API usage.'
    },
    {
      icon: Eye,
      title: 'How We Use Your Information',
      content: 'To provide and improve our services, personalize experiences, send permitted WhatsApp messages (after opt‑in), process transactions, provide support, and ensure safety and integrity. With your consent, we may use anonymized or aggregated data to enhance our service quality and user experience. We do not sell your personal data.'
    },
    {
      icon: Shield,
      title: 'Information Sharing',
      content: 'We do not sell your personal information. To deliver WhatsApp features, we share certain data (e.g., your phone number, message templates, metadata) with WhatsApp LLC/Meta as our service provider/processor. We may share data with vendors that help us operate our services, subject to confidentiality and data protection commitments.'
    },
    {
      icon: Lock,
      title: 'Data Security',
      content: 'We implement appropriate technical and organizational measures to protect your data. WhatsApp provides transport security and end‑to‑end encryption for personal chats; however, business messaging and template processing may involve Meta/WhatsApp servers as part of service delivery.'
    },
    {
      icon: Globe,
      title: 'International Transfers',
      content: 'Your information may be transferred to, stored, and processed in countries other than your own (including the United States and other jurisdictions where WhatsApp/Meta or our providers operate). Where required, we use appropriate safeguards for such transfers.'
    },
    {
      icon: Phone,
      title: 'Your Choices: Joining & Leaving',
      content: 'We only send WhatsApp messages when you have explicitly chosen to receive them, as described in our Terms & Conditions. You can stop receiving messages anytime by replying STOP or UNSUBSCRIBE in WhatsApp, or by contacting support. We will promptly honor your request in line with the consent and messaging controls outlined in our Terms.'
    },
    {
      icon: MessageCircle,
      title: 'WhatsApp Communications',
      content: 'WhatsApp messages sent by us may include service notifications, booking confirmations, or support replies. We do not send promotional or marketing content without your prior consent. All WhatsApp communications are governed by our opt-in consent system and WhatsApp\'s own policies.'
    },
    {
      icon: Database,
      title: 'WhatsApp Messaging Policy',
      content: 'WhatsApp is provided as an optional communication channel for user convenience. By opting in, users agree to WhatsApp\'s Privacy Policy and Meta\'s terms. All WhatsApp conversations are stored and processed on Meta servers as per their data practices. We use WhatsApp Business API only for service-related or support messages, not for unsolicited promotions.'
    },
    {
      icon: Lock,
      title: 'Data Retention',
      content: 'We retain user data only for as long as necessary to provide our services or comply with legal obligations. WhatsApp message logs are retained for operational analytics but are not shared or sold to third parties. Users may request data deletion through our support channels, subject to legal retention requirements.'
    },
    {
      icon: Shield,
      title: 'Children\'s Privacy',
      content: 'Our services are not intended for individuals under 16 years of age. If we become aware that a minor has provided personal information without parental consent, we will delete it promptly. Parents or guardians may contact us to request removal of their child\'s information.'
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
            <h1 className="text-xl font-bold text-gray-900">Terms & Privacy</h1>
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
          <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <FileText className="text-white" size={24} />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Terms & Privacy Policy</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Please read these terms and privacy policy carefully before using SamanKhojo.
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
            <span className="text-sm font-medium">Last updated: November 2025</span>
          </div>
        </motion.div>

        {/* Terms & Conditions Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-white/20 shadow-xl"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center shadow-sm">
              <FileText className="text-green-600" size={20} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Terms & Conditions</h3>
          </div>
          
          <div className="space-y-6">
            {termsSection.map((section, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                className="border-l-4 border-green-200 pl-4"
              >
                <h4 className="text-lg font-semibold text-gray-900 mb-2">{section.title}</h4>
                <p className="text-gray-700 leading-relaxed">{section.content}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Privacy Policy Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-white/20 shadow-xl"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center shadow-sm">
              <Shield className="text-purple-600" size={20} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Privacy Policy</h3>
          </div>
          
          <div className="space-y-6">
            {privacySections.map((section, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.05 }}
                className="flex items-start space-x-4 border-l-4 border-purple-200 pl-4"
              >
                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                  <section.icon className="text-purple-600" size={18} />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{section.title}</h4>
                  <p className="text-gray-700 leading-relaxed">{section.content}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

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
            Contact us via Help & Support to exercise your rights. We may require verification before acting on your request.
          </p>
        </motion.div>

        {/* Contact & Data Protection Officer */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact & Data Protection</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Shield className="text-blue-600" size={16} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Data Protection Officer</p>
                <p className="text-sm text-gray-600">For data protection queries, contact our Data Protection Officer at privacy@samankhojo.com</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <MessageCircle className="text-green-600" size={16} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">WhatsApp Support</p>
                <p className="text-sm text-gray-600">For WhatsApp-related privacy concerns or to manage your messaging preferences</p>
              </div>
            </div>
          </div>
        </motion.div>


      </div>
    </div>
  );
};

export default TermsPrivacyPage;