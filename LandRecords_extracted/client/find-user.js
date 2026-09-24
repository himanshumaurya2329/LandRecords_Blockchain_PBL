const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://rajeshbyreddy95:hB1LShLnluhQ4c2V@cluster0.qfvs3zb.mongodb.net/eland-records?retryWrites=true&w=majority&appName=Cluster0';

async function findUserByEmail() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');
    const user = await User.findOne({ email: 'rajeshbyreddy95@gmail.com' }).lean();
    
    if (user) {
      console.log('User found:');
      console.log('ID:', user._id.toString());
      console.log('Email:', user.email);
      console.log('Name:', user.firstName, user.lastName);
      
      // Check sessions for this user
      const Session = mongoose.model('Session', new mongoose.Schema({}, { strict: false }), 'sessions');
      const sessions = await Session.find({ userId: user._id.toString() }).lean();
      
      console.log('\nSessions for this user:', sessions.length);
      if (sessions.length > 0) {
        console.log('Session tokens:');
        sessions.forEach(s => {
          console.log('-', s.sessionToken);
        });
      }
      
      // Try to find applications by session token
      const LandRequest = mongoose.model('LandRequest', new mongoose.Schema({}, { strict: false }), 'landrequests');
      const allApps = await LandRequest.find({}).select('receiptNumber createdBy email phoneNumber').lean();
      
      console.log('\n=== All Applications ===');
      allApps.forEach(app => {
        console.log(`${app.receiptNumber}`);
        console.log(`  createdBy: ${app.createdBy}`);
        console.log(`  email: ${app.email}`);
        console.log(`  phone: ${app.phoneNumber}`);
      });
      
      // Try matching by email
      const appsByEmail = await LandRequest.find({ email: user.email }).lean();
      console.log(`\nApplications with email ${user.email}:`, appsByEmail.length);
      
    } else {
      console.log('User not found');
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

findUserByEmail();
