const express = require('express');
const router = express.Router();
const { db } = require('../firebaseAdmin');
const { batchTransliterate } = require('../services/transliterationService');
const { verifyAdmin, adminRateLimit } = require('../middleware/adminAuth');

// Helper function to process item data with auto-transliteration
function processItemData(data) {
    const processed = { ...data };

    // Auto-generate hindi_name if not provided and name is in English
    if (!processed.hindi_name || processed.hindi_name.trim() === '') {
        const transliterated = batchTransliterate([{
            name: processed.name,
            hindi_name: processed.hindi_name
        }]);
        processed.hindi_name = transliterated[0].hindi_name;
    }

    // Set default availability
    if (processed.availability === undefined && processed.isAvailable === undefined) {
        processed.availability = true;
    }

    // Sync availability and isAvailable
    if (processed.isAvailable !== undefined) {
        processed.availability = processed.isAvailable;
    }

    // Ensure price and inStock are numbers if provided
    if (processed.price && typeof processed.price === 'string') {
        processed.price = parseFloat(processed.price);
    }
    if (processed.inStock && typeof processed.inStock === 'string') {
        processed.inStock = parseFloat(processed.inStock);
    }

    return processed;
}

// Get items for a shop with optional filtering (NEW STRUCTURE)
router.get('/shop/:shopId', async (req, res) => {
    try {
        const { shopId } = req.params;
        const { type, category, available } = req.query;

        // Verify shop exists
        const shopDoc = await db.collection('shops').doc(shopId).get();
        if (!shopDoc.exists) {
            return res.status(404).json({ error: 'Shop not found' });
        }

        // Use shop-specific items subcollection
        let query = db.collection('shops').doc(shopId).collection('items');

        // Apply filters
        if (type && ['product', 'menu', 'service'].includes(type)) {
            query = query.where('type', '==', type);
        }

        if (category) {
            query = query.where('category', '==', category);
        }

        const snapshot = await query.get();
        let items = snapshot.docs.map(doc => ({
            id: doc.id,
            shopId, // Add shopId since it's implicit in the path
            ...doc.data()
        }));

        // Filter by availability if requested
        if (available === 'true') {
            items = items.filter(item => 
                item.availability !== false && item.isAvailable !== false
            );
        }

        // Group items by category
        const groupedItems = items.reduce((acc, item) => {
            const cat = item.category || 'Other';
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(item);
            return acc;
        }, {});

        res.json({
            items,
            groupedItems,
            categories: Object.keys(groupedItems).map(cat => ({
                name: cat,
                count: groupedItems[cat].length,
                items: groupedItems[cat]
            }))
        });
    } catch (error) {
        console.error('Get shop items error:', error);
        res.status(500).json({ error: 'Failed to fetch items' });
    }
});

// Get single item (NEW STRUCTURE)
router.get('/shop/:shopId/item/:itemId', async (req, res) => {
    try {
        const { shopId, itemId } = req.params;
        
        const itemDoc = await db.collection('shops').doc(shopId).collection('items').doc(itemId).get();
        if (!itemDoc.exists) {
            return res.status(404).json({ error: 'Item not found' });
        }

        const item = { 
            id: itemDoc.id, 
            shopId,
            ...itemDoc.data() 
        };
        res.json(item);
    } catch (error) {
        console.error('Get item error:', error);
        res.status(500).json({ error: 'Failed to fetch item' });
    }
});

