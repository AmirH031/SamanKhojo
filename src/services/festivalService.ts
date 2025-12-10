import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage, auth } from './firebase';
import { Festival, AssetMetadata } from '../types/Festival';

/**
 * Production Festival Management Service
 * Handles all festival and asset operations with Firebase
 */
export class FestivalService {
  private static instance: FestivalService;
  
  static getInstance(): FestivalService {
    if (!this.instance) {
      this.instance = new FestivalService();
    }
    return this.instance;
  }

  /**
   * Get active festival from Firestore
   */
  async getActiveFestival(): Promise<Festival | null> {
    try {
      const festivalsRef = collection(db, 'festivals');
      const q = query(
        festivalsRef,
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return null;
      }

      const festivalDoc = snapshot.docs[0];
      const festivalData = festivalDoc.data();
      
      // Check if festival is still within date range
      const now = new Date();
      const startDate = new Date(festivalData.startDate);
      const endDate = new Date(festivalData.endDate);
      
      if (now >= startDate && now <= endDate) {
        return {
          id: festivalDoc.id,
          ...festivalData,
          createdAt: festivalData.createdAt?.toDate?.()?.toISOString() || festivalData.createdAt,
          updatedAt: festivalData.updatedAt?.toDate?.()?.toISOString() || festivalData.updatedAt
        } as Festival;
      } else if (now > endDate) {
        // Auto-deactivate expired festival
        await updateDoc(festivalDoc.ref, { isActive: false });
        return null;
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get all active festivals from Firestore
   */
  async getActiveFestivals(): Promise<Festival[]> {
    try {
      const festivalsRef = collection(db, 'festivals');
      const q = query(
        festivalsRef,
        where('isActive', '==', true),
        orderBy('priority', 'desc'),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const now = new Date();
      const activeFestivals: Festival[] = [];
      const batch = writeBatch(db);
      let hasExpiredFestivals = false;
      
      for (const festivalDoc of snapshot.docs) {
        const festivalData = festivalDoc.data();
        const startDate = new Date(festivalData.startDate);
        const endDate = new Date(festivalData.endDate);
        
        if (now >= startDate && now <= endDate) {
          activeFestivals.push({
            id: festivalDoc.id,
            ...festivalData,
            createdAt: festivalData.createdAt?.toDate?.()?.toISOString() || festivalData.createdAt,
            updatedAt: festivalData.updatedAt?.toDate?.()?.toISOString() || festivalData.updatedAt
          } as Festival);
        } else if (now > endDate) {
          // Mark expired festival for deactivation
          batch.update(festivalDoc.ref, { isActive: false });
          hasExpiredFestivals = true;
        }
      }
      
      // Commit batch update for expired festivals
      if (hasExpiredFestivals) {
        await batch.commit();
      }
      
      return activeFestivals;
    } catch (error) {
      console.error('Error fetching active festivals:', error);
      return [];
    }
  }

  /**
   * Get all festivals from Firestore
   */
  async getAllFestivals(): Promise<Festival[]> {
    try {
      const festivalsRef = collection(db, 'festivals');
      const q = query(festivalsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt
      })) as Festival[];
    } catch (error) {
      return [];
    }
  }

  /**
   * Create festival in Firestore
   */
  async createFestival(festivalData: {
    name: string;
    displayName: string;
    description: string;
    startDate: string;
    endDate: string;
    style: any;
  }): Promise<Festival> {
    const user = auth.currentUser;
    if (!user) throw new Error('Authentication required');

    // Deactivate other festivals first
    await this.deactivateAllFestivals();

    const docData = {
      name: festivalData.name,
      displayName: festivalData.displayName,
      description: festivalData.description || '',
      startDate: festivalData.startDate,
      endDate: festivalData.endDate,
      isActive: true,
      style: festivalData.style,
      assetIds: [],
      status: 'active',
      priority: 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: user.uid
    };

    const cleanDocData = this.removeUndefinedValues(docData);
    const docRef = await addDoc(collection(db, 'festivals'), cleanDocData);
    
    return {
      id: docRef.id,
      ...docData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as Festival;
  }

  /**
   * Update festival in Firestore
   */
  async updateFestival(festivalId: string, updates: Partial<Festival>): Promise<void> {
    const festivalRef = doc(db, 'festivals', festivalId);
    
    const cleanUpdates = this.removeUndefinedValues({
      ...updates,
      updatedAt: serverTimestamp()
    });
    
    await updateDoc(festivalRef, cleanUpdates);
  }

  /**
   * Delete festival from Firestore
   */
  async deleteFestival(festivalId: string): Promise<void> {
    const festivalRef = doc(db, 'festivals', festivalId);
    await deleteDoc(festivalRef);
  }

  /**
   * Toggle festival status
   */
  async toggleFestivalStatus(festivalId: string): Promise<void> {
    const festivalRef = doc(db, 'festivals', festivalId);
    const festivalDoc = await getDoc(festivalRef);
    
    if (!festivalDoc.exists()) {
      throw new Error('Festival not found');
    }

    const currentStatus = festivalDoc.data().isActive;
    
    if (!currentStatus) {
      await this.deactivateAllFestivals();
    }

    await updateDoc(festivalRef, {
      isActive: !currentStatus,
      updatedAt: serverTimestamp()
    });
  }

  /**
   * Upload asset to Firebase Storage and save metadata
   */
  async uploadAsset(file: File, assetType: 'banner' | 'poster' | 'video' | 'sticker'): Promise<AssetMetadata> {
    const user = auth.currentUser;
    if (!user) throw new Error('Authentication required');

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = file.name.toLowerCase().replace(/[^a-z0-9.-]/g, '_');
    const filename = `${assetType}_${timestamp}_${sanitizedName}`;
    
    // Upload to Firebase Storage
    const storagePath = `festival-assets/festivals/${filename}`;
    const storageRef = ref(storage, storagePath);
    
    const uploadResult = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(uploadResult.ref);
    
    // Create asset metadata
    const assetData = {
      name: file.name,
      originalName: file.name,
      type: assetType,
      category: 'festival' as const,
      mimeType: file.type,
      size: file.size,
      firebaseUrl: downloadURL,
      firebasePath: storagePath,
      isAnimated: file.type.startsWith('video/') || file.type === 'image/gif',
      tags: ['festival', 'banner', 'homepage'],
      description: `Uploaded ${assetType} asset`,
      festivalIds: [],
      templateIds: [],
      usageCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: user.uid,
      isPublic: false,
      status: 'active' as const
    };

    const docRef = await addDoc(collection(db, 'assetMetadata'), assetData);
    
    return {
      id: docRef.id,
      ...assetData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as AssetMetadata;
  }

  /**
   * Get available assets for festivals
   */
  async getAvailableAssets(): Promise<AssetMetadata[]> {
    try {
      const assetsRef = collection(db, 'assetMetadata');
      const q = query(
        assetsRef,
        where('category', '==', 'festival'),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt
      })) as AssetMetadata[];
    } catch (error) {
      return [];
    }
  }

  /**
   * Get assets for a specific festival
   */
  async getFestivalAssets(festivalId: string): Promise<AssetMetadata[]> {
    try {
      const assetsRef = collection(db, 'assetMetadata');
      const q = query(
        assetsRef,
        where('festivalIds', 'array-contains', festivalId),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt
      })) as AssetMetadata[];
    } catch (error) {
      return [];
    }
  }

