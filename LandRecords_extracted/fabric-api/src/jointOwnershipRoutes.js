const express = require('express');
const router = express.Router();
const fabricClient = require('./fabricClient');

// 1. POST /api/land/joint - Create joint ownership application
router.post('/joint', async (req, res) => {
  try {
    const { applicationId, owners, primaryOwner, ...otherData } = req.body;
    
    if (!applicationId || !owners || !Array.isArray(owners)) {
      return res.status(400).json({ error: 'Application ID and owners array are required' });
    }

    const totalShare = owners.reduce((s, o) => s + parseFloat(o.sharePercent || 0), 0);
    if (Math.abs(totalShare - 100) > 0.01) {
        return res.status(400).json({ error: `Shares must total 100%. Got: ${totalShare}%` });
    }

    const username = primaryOwner || 'admin-registration';
    await fabricClient.connect(username);
    
    const userData = { ...otherData, primaryOwner, ownershipType: 'joint', owners };
    
    const response = await fabricClient.createApplication(username, applicationId, userData);
    const result = JSON.parse(response.result);
    
    res.json({
      success: true,
      data: result,
      txId: response.txId,
      message: 'Joint application created successfully'
    });
  } catch(e) { 
      res.status(500).json({ error: e.message }); 
  }
});

// 2. POST /api/land/:id/consent - Co-owner gives consent
router.post('/:id/consent', async (req, res) => {
  try {
    const { ownerId, remarks, username } = req.body;
    if (!ownerId) return res.status(400).json({ error: 'ownerId is required' });

    const caller = username || 'admin-registration';
    await fabricClient.connect(caller);
    
    const response = await fabricClient.submitTransaction(caller, 'addCoOwnerConsent', req.params.id, ownerId, JSON.stringify({ remarks: remarks || 'Consent given' }));
    const result = JSON.parse(response.result);
    
    res.json({ success: true, data: result, txId: response.txId });
  } catch(e) { 
      res.status(500).json({ error: e.message }); 
  }
});

// 3. POST /api/land/:id/transfer-share - Transfer Ownership
router.post('/:id/transfer-share', async (req, res) => {
  try {
    const { fromOwnerId, toOwnerId, sharePercent, newOwnerData, username } = req.body;
    const caller = username || 'admin-registration';
    await fabricClient.connect(caller);
    
    const response = await fabricClient.submitTransaction(caller, 'transferOwnershipShare', req.params.id, fromOwnerId, toOwnerId, sharePercent.toString(), JSON.stringify(newOwnerData || {}));
    const result = JSON.parse(response.result);
    
    res.json({ success: true, data: result, txId: response.txId });
  } catch(e) { 
      res.status(500).json({ error: e.message }); 
  }
});

// 4. POST /api/land/:id/dispute - Raise ownership dispute
router.post('/:id/dispute', async (req, res) => {
  try {
    const { raisedBy, reason, username } = req.body;
    const caller = username || 'admin-registration';
    await fabricClient.connect(caller);
    
    const response = await fabricClient.submitTransaction(caller, 'raiseOwnershipDispute', req.params.id, raisedBy, reason || 'Dispute raised');
    const result = JSON.parse(response.result);
    
    res.json({ success: true, data: result, txId: response.txId });
  } catch(e) { 
      res.status(500).json({ error: e.message }); 
  }
});

// 5. PUT /api/land/:id/dispute/resolve - Collector resolves dispute
router.put('/:id/dispute/resolve', async (req, res) => {
  try {
    const { decision, action, orderNumber, updatedOwners, username } = req.body;
    const caller = username || 'admin-collector'; // Requires Org3
    await fabricClient.connect(caller);
    
    const resolutionData = { decision, action, orderNumber, updatedOwners };
    const response = await fabricClient.submitTransaction(caller, 'resolveOwnershipDispute', req.params.id, JSON.stringify(resolutionData));
    const result = JSON.parse(response.result);
    
    res.json({ success: true, data: result, txId: response.txId });
  } catch(e) { 
      res.status(500).json({ error: e.message }); 
  }
});

// 6. GET /api/land/:id/owners - Get ownership details
router.get('/:id/owners', async (req, res) => {
  try {
    const caller = req.query.username || 'admin-registration';
    await fabricClient.connect(caller);
    
    const responseStr = await fabricClient.evaluateTransaction(caller, 'getOwnershipDetails', req.params.id);
    const result = JSON.parse(responseStr);
    
    res.json({ success: true, data: result });
  } catch(e) { 
      res.status(500).json({ error: e.message }); 
  }
});

module.exports = router;
