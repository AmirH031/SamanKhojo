import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, MessageCircle, ExternalLink } from 'lucide-react';
import { festivalService } from '../services/festivalService';
import { Festival } from '../types/Festival';

interface FestivalHeroSectionProps {
  pulseAnimation: any;
  fadeInUp: any;
}

const FestivalHeroSection: React.FC<FestivalHeroSectionProps> = ({ pulseAnimation, fadeInUp }) => {
  const [activeFestival, setActiveFestival] = useState<Festival | null>(null);
  const [bannerAsset, setBannerAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    loadActiveFestival();
  }, []);

  const loadActiveFestival = async () => {
    try {
      setLoading(true);
      const festival = await festivalService.getActiveFestival();
      
      if (festival) {
        setActiveFestival(festival);
        
        // Check if admin wants to show banner instead of feature boxes
        const showBannerSetting = festival.style?.layout?.showBannerInHero !== false;
        setShowBanner(showBannerSetting);
        
        // Get banner asset if available
        if (festival.style?.assets?.bannerAssetId) {
          try {
            const banner = await festivalService.getAssetById(festival.style.assets.bannerAssetId);
            setBannerAsset(banner);
          } catch (assetError) {
            // Silently handle asset loading error
          }
        }
      }
    } catch (error) {
      // Silently handle error
    } finally {
      setLoading(false);
    }
  };

  // If loading, show feature boxes as fallback
  if (loading) {
    return <FeatureBoxes pulseAnimation={pulseAnimation} fadeInUp={fadeInUp} />;
  }

  // If festival exists and admin wants to show banner, show festival banner
  if (activeFestival && showBanner) {
    return <FestivalBanner festival={activeFestival} bannerAsset={bannerAsset} fadeInUp={fadeInUp} />;
  }

  // Default: show feature boxes
  return <FeatureBoxes pulseAnimation={pulseAnimation} fadeInUp={fadeInUp} />;
};

// Festival Banner Component for Hero Section
const FestivalBanner: React.FC<{
  festival: Festival;
  bannerAsset: any;
  fadeInUp: any;
}> = ({ festival, bannerAsset, fadeInUp }) => {
  const festivalColors = festival.style?.colors || {
    primary: '#3B82F6',
    secondary: '#8B5CF6',
    accent: '#F59E0B'
  };

  return (
    <motion.div
      variants={fadeInUp}
      className="w-full max-w-full md:max-w-4xl mx-auto mb-8"
    >
      <div 
        className="relative overflow-hidden rounded-2xl md:rounded-3xl shadow-2xl"
        style={{
          background: `linear-gradient(135deg, ${festivalColors.primary}, ${festivalColors.secondary}, ${festivalColors.accent})`,
          aspectRatio: '3780 / 1890',
          maxHeight: '400px'
        }}
      >
        {/* Background Asset */}
        {bannerAsset && (
          bannerAsset.type === 'video' ? (
            <video
              src={bannerAsset.firebaseUrl}
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <img
              src={bannerAsset.firebaseUrl}
              alt={festival.displayName}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )
        )}

        {/* Decorative Elements */}
        {festival.style?.effects?.sparkles && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-yellow-300 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.3,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Feature Boxes Component
const FeatureBoxes: React.FC<{
  pulseAnimation: any;
  fadeInUp: any;
}> = ({ pulseAnimation, fadeInUp }) => {
  return (
    <motion.div
      variants={fadeInUp}
      className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 max-w-full md:max-w-4xl mx-auto"
    >
      <motion.div
        variants={pulseAnimation}
        className="flex items-center justify-center space-x-2 md:space-x-3 text-white/95 bg-white/20 backdrop-blur-sm rounded-2xl p-3 md:p-4 border border-white/20"
      >
        <MapPin className="text-green-400" size={24} />
        <span className="font-medium text-sm md:text-base">Find nearby local shops instantly</span>
      </motion.div>
      <motion.div
        variants={pulseAnimation}
        className="flex items-center justify-center space-x-2 md:space-x-3 text-white/95 bg-white/20 backdrop-blur-sm rounded-2xl p-3 md:p-4 border border-white/20"
      >
        <MessageCircle className="text-blue-400" size={24} />
        <span className="font-medium text-sm md:text-base">Works with WhatsApp, Hindi & English</span>
      </motion.div>
      <motion.div
        variants={pulseAnimation}
        className="flex items-center justify-center space-x-2 md:space-x-3 text-white/95 bg-white/20 backdrop-blur-sm rounded-2xl p-3 md:p-4 border border-white/20"
      >
        <ExternalLink className="text-purple-400" size={24} />
        <span className="font-medium text-sm md:text-base">Verified shop details with Google Map link</span>
      </motion.div>
    </motion.div>
  );
};

export default FestivalHeroSection;