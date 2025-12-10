// Enhanced Asset Management Types
export interface AssetMetadata {
  id: string;
  name: string;
  originalName: string;
  type: 'banner' | 'poster' | 'overlay' | 'video' | 'decoration' | 'template' | 'audio' | 'sticker';
  category: 'festival' | 'template' | 'common' | 'seasonal';
  mimeType: string;
  size: number;
  dimensions?: { width: number; height: number };
  duration?: number; // For videos/audio
  firebaseUrl: string;
  firebasePath: string;
  thumbnailUrl?: string;
  isAnimated: boolean;
  tags: string[];
  description: string;
  festivalIds: string[]; // Festivals using this asset
  templateIds: string[]; // Templates using this asset
  primaryFestivalId?: string; // Main festival this asset belongs to
  primaryTemplateId?: string; // Main template this asset belongs to
  usageCount: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  isPublic: boolean;
  status: 'active' | 'archived' | 'processing';
  layoutPosition?: 'hero' | 'navbar' | 'footer' | 'sidebar' | 'background' | 'overlay';
  styleProperties?: {
    opacity?: number;
    blendMode?: string;
    filters?: string;
    animation?: string;
  };
}

export interface AssetUploadRequest {
  file: File;
  type: AssetMetadata['type'];
  category: AssetMetadata['category'];
  description?: string;
  tags?: string[];
  festivalId?: string;
  templateId?: string;
}

export interface AssetSearchFilters {
  type?: string;
  category?: string;
  festivalId?: string;
  templateId?: string;
  tags?: string[];
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface AssetSearchResult {
  assets: AssetMetadata[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

export interface FestivalTemplate {
  id: string;
  name: string;
  displayName: string;
  description: string;
  icon: string;
  category: 'traditional' | 'modern' | 'seasonal' | 'custom';
  defaultStyle: FestivalStyle;
  prebuiltAssets: string[]; // Asset IDs instead of full objects
  bannerTemplates: BannerTemplate[];
  overlayTemplates: OverlayTemplate[];
  requiredAssets: string[];
  optionalAssets: string[];
  isBuiltIn: boolean;
  createdAt: string;
  updatedAt: string;
}

// Legacy alias for backward compatibility
export type PrebuiltAsset = AssetMetadata;

export interface BannerTemplate {
  id: string;
  name: string;
  description: string;
  htmlCode: string;
  cssCode: string;
  jsCode?: string;
  variables: BannerVariable[];
  preview: string;
  category: 'hero' | 'navbar' | 'footer' | 'popup';
  responsive: boolean;
  assetIds: string[]; // Assets used in this template
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface BannerVariable {
  name: string;
  type: 'text' | 'color' | 'image' | 'number' | 'boolean';
  label: string;
  defaultValue: any;
  description?: string;
  options?: string[]; // For select inputs
}

export interface OverlayTemplate {
  id: string;
  name: string;
  description: string;
  type: 'css' | 'canvas' | 'svg' | 'video';
  code: string;
  variables: BannerVariable[];
  preview: string;
  effects: string[];
  performance: 'low' | 'medium' | 'high';
  assetIds: string[]; // Assets used in this template
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// Legacy alias for backward compatibility
export type FestivalAsset = AssetMetadata;

export interface FestivalStyle {
  name: string;
  displayName: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  effects: {
    confetti: boolean;
    sparkles: boolean;
    glow: boolean;
    snow: boolean;
    colorSplash: boolean;
    particles: boolean;
    customSparkles: boolean;
    customOverlay: boolean;
  };
  animations: {
    float: boolean;
    pulse: boolean;
    rotate: boolean;
    bounce: boolean;
    fade: boolean;
  };
  layout: {
    bannerPosition: 'hero' | 'navbar' | 'footer' | 'sidebar' | 'popup' | 'overlay';
    overlayPosition: 'fullscreen' | 'corner' | 'center' | 'floating';
    showDecorations: boolean;
    decorationDensity: 'low' | 'medium' | 'high';
    showBannerInHero?: boolean;
  };
  assets: {
    bannerAssetId?: string;
    overlayAssetId?: string;
    decorationAssetIds: string[];
    videoAssetIds: string[];
    audioAssetId?: string;
    stickerAssetIds: string[];
    customOverlayCode?: string;
  };
  assetStyles?: Record<string, {
    layoutPosition?: 'hero' | 'navbar' | 'footer' | 'sidebar' | 'background' | 'overlay';
    opacity?: number;
    blendMode?: string;
    filters?: string;
    animation?: string;
    brightness?: number;
    contrast?: number;
    saturate?: number;
    blur?: number;
  }>;
  bannerStyle: {
    borderStyle: 'none' | 'solid' | 'dashed' | 'dotted' | 'double' | 'gradient' | 'glow' | 'neon';
    borderWidth: number;
    borderColor: string;
    borderRadius: number;
    shadow: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'glow';
    backgroundOverlay: 'none' | 'gradient' | 'pattern' | 'blur';
  };
  sounds: {
    enabled: boolean;
    backgroundAssetId?: string;
    volume: number;
  };
}

export interface Festival {
  id: string;
  name: string;
  displayName: string;
  description: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  style: FestivalStyle;
  assetIds: string[]; // References to AssetMetadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  status: 'draft' | 'active' | 'scheduled' | 'expired';
  priority: number; // For ordering multiple active festivals
}

// Enhanced Layout Management
export interface LayoutPosition {
  id: string;
  name: string;
  description: string;
  assetId?: string;
  assetType: 'banner' | 'overlay' | 'decoration' | 'video';
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  zIndex: number;
  opacity: number;
  isVisible: boolean;
  animations: {
    entrance?: string;
    loop?: string;
    exit?: string;
  };
}

export interface HomepageLayout {
  id: string;
  festivalId?: string;
  layout: {
    hero: {
      showBanner: boolean;
      bannerPosition: 'background' | 'overlay' | 'top' | 'bottom';
      showOverlay: boolean;
      positions: LayoutPosition[];
    };
    navbar: {
      showBanner: boolean;
      height: number;
      assetId?: string;
    };
    footer: {
      showDecorations: boolean;
      showBanner: boolean;
      decorationAssetIds: string[];
    };
    sidebar: {
      enabled: boolean;
      position: 'left' | 'right';
      showContent: boolean;
      assetIds: string[];
    };
    popup: {
      enabled: boolean;
      delay: number;
      frequency: 'once' | 'daily' | 'session';
      assetId?: string;
    };
    overlay: {
      enabled: boolean;
      opacity: number;
      zIndex: number;
      videoAssetId?: string;
      positions: LayoutPosition[];
    };
  };
  isActive: boolean;
  updatedAt: string;
}