import { auth } from './firebase';

export interface BagItem {
  itemId: string;
  itemName: string;
  shopId: string;
  shopName: string;
  quantity: number;
  unit: string;
  price?: number;
  addedAt: string;
}

export interface ShopGroup {
  shopId: string;
  shopName: string;
  items: BagItem[];
}

export interface BagData {
  items: BagItem[];
  shopGroups: ShopGroup[];
  totalItems: number;
  totalShops: number;
  updatedAt?: string;
}

export interface WhatsAppLink {
  shopId: string;
  shopName: string;
  shopPhone: string;
  whatsappLink: string;
  itemCount: number;
  totalQuantity: number;
}

export interface BookingConfirmation {
  success: boolean;
  bookingId: string;
  message: string;
  links: WhatsAppLink[];
  totalShops: number;
}

/**
 * Add item to user's bag
 */
export const addToBag = async (item: {
  itemId: string;
  itemName: string;
  shopId: string;
  shopName: string;
  quantity?: number;
  unit?: string;
  price?: number;
}): Promise<void> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User must be authenticated to add items to bag');
  }

  const response = await fetch('/api/bag/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${await user.getIdToken()}`
    },
    body: JSON.stringify({
      itemId: item.itemId,
      itemName: item.itemName,
      shopId: item.shopId,
      shopName: item.shopName,
      quantity: item.quantity || 1,
      unit: item.unit || 'piece',
      price: item.price
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to add item to bag');
  }

  return response.json();
};

/**
 * Get user's bag items
 */
export const getBagItems = async (): Promise<BagData> => {
  const user = auth.currentUser;
  if (!user) {
    return {
      items: [],
      shopGroups: [],
      totalItems: 0,
      totalShops: 0
    };
  }

  const response = await fetch(`/api/bag/${user.uid}`, {
    headers: {
      'Authorization': `Bearer ${await user.getIdToken()}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch bag items');
  }

  const data = await response.json();
  return data.bag;
};

/**
 * Update item quantity in bag
 */
export const updateBagItemQuantity = async (itemId: string, quantity: number): Promise<void> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User must be authenticated');
  }

  const response = await fetch(`/api/bag/item/${itemId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${await user.getIdToken()}`
    },
    body: JSON.stringify({ quantity })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to update item quantity');
  }
};

/**
 * Remove item from bag
 */
export const removeFromBag = async (itemId: string): Promise<void> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User must be authenticated');
  }

  const response = await fetch(`/api/bag/item/${itemId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${await user.getIdToken()}`
    }
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to remove item from bag');
  }
};

/**
 * Clear entire bag
 */
export const clearBag = async (): Promise<void> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User must be authenticated');
  }

  const response = await fetch(`/api/bag/${user.uid}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${await user.getIdToken()}`
    }
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to clear bag');
  }
};

/**
 * Confirm booking and get WhatsApp links
 */
export const confirmBooking = async (): Promise<BookingConfirmation> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User must be authenticated');
  }

  // Get user profile for phone and name
  const profileResponse = await fetch('/api/auth/user/profile', {
    headers: {
      'Authorization': `Bearer ${await user.getIdToken()}`
    }
  });

  let userPhone = '';
  let userName = '';
  
  if (profileResponse.ok) {
    const profileData = await profileResponse.json();
    userPhone = profileData.profile?.phoneNumber || '';
    userName = profileData.profile?.name || '';
  }

  const response = await fetch('/api/bag/confirm', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${await user.getIdToken()}`
    },
    body: JSON.stringify({
      userPhone,
      userName
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to confirm booking');
  }

  return response.json();
};

/**
 * Get bag count for display
 */
export const getBagCount = async (): Promise<number> => {
  try {
    const bagData = await getBagItems();
    return bagData.totalItems;
  } catch (error) {
    console.error('Error getting bag count:', error);
    return 0;
  }
};