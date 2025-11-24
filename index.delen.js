const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const winston = require('winston');
const path = require('path');
require('dotenv').config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// In-memory storage for reports and payloads
const reports = [];
const payloads = [];

// Security middleware
app.use(helmet());
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.File({ filename: 'logs/delen.log' }) // Specialized log for Delen
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Mock MongoDB connection
logger.info('Using in-memory storage for testing purposes');

// Routes for payloads
app.post('/api/payloads', (req, res) => {
  try {
    const payload = {
      id: Date.now().toString(),
      userId: req.body.userId,
      name: req.body.name,
      script: req.body.script,
      obfuscatedScript: req.body.obfuscatedScript,
      config: req.body.config || {},
      tags: req.body.tags || [],
      isPersistent: req.body.isPersistent || false,
      whitelistedDomains: req.body.whitelistedDomains || [],
      blacklistedDomains: req.body.blacklistedDomains || [],
      triggerCount: 0,
      lastTriggeredAt: null,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    payloads.push(payload);
    res.status(201).json(payload);
  } catch (error) {
    logger.error('Error creating payload:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/payloads', (req, res) => {
  try {
    const { userId } = req.query;
    let filteredPayloads = payloads;
    
    if (userId) {
      filteredPayloads = payloads.filter(p => p.userId === userId);
    }
    
    res.json(filteredPayloads);
  } catch (error) {
    logger.error('Error listing payloads:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/payloads/:id/script', (req, res) => {
  try {
    const payload = payloads.find(p => p.id === req.params.id);
    if (!payload) {
      return res.status(404).json({ error: 'Payload not found' });
    }
    
    res.send(payload.script);
  } catch (error) {
    logger.error('Error getting payload script:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Routes for reports
app.post('/api/reports', async (req, res) => {
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
    
    // Simple duplicate detection
    const isDuplicate = reports.some(r => 
      r.url === reportData.url && 
      r.userAgent === reportData.userAgent &&
      Date.now() - new Date(r.createdAt).getTime() < 600000 // 10 minutes
    );
      
    if (isDuplicate) {
      return res.status(200).json({ message: 'Duplicate report ignored' });
    }
    
    // Simple confidence scoring for testing
    let confidenceScore = 50;
    if (reportData.url) confidenceScore += 10;
    if (reportData.userAgent) confidenceScore += 5;
    if (reportData.ip) confidenceScore += 5;
    if (reportData.cookies) confidenceScore += 10;
    if (reportData.dom) confidenceScore += 15;
    
    // Boost for Delen reports
    if (isDelenReport) confidenceScore += 20;
    
    // Cap at 100
    confidenceScore = Math.min(100, confidenceScore);
    
    const report = {
      id: Date.now().toString(),
      payloadId: reportData.payloadId || 'test-payload',
      confidenceScore,
      verificationStatus: confidenceScore >= 85 ? 'verified' : confidenceScore >= 70 ? 'needs_review' : 'false_positive',
      triggeredAt: new Date(),
      url: reportData.url,
      ip: reportData.ip,
      userAgent: reportData.userAgent,
      referer: reportData.referer,
      origin: reportData.origin,
      cookies: reportData.cookies,
      localStorage: reportData.localStorage,
      sessionStorage: reportData.sessionStorage,
      dom: reportData.dom,
      screenshot: reportData.screenshot,
      customFields: reportData.customFields,
      verificationAttempts: 0,
      duplicateHash: `${reportData.url}-${reportData.userAgent}`,
      bankingData: reportData.bankingData,
      financialForms: reportData.financialForms,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    reports.push(report);
    
    // Log high confidence reports
    if (confidenceScore >= 80 && report.verificationStatus === 'verified') {
      logger.info(`High confidence XSS report received: ${report.id} (Score: ${confidenceScore})`);
    }
    
    res.status(201).json(report);
  } catch (error) {
    logger.error('Error creating report:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/reports', (req, res) => {
  try {
    const { 
      payloadId, 
      verificationStatus, 
      minConfidenceScore,
      limit = 50,
      offset = 0
    } = req.query;
    
    let filteredReports = [...reports].reverse(); // Most recent first
    
    if (payloadId) {
      filteredReports = filteredReports.filter(r => r.payloadId === payloadId);
    }
    
    if (verificationStatus) {
      filteredReports = filteredReports.filter(r => r.verificationStatus === verificationStatus);
    }
    
    if (minConfidenceScore) {
      filteredReports = filteredReports.filter(r => r.confidenceScore >= parseInt(minConfidenceScore));
    }
    
    const totalCount = filteredReports.length;
    const paginatedReports = filteredReports.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
    
    res.json({
      reports: paginatedReports,
      totalCount,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    logger.error('Error listing reports:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/reports/:id', (req, res) => {
  try {
    const report = reports.find(r => r.id === req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    res.json(report);
  } catch (error) {
    logger.error('Error getting report:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Webhook routes
app.post('/api/webhooks/:id', (req, res) => {
  try {
    // Simple webhook handler
    res.status(200).json({ message: 'Webhook received' });
  } catch (error) {
    logger.error('Error handling webhook:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Dashboard endpoint
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Specialized endpoint for Delen Private Bank status
app.get('/delen-status', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    service: 'Delen Private Bank XSS Detection Service',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    reports: reports.length,
    payloads: payloads.length
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Delen Private Bank XSS Detection server running on port ${PORT}`);
});

module.exports = app;