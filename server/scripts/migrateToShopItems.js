const admin = require('firebase-admin');

// Initialize Firebase Admin if not already done
if (!admin.apps.length) {
  const serviceAccount = require('../serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

/**
 * Migration script to move all items from global 'items' collection 
 * to shop-specific subcollections: shops/{shopId}/items/{itemId}
 */

async function migrateToShopItems() {
  console.log('🚀 Starting migration to shop-specific items structure...\n');

  try {
    // Step 1: Get all items from global collection
    console.log('📋 Step 1: Fetching all items from global collection...');
    const globalItemsSnapshot = await db.collection('items').get();
    console.log(`Found ${globalItemsSnapshot.size} items in global collection\n`);

    if (globalItemsSnapshot.size === 0) {
      console.log('✅ No items found in global collection. Migration not needed.');
      return;
    }

    // Step 2: Group items by shopId
    const itemsByShop = {};
    const itemsWithoutShop = [];

    globalItemsSnapshot.docs.forEach(doc => {
      const itemData = doc.data();
      const shopId = itemData.shopId;

      if (shopId) {
        if (!itemsByShop[shopId]) {
          itemsByShop[shopId] = [];
        }
        itemsByShop[shopId].push({
          id: doc.id,
          data: itemData
        });
      } else {
        itemsWithoutShop.push({
          id: doc.id,
          data: itemData
        });
      }
    });

    console.log(`📊 Items grouped by shop:`);
    Object.keys(itemsByShop).forEach(shopId => {
      console.log(`  - Shop ${shopId}: ${itemsByShop[shopId].length} items`);
    });
    
    if (itemsWithoutShop.length > 0) {
      console.log(`  - Items without shopId: ${itemsWithoutShop.length}`);
    }
    console.log();

    // Step 3: Migrate items to shop subcollections
    console.log('🔄 Step 3: Migrating items to shop subcollections...');
    
    for (const [shopId, items] of Object.entries(itemsByShop)) {
      console.log(`\n📦 Migrating ${items.length} items for shop: ${shopId}`);
      
      // Verify shop exists
      const shopDoc = await db.collection('shops').doc(shopId).get();
      if (!shopDoc.exists) {
        console.log(`⚠️  Shop ${shopId} not found, skipping items...`);
        continue;
      }

      const batch = db.batch();
      let batchCount = 0;

      for (const item of items) {
        // Create new document in shop's items subcollection
        const newItemRef = db.collection('shops').doc(shopId).collection('items').doc(item.id);
        
        // Clean up the data (remove shopId since it's implicit in the path)
        const cleanedData = { ...item.data };
        delete cleanedData.shopId;
        
        batch.set(newItemRef, cleanedData);
        batchCount++;

        // Commit batch every 500 operations (Firestore limit)
        if (batchCount >= 500) {
          await batch.commit();
          console.log(`  ✅ Committed batch of ${batchCount} items`);
          batchCount = 0;
        }
      }

      // Commit remaining items
      if (batchCount > 0) {
        await batch.commit();
        console.log(`  ✅ Committed final batch of ${batchCount} items`);
      }

      console.log(`✅ Successfully migrated ${items.length} items for shop ${shopId}`);
    }

    // Step 4: Handle items without shopId
    if (itemsWithoutShop.length > 0) {
      console.log(`\n⚠️  Found ${itemsWithoutShop.length} items without shopId:`);
      itemsWithoutShop.forEach(item => {
        console.log(`  - Item ${item.id}: ${item.data.name || 'No name'}`);
      });
      console.log('These items will remain in the global collection for manual review.');
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Update your application code to use shop subcollections');
    console.log('2. Test the new structure thoroughly');
    console.log('3. Once confirmed working, clean up the global items collection');
    console.log('4. Update Firestore security rules');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Cleanup function to remove migrated items from global collection
async function cleanupGlobalItems() {
  console.log('🧹 Starting cleanup of global items collection...\n');

  try {
    const globalItemsSnapshot = await db.collection('items').get();
    console.log(`Found ${globalItemsSnapshot.size} items to potentially clean up`);

    const batch = db.batch();
    let deleteCount = 0;

    for (const doc of globalItemsSnapshot.docs) {
      const itemData = doc.data();
      
      // Only delete items that have a shopId (meaning they were migrated)
      if (itemData.shopId) {
        // Verify the item exists in the shop subcollection
        const shopItemRef = db.collection('shops').doc(itemData.shopId).collection('items').doc(doc.id);
        const shopItemDoc = await shopItemRef.get();
        
        if (shopItemDoc.exists) {
          batch.delete(doc.ref);
          deleteCount++;
          
          if (deleteCount >= 500) {
            await batch.commit();
            console.log(`✅ Deleted batch of ${deleteCount} items`);
            deleteCount = 0;
          }
        }
      }
    }

    if (deleteCount > 0) {
      await batch.commit();
      console.log(`✅ Deleted final batch of ${deleteCount} items`);
    }

    console.log('🎉 Cleanup completed successfully!');

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    throw error;
  }
}

// Run migration
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'cleanup') {
    cleanupGlobalItems()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  } else {
    migrateToShopItems()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  }
}

module.exports = { migrateToShopItems, cleanupGlobalItems };