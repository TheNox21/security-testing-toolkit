/**
 * Duplicate detection for XSS reports to reduce false positives
 * 
 * This module identifies and filters duplicate XSS reports that may occur
 * from the same source in a short time period, which helps reduce noise
 * and false positives in the reporting system.
 */

const Report = require('../models/Report');
const config = require('../config');

/**
 * Check if a report is a duplicate of a recently received report
 * @param {Object} reportData - The data from the payload execution
 * @returns {Promise<boolean>} True if duplicate, false otherwise
 */
async function detectDuplicate(reportData) {
  // If deduplication is disabled, return false
  if (!config.reporting.enableDeduplication) {
    return false;
  }
  
  // Generate a hash for comparison
  const currentHash = generateDuplicateHash(reportData);
  
  // Calculate the time window for duplicate detection
  const timeWindow = config.security.duplicateDetectionWindow || 300; // Default 5 minutes
  const cutoffTime = new Date(Date.now() - timeWindow * 1000);
  
  // Look for recent reports with the same hash
  const recentDuplicate = await Report.findOne({
    duplicateHash: currentHash,
    createdAt: { $gte: cutoffTime }
  });
  
  return !!recentDuplicate;
}

/**
 * Generate a hash for duplicate detection based on key report fields
 * @param {Object} reportData - The data from the payload execution
 * @returns {string} Hash string for comparison
 */
function generateDuplicateHash(reportData) {
  // Create a hash based on key identifying fields
  const data = {
    url: normalizeUrlForComparison(reportData.url),
    userAgent: reportData.userAgent,
    origin: reportData.origin,
    ip: reportData.ip
  };
  
  // Simple hash function (in production, use a proper cryptographic hash)
  return JSON.stringify(data).split('').reduce((a,b) => (((a << 5) - a) + b.charCodeAt(0))|0, 0).toString();
}

/**
 * Normalize URL for comparison (remove query parameters that don't affect the page)
 * @param {string} url - The URL to normalize
 * @returns {string} Normalized URL
 */
function normalizeUrlForComparison(url) {
  if (!url) return '';
  
  try {
    const urlObj = new URL(url);
    
    // Remove common tracking parameters that don't change the page content
    const trackingParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'ref', 'referer', 'source', 'fbclid', 'gclid', 'msclkid'
    ];
    
    trackingParams.forEach(param => {
      urlObj.searchParams.delete(param);
    });
    
    // Sort remaining parameters for consistent comparison
    const sortedParams = Array.from(urlObj.searchParams.entries()).sort();
    urlObj.search = '';
    sortedParams.forEach(([key, value]) => {
      urlObj.searchParams.append(key, value);
    });
    
    return urlObj.toString();
  } catch (error) {
    // If URL parsing fails, return as-is
    return url;
  }
}

/**
 * Advanced duplicate detection using fuzzy matching
 * @param {Object} reportData - The data from the payload execution
 * @returns {Promise<boolean>} True if duplicate, false otherwise
 */
async function detectFuzzyDuplicate(reportData) {
  // Calculate the time window for duplicate detection
  const timeWindow = config.security.duplicateDetectionWindow || 300; // Default 5 minutes
  const cutoffTime = new Date(Date.now() - timeWindow * 1000);
  
  // Look for recent reports from the same domain
  const urlDomain = extractDomain(reportData.url);
  
  const recentReports = await Report.find({
    createdAt: { $gte: cutoffTime }
  }).limit(10);
  
  // Check for fuzzy matches
  for (const report of recentReports) {
    const reportDomain = extractDomain(report.url);
    
    // Same domain
    if (urlDomain === reportDomain) {
      // Similar user agent (allow for minor variations)
      if (similarStrings(reportData.userAgent, report.userAgent, 0.8)) {
        // Similar IP or same subnet
        if (similarIP(reportData.ip, report.ip)) {
          return true;
        }
      }
    }
  }
  
  return false;
}

/**
 * Extract domain from URL
 * @param {string} url - The URL to extract domain from
 * @returns {string} Domain name
 */
function extractDomain(url) {
  if (!url) return '';
  
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (error) {
    return '';
  }
}

/**
 * Calculate similarity between two strings
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @param {number} threshold - Similarity threshold (0-1)
 * @returns {boolean} True if strings are similar above threshold
 */
function similarStrings(str1, str2, threshold) {
  if (!str1 || !str2) return false;
  
  // Simple implementation - in production use a proper similarity algorithm
  const len1 = str1.length;
  const len2 = str2.length;
  const maxLen = Math.max(len1, len2);
  
  if (maxLen === 0) return true;
  
  // Check if one string contains the other
  if (str1.includes(str2) || str2.includes(str1)) {
    return true;
  }
  
  // Calculate similarity ratio
  let matches = 0;
  for (let i = 0; i < Math.min(len1, len2); i++) {
    if (str1[i] === str2[i]) {
      matches++;
    }
  }
  
  const similarity = matches / maxLen;
  return similarity >= threshold;
}

/**
 * Check if IPs are similar (same subnet or close)
 * @param {string} ip1 - First IP
 * @param {string} ip2 - Second IP
 * @returns {boolean} True if IPs are similar
 */
function similarIP(ip1, ip2) {
  if (!ip1 || !ip2) return false;
  if (ip1 === ip2) return true;
  
  // Check if same /24 subnet (last octet differs)
  const parts1 = ip1.split('.');
  const parts2 = ip2.split('.');
  
  if (parts1.length === 4 && parts2.length === 4) {
    return (
      parts1[0] === parts2[0] &&
      parts1[1] === parts2[1] &&
      parts1[2] === parts2[2]
    );
  }
  
  return false;
}

module.exports = {
  detectDuplicate,
  detectFuzzyDuplicate
};