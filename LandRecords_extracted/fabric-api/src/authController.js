const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fabricClient = require('./fabricClient');
const { isValidUser, getOrgForUser } = require('./userOrgMap');

const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Mock user database (in production, use real database)
const users = {
  // Org1 users
  'admin-registration': { password: 'adminpw', role: 'admin', org: 'org1' },
  'user_portal': { password: 'portal123', role: 'user', org: 'org1' },
  'clerk1': { password: 'clerk123', role: 'clerk', org: 'org1' },
  'superintendent1': { password: 'super123', role: 'superintendent', org: 'org1' },
  'project_officer1': { password: 'project123', role: 'project_officer', org: 'org1' },

  // Org2 users
  'admin-revenue': { password: 'adminpw', role: 'admin', org: 'org2' },
  'mro1': { password: 'mro123', role: 'mro', org: 'org2' },
  'vro1': { password: 'vro123', role: 'vro', org: 'org2' },
  'survey1': { password: 'survey123', role: 'surveyor', org: 'org2' },
  'revenue_officer1': { password: 'revenue123', role: 'revenue_officer', org: 'org2' },
  'revenue_dept1': { password: 'dept123', role: 'revenue_dept', org: 'org2' },

  // Org3 users
  'admin-collector': { password: 'adminpw', role: 'admin', org: 'org3' },
  'joint_collector1': { password: 'joint123', role: 'joint_collector', org: 'org3' },
  'collector1': { password: 'collector123', role: 'collector', org: 'org3' },
  'mw1': { password: 'mw123', role: 'mw', org: 'org3' }
};

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'land-registration-jwt-secret';

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Check if user exists
    if (!isValidUser(username)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[username];

    // Verify password (in production, use proper password hashing)
    if (password !== user.password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Connect to Fabric network
    try {
      await fabricClient.connect(username);
    } catch (fabricError) {
      console.error('Fabric connection failed:', fabricError);
      return res.status(500).json({ error: 'Failed to connect to blockchain network' });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        username,
        role: user.role,
        org: user.org,
        orgNumber: user.org.replace('org', '')
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
        username,
        role: user.role,
        org: user.org,
        orgNumber: user.org.replace('org', '')
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user info
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        username: req.user.username,
        role: req.user.role,
        org: req.user.org,
        orgNumber: req.user.org.replace('org', '')
      }
    });
  } catch (error) {
    console.error('Get user info error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

// Logout
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // In a stateless JWT system, logout is handled client-side
    // by removing the token from client storage
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Logout endpoint
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    const username = decoded.username;

    // Disconnect from Fabric network
    await fabricClient.disconnect(username);

    res.json({ success: true, message: 'Logged out successfully' });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user profile
router.get('/profile', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);

    res.json({
      success: true,
      user: {
        username: decoded.username,
        role: decoded.role,
        org: decoded.org,
        orgNumber: decoded.orgNumber
      }
    });

  } catch (error) {
    console.error('Profile error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = {
  router,
  authenticateToken
};