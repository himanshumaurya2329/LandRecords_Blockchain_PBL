const express = require('express');
const fabricClient = require('./fabricClient');

const router = express.Router();

// Get all land applications
router.get('/applications', async (req, res) => {
  try {
    // Connect to fabric network first
    await fabricClient.connect('user_portal');

    // Use admin user for queries
    const applications = await fabricClient.getAllLandRequests('user_portal');

    res.json({
      success: true,
      data: applications
    });

  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// Get applications by email
router.get('/applications/email/:email', async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Connect to fabric network first
    await fabricClient.connect('user_portal');

    // Get all applications and filter by email
    const allApplications = await fabricClient.getAllLandRequests('user_portal');

    // Filter applications by email (blockchain returns {Key, Record} format)
    const userApplications = allApplications.filter(app => {
      const record = app.Record || app;
      const userData = record.userData || record;
      return userData.email && userData.email.toLowerCase() === email.toLowerCase();
    });

    res.json({
      success: true,
      data: userApplications
    });

  } catch (error) {
    console.error('Get applications by email error:', error);
    res.status(500).json({ error: 'Failed to fetch applications by email' });
  }
});

// Create new land application
router.post('/applications', async (req, res) => {
  try {
    const { applicationId, userData } = req.body;

    if (!applicationId || !userData) {
      return res.status(400).json({ error: 'Application ID and user data are required' });
    }

    // Connect to fabric network first
    await fabricClient.connect('admin-registration');

    // Use admin user for creating applications
    const response = await fabricClient.createApplication('admin-registration', applicationId, userData);
    const result = JSON.parse(response.result);

    res.json({
      success: true,
      data: result,
      txId: response.txId,
      message: 'Application created successfully'
    });

  } catch (error) {
    console.error('Create application error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create application',
      details: error.stack
    });
  }
});

// Verify application by revenue department
router.post('/applications/:id/verify', async (req, res) => {
  try {
    const { id } = req.params;
    const { officerData } = req.body;

    if (!officerData) {
      return res.status(400).json({ error: 'Officer data is required' });
    }

    // For now, get username from request body (passed from dashboard)
    // TODO: Implement proper authentication
    const username = 'admin-registration'; // Use admin-registration for all operations (Org1)

    // Connect to fabric network
    await fabricClient.connect(username);

    // Perform verification
    const response = await fabricClient.verifyByRevenue(username, id, officerData);
    const result = JSON.parse(response.result);

    res.json({
      success: true,
      data: result,
      txId: response.txId,
      message: 'Application verified successfully'
    });

  } catch (error) {
    console.error('Verify application error:', error);
    res.status(500).json({ error: error.message || 'Failed to verify application' });
  }
});

// Update survey report
router.post('/applications/:id/survey', async (req, res) => {
  try {
    const { id } = req.params;
    const { surveyData } = req.body;

    if (!surveyData) {
      return res.status(400).json({ error: 'Survey data is required' });
    }

    // For now, get username from request body (passed from dashboard)
    // TODO: Implement proper authentication
    const username = 'admin-registration'; // Use admin-registration for all operations (Org1)

    // Connect to fabric network
    await fabricClient.connect(username);

    // Perform survey update
    const response = await fabricClient.surveyReportUpdate(username, id, surveyData);
    const result = JSON.parse(response.result);

    res.json({
      success: true,
      data: result,
      txId: response.txId,
      message: 'Survey report updated successfully'
    });

  } catch (error) {
    console.error('Survey report update error:', error);
    res.status(500).json({ error: error.message || 'Failed to update survey report' });
  }
});

// Forward application to next stage
router.post('/applications/:id/forward', async (req, res) => {
  try {
    const { id } = req.params;
    const { forwardData } = req.body;

    if (!forwardData) {
      return res.status(400).json({ error: 'Forward data is required' });
    }

    // For now, get username from request body (passed from dashboard)
    // TODO: Implement proper authentication
    const username = forwardData.username || 'admin-registration'; // Use username from forwardData or admin as fallback

    // Connect to fabric network
    await fabricClient.connect(username);

    // Perform forward
    const response = await fabricClient.forwardApplication(username, id, forwardData);
    const result = JSON.parse(response.result);

    res.json({
      success: true,
      data: result,
      txId: response.txId,
      message: 'Application forwarded successfully'
    });

  } catch (error) {
    console.error('Forward application error:', error);
    res.status(500).json({ error: error.message || 'Failed to forward application' });
  }
});

// Approve application by collector
router.post('/applications/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { approvalData } = req.body;

    if (!approvalData) {
      return res.status(400).json({ error: 'Approval data is required' });
    }

    // For now, get username from request body (passed from dashboard)
    // TODO: Implement proper authentication
    const username = 'admin-registration'; // Use admin-registration for all operations (Org1)

    // Connect to fabric network
    await fabricClient.connect(username);

    // Perform approval
    const response = await fabricClient.approveByCollector(username, id, approvalData);
    const result = JSON.parse(response.result);

    res.json({
      success: true,
      data: result,
      txId: response.txId,
      message: 'Application approved successfully'
    });

  } catch (error) {
    console.error('Approve application error:', error);
    res.status(500).json({ error: error.message || 'Failed to approve application' });
  }
});

// Record DigiLocker document integrity
router.post('/digilocker/record', async (req, res) => {
  try {
    const { docHash, ipfsHash, aadharNumber, requestId, officialId } = req.body;

    if (!docHash || !ipfsHash || !aadharNumber || !requestId || !officialId) {
      return res.status(400).json({ error: 'Missing required fields for integrity record' });
    }

    const username = 'admin-registration'; // Default to admin for recording

    // Connect to fabric network
    await fabricClient.connect(username);

    // Perform recording
    const result = await fabricClient.recordDocumentIntegrity(username, docHash, ipfsHash, aadharNumber, requestId, officialId);

    res.json({
      success: true,
      data: result,
      message: 'Document integrity recorded successfully'
    });

  } catch (error) {
    console.error('Record integrity error:', error);
    res.status(500).json({ error: error.message || 'Failed to record document integrity' });
  }
});

module.exports = router;