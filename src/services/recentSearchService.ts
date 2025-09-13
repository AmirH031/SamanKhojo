export interface RecentSearch {
  query: string;
  timestamp: string;
  results: number;
}

export const saveRecentSearch = (query: string, results: number): void => {
  try {
    const searches = getRecentSearches();
    const newSearch: RecentSearch = {
      query: query.toLowerCase(),
      timestamp: new Date().toISOString(),
      results
    };
    
    // Remove duplicate if exists
    const filteredSearches = searches.filter(search => search.query !== newSearch.query);
    
    // Add new search at beginning and keep only last 5
    const updatedSearches = [newSearch, ...filteredSearches].slice(0, 5);
    
    localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
  } catch (error) {
    console.error('Error saving recent search:', error);
  }
};

export const getRecentSearches = (): RecentSearch[] => {
  try {
    const searches = localStorage.getItem('recentSearches');
    return searches ? JSON.parse(searches) : [];
  } catch (error) {
    console.error('Error getting recent searches:', error);
    return [];
  }
};

export const clearRecentSearches = (): void => {
  localStorage.removeItem('recentSearches');
};