const { admin } = require('../firebaseAdmin');

/**
 * Script to list all users with admin custom claims
 * Usage: node scripts/listAdminUsers.js
 */

async function listAdminUsers() {
  try {
    console.log('🔍 Searching for admin users...\n');
    
    let adminUsers = [];
    let nextPageToken;
    
    do {
      // List users in batches
      const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
      
      // Check each user for admin claims
      for (const userRecord of listUsersResult.users) {
        if (userRecord.customClaims && userRecord.customClaims.admin === true) {
          adminUsers.push({
            uid: userRecord.uid,
            email: userRecord.email,
            displayName: userRecord.displayName,
            emailVerified: userRecord.emailVerified,
            disabled: userRecord.disabled,
            creationTime: userRecord.metadata.creationTime,
            lastSignInTime: userRecord.metadata.lastSignInTime
          });
        }
      }
      
      nextPageToken = listUsersResult.pageToken;
    } while (nextPageToken);
    
    if (adminUsers.length === 0) {
      console.log('❌ No users found with admin claims');
      console.log('\nTo set admin claims for a user, run:');
      console.log('node scripts/setAdminClaims.js <email>');
    } else {
      console.log(`✅ Found ${adminUsers.length} admin user(s):\n`);
      
      adminUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email || 'No email'}`);
        console.log(`   UID: ${user.uid}`);
        console.log(`   Display Name: ${user.displayName || 'Not set'}`);
        console.log(`   Email Verified: ${user.emailVerified}`);
        console.log(`   Account Status: ${user.disabled ? 'Disabled' : 'Active'}`);
        console.log(`   Created: ${user.creationTime}`);
        console.log(`   Last Sign In: ${user.lastSignInTime || 'Never'}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Error listing admin users:', error);
  }
}

listAdminUsers()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });