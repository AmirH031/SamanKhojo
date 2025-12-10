import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink } from 'lucide-react';
import { festivalService } from '../services/festivalService';
import { Festival } from '../types/Festival';

interface FestivalBannerProps {
  className?: string;
}

const FestivalBanner: React.FC<FestivalBannerProps> = ({ className = '' }) => {
  const [activeFestival, setActiveFestival] = useState<Festival | null>(null);
  const [bannerAsset, setBannerAsset] = useState<any>(null);
  const [stickerAssets, setStickerAssets] = useState<Record<string, any>>({});
  const [isVisible, setIsVisible] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActiveFestival();
  }, []);

  const loadActiveFestival = async () => {
    try {
      setLoading(true);
      console.log('Loading active festival...');
      const festival = await festivalService.getActiveFestival();
      console.log('Active festival:', festival);
      
      if (festival) {
        setActiveFestival(festival);
        
        // Get banner asset details if bannerAssetId exists
        if (festival.style?.assets?.bannerAssetId) {
          try {
            console.log('Loading specific banner asset:', festival.style.assets.bannerAssetId);
            // Try to get the asset directly by ID first
            const banner = await festivalService.getAssetById(festival.style.assets.bannerAssetId);
            console.log('Found banner asset by ID:', banner);
            setBannerAsset(banner);
          } catch (assetError) {
            console.error('Error loading banner asset by ID:', assetError);
            // Fallback: try to find it in festival assets
            try {
              const assets = await festivalService.getFestivalAssets(festival.id);
              const banner = assets.find(asset => asset.id === festival.style.assets.bannerAssetId);
              console.log('Found banner asset in festival assets:', banner);
              setBannerAsset(banner);
            } catch (fallbackError) {
              console.error('Error loading festival assets:', fallbackError);
            }
          }
        } else {
          // Try to get any available banner asset for this festival
          try {
            console.log('Looking for any banner assets for festival:', festival.id);
            const assets = await festivalService.getFestivalAssets(festival.id);
            console.log('Available assets:', assets);
            const banner = assets.find(asset => asset.type === 'banner' || asset.type === 'poster');
            console.log('Found banner asset:', banner);
            setBannerAsset(banner);
          } catch (assetError) {
            console.error('Error loading festival assets:', assetError);
          }
        }

        // Load sticker assets
        if (festival.style?.assets?.stickerAssetIds?.length > 0) {
          try {
            const stickerAssetsMap: Record<string, any> = {};
            for (const stickerId of festival.style.assets.stickerAssetIds) {
              try {
                const stickerAsset = await festivalService.getAssetById(stickerId);
                if (stickerAsset) {
                  stickerAssetsMap[stickerId] = stickerAsset;
                }
              } catch (stickerError) {
                console.error('Error loading sticker asset:', stickerId, stickerError);
                // Continue loading other stickers even if one fails
              }
            }
            setStickerAssets(stickerAssetsMap);
          } catch (error) {
            console.error('Error loading sticker assets:', error);
            // Set empty object to prevent further errors
            setStickerAssets({});
          }
        } else {
          setStickerAssets({});
        }
      } else {
        console.log('No active festival found');
        setStickerAssets({});
      }
    } catch (error) {
      console.error('Error loading festival banner:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    // Store in localStorage to remember user dismissed it
    if (activeFestival) {
      localStorage.setItem(`festival-banner-dismissed-${activeFestival.id}`, 'true');
    }
  };

  // Check if user previously dismissed this banner
  useEffect(() => {
    if (activeFestival) {
      const dismissed = localStorage.getItem(`festival-banner-dismissed-${activeFestival.id}`);
      if (dismissed === 'true') {
        setIsVisible(false);
      }
    }
  }, [activeFestival]);

  // For debugging - let's show the banner even if no festival is found
  if (loading) {
    return (
      <div className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 shadow-lg z-50 min-h-[120px] flex items-center justify-center">
        <div className="text-white text-lg">Loading festival...</div>
      </div>
    );
  }

  if (!isVisible) {
    return null;
  }

  // Show banner even if no festival is found (for debugging)
  if (!activeFestival) {
    return (
      <div className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 shadow-lg z-50 min-h-[120px] flex items-center justify-center">
        <div className="text-white text-lg">🎉 No active festival found - but banner is working!</div>
      </div>
    );
  }

  const bannerStyle = (bannerAsset && activeFestival.style?.assetStyles?.[bannerAsset.id]) || {};
  const festivalColors = activeFestival.style?.colors || {
    primary: '#3B82F6',
    secondary: '#8B5CF6',
    accent: '#F59E0B'
  };

  // Get border styling
  const borderStyle = activeFestival.style?.bannerStyle || {
    borderStyle: 'none',
    borderWidth: 0,
    borderColor: '#3B82F6',
    borderRadius: 0,
    shadow: 'none',
    backgroundOverlay: 'none'
  };

  // Generate border CSS
  const getBorderStyles = () => {
    const styles: React.CSSProperties = {};
    
    if (borderStyle.borderStyle !== 'none') {
      if (borderStyle.borderStyle === 'gradient') {
        styles.border = `${borderStyle.borderWidth}px solid transparent`;
        styles.background = `linear-gradient(white, white) padding-box, linear-gradient(45deg, ${borderStyle.borderColor}, ${festivalColors.accent}) border-box`;
      } else if (borderStyle.borderStyle === 'glow') {
        styles.border = `${borderStyle.borderWidth}px solid ${borderStyle.borderColor}`;
        styles.boxShadow = `0 0 20px ${borderStyle.borderColor}40, inset 0 0 20px ${borderStyle.borderColor}20`;
      } else if (borderStyle.borderStyle === 'neon') {
        styles.border = `${borderStyle.borderWidth}px solid ${borderStyle.borderColor}`;
        styles.boxShadow = `
          0 0 5px ${borderStyle.borderColor},
          0 0 10px ${borderStyle.borderColor},
          0 0 15px ${borderStyle.borderColor},
          0 0 20px ${borderStyle.borderColor}
        `;
      } else {
        styles.border = `${borderStyle.borderWidth}px ${borderStyle.borderStyle} ${borderStyle.borderColor}`;
      }
    }
    
    if (borderStyle.borderRadius > 0) {
      styles.borderRadius = `${borderStyle.borderRadius}px`;
    }
    
    // Add shadow
    if (borderStyle.shadow !== 'none' && borderStyle.shadow !== 'glow') {
      const shadowMap = {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)'
      };
      styles.boxShadow = shadowMap[borderStyle.shadow as keyof typeof shadowMap] || styles.boxShadow;
    }
    
    return styles;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -100 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`relative w-full bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 shadow-lg z-50 ${className}`}
        style={{
          background: `linear-gradient(135deg, ${festivalColors.primary}, ${festivalColors.secondary}, ${festivalColors.accent})`,
          minHeight: '120px',
          ...getBorderStyles()
        }}
      >
        {/* Banner Content */}
        <div className="relative overflow-hidden">
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
                style={{
                  opacity: bannerStyle.opacity || 0.8,
                  filter: bannerStyle.filters || 'brightness(0.7)'
                }}
              />
            ) : (
              <img
                src={bannerAsset.firebaseUrl}
                alt={activeFestival.displayName}
                className="absolute inset-0 w-full h-full object-cover"
                style={{
                  opacity: bannerStyle.opacity || 0.8,
                  filter: bannerStyle.filters || 'brightness(0.7)'
                }}
              />
            )
          ) : (
            // Default gradient background when no banner asset
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-purple-600 via-pink-600 to-red-600"></div>
          )}

          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/50"></div>

          {/* Content */}
          <div className="relative z-10 px-4 py-6 md:py-8">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex-1">
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center space-x-4"
                >
                  {/* Festival Info */}
                  <div>
                    <h2 className="text-xl md:text-3xl font-bold text-white mb-1">
                      🎉 {activeFestival.displayName}
                    </h2>
                    <p className="text-white/90 text-sm md:text-base">
                      {activeFestival.description}
                    </p>
                  </div>

                  {/* CTA Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      // Navigate to festival page or show more info
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hidden md:flex items-center space-x-2 bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-xl hover:bg-white/30 transition-all border border-white/30"
                  >
                    <span className="font-medium">Explore Offers</span>
                    <ExternalLink size={16} />
                  </motion.button>
                </motion.div>
              </div>

              {/* Close Button */}
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                onClick={handleClose}
                className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-all"
              >
                <X size={20} />
              </motion.button>
            </div>

            {/* Mobile CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="md:hidden mt-4 text-center"
            >
              <button
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="bg-white/20 backdrop-blur-sm text-white px-6 py-2 rounded-xl hover:bg-white/30 transition-all border border-white/30 text-sm font-medium"
              >
                Explore Festival Offers 🎊
              </button>
            </motion.div>
          </div>

          {/* Decorative Elements - Sparkles */}
          {activeFestival.style?.effects?.sparkles && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {activeFestival.style?.effects?.customSparkles ? (
                // Custom sparkles pattern
                <>
                  {[...Array(20)].map((_, i) => (
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
                        x: [0, Math.random() * 50 - 25],
                        y: [0, Math.random() * 50 - 25],
                      }}
                      transition={{
                        duration: 3 + Math.random() * 3,
                        repeat: Infinity,
                        delay: i * 0.15,
                        ease: "easeInOut",
                      }}
                    >
                      <div className="relative">
                        {/* Star-shaped sparkle */}
                        <div className="w-4 h-4 bg-gradient-to-r from-yellow-300 to-orange-400 rounded-full shadow-lg"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-8 h-0.5 bg-white/90 rounded-full transform rotate-45"></div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-0.5 h-8 bg-white/90 rounded-full transform rotate-45"></div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-6 h-0.5 bg-white/70 rounded-full"></div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-0.5 h-6 bg-white/70 rounded-full"></div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </>
              ) : (
                // Default sparkles
                <>
                  {[...Array(12)].map((_, i) => (
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
                        delay: i * 0.2,
                        ease: "easeInOut",
                      }}
                    >
                      <div className="relative">
                        {/* Main sparkle */}
                        <div className="w-3 h-3 bg-yellow-300 rounded-full shadow-lg"></div>
                        {/* Cross sparkle effect */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-6 h-0.5 bg-white/80 rounded-full"></div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-0.5 h-6 bg-white/80 rounded-full"></div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  
                  {/* Additional smaller sparkles */}
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={`small-${i}`}
                      className="absolute w-1.5 h-1.5 bg-white rounded-full shadow-sm"
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                      }}
                      animate={{
                        scale: [0, 1, 0],
                        opacity: [0, 0.8, 0],
                      }}
                      transition={{
                        duration: 1.5 + Math.random() * 1.5,
                        repeat: Infinity,
                        delay: i * 0.4,
                      }}
                    />
                  ))}
                </>
              )}
            </div>
          )}

          {/* Stickers/Decorations */}
          {activeFestival.style?.assets?.stickerAssetIds?.map((stickerId, index) => {
            const stickerAsset = stickerAssets[stickerId];
            if (!stickerAsset) return null;
            
            return (
              <motion.div
                key={stickerId}
                className="absolute pointer-events-none"
                style={{
                  left: `${10 + (index * 15) % 80}%`,
                  top: `${10 + (index * 20) % 70}%`,
                  zIndex: 10,
                }}
                animate={{
                  scale: [0.8, 1.2, 0.8],
                  rotate: [0, 10, -10, 0],
                }}
                transition={{
                  duration: 4 + Math.random() * 2,
                  repeat: Infinity,
                  delay: index * 0.5,
                }}
              >
                <img
                  src={stickerAsset.firebaseUrl}
                  alt="Festival sticker"
                  className="w-8 h-8 md:w-12 md:h-12 drop-shadow-lg"
                  onError={(e) => {
                    console.error('Failed to load sticker:', stickerId);
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </motion.div>
            );
          })}

          {/* Custom Overlay Code */}
          {activeFestival.style?.assets?.customOverlayCode && (
            <div 
              className="absolute inset-0 pointer-events-none"
              dangerouslySetInnerHTML={{ 
                __html: activeFestival.style.assets.customOverlayCode 
              }}
              onError={(e) => {
                console.error('Error in custom overlay code:', e);
              }}
            />
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FestivalBanner;