const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const Payload = require('../models/Payload');
const { calculateConfidenceScore } = require('../utils/confidenceCalculator');
const { detectDuplicate } = require('../utils/duplicateDetector');
const { verifyReport } = require('../utils/verifier');
const config = require('../config');
const axios = require('axios');

// Webhook endpoint for external integrations
router.post('/:service', async (req, res) => {
  try {
    const service = req.params.service;
    const payload = req.body;
    
    // Process webhook based on service type
    switch (service) {
      case 'slack':
        await handleSlackWebhook(payload);
        break;
      case 'discord':
        await handleDiscordWebhook(payload);
        break;
      case 'custom':
        await handleCustomWebhook(payload);
        break;
      default:
        return res.status(400).json({ error: 'Unsupported webhook service' });
    }
    
    res.status(200).json({ message: 'Webhook processed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Handle incoming Slack webhook
async function handleSlackWebhook(payload) {
  // Extract relevant information from Slack payload
  // This would typically involve parsing the Slack message format
  // and converting it to our report format
  
  // For now, we'll just log it
  console.log('Slack webhook received:', payload);
}

// Handle incoming Discord webhook
async function handleDiscordWebhook(payload) {
  // Extract relevant information from Discord payload
  console.log('Discord webhook received:', payload);
}

// Handle custom webhook
async function handleCustomWebhook(payload) {
  // Process custom webhook payload
  console.log('Custom webhook received:', payload);
}

// Endpoint for external systems to send XSS reports
router.post('/reports', async (req, res) => {
  try {
    const reportData = req.body;
    
    // Validate required fields
    if (!reportData.payloadId || !reportData.url) {
      return res.status(400).json({ error: 'payloadId and url are required' });
    }
    
    // Verify payload exists
    const payload = await Payload.findById(reportData.payloadId);
    if (!payload) {
      return res.status(400).json({ error: 'Invalid payloadId' });
    }
    
    // Check for duplicates
    const isDuplicate = await detectDuplicate(reportData);
    if (isDuplicate) {
      return res.status(200).json({ message: 'Duplicate report ignored' });
    }
    
    // Calculate confidence score
    const confidenceScore = await calculateConfidenceScore(reportData);
    reportData.confidenceScore = confidenceScore;
    
    // Generate duplicate hash
    reportData.duplicateHash = generateDuplicateHash(reportData);
    
    const report = new Report(reportData);
    await report.save();
    
    // Perform multi-stage verification if enabled
    let verificationResult = null;
    if (config.security.enableMultiStageVerification) {
      verificationResult = await verifyReport(report);
      report.verificationStatus = verificationResult.verified ? 'verified' : 'false_positive';
      
      // If verification failed but confidence is high, mark for review
      if (!verificationResult.verified && confidenceScore >= 80) {
        report.verificationStatus = 'needs_review';
      }
    } else {
      // Set verification status based on confidence score only
      if (confidenceScore >= 90) {
        report.verificationStatus = 'verified';
      } else if (confidenceScore >= 70) {
        report.verificationStatus = 'needs_review';
      } else {
        report.verificationStatus = 'false_positive';
      }
    }
    
    await report.save();
    
    // Trigger alerts if confidence is high enough and verified
    if (confidenceScore >= 80 && report.verificationStatus === 'verified') {
      // TODO: Implement alerting system
      console.log(`High confidence XSS report received via webhook: ${report.id} (Score: ${confidenceScore})`);
    }
    
    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to generate duplicate hash
function generateDuplicateHash(reportData) {
  // Create a hash based on key identifying fields
  const data = {
    url: reportData.url,
    userAgent: reportData.userAgent,
    origin: reportData.origin
  };
  
  // Simple hash function (in production, use a proper hashing algorithm)
  return JSON.stringify(data).split('').reduce((a,b) => (((a << 5) - a) + b.charCodeAt(0))|0, 0).toString();
}

module.exports = router;