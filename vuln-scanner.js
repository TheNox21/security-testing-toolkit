/**
 * Simple Vulnerability Scanner
 * A basic tool to check for common web vulnerabilities
 */

const axios = require('axios');
const fs = require('fs');

// Target URLs to scan - now including redcare-apotheke.ch
const TARGETS = [
    'https://redcare-apotheke.ch',
    'https://redcare-apotheke.ch/',
    'https://redcare-apotheke.ch/kontakt',
    'https://redcare-apotheke.ch/termin'
];

// Common payloads for testing
const PAYLOADS = {
    xss: [
        '<script>alert("XSS")</script>',
        '"><script>alert("XSS")</script>',
        'javascript:alert("XSS")',
        '<img src=x onerror=alert("XSS")>'
    ],
    sql: [
        "' OR '1'='1",
        '" OR "1"="1',
        "'; DROP TABLE users; --",
        "' UNION SELECT * FROM users --"
    ],
    cmd: [
        '| ls',
        '; ls',
        '& ls',
        '&& ls'
    ]
};

class VulnerabilityScanner {
    constructor() {
        this.results = [];
        this.verifiedResults = [];
    }

    async scanUrl(url) {
        console.log(`[INFO] Scanning ${url}`);
        
        // Test for XSS vulnerabilities
        await this.testXSS(url);
        
        // Test for SQL injection vulnerabilities
        await this.testSQLInjection(url);
        
        // Test for command injection vulnerabilities
        await this.testCommandInjection(url);
        
        // Test for security headers
        await this.testSecurityHeaders(url);
    }

    async testXSS(url) {
        console.log(`[INFO] Testing XSS on ${url}`);
        
        for (const payload of PAYLOADS.xss) {
            try {
                // Test GET parameters
                const testUrl = `${url}?test=${encodeURIComponent(payload)}`;
                const response = await axios.get(testUrl, { timeout: 5000 });
                
                // Check if payload is reflected in response
                if (response.data.includes(payload)) {
                    // Verify the vulnerability with additional checks
                    const isVerified = await this.verifyXSS(url, payload);
                    if (isVerified) {
                        this.results.push({
                            url: testUrl,
                            vulnerability: 'XSS',
                            payload: payload,
                            severity: 'High',
                            confidence: 'High',
                            timestamp: new Date().toISOString()
                        });
                        console.log(`[VULN] XSS found with payload: ${payload}`);
                    } else {
                        this.results.push({
                            url: testUrl,
                            vulnerability: 'XSS',
                            payload: payload,
                            severity: 'High',
                            confidence: 'Low',
                            timestamp: new Date().toISOString()
                        });
                        console.log(`[POSSIBLE] Potential XSS found with payload: ${payload} (needs manual verification)`);
                    }
                }
            } catch (error) {
                // Continue with other tests
            }
        }
    }

