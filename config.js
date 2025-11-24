module.exports = {
  // Server configuration
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost'
  },
  
  // Database configuration
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/advanced_blind_xss'
  },
  
  // Security settings
  security: {
    // Minimum confidence score required to report a finding (0-100)
    minConfidenceScore: process.env.MIN_CONFIDENCE_SCORE || 80,
    
    // Enable multi-stage verification
    enableMultiStageVerification: process.env.ENABLE_MULTI_STAGE_VERIFICATION || true,
    
    // Time window for duplicate detection (in seconds)
    duplicateDetectionWindow: process.env.DUPLICATE_DETECTION_WINDOW || 300,
    
    // Enable machine learning classification
    enableMLClassification: process.env.ENABLE_ML_CLASSIFICATION || true
  },
  
  // Payload settings
  payloads: {
    // Default payload generation options
    defaultOptions: {
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
    
    // Payload obfuscation level (0-3)
    obfuscationLevel: process.env.PAYLOAD_OBFUSCATION_LEVEL || 2
  },
  
  // Reporting settings
  reporting: {
    // Enable deduplication of reports
    enableDeduplication: process.env.ENABLE_DEDUPLICATION || true,
    
    // Alerting channels
    alerts: {
      email: process.env.ALERT_EMAIL_ENABLED || false,
      slack: process.env.ALERT_SLACK_ENABLED || false,
      discord: process.env.ALERT_DISCORD_ENABLED || false,
      telegram: process.env.ALERT_TELEGRAM_ENABLED || false
    }
  },
  
  // Machine learning settings
  ml: {
    // Path to ML model
    modelPath: process.env.ML_MODEL_PATH || './models/xss_classifier.json',
    
    // Features to use for classification
    features: [
      'url_length',
      'user_agent_length',
      'cookie_count',
      'dom_size',
      'referer_present',
      'origin_present',
      'screenshot_size'
    ]
  }
};