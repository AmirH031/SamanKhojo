const { admin } = require('../firebaseAdmin');

/**
 * Script to set admin custom claims for a user
 * Usage: node scripts/setAdminClaims.js <email>
 */

async function setAdminClaims(email) {
  try {
    // Get user by email
    const userRecord = await admin.auth().getUserByEmail(email);
    
    // Set custom claims
    await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true });
    
    console.log(`✅ Admin claims set successfully for ${email}`);
    console.log(`User UID: ${userRecord.uid}`);
    
    // Verify the claims were set
    const updatedUser = await admin.auth().getUser(userRecord.uid);
    console.log('Custom claims:', updatedUser.customClaims);
    
  } catch (error) {
    console.error('❌ Error setting admin claims:', error);
    
    if (error.code === 'auth/user-not-found') {
      console.error('User not found. Make sure the user has signed up first.');
    }
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error('Usage: node scripts/setAdminClaims.js <email>');
  process.exit(1);
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  console.error('Invalid email format');
  process.exit(1);
}

setAdminClaims(email)
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });