/**
 * HTTP Header Analyzer
 * A tool to check for security-related HTTP headers
 */

const axios = require('axios');

// Example target URL - now targeting redcare-apotheke.ch
const TARGET_URL = 'https://redcare-apotheke.ch';

// Security headers to check for
const SECURITY_HEADERS = {
    'strict-transport-security': {
        name: 'Strict-Transport-Security',
        description: 'Enforces HTTPS connections',
        recommended: 'max-age=31536000; includeSubDomains',
        severity: 'Medium'
    },
    'content-security-policy': {
        name: 'Content-Security-Policy',
        description: 'Prevents XSS and data injection attacks',
        recommended: "default-src 'self'",
        severity: 'High'
    },
    'x-frame-options': {
        name: 'X-Frame-Options',
        description: 'Prevents clickjacking',
        recommended: 'DENY or SAMEORIGIN',
        severity: 'Medium'
    },
    'x-content-type-options': {
        name: 'X-Content-Type-Options',
        description: 'Prevents MIME type sniffing',
        recommended: 'nosniff',
        severity: 'Low'
    },
    'x-xss-protection': {
        name: 'X-XSS-Protection',
        description: 'Enables XSS filtering',
        recommended: '1; mode=block',
        severity: 'Medium'
    },
    'referrer-policy': {
        name: 'Referrer-Policy',
        description: 'Controls referrer information',
        recommended: 'no-referrer',
        severity: 'Low'
    }
};

class HeaderAnalyzer {
    constructor() {
        this.results = [];
    }

    async analyzeHeaders(url) {
        console.log(`[INFO] Analyzing headers for ${url}`);
        
        try {
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Security-Header-Analyzer/1.0'
                }
            });
            
            const headers = response.headers;
            console.log(`[INFO] Received ${Object.keys(headers).length} headers`);
            
            // Check for security headers
            const missingHeaders = [];
            const presentHeaders = [];
            let securityScore = 0;
            const totalHeaders = Object.keys(SECURITY_HEADERS).length;
            
            for (const [headerKey, headerInfo] of Object.entries(SECURITY_HEADERS)) {
                const headerValue = headers[headerKey];
                
                if (headerValue) {
                    presentHeaders.push({
                        name: headerInfo.name,
                        value: headerValue,
                        description: headerInfo.description,
                        severity: headerInfo.severity
                    });
                    securityScore++;
                } else {
                    missingHeaders.push({
                        name: headerInfo.name,
                        description: headerInfo.description,
                        recommended: headerInfo.recommended,
                        severity: headerInfo.severity
                    });
                }
            }
            
            // Calculate security score
            const score = Math.round((securityScore / totalHeaders) * 100);
            
            // Display results
            this.displayResults(url, presentHeaders, missingHeaders, score);
            
            // Store results for reporting
            if (missingHeaders.length > 0) {
                this.results.push({
                    url: url,
                    vulnerability: 'Missing Security Headers',
                    missingHeaders: missingHeaders.map(h => h.name),
                    details: missingHeaders,
                    severity: 'Medium',
                    confidence: 'High',
                    securityScore: score,
                    timestamp: new Date().toISOString()
                });
            }
            
        } catch (error) {
            console.error(`[ERROR] Failed to analyze headers: ${error.message}`);
        }
    }

    displayResults(url, presentHeaders, missingHeaders, securityScore) {
        console.log('\n=== Header Analysis Results ===');
        console.log(`URL: ${url}`);
        console.log(`Security Score: ${securityScore}%\n`);
        
        // Present headers
        console.log('✓ Present Security Headers:');
        if (presentHeaders.length === 0) {
            console.log('  None found');
        } else {
            for (const header of presentHeaders) {
                console.log(`  ${header.name}: ${header.value}`);
                console.log(`    Description: ${header.description}`);
                console.log(`    Severity: ${header.severity}`);
                console.log();
            }
        }
        
        // Missing headers
        console.log('✗ Missing Security Headers:');
        if (missingHeaders.length === 0) {
            console.log('  None - All security headers present!');
        } else {
            for (const header of missingHeaders) {
                console.log(`  ${header.name}`);
                console.log(`    Description: ${header.description}`);
                console.log(`    Recommended: ${header.recommended}`);
                console.log(`    Severity: ${header.severity}`);
                console.log();
            }
        }
        
        // Recommendations
        if (missingHeaders.length > 0) {
            console.log('Recommendations:');
            console.log('  Consider implementing the missing security headers to improve');
            console.log('  the application\'s security posture.');
        }
    }

    async runAnalysis() {
        console.log('=== HTTP Header Analyzer ===');
        await this.analyzeHeaders(TARGET_URL);
    }
}

// Run the header analyzer
if (require.main === module) {
    const analyzer = new HeaderAnalyzer();
    analyzer.runAnalysis();
}

module.exports = HeaderAnalyzer;