  /**
   * Get asset by ID
   */
  async getAssetById(assetId: string): Promise<AssetMetadata | null> {
    try {
      const assetRef = doc(db, 'assetMetadata', assetId);
      const assetDoc = await getDoc(assetRef);
      
      if (!assetDoc.exists()) {
        return null;
      }

      const assetData = assetDoc.data();
      return {
        id: assetDoc.id,
        ...assetData,
        createdAt: assetData.createdAt?.toDate?.()?.toISOString() || assetData.createdAt,
        updatedAt: assetData.updatedAt?.toDate?.()?.toISOString() || assetData.updatedAt
      } as AssetMetadata;
    } catch (error) {
      return null;
    }
  }

  /**
   * Update asset metadata
   */
  async updateAsset(assetId: string, updates: Partial<AssetMetadata>): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('Authentication required');

    const assetRef = doc(db, 'assetMetadata', assetId);
    const cleanUpdates = this.removeUndefinedValues({
      ...updates,
      updatedAt: serverTimestamp()
    });
    
    await updateDoc(assetRef, cleanUpdates);
  }

  /**
   * Delete asset and its file from storage
   */
  async deleteAsset(assetId: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('Authentication required');

    const assetRef = doc(db, 'assetMetadata', assetId);
    const assetDoc = await getDoc(assetRef);
    
    if (!assetDoc.exists()) {
      throw new Error('Asset not found');
    }

    const assetData = assetDoc.data();
    
    // Delete file from Firebase Storage
    if (assetData.firebasePath) {
      try {
        const storageRef = ref(storage, assetData.firebasePath);
        await deleteObject(storageRef);
      } catch (storageError) {
        // Continue with metadata deletion even if file deletion fails
      }
    }

    await deleteDoc(assetRef);
  }

  /**
   * Replace asset file while keeping metadata
   */
  async replaceAsset(assetId: string, newFile: File): Promise<AssetMetadata> {
    const user = auth.currentUser;
    if (!user) throw new Error('Authentication required');

    const assetRef = doc(db, 'assetMetadata', assetId);
    const assetDoc = await getDoc(assetRef);
    
    if (!assetDoc.exists()) {
      throw new Error('Asset not found');
    }

    const existingAsset = assetDoc.data() as AssetMetadata;
    
    // Delete old file from storage
    if (existingAsset.firebasePath) {
      try {
        const oldStorageRef = ref(storage, existingAsset.firebasePath);
        await deleteObject(oldStorageRef);
      } catch (error) {
        // Continue with upload even if old file deletion fails
      }
    }

    // Upload new file
    const timestamp = Date.now();
    const sanitizedName = newFile.name.toLowerCase().replace(/[^a-z0-9.-]/g, '_');
    const filename = `${existingAsset.type}_${timestamp}_${sanitizedName}`;
    const storagePath = `festival-assets/festivals/${filename}`;
    const storageRef = ref(storage, storagePath);
    
    const uploadResult = await uploadBytes(storageRef, newFile);
    const downloadURL = await getDownloadURL(uploadResult.ref);

    const updates = {
      name: newFile.name,
      originalName: newFile.name,
      mimeType: newFile.type,
      size: newFile.size,
      firebaseUrl: downloadURL,
      firebasePath: storagePath,
      isAnimated: newFile.type.startsWith('video/') || newFile.type === 'image/gif',
      updatedAt: serverTimestamp()
    };

    await updateDoc(assetRef, this.removeUndefinedValues(updates));
    
    return {
      ...existingAsset,
      ...updates,
      id: assetId,
      updatedAt: new Date().toISOString()
    } as AssetMetadata;
  }

  /**
   * Duplicate an asset
   */
  async duplicateAsset(assetId: string): Promise<AssetMetadata> {
    const user = auth.currentUser;
    if (!user) throw new Error('Authentication required');

    const originalAsset = await this.getAssetById(assetId);
    if (!originalAsset) {
      throw new Error('Asset not found');
    }

    const newAssetData = {
      name: `Copy of ${originalAsset.name}`,
      originalName: `Copy of ${originalAsset.originalName}`,
      type: originalAsset.type,
      category: originalAsset.category,
      mimeType: originalAsset.mimeType,
      size: originalAsset.size,
      firebaseUrl: originalAsset.firebaseUrl,
      firebasePath: originalAsset.firebasePath,
      isAnimated: originalAsset.isAnimated,
      tags: [...(originalAsset.tags || [])],
      description: `Copy of ${originalAsset.description}`,
      festivalIds: [],
      templateIds: [],
      usageCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: user.uid,
      isPublic: originalAsset.isPublic,
      status: 'active' as const
    };

    const docRef = await addDoc(collection(db, 'assetMetadata'), this.removeUndefinedValues(newAssetData));
    
    return {
      id: docRef.id,
      ...newAssetData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as AssetMetadata;
  }

  /**
   * Link an asset to a festival
   */
  async linkAssetToFestival(assetId: string, festivalId: string): Promise<void> {
    const assetRef = doc(db, 'assetMetadata', assetId);
    const assetDoc = await getDoc(assetRef);
    
    if (!assetDoc.exists()) {
      return;
    }

    const assetData = assetDoc.data();
    const currentFestivalIds = assetData.festivalIds || [];
    
    if (!currentFestivalIds.includes(festivalId)) {
      await updateDoc(assetRef, {
        festivalIds: [...currentFestivalIds, festivalId],
        updatedAt: serverTimestamp()
      });
    }
  }

  /**
   * Deactivate all festivals
   */
  private async deactivateAllFestivals(): Promise<void> {
    try {
      const festivalsRef = collection(db, 'festivals');
      const q = query(festivalsRef, where('isActive', '==', true));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const batch = writeBatch(db);
        snapshot.docs.forEach(doc => {
          batch.update(doc.ref, { isActive: false });
        });
        await batch.commit();
      }
    } catch (error) {
      // Silently handle error
    }
  }

  /**
   * Remove undefined values from an object recursively
   */
  private removeUndefinedValues(obj: any): any {
    if (obj === null || obj === undefined) {
      return null;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.removeUndefinedValues(item));
    }
    
    if (typeof obj === 'object') {
      const cleaned: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
          cleaned[key] = this.removeUndefinedValues(value);
        }
      }
      return cleaned;
    }
    
    return obj;
  }
}

export const festivalService = FestivalService.getInstance();