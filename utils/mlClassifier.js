/**
 * Machine Learning Classifier for XSS Detection
 * 
 * This module uses a simple classification algorithm to determine
 * the likelihood that a payload execution is a genuine XSS vulnerability
 * rather than a false positive.
 */

const fs = require('fs');
const path = require('path');
const config = require('../config');

// Simple ML model for demonstration
// In a real implementation, this would be a trained model
class XSSClassifier {
  constructor() {
    this.model = this.loadModel();
  }
  
  /**
   * Load the ML model from file
   */
  loadModel() {
    try {
      const modelPath = path.resolve(config.ml.modelPath || './models/xss_classifier.json');
      if (fs.existsSync(modelPath)) {
        const modelData = fs.readFileSync(modelPath, 'utf8');
        return JSON.parse(modelData);
      } else {
        // Return a simple default model
        return this.createDefaultModel();
      }
    } catch (error) {
      console.warn('Failed to load ML model, using default:', error.message);
      return this.createDefaultModel();
    }
  }
  
  /**
   * Create a default simple model
   */
  createDefaultModel() {
    return {
      weights: {
        url_length: 0.1,
        user_agent_length: 0.05,
        cookie_count: 0.2,
        dom_size: 0.15,
        referer_present: 0.1,
        origin_present: 0.1,
        screenshot_size: 0.1,
        automation_indicators: -0.3,
        static_resource: -0.25
      },
      bias: 0.5
    };
  }
  
  /**
   * Extract features from report data
   */
  extractFeatures(reportData) {
    const features = {};
    
    // URL length
    features.url_length = reportData.url ? reportData.url.length : 0;
    
    // User agent length
    features.user_agent_length = reportData.userAgent ? reportData.userAgent.length : 0;
    
    // Cookie count
    features.cookie_count = reportData.cookies ? Object.keys(reportData.cookies).length : 0;
    
    // DOM size
    features.dom_size = reportData.dom ? reportData.dom.length : 0;
    
    // Referer present
    features.referer_present = reportData.referer ? 1 : 0;
    
    // Origin present
    features.origin_present = reportData.origin ? 1 : 0;
    
    // Screenshot size
    features.screenshot_size = reportData.screenshot ? reportData.screenshot.length : 0;
    
    // Automation indicators
    features.automation_indicators = this.detectAutomation(reportData);
    
    // Static resource flag
    features.static_resource = this.isStaticResource(reportData.url) ? 1 : 0;
    
    return features;
  }
  
  /**
   * Detect automation indicators
   */
  detectAutomation(reportData) {
    let score = 0;
    
    // Check User-Agent for automation tools
    if (reportData.userAgent) {
      const automationPatterns = [
        /python/i,
        /java/i,
        /node\.js/i,
        /axios/i,
        /postman/i,
        /insomnia/i,
        /bot/i,
        /crawler/i,
        /spider/i
      ];
      
      for (const pattern of automationPatterns) {
        if (pattern.test(reportData.userAgent)) {
          score += 1;
          break;
        }
      }
    }
    
    return score;
  }
  
  /**
   * Check if URL points to a static resource
   */
  isStaticResource(url) {
    if (!url) return false;
    
    const staticPatterns = [
      /\.css(\?.*)?$/i,
      /\.js(\?.*)?$/i,
      /\.png$/i,
      /\.jpg$/i,
      /\.jpeg$/i,
      /\.gif$/i,
      /\.svg$/i,
      /\.ico$/i,
      /\.woff$/i,
      /\.woff2$/i,
      /\.ttf$/i
    ];
    
    for (const pattern of staticPatterns) {
      if (pattern.test(url)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Classify a report as XSS or false positive
   */
  classify(reportData) {
    if (!config.security.enableMLClassification) {
      return 0.5; // Neutral score if ML is disabled
    }
    
    const features = this.extractFeatures(reportData);
    let score = this.model.bias;
    
    // Apply weights to features
    for (const [feature, weight] of Object.entries(this.model.weights)) {
      if (features[feature] !== undefined) {
        score += features[feature] * weight;
      }
    }
    
    // Normalize to 0-1 range using sigmoid function
    const normalizedScore = 1 / (1 + Math.exp(-score));
    
    return normalizedScore;
  }
  
  /**
   * Convert ML score to confidence score (0-100)
   */
  toConfidenceScore(mlScore) {
    return Math.round(mlScore * 100);
  }
}

// Create a singleton instance
const classifier = new XSSClassifier();

/**
 * Classify a report using the ML model
 */
function classifyReport(reportData) {
  const mlScore = classifier.classify(reportData);
  return classifier.toConfidenceScore(mlScore);
}

module.exports = {
  classifyReport,
  XSSClassifier
};