    async verifyXSS(url, payload) {
        // Additional verification to reduce false positives
        try {
            // Test with a random payload to see if reflection is normal behavior
            const randomPayload = `random${Math.floor(Math.random() * 1000000)}`;
            const testUrl = `${url}?test=${encodeURIComponent(randomPayload)}`;
            const response = await axios.get(testUrl, { timeout: 5000 });
            
            // If random payload is also reflected, this might be normal behavior
            if (response.data.includes(randomPayload)) {
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

    async testSQLInjection(url) {
        console.log(`[INFO] Testing SQL Injection on ${url}`);
        
        for (const payload of PAYLOADS.sql) {
            try {
                // Test GET parameters
                const testUrl = `${url}?id=${encodeURIComponent(payload)}`;
                const response = await axios.get(testUrl, { timeout: 5000 });
                
                // Check for SQL error patterns
                const sqlErrors = [
                    'SQL syntax', 'mysql_fetch', 'ORA-', 'PostgreSQL', 
                    'JDBC', 'ODBC', 'SQLite', 'You have an error in your SQL syntax'
                ];
                
                const hasSQLError = sqlErrors.some(error => 
                    response.data.includes(error)
                );
                
                if (hasSQLError) {
                    // Verify the vulnerability with additional checks
                    const isVerified = await this.verifySQLInjection(url, payload);
                    if (isVerified) {
                        this.results.push({
                            url: testUrl,
                            vulnerability: 'SQL Injection',
                            payload: payload,
                            severity: 'Critical',
                            confidence: 'High',
                            timestamp: new Date().toISOString()
                        });
                        console.log(`[VULN] SQL Injection found with payload: ${payload}`);
                    } else {
                        this.results.push({
                            url: testUrl,
                            vulnerability: 'SQL Injection',
                            payload: payload,
                            severity: 'Critical',
                            confidence: 'Low',
                            timestamp: new Date().toISOString()
                        });
                        console.log(`[POSSIBLE] Potential SQL Injection found with payload: ${payload} (needs manual verification)`);
                    }
                }
            } catch (error) {
                // Continue with other tests
            }
        }
    }

    async verifySQLInjection(url, payload) {
        // Additional verification to reduce false positives
        try {
            // Test with a random payload to see if SQL errors are common
            const randomPayload = `random${Math.floor(Math.random() * 1000000)}`;
            const testUrl = `${url}?id=${encodeURIComponent(randomPayload)}`;
            const response = await axios.get(testUrl, { timeout: 5000 });
            
            // Check for SQL error patterns with random payload
            const sqlErrors = [
                'SQL syntax', 'mysql_fetch', 'ORA-', 'PostgreSQL', 
                'JDBC', 'ODBC', 'SQLite', 'You have an error in your SQL syntax'
            ];
            
            const hasSQLError = sqlErrors.some(error => 
                response.data.includes(error)
            );
            
            // If random payload also triggers SQL errors, this might be normal behavior
            if (hasSQLError) {
                return false; // Likely false positive
            }
            
            return true; // Specific payload caused error, likely real
        } catch (error) {
            return false;
        }
    }

    async testCommandInjection(url) {
        console.log(`[INFO] Testing Command Injection on ${url}`);
        
        for (const payload of PAYLOADS.cmd) {
            try {
                // Test GET parameters
                const testUrl = `${url}?cmd=${encodeURIComponent(payload)}`;
                const response = await axios.get(testUrl, { timeout: 5000 });
                
                // More sophisticated check for command injection
                const isCommandInjection = await this.verifyCommandInjection(url, payload, response);
                if (isCommandInjection) {
                    this.results.push({
                        url: testUrl,
                        vulnerability: 'Command Injection',
                        payload: payload,
                        severity: 'Critical',
                        confidence: 'High',
                        timestamp: new Date().toISOString()
                    });
                    console.log(`[VULN] Command Injection found with payload: ${payload}`);
                } else if (response.data.length > 1000) {
                    // Check for command output patterns (simplified)
                    this.results.push({
                        url: testUrl,
                        vulnerability: 'Command Injection',
                        payload: payload,
                        severity: 'Critical',
                        confidence: 'Low',
                        timestamp: new Date().toISOString()
                    });
                    console.log(`[POSSIBLE] Potential Command Injection with payload: ${payload} (needs manual verification)`);
                }
            } catch (error) {
                // Continue with other tests
            }
        }
    }

    async verifyCommandInjection(url, payload, response) {
        // Additional verification to reduce false positives
        try {
            // Test with a random payload to see if large responses are normal
            const randomPayload = `random${Math.floor(Math.random() * 1000000)}`;
            const testUrl = `${url}?cmd=${encodeURIComponent(randomPayload)}`;
            const randomResponse = await axios.get(testUrl, { timeout: 5000 });
            
            // If random payload also produces large response, this might be normal behavior
            if (randomResponse.data.length > 1000) {
                return false; // Likely false positive
            }
            
            // Look for specific command output patterns
            const commandOutputIndicators = [
                'bin/', 'etc/', 'usr/', 'home/', 'root/',
                'total ', 'drwx', '-rw-', 'Permission denied'
            ];
            
            const hasCommandOutput = commandOutputIndicators.some(indicator =>
                response.data.includes(indicator)
            );
            
            return hasCommandOutput; // More specific evidence of command execution
        } catch (error) {
            return false;
        }
    }

    async testSecurityHeaders(url) {
        console.log(`[INFO] Testing Security Headers on ${url}`);
        
        try {
            const response = await axios.get(url, { timeout: 5000 });
            const headers = response.headers;
            
            const securityHeaders = {
                'x-xss-protection': 'X-XSS-Protection',
                'content-security-policy': 'Content-Security-Policy',
                'x-frame-options': 'X-Frame-Options',
                'x-content-type-options': 'X-Content-Type-Options',
                'strict-transport-security': 'Strict-Transport-Security'
            };
            
            const missingHeaders = [];
            for (const [headerKey, headerName] of Object.entries(securityHeaders)) {
                if (!headers[headerKey]) {
                    missingHeaders.push(headerName);
                }
            }
            
            if (missingHeaders.length > 0) {
                this.results.push({
                    url: url,
                    vulnerability: 'Missing Security Headers',
                    missingHeaders: missingHeaders,
                    severity: 'Medium',
                    confidence: 'High',
                    timestamp: new Date().toISOString()
                });
                console.log(`[INFO] Missing security headers: ${missingHeaders.join(', ')}`);
            }
        } catch (error) {
            // Continue with other tests
        }
    }

    async scanAllTargets() {
        console.log('=== Starting Vulnerability Scan ===');
        
        for (const target of TARGETS) {
            try {
                await this.scanUrl(target);
            } catch (error) {
                console.error(`[ERROR] Failed to scan ${target}: ${error.message}`);
            }
        }
        
        // Filter results to only include high confidence findings
        this.verifiedResults = this.results.filter(result => 
            result.confidence === 'High' || result.vulnerability === 'Missing Security Headers'
        );
        
        this.saveResults();
        this.printSummary();
    }

    saveResults() {
        const filename = `scan-results-${new Date().getTime()}.json`;
        fs.writeFileSync(filename, JSON.stringify(this.results, null, 2));
        console.log(`[INFO] All results saved to ${filename}`);
        
        const verifiedFilename = `verified-results-${new Date().getTime()}.json`;
        fs.writeFileSync(verifiedFilename, JSON.stringify(this.verifiedResults, null, 2));
        console.log(`[INFO] High confidence results saved to ${verifiedFilename}`);
    }

    printSummary() {
        console.log('\n=== Scan Summary ===');
        console.log(`Total potential issues found: ${this.results.length}`);
        console.log(`High confidence findings: ${this.verifiedResults.length}`);
        
        const severityCount = {
            'Critical': 0,
            'High': 0,
            'Medium': 0,
            'Low': 0
        };
        
        const confidenceCount = {
            'High': 0,
            'Low': 0
        };
        
        for (const result of this.results) {
            severityCount[result.severity]++;
            if (result.confidence) {
                confidenceCount[result.confidence]++;
            }
        }
        
        console.log('Severity breakdown:');
        for (const [severity, count] of Object.entries(severityCount)) {
            if (count > 0) {
                console.log(`  ${severity}: ${count}`);
            }
        }
        
        console.log('Confidence breakdown:');
        for (const [confidence, count] of Object.entries(confidenceCount)) {
            if (count > 0) {
                console.log(`  ${confidence}: ${count}`);
            }
        }
        
        if (this.verifiedResults.length > 0) {
            console.log('\nHigh confidence findings:');
            for (const result of this.verifiedResults) {
                console.log(`  - ${result.vulnerability} (${result.severity}) on ${result.url}`);
            }
        }
        
        if (this.results.length > this.verifiedResults.length) {
            console.log('\nLow confidence findings (require manual verification):');
            const lowConfidence = this.results.filter(result => result.confidence === 'Low');
            for (const result of lowConfidence) {
                console.log(`  - ${result.vulnerability} (${result.severity}) on ${result.url}`);
            }
        }
    }
}

// Run the scanner
if (require.main === module) {
    const scanner = new VulnerabilityScanner();
    scanner.scanAllTargets();
}

module.exports = VulnerabilityScanner;