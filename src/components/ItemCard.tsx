import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Plus, Package, Star, Clock, Tag, Sparkles } from 'lucide-react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { Item, isProduct, isMenu, isService } from '../types/Item';
import { addToBag } from '../services/bagService';
import { getDisplayName, shouldDisplay, formatPrice } from '../utils';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';

interface ItemCardProps {
  item: Item;
  shopName: string;
  shopAddress: string;
  shopPhone: string;
  onAddToBag?: (item: Item) => void;
  showShopInfo?: boolean;
  compact?: boolean;
}

const ItemCard: React.FC<ItemCardProps> = ({
  item,
  shopName,
  shopAddress,
  shopPhone,
  onAddToBag,
  showShopInfo = false,
  compact = false
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddToBag = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setIsLoading(true);
    try {
      await addToBag({
        itemId: item.id,
        itemName: item.name || 'Service',
        shopId: item.shopId,
        shopName,
        quantity: 1,
        unit: item.unit || (isService(item) ? 'service' : 'piece'),
        price: item.price
      });
      toast.success('Added to bag!');

      onAddToBag?.(item);
    } catch (error) {
      console.error('Error adding to bag:', error);
      toast.error('Failed to add item to bag');
    } finally {
      setIsLoading(false);
    }
  };

  const renderTypeSpecificContent = () => {
    if (isProduct(item)) {
      return (
        <div className="space-y-2">
          {item.brand_name && (
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <Tag className="w-3 h-3" />
              <span>{item.brand_name}</span>
            </div>
          )}
          {item.variety && (
            <div className="text-xs text-gray-500">
              {t('variety')}: {item.variety}
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-sm">
              <Package className="w-4 h-4 text-green-600" />
              <span className={item.inStock > 0 ? 'text-green-600' : 'text-red-500'}>
                {item.inStock > 0 ? `${item.inStock} ${t('inStock')}` : t('outOfStock')}
              </span>
            </div>
            {item.price && (
              <div className="text-lg font-bold text-green-600">
                {formatPrice(item.price)}
              </div>
            )}
          </div>
        </div>
      );
    }

    if (isMenu(item)) {
      return (
        <div className="space-y-2">
          {item.unit && (
            <div className="text-xs text-gray-500">
              {t('unit')}: {item.unit}
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-sm">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className={item.availability ? 'text-green-600' : 'text-red-500'}>
                {item.availability ? t('available') : t('unavailable')}
              </span>
            </div>
            {item.price && (
              <div className="text-lg font-bold text-green-600">
                {formatPrice(item.price)}
              </div>
            )}
          </div>
        </div>
      );
    }

    if (isService(item)) {
      return (
        <div className="space-y-2">
          {item.description && (
            <div className="text-sm text-gray-600">
              {item.description}
            </div>
          )}
          {item.price && (
            <div className="text-lg font-bold text-purple-600">
              {formatPrice(item.price)}
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  const getTypeColor = () => {
    if (isProduct(item)) return 'border-green-200 bg-green-50';
    if (isMenu(item)) return 'border-blue-200 bg-blue-50';
    if (isService(item)) return 'border-purple-200 bg-purple-50';
    return 'border-gray-200 bg-gray-50';
  };

  const getTypeIcon = () => {
    if (isProduct(item)) return <Package className="w-4 h-4 text-green-600" />;
    if (isMenu(item)) return <Star className="w-4 h-4 text-blue-600" />;
    if (isService(item)) return <Sparkles className="w-4 h-4 text-purple-600" />;
    return null;
  };

  const isAvailable = () => {
    if (isProduct(item)) return item.inStock > 0;
    if (isMenu(item)) return item.availability !== false && item.isAvailable !== false;
    if (isService(item)) return item.availability !== false;
    return true;
  };

  return (
    <>
      <motion.div
        className={`bg-white rounded-lg border-2 ${getTypeColor()} shadow-sm hover:shadow-md transition-all duration-200 ${
          compact ? 'p-3' : 'p-4'
        }`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {getTypeIcon()}
              <h3 className={`font-semibold text-gray-900 ${compact ? 'text-sm' : 'text-base'}`}>
                {shouldDisplay(item.name) ? getDisplayName(item.name, item.hindi_name) : item.name}
              </h3>
            </div>
            {item.category && (
              <div className="text-xs text-gray-500 mb-2">
                {item.category}
              </div>
            )}
          </div>
          {item.imageUrl && (
            <img
              src={item.imageUrl}
              alt={item.name}
              className={`rounded-lg object-cover ${compact ? 'w-12 h-12' : 'w-16 h-16'}`}
            />
          )}
        </div>

        {/* Description */}
        {item.description && (
          <p className={`text-gray-600 mb-3 ${compact ? 'text-xs' : 'text-sm'}`}>
            {item.description.length > 100 
              ? `${item.description.substring(0, 100)}...` 
              : item.description
            }
          </p>
        )}

        {/* Type-specific content */}
        {renderTypeSpecificContent()}

        {/* Shop info (if requested) */}
        {showShopInfo && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              <div className="font-medium">{shopName}</div>
              <div>{shopAddress}</div>
            </div>
          </div>
        )}

        {/* Action button */}
        <div className="mt-4">
          <button
            onClick={handleAddToBag}
            disabled={!isAvailable() || isLoading}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              !isAvailable()
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : isProduct(item)
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : isMenu(item)
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            } ${compact ? 'text-sm py-1.5' : 'text-sm py-2'}`}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {isService(item) ? <Plus className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
                <span>
                  {!isAvailable()
                    ? t('unavailable')
                    : isService(item)
                    ? 'Add to Bag'
                    : 'Add to Bag'
                  }
                </span>
              </>
            )}
          </button>
        </div>
      </motion.div>

      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </>
  );
};

export default ItemCard;