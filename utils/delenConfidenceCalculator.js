/**
 * Calculate confidence score for XSS reports targeting Delen Private Bank
 * 
 * This module implements specialized heuristics for financial institutions
 * to determine the likelihood that a reported payload execution is a 
 * genuine XSS vulnerability rather than a false positive.
 */

const { classifyReport } = require('./mlClassifier');

/**
 * Calculate a confidence score (0-100) for a reported XSS payload execution
 * @param {Object} reportData - The data from the payload execution
 * @returns {Promise<number>} Confidence score between 0 and 100
 */
async function calculateDelenConfidenceScore(reportData) {
  // Calculate heuristic-based score
  let heuristicScore = 50; // Base score
  
  // 1. Check if essential data is present
  if (reportData.url) heuristicScore += 10;
  if (reportData.userAgent) heuristicScore += 5;
  if (reportData.ip) heuristicScore += 5;
  
  // 2. Analyze URL characteristics for banking domains
  heuristicScore += analyzeBankingUrl(reportData.url);
  
  // 3. Analyze User-Agent
  heuristicScore += analyzeUserAgent(reportData.userAgent);
  
  // 4. Check for suspicious data patterns
  heuristicScore += analyzeDataPatterns(reportData);
  
  // 5. Check for browser artifacts (indicators of real browser execution)
  heuristicScore += checkBrowserArtifacts(reportData);
  
  // 6. Check for automation signatures (indicators of bots/testing tools)
  heuristicScore -= checkAutomationSignatures(reportData);
  
  // 7. Check data completeness
  heuristicScore += checkDataCompleteness(reportData);
  
  // 8. Check for known false positive patterns
  heuristicScore -= checkFalsePositivePatterns(reportData);
  
  // 9. Banking-specific checks
  heuristicScore += checkBankingIndicators(reportData);
  
  // Ensure heuristic score is between 0 and 100
  heuristicScore = Math.max(0, Math.min(100, Math.round(heuristicScore)));
  
  // Get ML-based score
  const mlScore = await classifyReport(reportData);
  
  // Combine heuristic and ML scores (weighted average)
  // 60% heuristic, 40% ML for banking context
  const finalScore = Math.round(heuristicScore * 0.6 + mlScore * 0.4);
  
  return finalScore;
}

/**
 * Analyze URL characteristics for banking domains
 */
function analyzeBankingUrl(url) {
  if (!url) return 0;
  
  let score = 0;
  
  // Check URL length (very short URLs might be false positives)
  if (url.length > 30) score += 5;
  
  // Check for banking-related domains
  const bankingDomains = [
    'delen.be',
    'delen.lu',
    'delen.ch',
    'cadelam.be',
    'cadelux.lu',
    'delen.bank'
  ];
  
  let isBankingDomain = false;
  for (const domain of bankingDomains) {
    if (url.includes(domain)) {
      isBankingDomain = true;
      score += 20;
      break;
    }
  }
  
  // Check for common web application patterns
  if (url.includes('.php') || url.includes('.asp') || url.includes('.jsp')) score += 5;
  
  // Check for query parameters (indicative of web apps)
  if (url.includes('?')) score += 5;
  
  // Check for sensitive banking endpoints
  const sensitiveEndpoints = [
    'login',
    'transfer',
    'payment',
    'transaction',
    'account',
    'balance',
    'profile'
  ];
  
  for (const endpoint of sensitiveEndpoints) {
    if (url.includes(endpoint)) {
      score += 10;
      break;
    }
  }
  
  // Check for common false positive patterns
  if (url.includes('google.com') || url.includes('facebook.com')) score -= 20;
  
  return score;
}

/**
 * Analyze User-Agent string
 */
function analyzeUserAgent(userAgent) {
  if (!userAgent) return 0;
  
  // Known bot/crawler user agents (likely false positives)
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scan/i,
    /security/i,
    /monitor/i,
    /curl/i,
    /wget/i
  ];
  
  for (const pattern of botPatterns) {
    if (pattern.test(userAgent)) {
      return -30; // Strong indicator of false positive
    }
  }
  
  // Real browser user agents
  const browserPatterns = [
    /chrome/i,
    /firefox/i,
    /safari/i,
    /edge/i,
    /opera/i
  ];
  
  let browserFound = false;
  for (const pattern of browserPatterns) {
    if (pattern.test(userAgent)) {
      browserFound = true;
      break;
    }
  }
  
  return browserFound ? 15 : 0;
}

/**
 * Analyze data patterns for suspicious characteristics
 */
