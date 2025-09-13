const { admin } = require('../firebaseAdmin');

/**
 * Script to remove admin custom claims from a user
 * Usage: node scripts/removeAdminClaims.js <email>
 */

async function removeAdminClaims(email) {
  try {
    // Get user by email
    const userRecord = await admin.auth().getUserByEmail(email);
    
    // Remove custom claims by setting them to null
    await admin.auth().setCustomUserClaims(userRecord.uid, { admin: null });
    
    console.log(`✅ Admin claims removed successfully for ${email}`);
    console.log(`User UID: ${userRecord.uid}`);
    
    // Verify the claims were removed
    const updatedUser = await admin.auth().getUser(userRecord.uid);
    console.log('Custom claims:', updatedUser.customClaims);
    
  } catch (error) {
    console.error('❌ Error removing admin claims:', error);
    
    if (error.code === 'auth/user-not-found') {
      console.error('User not found.');
    }
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error('Usage: node scripts/removeAdminClaims.js <email>');
  process.exit(1);
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  console.error('Invalid email format');
  process.exit(1);
}

removeAdminClaims(email)
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });