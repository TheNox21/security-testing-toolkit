/**
 * LEGITIMATE SECURITY TESTING SCRIPT - FOR AUTHORIZED USE ONLY
 * 
 * This script demonstrates how automated testing might work in a controlled,
 * authorized security assessment scenario. It should only be used:
 * 
 * 1. On systems you own or have explicit written permission to test
 * 2. In accordance with the target organization's rules of engagement
 * 3. With proper authorization from the system owners
 */

const axios = require('axios');
const cheerio = require('cheerio');

// IMPORTANT: These are EXAMPLE targets for educational purposes only
// In a real authorized assessment, you would ONLY test systems you have permission to test
const TARGET_DOMAINS = [
  'https://httpbin.org/forms/post',  // Safe testing endpoint
  'https://example.com/contact'      // Example - NOT a real target
];

// Example payload (for educational purposes)
const TEST_PAYLOAD = '<script>console.log("XSS Test")</script>';

async function scanForForms(url) {
  try {
    console.log(`[INFO] Scanning ${url} for forms...`);
    
    // Fetch the page
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    
    // Find all forms
    const forms = $('form');
    console.log(`[INFO] Found ${forms.length} form(s) on ${url}`);
    
    // For each form, identify input fields
    forms.each((index, form) => {
      const formAction = $(form).attr('action') || url;
      const formMethod = $(form).attr('method') || 'GET';
      
      console.log(`[INFO] Form ${index + 1}: ${formMethod} ${formAction}`);
      
      // Find input fields
      const inputs = $(form).find('input, textarea');
      inputs.each((i, input) => {
        const inputType = $(input).attr('type') || 'text';
        const inputName = $(input).attr('name') || 'unnamed';
        console.log(`  Input: ${inputType} name="${inputName}"`);
      });
    });
    
    return forms.length;
  } catch (error) {
    console.error(`[ERROR] Failed to scan ${url}: ${error.message}`);
    return 0;
  }
}

async function demonstrateScanning() {
  console.log('=== LEGITIMATE SECURITY TESTING DEMO ===');
  console.log('IMPORTANT: This is for educational purposes only.');
  console.log('Only use on systems you own or have explicit permission to test.\n');
  
  let totalForms = 0;
  
  for (const domain of TARGET_DOMAINS) {
    try {
      const formCount = await scanForForms(domain);
      totalForms += formCount;
    } catch (error) {
      console.error(`[ERROR] Failed to process ${domain}: ${error.message}`);
    }
  }
  
  console.log(`\n[SUMMARY] Scanned ${TARGET_DOMAINS.length} domains, found ${totalForms} forms`);
  console.log('\nREMINDER: Always ensure you have proper authorization before testing any system.');
  console.log('Unauthorized testing is illegal and unethical.');
}

// Run the demonstration
if (require.main === module) {
  demonstrateScanning();
}

module.exports = { scanForForms, demonstrateScanning };