function analyzeDataPatterns(reportData) {
  let score = 0;
  
  // Check cookie data
  if (reportData.cookies && Object.keys(reportData.cookies).length > 0) {
    score += 10;
  }
  
  // Check localStorage data
  if (reportData.localStorage && Object.keys(reportData.localStorage).length > 0) {
    score += 10;
  }
  
  // Check sessionStorage data
  if (reportData.sessionStorage && Object.keys(reportData.sessionStorage).length > 0) {
    score += 10;
  }
  
  // Check DOM data
  if (reportData.dom && reportData.dom.length > 100) {
    score += 15;
  }
  
  return score;
}

/**
 * Check for browser artifacts that indicate real browser execution
 */
function checkBrowserArtifacts(reportData) {
  let score = 0;
  
  // Check for realistic user agent
  if (reportData.userAgent && reportData.userAgent.length > 20) {
    score += 5;
  }
  
  // Check for realistic IP (not localhost or private networks in production)
  if (reportData.ip && !reportData.ip.startsWith('127.') && !reportData.ip.startsWith('192.168.')) {
    score += 5;
  }
  
  // Check for referer header (real browsers typically send this)
  if (reportData.referer) {
    score += 5;
  }
  
  // Check for origin header (modern browsers send this)
  if (reportData.origin) {
    score += 5;
  }
  
  return score;
}

/**
 * Check for automation signatures that indicate bots or testing tools
 */
function checkAutomationSignatures(reportData) {
  let deduction = 0;
  
  // Check User-Agent for automation tools
  if (reportData.userAgent) {
    const automationPatterns = [
      /python/i,
      /java/i,
      /node\.js/i,
      /axios/i,
      /postman/i,
      /insomnia/i
    ];
    
    for (const pattern of automationPatterns) {
      if (pattern.test(reportData.userAgent)) {
        deduction += 25;
        break;
      }
    }
  }
  
  // Check for unrealistic data combinations
  if (reportData.userAgent && reportData.dom && reportData.dom.length < 50) {
    // Very small DOM with a user agent might indicate automated scanning
    deduction += 10;
  }
  
  return deduction;
}

/**
 * Check data completeness
 */
function checkDataCompleteness(reportData) {
  let score = 0;
  
  // More complete data sets indicate real browser execution
  const dataFields = [
    reportData.url,
    reportData.ip,
    reportData.userAgent,
    reportData.cookies,
    reportData.localStorage,
    reportData.sessionStorage,
    reportData.dom
  ];
  
  const filledFields = dataFields.filter(field => 
    field !== undefined && field !== null && 
    (typeof field !== 'string' || field.length > 0)
  ).length;
  
  // Award points based on completeness (0-7 fields filled)
  score += Math.floor((filledFields / 7) * 20);
  
  return score;
}

/**
 * Check for known false positive patterns
 */
function checkFalsePositivePatterns(reportData) {
  let deduction = 0;
  
  // Check URL for known false positive sources
  if (reportData.url) {
    const fpUrlPatterns = [
      /static\./i,
      /\.css(\?.*)?$/i,
      /\.js(\?.*)?$/i,
      /\.png$/i,
      /\.jpg$/i,
      /\.jpeg$/i,
      /\.gif$/i,
      /\.svg$/i,
      /cdn\./i
    ];
    
    for (const pattern of fpUrlPatterns) {
      if (pattern.test(reportData.url)) {
        deduction += 20;
        break;
      }
    }
  }
  
  // Check for suspiciously short execution times (automated scanning)
  if (reportData.dom && reportData.dom.length < 100) {
    deduction += 10;
  }
  
  return deduction;
}

/**
 * Check for banking-specific indicators
 */
function checkBankingIndicators(reportData) {
  let score = 0;
  
  // Check for banking-related data in the report
  if (reportData.bankingData) {
    // More banking data = higher confidence
    if (reportData.bankingData.accountFields > 0) score += 15;
    if (reportData.bankingData.amountFields > 0) score += 10;
    if (reportData.bankingData.beneficiaryFields > 0) score += 10;
    if (reportData.bankingData.sensitiveKeywords > 0) score += 5;
  }
  
  // Check for financial forms
  if (reportData.financialForms && reportData.financialForms.length > 0) {
    score += 20;
  }
  
  // Check URL for banking context
  if (reportData.url) {
    const bankingContextKeywords = [
      'bank', 'finance', 'investment', 'wealth', 'asset', 'portfolio',
      'account', 'transfer', 'payment', 'transaction', 'balance'
    ];
    
    for (const keyword of bankingContextKeywords) {
      if (reportData.url.toLowerCase().includes(keyword)) {
        score += 5;
      }
    }
  }
  
  return score;
}

module.exports = {
  calculateDelenConfidenceScore
};