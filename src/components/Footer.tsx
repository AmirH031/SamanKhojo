import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, Instagram, Youtube, MessageCircle, MapPin, Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSelector from './LanguageSelector';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { t } = useTranslation();

  const socialLinks = [
    {
      name: 'Instagram',
      icon: Instagram,
      url: 'https://instagram.com/samankhojo',
      color: 'hover:text-pink-500'
    },
    {
      name: 'YouTube',
      icon: Youtube,
      url: 'https://youtube.com/@samankhojo',
      color: 'hover:text-red-500'
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      url: 'https://wa.me/919876543210',
      color: 'hover:text-green-500'
    }
  ];

  const quickLinks = [
    { name: t('nav.home'), href: '/' },
    { name: t('nav.shops'), href: '/shops' },
    { name: t('common.feedback'), href: '/feedback' },
    { name: t('common.about'), href: '/about' }
  ];

  return (
    <>
      {/* Desktop Footer */}
      <footer className="hidden md:block bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Brand Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent mb-3">
                SamanKhojo
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed max-w-xs">
                Find local Indian shops instantly with SamanKhojo – your go-to for kirana and grocery stores.
              </p>
              <div className="mt-4 space-y-2">
                <div className="flex items-center space-x-2 text-gray-300">
                  <Mail size={16} className="text-blue-400" />
                  <a href="mailto:contact@samankhojo.com" className="hover:text-blue-400 transition-colors text-sm">
                    contact@samankhojo.com
                  </a>
                </div>
                <div className="flex items-center space-x-2 text-gray-300">
                  <Phone size={16} className="text-green-400" />
                  <a href="tel:+919876543210" className="hover:text-green-400 transition-colors text-sm">
                    +91 98765 43210
                  </a>
                </div>
                <div className="flex items-center space-x-2 text-gray-300">
                  <MapPin size={16} className="text-red-400" />
                  <span className="text-sm">India</span>
                </div>
              </div>
            </motion.div>

            {/* Quick Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h4 className="text-lg font-semibold mb-4 text-white">{t('footer.quickLinks')}</h4>
              <ul className="space-y-2">
                {quickLinks.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.href}
                      className="text-gray-300 hover:text-blue-400 transition-colors flex items-center space-x-2 group text-sm"
                    >
                      <span className="w-1 h-1 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                      <span>{link.name}</span>
                    </a>
                  </li>
                ))}
              </ul>

              {/* Language Selector in Footer */}
              <div className="mt-4">
                <LanguageSelector className="text-white" />
              </div>
            </motion.div>

            {/* Social Media */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <h4 className="text-lg font-semibold mb-4 text-white">{t('footer.connectWithUs')}</h4>
              <div className="space-y-2">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center space-x-2 text-gray-300 ${social.color} transition-colors group text-sm`}
                  >
                    <div className="p-1.5 bg-white/10 rounded-lg group-hover:bg-white/20 transition-colors">
                      <social.icon size={16} />
                    </div>
                    <span>{social.name}</span>
                  </a>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Bottom Section */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="border-t border-white/20 mt-6 pt-6 text-center"
          >
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-2 text-gray-300 text-sm">
                <span>© {currentYear} SamanKhojo. Made with</span>
                <Heart size={14} className="text-red-500 fill-current" />
                <span>in India</span>
              </div>
              <div className="flex space-x-4 text-xs text-gray-300">
                <a href="/terms" className="hover:text-blue-400 transition-colors">
                  Terms of Service
                </a>
                <a href="/terms" className="hover:text-blue-400 transition-colors">
                  Privacy Policy
                </a>
                <a href="/support" className="hover:text-blue-400 transition-colors">
                  Support
                </a>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500">
              <p>
                Keywords: Find shops nearby • Kirana store finder • Search local Indian shops • Shop locator app India
              </p>
              <p className="mt-2">
                All trademarks and brand names are the property of their respective owners. We list items as available in local shops and do not claim ownership of any brand.
              </p>
            </div>
          </motion.div>
        </div>
      </footer>
    </>
  );
};

export default Footer;