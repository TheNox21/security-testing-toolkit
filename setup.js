/**
 * Setup script for Advanced Blind XSS tool
 * 
 * This script initializes the database and creates sample data for testing.
 */

const mongoose = require('mongoose');
const Payload = require('./models/Payload');
const Report = require('./models/Report');
require('dotenv').config();

async function setup() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/advanced_blind_xss', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB');
    
    // Clear existing data (optional)
    // await Payload.deleteMany({});
    // await Report.deleteMany({});
    
    // Create a sample payload
    const samplePayload = new Payload({
      userId: 'test-user-1',
      name: 'Sample Payload',
      script: 'alert("Sample Payload");',
      obfuscatedScript: 'alert("Sample Payload");',
      config: {
        collectUrl: true,
        collectIp: true,
        collectUserAgent: true,
        collectCookies: true,
        collectLocalStorage: true,
        collectSessionStorage: true,
        collectDom: true,
        collectOrigin: true,
        collectReferer: true,
        takeScreenshot: true
      },
      tags: ['sample', 'test'],
      isPersistent: false,
      whitelistedDomains: [],
      blacklistedDomains: [],
      isActive: true
    });
    
    await samplePayload.save();
    console.log('Sample payload created:', samplePayload.id);
    
    // Create a sample report
    const sampleReport = new Report({
      payloadId: samplePayload.id,
      confidenceScore: 95,
      verificationStatus: 'verified',
      url: 'http://example.com/test.php?id=123',
      ip: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      referer: 'http://google.com',
      origin: 'http://example.com',
      cookies: { session: 'abc123' },
      localStorage: { token: 'xyz789' },
      dom: '<html><body><h1>Test Page</h1><p>This is a test payload execution</p></body></html>',
      duplicateHash: 'sample-hash'
    });
    
    await sampleReport.save();
    console.log('Sample report created:', sampleReport.id);
    
    console.log('Setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Setup failed:', error.message);
    process.exit(1);
  }
}

// Run setup if this script is executed directly
if (require.main === module) {
  setup();
}

module.exports = setup;