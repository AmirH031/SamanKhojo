import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Festival } from '../types/Festival';
import { festivalService } from '../services/festivalService';

interface FestivalContextType {
  activeFestival: Festival | null;
  isLoading: boolean;
  error: string | null;
  refreshActiveFestival: () => Promise<void>;
}

const FestivalContext = createContext<FestivalContextType | undefined>(undefined);

export const useFestival = () => {
  const context = useContext(FestivalContext);
  if (context === undefined) {
    throw new Error('useFestival must be used within a FestivalProvider');
  }
  return context;
};

interface FestivalProviderProps {
  children: ReactNode;
}

export const FestivalProvider: React.FC<FestivalProviderProps> = ({ children }) => {
  const [activeFestival, setActiveFestival] = useState<Festival | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshActiveFestival = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const festivals = await festivalService.getActiveFestivals();
      
      // Get the highest priority active festival
      const currentFestival = festivals.length > 0 
        ? festivals.sort((a, b) => b.priority - a.priority)[0]
        : null;
      
      setActiveFestival(currentFestival);
    } catch (err) {
      console.error('Error fetching active festival:', err);
      setError('Failed to load festival data');
      setActiveFestival(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshActiveFestival();
    
    // Refresh every 5 minutes to check for festival changes
    const interval = setInterval(refreshActiveFestival, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const value: FestivalContextType = {
    activeFestival,
    isLoading,
    error,
    refreshActiveFestival
  };

  return (
    <FestivalContext.Provider value={value}>
      {children}
    </FestivalContext.Provider>
  );
};

export default FestivalProvider;