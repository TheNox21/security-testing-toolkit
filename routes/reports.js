const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const { calculateConfidenceScore } = require('../utils/confidenceCalculator');
const { calculateDelenConfidenceScore } = require('../utils/delenConfidenceCalculator');
const { detectDuplicate } = require('../utils/duplicateDetector');
const { detectDelenDuplicate } = require('../utils/delenDuplicateDetector');
const { verifyReport } = require('../utils/verifier');
const { verifyDelenReport } = require('../utils/delenVerifier');
const config = require('../config');

// Get all reports
router.get('/', async (req, res) => {
  try {
    const { 
      payloadId, 
      verificationStatus, 
      minConfidenceScore,
      limit = 50,
      offset = 0
    } = req.query;
    
    const filter = {};
    
    if (payloadId) filter.payloadId = payloadId;
    if (verificationStatus) filter.verificationStatus = verificationStatus;
    if (minConfidenceScore) filter.confidenceScore = { $gte: parseInt(minConfidenceScore) };
    
    const reports = await Report.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));
      
    const totalCount = await Report.countDocuments(filter);
    
    res.json({
      reports,
      totalCount,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a specific report
router.get('/:id', async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new report (payload callback endpoint)
router.post('/', async (req, res) => {
  try {
    const reportData = req.body;
    
    // Check if this is a Delen Private Bank report by examining the URL
    const isDelenReport = reportData.url && (
      reportData.url.includes('delen.be') ||
      reportData.url.includes('delen.lu') ||
      reportData.url.includes('delen.ch') ||
      reportData.url.includes('cadelam.be') ||
      reportData.url.includes('cadelux.lu') ||
      reportData.url.includes('delen.bank')
    );
    
    // Use appropriate duplicate detection
    const isDuplicate = isDelenReport 
      ? await detectDelenDuplicate(reportData)
      : await detectDuplicate(reportData);
      
    if (isDuplicate) {
      return res.status(200).json({ message: 'Duplicate report ignored' });
    }
    
    // Calculate confidence score using appropriate calculator
    const confidenceScore = isDelenReport
      ? await calculateDelenConfidenceScore(reportData)
      : await calculateConfidenceScore(reportData);
      
    reportData.confidenceScore = confidenceScore;
    
    // Generate duplicate hash
    reportData.duplicateHash = generateDuplicateHash(reportData);
    
    const report = new Report(reportData);
    await report.save();
    
    // Perform multi-stage verification using appropriate verifier
    let verificationResult = null;
    if (config.security.enableMultiStageVerification) {
      verificationResult = isDelenReport
        ? await verifyDelenReport(report)
        : await verifyReport(report);
        
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
      console.log(`High confidence XSS report received: ${report.id} (Score: ${confidenceScore})`);
    }
    
    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a report
router.put('/:id', async (req, res) => {
  try {
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a report
router.delete('/:id', async (req, res) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id);
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    res.json({ message: 'Report deleted successfully' });
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