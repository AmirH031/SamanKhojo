import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { standaloneBannerService, StandaloneBanner } from '../services/standaloneBannerService';
import { festivalService } from '../services/festivalService';

interface StandaloneBannerDisplayProps {
  position: 'hero' | 'navbar' | 'footer' | 'sidebar' | 'popup' | 'overlay';
  className?: string;
}

const StandaloneBannerDisplay: React.FC<StandaloneBannerDisplayProps> = ({ 
  position, 
  className = '' 
}) => {
  const [banners, setBanners] = useState<StandaloneBanner[]>([]);
  const [bannerAssets, setBannerAssets] = useState<Record<string, any>>({});
  const [dismissedBanners, setDismissedBanners] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadBanners();
  }, [position]);

  const loadBanners = async () => {
    try {
      const activeBanners = standaloneBannerService.getActiveBanners(position);
      setBanners(activeBanners);

      // Load assets for banners
      const assets: Record<string, any> = {};
      for (const banner of activeBanners) {
        if (banner.bannerAssetId) {
          try {
            const asset = await festivalService.getAssetById(banner.bannerAssetId);
            if (asset) assets[banner.bannerAssetId] = asset;
          } catch (error) {
            console.error('Error loading banner asset:', error);
          }
        }
        if (banner.videoAssetId) {
          try {
            const asset = await festivalService.getAssetById(banner.videoAssetId);
            if (asset) assets[banner.videoAssetId] = asset;
          } catch (error) {
            console.error('Error loading video asset:', error);
          }
        }
      }
      setBannerAssets(assets);

      // Load dismissed banners from localStorage
      const dismissed = new Set<string>();
      activeBanners.forEach(banner => {
        const isDismissed = localStorage.getItem(`standalone-banner-dismissed-${banner.id}`);
        if (isDismissed === 'true') {
          dismissed.add(banner.id);
        }
      });
      setDismissedBanners(dismissed);
    } catch (error) {
      console.error('Error loading standalone banners:', error);
    }
  };

  const handleDismiss = (bannerId: string) => {
    setDismissedBanners(prev => new Set([...prev, bannerId]));
    localStorage.setItem(`standalone-banner-dismissed-${bannerId}`, 'true');
  };

  const visibleBanners = banners.filter(banner => !dismissedBanners.has(banner.id));

  if (visibleBanners.length === 0) {
    return null;
  }

  return (
    <div className={`standalone-banners-${position} ${className}`}>
      <AnimatePresence>
        {visibleBanners.map((banner, index) => (
          <StandaloneBannerCard
            key={banner.id}
            banner={banner}
            bannerAsset={bannerAssets[banner.bannerAssetId || ''] || bannerAssets[banner.videoAssetId || '']}
            onDismiss={() => handleDismiss(banner.id)}
            index={index}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

interface StandaloneBannerCardProps {
  banner: StandaloneBanner;
  bannerAsset?: any;
  onDismiss: () => void;
  index: number;
}

const StandaloneBannerCard: React.FC<StandaloneBannerCardProps> = ({
  banner,
  bannerAsset,
  onDismiss,
  index
}) => {
  // Generate border styles
  const getBorderStyles = () => {
    const styles: React.CSSProperties = {};
    
    if (banner.style.borderStyle !== 'none') {
      if (banner.style.borderStyle === 'gradient') {
        styles.border = `${banner.style.borderWidth}px solid transparent`;
        styles.background = `linear-gradient(white, white) padding-box, linear-gradient(45deg, ${banner.style.borderColor}, #F59E0B) border-box`;
      } else if (banner.style.borderStyle === 'glow') {
        styles.border = `${banner.style.borderWidth}px solid ${banner.style.borderColor}`;
        styles.boxShadow = `0 0 20px ${banner.style.borderColor}40, inset 0 0 20px ${banner.style.borderColor}20`;
      } else if (banner.style.borderStyle === 'neon') {
        styles.border = `${banner.style.borderWidth}px solid ${banner.style.borderColor}`;
        styles.boxShadow = `
          0 0 5px ${banner.style.borderColor},
          0 0 10px ${banner.style.borderColor},
          0 0 15px ${banner.style.borderColor},
          0 0 20px ${banner.style.borderColor}
        `;
      } else {
        styles.border = `${banner.style.borderWidth}px ${banner.style.borderStyle} ${banner.style.borderColor}`;
      }
    }
    
    if (banner.style.borderRadius > 0) {
      styles.borderRadius = `${banner.style.borderRadius}px`;
    }
    
    // Add shadow
    if (banner.style.shadow !== 'none' && banner.style.shadow !== 'glow') {
      const shadowMap = {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)'
      };
      styles.boxShadow = shadowMap[banner.style.shadow as keyof typeof shadowMap] || styles.boxShadow;
    }
    
    return styles;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: banner.position === 'hero' ? -100 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: banner.position === 'hero' ? -100 : 20 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="relative w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 shadow-lg z-50 mb-4"
      style={{
        minHeight: banner.position === 'hero' ? '120px' : '80px',
        ...getBorderStyles()
      }}
    >
      {/* Banner Content */}
      <div className="relative overflow-hidden h-full">
        {/* Background Asset */}
        {bannerAsset ? (
          bannerAsset.type === 'video' ? (
            <video
              src={bannerAsset.firebaseUrl}
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
              style={{ opacity: 0.8, filter: 'brightness(0.7)' }}
            />
          ) : (
            <img
              src={bannerAsset.firebaseUrl}
              alt={banner.name}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ opacity: 0.8, filter: 'brightness(0.7)' }}
            />
          )
        ) : (
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"></div>
        )}

        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/50"></div>

        {/* Content */}
        <div className="relative z-10 px-4 py-4 h-full flex items-center">
          <div className="max-w-7xl mx-auto flex items-center justify-between w-full">
            <div className="flex-1">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center space-x-4"
              >
                <div>
                  <h2 className="text-lg md:text-2xl font-bold text-white mb-1">
                    {banner.name}
                  </h2>
                  {banner.description && (
                    <p className="text-white/90 text-sm md:text-base">
                      {banner.description}
                    </p>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Close Button */}
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              onClick={onDismiss}
              className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-all"
            >
              <X size={18} />
            </motion.button>
          </div>
        </div>

        {/* Sparkles */}
        {banner.style.sparkles && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {banner.style.customSparkles ? (
              // Custom sparkles pattern
              <>
                {[...Array(15)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                      scale: [0, 1.5, 0],
                      opacity: [0, 1, 0],
                      rotate: [0, 360],
                      x: [0, Math.random() * 30 - 15],
                      y: [0, Math.random() * 30 - 15],
                    }}
                    transition={{
                      duration: 3 + Math.random() * 2,
                      repeat: Infinity,
                      delay: i * 0.2,
                      ease: "easeInOut",
                    }}
                  >
                    <div className="relative">
                      <div className="w-3 h-3 bg-gradient-to-r from-yellow-300 to-orange-400 rounded-full shadow-lg"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-6 h-0.5 bg-white/90 rounded-full transform rotate-45"></div>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-0.5 h-6 bg-white/90 rounded-full transform rotate-45"></div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </>
            ) : (
              // Default sparkles
              <>
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                      scale: [0, 1, 0],
                      opacity: [0, 1, 0],
                      rotate: [0, 180, 360],
                    }}
                    transition={{
                      duration: 2 + Math.random() * 2,
                      repeat: Infinity,
                      delay: i * 0.3,
                      ease: "easeInOut",
                    }}
                  >
                    <div className="relative">
                      <div className="w-2 h-2 bg-yellow-300 rounded-full shadow-lg"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-4 h-0.5 bg-white/80 rounded-full"></div>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-0.5 h-4 bg-white/80 rounded-full"></div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </>
            )}
          </div>
        )}

        {/* Custom Overlay Code */}
        {banner.customOverlayCode && (
          <div 
            className="absolute inset-0 pointer-events-none"
            dangerouslySetInnerHTML={{ __html: banner.customOverlayCode }}
          />
        )}
      </div>
    </motion.div>
  );
};

export default StandaloneBannerDisplay;