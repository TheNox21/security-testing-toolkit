/**
 * Multi-stage verification system for XSS reports
 * 
 * This module implements a multi-stage verification process to reduce
 * false positives by requiring multiple conditions to be met before
 * confirming an XSS vulnerability.
 */

const axios = require('axios');
const Report = require('../models/Report');
const config = require('../config');

/**
 * Perform multi-stage verification of an XSS report
 * @param {Object} report - The report to verify
 * @returns {Promise<Object>} Verification result
 */
async function verifyReport(report) {
  if (!config.security.enableMultiStageVerification) {
    return {
      verified: true,
      confidence: report.confidenceScore,
      stages: []
    };
  }
  
  const stages = [];
  let passedStages = 0;
  let totalStages = 0;
  
  // Stage 1: Temporal consistency check
  totalStages++;
  const temporalResult = await checkTemporalConsistency(report);
  stages.push({
    name: 'Temporal Consistency',
    passed: temporalResult.passed,
    details: temporalResult.details
  });
  
  if (temporalResult.passed) passedStages++;
  
  // Stage 2: Data integrity check
  totalStages++;
  const integrityResult = await checkDataIntegrity(report);
  stages.push({
    name: 'Data Integrity',
    passed: integrityResult.passed,
    details: integrityResult.details
  });
  
  if (integrityResult.passed) passedStages++;
  
  // Stage 3: Behavioral analysis
  totalStages++;
  const behavioralResult = await analyzeBehavior(report);
  stages.push({
    name: 'Behavioral Analysis',
    passed: behavioralResult.passed,
    details: behavioralResult.details
  });
  
  if (behavioralResult.passed) passedStages++;
  
  // Calculate verification confidence
  const verificationConfidence = Math.round((passedStages / totalStages) * 100);
  
  return {
    verified: passedStages >= 2, // Require at least 2 stages to pass
    confidence: verificationConfidence,
    stages
  };
}

/**
 * Check temporal consistency of the report
 */
async function checkTemporalConsistency(report) {
  try {
    // Check if we've seen similar reports recently
    const timeWindow = 300; // 5 minutes
    const cutoffTime = new Date(Date.now() - timeWindow * 1000);
    
    const similarReports = await Report.find({
      url: report.url,
      userAgent: report.userAgent,
      createdAt: { $gte: cutoffTime }
    }).limit(5);
    
    // If we have multiple similar reports in a short time, it might be automated
    if (similarReports.length > 3) {
      return {
        passed: false,
        details: `Too many similar reports (${similarReports.length}) in short time window`
      };
    }
    
    return {
      passed: true,
      details: `Acceptable report frequency (${similarReports.length} similar reports)`
    };
  } catch (error) {
    return {
      passed: false,
      details: `Error during temporal consistency check: ${error.message}`
    };
  }
}

/**
 * Check data integrity of the report
 */
async function checkDataIntegrity(report) {
  try {
    // Check for realistic data combinations
    const issues = [];
    
    // Check if DOM data is realistic
    if (report.dom && report.dom.length < 50) {
      issues.push('DOM data is unusually small');
    }
    
    // Check if we have a realistic user agent
    if (report.userAgent && report.userAgent.length < 20) {
      issues.push('User agent is unusually short');
    }
    
    // Check for conflicting data
    if (report.userAgent && report.dom) {
      // If we have a browser user agent but no DOM content, that's suspicious
      const isBrowser = /mozilla|chrome|firefox|safari|edge/i.test(report.userAgent);
      if (isBrowser && (!report.dom || report.dom.length < 100)) {
        issues.push('Browser user agent with minimal DOM content');
      }
    }
    
    return {
      passed: issues.length === 0,
      details: issues.length === 0 ? 'Data integrity check passed' : `Issues found: ${issues.join(', ')}`
    };
  } catch (error) {
    return {
      passed: false,
      details: `Error during data integrity check: ${error.message}`
    };
  }
}

/**
 * Analyze behavioral patterns
 */
async function analyzeBehavior(report) {
  try {
    // Check if the reported URL is accessible
    let urlAccessible = true;
    let urlResponse = null;
    
    try {
      urlResponse = await axios.get(report.url, { 
        timeout: 5000,
        validateStatus: () => true // Don't reject on non-2xx status codes
      });
    } catch (error) {
      urlAccessible = false;
    }
    
    // Analyze the findings
    const issues = [];
    
    // If the URL is not accessible, it might be a false positive
    if (!urlAccessible) {
      issues.push('Reported URL is not accessible');
    }
    
    // If we have a response, check if it's a web page
    if (urlResponse && urlResponse.headers) {
      const contentType = urlResponse.headers['content-type'];
      if (contentType && !contentType.includes('text/html')) {
        issues.push('Reported URL does not return HTML content');
      }
    }
    
    return {
      passed: issues.length === 0,
      details: issues.length === 0 ? 'Behavioral analysis passed' : `Issues found: ${issues.join(', ')}`
    };
  } catch (error) {
    return {
      passed: false,
      details: `Error during behavioral analysis: ${error.message}`
    };
  }
}

/**
 * Re-verify a report with updated information
 */
async function reverifyReport(reportId) {
  try {
    const report = await Report.findById(reportId);
    if (!report) {
      throw new Error('Report not found');
    }
    
    const verificationResult = await verifyReport(report);
    
    // Update the report with verification results
    report.verificationStatus = verificationResult.verified ? 'verified' : 'false_positive';
    report.verificationAttempts = report.verificationAttempts + 1;
    
    await report.save();
    
    return verificationResult;
  } catch (error) {
    throw new Error(`Re-verification failed: ${error.message}`);
  }
}

module.exports = {
  verifyReport,
  reverifyReport
};