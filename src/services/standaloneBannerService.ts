interface StandaloneBanner {
  id: string;
  name: string;
  description: string;
  bannerAssetId?: string;
  videoAssetId?: string;
  stickerAssetIds: string[];
  customOverlayCode?: string;
  isActive: boolean;
  style: {
    borderStyle: 'none' | 'solid' | 'dashed' | 'dotted' | 'double' | 'gradient' | 'glow' | 'neon';
    borderWidth: number;
    borderColor: string;
    borderRadius: number;
    shadow: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'glow';
    backgroundOverlay: 'none' | 'gradient' | 'pattern' | 'blur';
    sparkles: boolean;
    customSparkles: boolean;
  };
  position: 'hero' | 'navbar' | 'footer' | 'sidebar' | 'popup' | 'overlay';
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export class StandaloneBannerService {
  private static instance: StandaloneBannerService;
  
  static getInstance(): StandaloneBannerService {
    if (!this.instance) {
      this.instance = new StandaloneBannerService();
    }
    return this.instance;
  }

  /**
   * Get all standalone banners
   */
  getAllBanners(): StandaloneBanner[] {
    try {
      const storedBanners = localStorage.getItem('standaloneBanners');
      return storedBanners ? JSON.parse(storedBanners) : [];
    } catch (error) {
      console.error('Error loading standalone banners:', error);
      return [];
    }
  }

  /**
   * Get active banners for a specific position
   */
  getActiveBanners(position?: string): StandaloneBanner[] {
    const allBanners = this.getAllBanners();
    return allBanners
      .filter(banner => banner.isActive && (!position || banner.position === position))
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * Get active hero banners
   */
  getActiveHeroBanners(): StandaloneBanner[] {
    return this.getActiveBanners('hero');
  }

  /**
   * Save banners to localStorage
   */
  saveBanners(banners: StandaloneBanner[]): void {
    try {
      localStorage.setItem('standaloneBanners', JSON.stringify(banners));
    } catch (error) {
      console.error('Error saving standalone banners:', error);
    }
  }

  /**
   * Create a new banner
   */
  createBanner(bannerData: Omit<StandaloneBanner, 'id' | 'createdAt' | 'updatedAt'>): StandaloneBanner {
    const newBanner: StandaloneBanner = {
      ...bannerData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const allBanners = this.getAllBanners();
    const updatedBanners = [...allBanners, newBanner];
    this.saveBanners(updatedBanners);
    
    return newBanner;
  }

  /**
   * Update a banner
   */
  updateBanner(bannerId: string, updates: Partial<StandaloneBanner>): void {
    const allBanners = this.getAllBanners();
    const updatedBanners = allBanners.map(banner =>
      banner.id === bannerId 
        ? { ...banner, ...updates, updatedAt: new Date().toISOString() }
        : banner
    );
    this.saveBanners(updatedBanners);
  }

  /**
   * Delete a banner
   */
  deleteBanner(bannerId: string): void {
    const allBanners = this.getAllBanners();
    const updatedBanners = allBanners.filter(banner => banner.id !== bannerId);
    this.saveBanners(updatedBanners);
  }

  /**
   * Toggle banner status
   */
  toggleBanner(bannerId: string): void {
    const allBanners = this.getAllBanners();
    const updatedBanners = allBanners.map(banner =>
      banner.id === bannerId 
        ? { ...banner, isActive: !banner.isActive, updatedAt: new Date().toISOString() }
        : banner
    );
    this.saveBanners(updatedBanners);
  }
}

export const standaloneBannerService = StandaloneBannerService.getInstance();
export type { StandaloneBanner };