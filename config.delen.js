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
    minConfidenceScore: process.env.MIN_CONFIDENCE_SCORE || 85,
    
    // Enable multi-stage verification
    enableMultiStageVerification: process.env.ENABLE_MULTI_STAGE_VERIFICATION || true,
    
    // Time window for duplicate detection (in seconds)
    duplicateDetectionWindow: process.env.DUPLICATE_DETECTION_WINDOW || 600,
    
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
      takeScreenshot: true,
      // Banking-specific collections
      collectBankingData: true,
      collectFinancialForms: true
    },
    
    // Payload obfuscation level (0-3)
    obfuscationLevel: process.env.PAYLOAD_OBFUSCATION_LEVEL || 3,
    
    // Banking-specific domains
    delenDomains: [
      'api.digital.delen.be',
      'api.digital.delen.lu',
      'app.delen.be',
      'app.delen.ch',
      'app.delen.lu',
      'auth.digital.delen.be',
      'auth.digital.delen.lu',
      'login.delen.be',
      'login.delen.ch',
      'login.delen.lu',
      'login.oyens.com',
      'status.delen.be',
      'sts.delen.be',
      'www.cadelam.be',
      'www.cadelux.lu',
      'www.delen.bank',
      'www.delen.be'
    ]
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
    },
    
    // Banking-specific reporting
    bankingAlerts: {
      highValueData: true,
      credentialCollection: true,
      transactionData: true
    }
  },
  
  // Machine learning settings
  ml: {
    // Path to ML model
    modelPath: process.env.ML_MODEL_PATH || './models/delen_xss_classifier.json',
    
    // Features to use for classification
    features: [
      'url_length',
      'user_agent_length',
      'cookie_count',
      'dom_size',
      'referer_present',
      'origin_present',
      'screenshot_size',
      'banking_keywords',
      'financial_data_patterns',
      'form_fields_count'
    ]
  },
  
  // Delen Private Bank specific settings
  delen: {
    // Severity thresholds aligned with Intigriti program
    severityThresholds: {
      exceptional: 95,  // 9.5-10.0 rating
      critical: 90,     // 9.0-9.4 rating
      high: 80,         // 7.0-8.9 rating
      medium: 70,       // 4.0-6.9 rating
      low: 60           // 0.1-3.9 rating
    },
    
    // Target domains for focused scanning
    targetDomains: [
      'delen.be',
      'delen.lu',
      'delen.ch',
      'cadelam.be',
      'cadelux.lu',
      'delen.bank'
    ],
    
    // Out-of-scope patterns to avoid
    outOfScopePatterns: [
      'wordpress',
      'third-party-service',
      'cdn.',
      'static.'
    ]
  }
};