const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
// Load .env.local (Next.js style) then fallback to .env
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

// Admin Schema (same as in the model)
const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['super_admin', 'admin'],
    default: 'admin',
  },
}, {
  timestamps: true,
});

// Hash password before saving
adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
adminSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const Admin = mongoose.model('Admin', adminSchema);

async function createDefaultAdmin() {
  try {
    // Connect to MongoDB
    // Uses MONGODB_URI from .env.local — eland-records was old hardcoded name, now using Atlas
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/elandrecords';
    console.log('Connecting to:', uri.replace(/:([^@]+)@/, ':****@')); // hide password in logs
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: 'admin@elandrecords.gov' });
    if (existingAdmin) {
      console.log('Default admin already exists');
      return;
    }

    // Create default admin
    const defaultAdmin = new Admin({
      username: 'admin',
      email: 'admin@elandrecords.gov',
      password: 'admin123',
      role: 'super_admin',
    });

    await defaultAdmin.save();
    console.log('Default admin created successfully!');
    console.log('Email: admin@elandrecords.gov');
    console.log('Password: admin123');

  } catch (error) {
    console.error('Error creating default admin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createDefaultAdmin();