// Add new item (Admin only) - NEW STRUCTURE
router.post('/shop/:shopId', adminRateLimit(100, 15 * 60 * 1000), verifyAdmin, async (req, res) => {
    try {
        const { shopId } = req.params;
        const itemData = req.body;

        // Verify shop exists
        const shopDoc = await db.collection('shops').doc(shopId).get();
        if (!shopDoc.exists) {
            return res.status(404).json({ error: 'Shop not found' });
        }

        // Validate required fields
        if (!itemData.name || !itemData.name.trim()) {
            return res.status(400).json({ error: 'Item name is required' });
        }

        if (!itemData.type || !['product', 'menu', 'service'].includes(itemData.type)) {
            return res.status(400).json({ error: 'Valid item type is required (product, menu, service)' });
        }

        // Type-specific validation
        if (itemData.type === 'product') {
            if (itemData.inStock === undefined || itemData.inStock === null) {
                return res.status(400).json({ error: 'Stock quantity is required for products' });
            }
            if (itemData.price === undefined || itemData.price === null) {
                return res.status(400).json({ error: 'Price is required for products' });
            }
        }

        // Process data with auto-transliteration
        const processedData = processItemData(itemData);

        // Remove undefined fields for Firestore compatibility
        const cleanedData = {};
        Object.entries(processedData).forEach(([key, value]) => {
            if (value !== undefined) {
                cleanedData[key] = value;
            }
        });

        // Use shop-specific items subcollection
        const docRef = await db.collection('shops').doc(shopId).collection('items').add({
            ...cleanedData,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        console.log(`✅ Item added to shop ${shopId}: ${processedData.name} (${processedData.type})`);
        res.json({ id: docRef.id, message: 'Item added successfully' });
    } catch (error) {
        console.error('Add item error:', error);
        res.status(500).json({ error: 'Failed to add item' });
    }
});

// Update item (Admin only) - NEW STRUCTURE
router.put('/shop/:shopId/item/:itemId', adminRateLimit(100, 15 * 60 * 1000), verifyAdmin, async (req, res) => {
    try {
        const { shopId, itemId } = req.params;
        const updates = req.body;

        // Get current item to check if hindi_name should be regenerated
        const itemRef = db.collection('shops').doc(shopId).collection('items').doc(itemId);
        const currentItem = await itemRef.get();

        if (!currentItem.exists) {
            return res.status(404).json({ error: 'Item not found' });
        }

        const currentData = currentItem.data();
        let processedUpdates = { ...updates };

        // Auto-regenerate hindi_name if it's empty and name is being updated
        if (updates.name && (!currentData.hindi_name || currentData.hindi_name.trim() === '')) {
            const transliterated = batchTransliterate([{
                name: updates.name,
                hindi_name: updates.hindi_name
            }]);
            processedUpdates.hindi_name = transliterated[0].hindi_name;
        }

        // Process updates
        processedUpdates = processItemData(processedUpdates);

        // Remove undefined fields for Firestore compatibility
        const cleanedUpdates = {};
        Object.entries(processedUpdates).forEach(([key, value]) => {
            if (value !== undefined) {
                cleanedUpdates[key] = value;
            }
        });

        await itemRef.update({
            ...cleanedUpdates,
            updatedAt: new Date()
        });

        console.log(`✅ Item updated in shop ${shopId}: ${itemId}`);
        res.json({ message: 'Item updated successfully' });
    } catch (error) {
        console.error('Update item error:', error);
        res.status(500).json({ error: 'Failed to update item' });
    }
});

// Delete item (Admin only) - NEW STRUCTURE
router.delete('/shop/:shopId/item/:itemId', adminRateLimit(50, 15 * 60 * 1000), verifyAdmin, async (req, res) => {
    try {
        const { shopId, itemId } = req.params;
        
        const itemRef = db.collection('shops').doc(shopId).collection('items').doc(itemId);
        const itemDoc = await itemRef.get();
        
        if (!itemDoc.exists) {
            return res.status(404).json({ error: 'Item not found' });
        }

        await itemRef.delete();
        console.log(`✅ Item deleted from shop ${shopId}: ${itemId}`);
        res.json({ message: 'Item deleted successfully' });
    } catch (error) {
        console.error('Delete item error:', error);
        res.status(500).json({ error: 'Failed to delete item' });
    }
});

// Bulk add items (Admin only) - NEW STRUCTURE
router.post('/shop/:shopId/bulk', adminRateLimit(10, 15 * 60 * 1000), verifyAdmin, async (req, res) => {
    try {
        const { shopId } = req.params;
        const { items } = req.body;

        // Verify shop exists
        const shopDoc = await db.collection('shops').doc(shopId).get();
        if (!shopDoc.exists) {
            return res.status(404).json({ error: 'Shop not found' });
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Items array is required' });
        }

        // Validate all items first
        const validationErrors = [];
        items.forEach((item, index) => {
            if (!item.name || !item.name.trim()) {
                validationErrors.push(`Row ${index + 1}: Item name is required`);
            }
            if (!item.type || !['product', 'menu', 'service'].includes(item.type)) {
                validationErrors.push(`Row ${index + 1}: Valid item type is required`);
            }
            if (item.type === 'product') {
                if (item.inStock === undefined || item.inStock === null) {
                    validationErrors.push(`Row ${index + 1}: Stock is required for products`);
                }
                if (item.price === undefined || item.price === null) {
                    validationErrors.push(`Row ${index + 1}: Price is required for products`);
                }
            }
        });

        if (validationErrors.length > 0) {
            return res.status(400).json({ 
                error: 'Validation errors', 
                details: validationErrors 
            });
        }

        // Process all items with auto-transliteration
        const processedItems = items.map(item => processItemData(item));

        // Use batch write for better performance
        const batch = db.batch();
        const itemsRef = db.collection('shops').doc(shopId).collection('items');

        processedItems.forEach(item => {
            const docRef = itemsRef.doc();
            
            // Remove undefined fields for Firestore compatibility
            const cleanedItem = {};
            Object.entries(item).forEach(([key, value]) => {
                if (value !== undefined) {
                    cleanedItem[key] = value;
                }
            });
            
            batch.set(docRef, {
                ...cleanedItem,
                createdAt: new Date(),
                updatedAt: new Date()
            });
        });

        await batch.commit();
        console.log(`✅ Bulk uploaded ${processedItems.length} items for shop ${shopId}`);
        res.json({ 
            message: `Successfully added ${processedItems.length} items`,
            count: processedItems.length 
        });
    } catch (error) {
        console.error('Bulk add items error:', error);
        res.status(500).json({ error: 'Failed to bulk add items' });
    }
});

// Search items within a shop - NEW STRUCTURE
router.get('/shop/:shopId/search/:query', async (req, res) => {
    try {
        const { shopId, query: searchQuery } = req.params;
        const { type } = req.query;

        // Verify shop exists
        const shopDoc = await db.collection('shops').doc(shopId).get();
        if (!shopDoc.exists) {
            return res.status(404).json({ error: 'Shop not found' });
        }

        let itemsQuery = db.collection('shops').doc(shopId).collection('items');

        if (type && ['product', 'menu', 'service'].includes(type)) {
            itemsQuery = itemsQuery.where('type', '==', type);
        }

        const snapshot = await itemsQuery.get();
        const allItems = snapshot.docs.map(doc => ({
            id: doc.id,
            shopId,
            ...doc.data()
        }));

        // Filter items by search query
        const query = searchQuery.toLowerCase();
        const filteredItems = allItems.filter(item =>
            (item.name && item.name.toLowerCase().includes(query)) ||
            (item.hindi_name && item.hindi_name.toLowerCase().includes(query)) ||
            (item.description && item.description.toLowerCase().includes(query)) ||
            (item.category && item.category.toLowerCase().includes(query)) ||
            (item.brand_name && item.brand_name.toLowerCase().includes(query)) ||
            (item.variety && item.variety.toLowerCase().includes(query)) ||
            (item.tags && item.tags.some(tag => tag.toLowerCase().includes(query)))
        );

        res.json({
            items: filteredItems,
            count: filteredItems.length,
            query: searchQuery,
            shopId
        });
    } catch (error) {
        console.error('Search items error:', error);
        res.status(500).json({ error: 'Failed to search items' });
    }
});

// Global search across all shops (using collection group query)
router.get('/search/:query', async (req, res) => {
    try {
        const { query: searchQuery } = req.params;
        const { type } = req.query;

        // Use collection group query to search across all shop items
        let itemsQuery = db.collectionGroup('items');

        if (type && ['product', 'menu', 'service'].includes(type)) {
            itemsQuery = itemsQuery.where('type', '==', type);
        }

        const snapshot = await itemsQuery.get();
        const allItems = snapshot.docs.map(doc => {
            // Extract shopId from document path: shops/{shopId}/items/{itemId}
            const pathParts = doc.ref.path.split('/');
            const shopId = pathParts[1];
            
            return {
                id: doc.id,
                shopId,
                ...doc.data()
            };
        });

        // Filter items by search query
        const query = searchQuery.toLowerCase();
        const filteredItems = allItems.filter(item =>
            (item.name && item.name.toLowerCase().includes(query)) ||
            (item.hindi_name && item.hindi_name.toLowerCase().includes(query)) ||
            (item.description && item.description.toLowerCase().includes(query)) ||
            (item.category && item.category.toLowerCase().includes(query)) ||
            (item.brand_name && item.brand_name.toLowerCase().includes(query)) ||
            (item.variety && item.variety.toLowerCase().includes(query)) ||
            (item.tags && item.tags.some(tag => tag.toLowerCase().includes(query)))
        );

        // Group by shop for better organization
        const itemsByShop = filteredItems.reduce((acc, item) => {
            if (!acc[item.shopId]) {
                acc[item.shopId] = [];
            }
            acc[item.shopId].push(item);
            return acc;
        }, {});

        res.json({
            items: filteredItems,
            itemsByShop,
            count: filteredItems.length,
            shopCount: Object.keys(itemsByShop).length,
            query: searchQuery
        });
    } catch (error) {
        console.error('Global search items error:', error);
        res.status(500).json({ error: 'Failed to search items' });
    }
});

// Legacy endpoints for backward compatibility
// These will redirect to the new structure

// Legacy: Get items for a shop
router.get('/', async (req, res) => {
    const { shopId } = req.query;
    if (shopId) {
        // Redirect to new endpoint
        return req.app._router.handle(req, res, () => {
            req.url = `/shop/${shopId}`;
            req.params = { shopId };
            router.handle(req, res);
        });
    }
    
    res.status(400).json({ 
        error: 'shopId parameter is required. Use /items/shop/:shopId instead.' 
    });
});

// Legacy: Get single item
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Search in shop subcollections
        const shopsSnapshot = await db.collection('shops').get();
        
        for (const shopDoc of shopsSnapshot.docs) {
            const itemDoc = await db.collection('shops').doc(shopDoc.id).collection('items').doc(id).get();
            if (itemDoc.exists) {
                const item = { 
                    id: itemDoc.id, 
                    shopId: shopDoc.id,
                    ...itemDoc.data() 
                };
                return res.json(item);
            }
        }

        res.status(404).json({ error: 'Item not found' });
    } catch (error) {
        console.error('Get item error:', error);
        res.status(500).json({ error: 'Failed to fetch item' });
    }
});

module.exports = router;