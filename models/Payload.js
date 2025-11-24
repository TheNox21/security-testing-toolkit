const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const payloadSchema = new mongoose.Schema({
  // Unique identifier for the payload
  id: {
    type: String,
    default: uuidv4,
    unique: true
  },
  
  // User who owns this payload
  userId: {
    type: String,
    required: true,
    index: true
  },
  
  // Payload name/description
  name: {
    type: String,
    required: true
  },
  
  // The actual payload script
  script: {
    type: String,
    required: true
  },
  
  // Obfuscated version of the payload
  obfuscatedScript: {
    type: String
  },
  
  // Payload configuration
  config: {
    collectUrl: { type: Boolean, default: true },
    collectIp: { type: Boolean, default: true },
    collectUserAgent: { type: Boolean, default: true },
    collectCookies: { type: Boolean, default: true },
    collectLocalStorage: { type: Boolean, default: true },
    collectSessionStorage: { type: Boolean, default: true },
    collectDom: { type: Boolean, default: true },
    collectOrigin: { type: Boolean, default: true },
    collectReferer: { type: Boolean, default: true },
    takeScreenshot: { type: Boolean, default: true },
    customFields: { type: Map, of: String }
  },
  
  // Tags for categorizing payloads
  tags: [{
    type: String
  }],
  
  // Whether this is a persistent payload
  isPersistent: {
    type: Boolean,
    default: false
  },
  
  // Whitelisted domains (payload will only trigger on these domains)
  whitelistedDomains: [{
    type: String
  }],
  
  // Blacklisted domains (payload will not trigger on these domains)
  blacklistedDomains: [{
    type: String
  }],
  
  // Number of times this payload has been triggered
  triggerCount: {
    type: Number,
    default: 0
  },
  
  // Last time this payload was triggered
  lastTriggeredAt: {
    type: Date
  },
  
  // Whether the payload is active
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for querying payloads by user ID
payloadSchema.index({ userId: 1 });

// Index for querying active payloads
payloadSchema.index({ isActive: 1 });

module.exports = mongoose.model('Payload', payloadSchema);