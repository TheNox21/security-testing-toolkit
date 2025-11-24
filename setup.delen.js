#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('Setting up Delen Private Bank XSS Detection Tool...');

// Check if .env file exists, if not create it
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  const envContent = `
# Server Configuration
PORT=3000
HOST=localhost

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/delen_xss

# Security Settings
MIN_CONFIDENCE_SCORE=85
ENABLE_MULTI_STAGE_VERIFICATION=true
DUPLICATE_DETECTION_WINDOW=600
ENABLE_ML_CLASSIFICATION=true

# Payload Settings
PAYLOAD_OBFUSCATION_LEVEL=3

# Reporting Settings
ENABLE_DEDUPLICATION=true
`;
  
  fs.writeFileSync(envPath, envContent.trim());
  console.log('Created .env file with default settings');
}

// Check if logs directory exists, if not create it
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
  console.log('Created logs directory');
}

// Check if config.json exists, if not copy from sample
const configPath = path.join(__dirname, 'config.json');
const configSamplePath = path.join(__dirname, 'config.sample.json');
if (!fs.existsSync(configPath) && fs.existsSync(configSamplePath)) {
  fs.copyFileSync(configSamplePath, configPath);
  console.log('Created config.json from sample');
}

console.log('Setup complete! You can now start the server with: npm run start-delen');
console.log('Or generate payloads with: delen-blind-xss generate-payload -u YOUR_USER_ID -n "Payload Name"');