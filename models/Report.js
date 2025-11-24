const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const reportSchema = new mongoose.Schema({
  // Unique identifier for the report
  id: {
    type: String,
    default: uuidv4,
    unique: true
  },
  
  // Payload that triggered the report
  payloadId: {
    type: String,
    required: true,
    index: true
  },
  
  // Confidence score (0-100) indicating likelihood of being a true positive
  confidenceScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  
  // Verification status
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'false_positive', 'needs_review'],
    default: 'pending'
  },
  
  // Timestamp when the payload was triggered
  triggeredAt: {
    type: Date,
    default: Date.now
  },
  
  // URL where the payload was triggered
  url: {
    type: String,
    required: true
  },
  
  // IP address of the client
  ip: {
    type: String
  },
  
  // User agent of the client
  userAgent: {
    type: String
  },
  
  // Referrer information
  referer: {
    type: String
  },
  
  // Origin of the page
  origin: {
    type: String
  },
  
  // Cookies (non-httpOnly)
  cookies: {
    type: Map,
    of: String
  },
  
  // Local storage data
  localStorage: {
    type: Map,
    of: String
  },
  
  // Session storage data
  sessionStorage: {
    type: Map,
    of: String
  },
  
  // DOM content
  dom: {
    type: String
  },
  
  // Screenshot (base64 encoded)
  screenshot: {
    type: String
  },
  
  // Custom fields
  customFields: {
    type: Map,
    of: String
  },
  
  // Verification attempts
  verificationAttempts: {
    type: Number,
    default: 0
  },
  
  // Duplicate hash for deduplication
  duplicateHash: {
    type: String,
    index: true
  }
}, {
  timestamps: true
});

// Index for querying reports by payload ID
reportSchema.index({ payloadId: 1 });

// Index for querying reports by verification status
reportSchema.index({ verificationStatus: 1 });

// Index for querying reports by confidence score
reportSchema.index({ confidenceScore: 1 });

// Index for querying recent reports
reportSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema);