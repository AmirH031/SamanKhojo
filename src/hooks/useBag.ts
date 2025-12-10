import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getBagItems, BagData } from '../services/bagService';

export const useBag = () => {
  const { user } = useAuth();
  const [bagData, setBagData] = useState<BagData>({
    items: [],
    shopGroups: [],
    totalItems: 0,
    totalShops: 0
  });
  const [loading, setLoading] = useState(false);

  const fetchBagData = async () => {
    if (!user) {
      setBagData({
        items: [],
        shopGroups: [],
        totalItems: 0,
        totalShops: 0
      });
      return;
    }

    setLoading(true);
    try {
      const data = await getBagItems();
      setBagData(data);
    } catch (error) {
      console.error('Error fetching bag data:', error);
      setBagData({
        items: [],
        shopGroups: [],
        totalItems: 0,
        totalShops: 0
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBagData();
  }, [user]);

  const refreshBag = () => {
    fetchBagData();
  };

  return {
    bagData,
    bagCount: bagData.totalItems,
    loading,
    refreshBag
  };
};