/**
 * Check Firestore Data and Add Test Data if Needed
 */

require('dotenv').config();
const { db } = require('../firebaseAdmin');

async function checkFirestoreData() {
  console.log('🔍 Checking Firestore Collections...\n');

  try {
    // Check shops collection
    console.log('1. Checking shops collection:');
    const shopsSnapshot = await db.collection('shops').limit(5).get();
    console.log(`   Found ${shopsSnapshot.size} shops`);
    
    if (shopsSnapshot.size > 0) {
      const firstShop = shopsSnapshot.docs[0].data();
      console.log('   Sample shop:', {
        id: shopsSnapshot.docs[0].id,
        shopName: firstShop.shopName,
        type: firstShop.type,
        address: firstShop.address
      });
    }

    // Check items collection
    console.log('\n2. Checking items collection:');
    const itemsSnapshot = await db.collection('items').limit(5).get();
    console.log(`   Found ${itemsSnapshot.size} items`);
    
    if (itemsSnapshot.size > 0) {
      const firstItem = itemsSnapshot.docs[0].data();
      console.log('   Sample item:', {
        id: itemsSnapshot.docs[0].id,
        name: firstItem.name,
        hindi_name: firstItem.hindi_name,
        category: firstItem.category,
        price: firstItem.price
      });
    }

    // If no data found, add test data
    if (shopsSnapshot.size === 0 && itemsSnapshot.size === 0) {
      console.log('\n❌ No data found in Firestore. Adding test data...');
      await addTestData();
    } else {
      console.log('\n✅ Firestore has data. Testing search...');
      await testSearch();
    }

  } catch (error) {
    console.error('❌ Error checking Firestore:', error);
  }
}

async function addTestData() {
  try {
    console.log('📝 Adding test shops...');
    
    // Add test shops
    const testShops = [
      {
        shopName: 'Sharma General Store',
        type: 'grocery',
        address: 'Main Market, Bhanpura',
        phone: '+91-9876543210',
        location: { lat: 24.5204, lng: 76.4644 },
        items: ['rice', 'chawal', 'basmati', 'oil', 'sugar']
      },
      {
        shopName: 'Quality Rice Shop',
        type: 'grocery',
        address: 'Station Road, Bhanpura',
        phone: '+91-9876543211',
        location: { lat: 24.5214, lng: 76.4654 },
        items: ['basmati rice', 'sona masuri', 'brown rice']
      },
      {
        shopName: 'Mobile World',
        type: 'electronics',
        address: 'Electronics Market, Bhanpura',
        phone: '+91-9876543212',
        location: { lat: 24.5224, lng: 76.4664 },
        items: ['mobile phone', 'smartphone', 'accessories']
      }
    ];

    const shopRefs = [];
    for (const shop of testShops) {
      const shopRef = await db.collection('shops').add(shop);
      shopRefs.push({ id: shopRef.id, ...shop });
      console.log(`   Added shop: ${shop.shopName}`);
    }

    console.log('\n📦 Adding test items...');
    
    // Add test items
    const testItems = [
      {
        name: 'Basmati Rice Premium',
        hindi_name: 'बासमती चावल प्रीमियम',
        category: 'grocery',
        type: 'food',
        price: '₹180/kg',
        shopId: shopRefs[0].id,
        inStock: 50,
        availability: true,
        variety: 'premium'
      },
      {
        name: 'India Gate Basmati',
        hindi_name: 'इंडिया गेट बासमती',
        category: 'grocery',
        type: 'food',
        price: '₹220/kg',
        shopId: shopRefs[1].id,
        inStock: 30,
        availability: true,
        variety: 'branded'
      },
      {
        name: 'Cooking Oil',
        hindi_name: 'खाना पकाने का तेल',
        category: 'grocery',
        type: 'food',
        price: '₹150/L',
        shopId: shopRefs[0].id,
        inStock: 25,
        availability: true
      },
      {
        name: 'Samsung Galaxy',
        hindi_name: 'सैमसंग गैलेक्सी',
        category: 'electronics',
        type: 'mobile',
        price: '₹15,000',
        shopId: shopRefs[2].id,
        inStock: 5,
        availability: true
      }
    ];

    for (const item of testItems) {
      await db.collection('items').add(item);
      console.log(`   Added item: ${item.name}`);
    }

    console.log('\n✅ Test data added successfully!');
    
    // Test search after adding data
    await testSearch();

  } catch (error) {
    console.error('❌ Error adding test data:', error);
  }
}

async function testSearch() {
  try {
    console.log('\n🧪 Testing search functionality...');
    
    const { searchShopsAndItems } = require('../firestore/searchEngine');
    
    const testQueries = [
      ['basmati', 'chawal'],
      ['rice'],
      ['mobile', 'phone'],
      ['cooking', 'oil']
    ];

    for (const keywords of testQueries) {
      console.log(`\n   Testing: ${keywords.join(' ')}`);
      const results = await searchShopsAndItems(keywords, { limit: 3 });
      console.log(`   Results: ${results.length}`);
      
      if (results.length > 0) {
        results.forEach((result, index) => {
          console.log(`     ${index + 1}. ${result.name || result.shopName} (${result.type})`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error testing search:', error);
  }
}

// Run the check
if (require.main === module) {
  checkFirestoreData().catch(console.error);
}

module.exports = { checkFirestoreData, addTestData };