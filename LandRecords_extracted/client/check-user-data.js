const mongoose = require('mongoose');
// Load .env.local (Next.js style) then fallback to .env
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

// Now reads from your .env.local MONGODB_URI automatically
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/elandrecords';

async function checkUserData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Get a user
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');
    const users = await User.find({}, '_id email firstName lastName').limit(5).lean();
    
    console.log('=== USERS ===');
    users.forEach(user => {
      console.log(`ID: ${user._id}`);
      console.log(`Email: ${user.email}`);
      console.log(`Name: ${user.firstName} ${user.lastName}`);
      console.log('---');
    });

    // Get applications
    const LandRequest = mongoose.model('LandRequest', new mongoose.Schema({}, { strict: false }), 'landrequests');
    const apps = await LandRequest.find({}, 'receiptNumber createdBy status').limit(5).lean();
    
    console.log('\n=== APPLICATIONS ===');
    apps.forEach(app => {
      console.log(`Receipt: ${app.receiptNumber}`);
      console.log(`CreatedBy: ${app.createdBy} (type: ${typeof app.createdBy})`);
      console.log(`Status: ${app.status}`);
      console.log('---');
    });

    // Check if createdBy matches user IDs
    if (users.length > 0 && apps.length > 0) {
      const userId = users[0]._id.toString();
      const userApps = await LandRequest.find({ createdBy: userId }).lean();
      console.log(`\n=== Applications by User ${userId} ===`);
      console.log(`Found: ${userApps.length} applications`);
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUserData();
