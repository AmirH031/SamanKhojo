import { getDistance } from 'geolib';
import { calculateDistance as calculateHaversineDistance, formatDistance as formatDistanceUtil } from '../utils';

// Types
export interface LocationData {
  latitude: number;
  longitude: number;
}

export interface ShopWithDistance {
  id: string;
  shopName: string;
  address: string;
  phone: string;
  distance?: number | null;
  location?: LocationData;
}

// Function to get user's current location
export const getCurrentLocation = (): Promise<LocationData> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        console.warn('Geolocation error:', error);
        reject(new Error('Unable to fetch user location'));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  });
};

// Calculate distance between user and shop using Haversine
export const calculateDistance = (
  userLocation: LocationData,
  shopLocation: LocationData
): number => {
  return calculateHaversineDistance(
    userLocation.latitude,
    userLocation.longitude,
    shopLocation.latitude,
    shopLocation.longitude
  );
};

// Adds distance field to each shop and sorts by proximity
export const addDistanceToShops = (
  shops: ShopWithDistance[],
  userLocation: LocationData
): ShopWithDistance[] => {
  return shops
    .map((shop) => {
      if (shop.location) {
        const distance = calculateDistance(userLocation, shop.location);
        return {
          ...shop,
          distance: distance
        };
      }
      return { ...shop, distance: null };
    })
    .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
};

// Formats distance as a readable string
export const formatDistance = (distance: number | null | undefined): string => {
  if (distance === null || distance === undefined) return '';
  return formatDistanceUtil(distance); 
};
