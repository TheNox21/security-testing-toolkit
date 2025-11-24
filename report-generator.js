/**
 * Bug Bounty Report Generator
 * Creates professional PDF reports for security findings
 */

const fs = require('fs');
const PDFDocument = require('pdfkit');
const moment = require('moment');

class BugBountyReportGenerator {
    constructor() {
        this.findings = [];
        this.reportMetadata = {
            researcher: "Anonymous Security Researcher",
            companyName: "Target Organization",
            reportDate: moment().format('YYYY-MM-DD'),
            reportId: `BB-${moment().format('YYYYMMDD-HHmmss')}`
        };
    }

    /**
     * Load findings from JSON file
     * @param {string} filePath - Path to the findings JSON file
     */
    loadFindingsFromFile(filePath) {
        try {
            const rawData = fs.readFileSync(filePath, 'utf8');
            this.findings = JSON.parse(rawData);
            console.log(`[INFO] Loaded ${this.findings.length} findings from ${filePath}`);
        } catch (error) {
            console.error(`[ERROR] Failed to load findings: ${error.message}`);
        }
    }

    /**
     * Add a finding manually
     * @param {Object} finding - The finding object
     */
    addFinding(finding) {
        this.findings.push(finding);
    }

    /**
     * Generate a professional bug bounty report in PDF format
     * @param {string} outputPath - Output path for the PDF report
     */
    generatePDFReport(outputPath) {
        console.log(`[INFO] Generating PDF report with ${this.findings.length} findings...`);
        
        const doc = new PDFDocument({
            size: 'A4',
            margin: 50
        });
        
        // Pipe the PDF to a writable stream
        const stream = fs.createWriteStream(outputPath);
        doc.pipe(stream);
        
        // Title page
        this.generateTitlePage(doc);
        
        // Table of contents
        this.generateTableOfContents(doc);
        
        // Executive summary
        this.generateExecutiveSummary(doc);
        
        // Detailed findings
        this.generateDetailedFindings(doc);
        
        // Methodology
        this.generateMethodology(doc);
        
        // Conclusion
        this.generateConclusion(doc);
        
        // Finalize PDF
        doc.end();
        
        stream.on('finish', () => {
            console.log(`[SUCCESS] PDF report generated: ${outputPath}`);
        });
    }

    generateTitlePage(doc) {
        doc.fontSize(24).fillColor('#2c3e50')
           .text('BUG BOUNTY REPORT', {align: 'center'});
        
        doc.moveDown(2);
        
        doc.fontSize(18)
           .text(`Report ID: ${this.reportMetadata.reportId}`, {align: 'center'});
        
        doc.moveDown(1);
        
        doc.fontSize(16)
           .text(`Prepared for: ${this.reportMetadata.companyName}`, {align: 'center'});
        
        doc.moveDown(1);
        
        doc.fontSize(16)
           .text(`Prepared by: ${this.reportMetadata.researcher}`, {align: 'center'});
        
        doc.moveDown(1);
        
        doc.fontSize(16)
           .text(`Date: ${this.reportMetadata.reportDate}`, {align: 'center'});
        
        doc.moveDown(5);
        
        doc.fontSize(12).fillColor('black')
           .text('CONFIDENTIAL', {align: 'center'});
        
        doc.addPage();
    }

    generateTableOfContents(doc) {
        doc.fontSize(18).fillColor('#2c3e50')
           .text('Table of Contents', {underline: true});
        
        doc.moveDown(1);
        
        doc.fontSize(12).fillColor('black')
           .text('1. Executive Summary .................................................. 2');
        
        doc.moveDown(0.5);
        
        doc.text('2. Detailed Findings .................................................. 3');
        
        doc.moveDown(0.5);
        
        doc.text('3. Methodology ........................................................ 8');
        
        doc.moveDown(0.5);
        
        doc.text('4. Conclusion ......................................................... 9');
        
        doc.addPage();
    }

    generateExecutiveSummary(doc) {
        doc.fontSize(18).fillColor('#2c3e50')
           .text('1. Executive Summary', {underline: true});
        
        doc.moveDown(1);
        
        doc.fontSize(12).fillColor('black')
           .text('This report presents the findings of a security assessment conducted on the target application. ' +
                'During the assessment, several vulnerabilities were identified that could potentially be exploited ' +
                'by malicious actors to compromise the confidentiality, integrity, or availability of the system.', {
                    align: 'justify',
                    lineGap: 2
                });
        
        doc.moveDown(1);
        
        // Summary statistics
        const severityStats = this.getSeverityStatistics();
        const confidenceStats = this.getConfidenceStatistics();
        
        doc.text('Summary of Findings:', {bold: true});
        doc.moveDown(0.5);
        
        doc.text(`• Critical: ${severityStats.Critical || 0}`);
        doc.text(`• High: ${severityStats.High || 0}`);
        doc.text(`• Medium: ${severityStats.Medium || 0}`);
        doc.text(`• Low: ${severityStats.Low || 0}`);
        doc.text(`• Informational: ${severityStats.Informational || 0}`);
        
        doc.moveDown(1);
        
        doc.text('Confidence Levels:', {bold: true});
        doc.moveDown(0.5);
        
        doc.text(`• High Confidence: ${confidenceStats.High || 0}`);
        doc.text(`• Low Confidence: ${confidenceStats.Low || 0}`);
        doc.text(`• Not Specified: ${confidenceStats.NotSpecified || 0}`);
        
        doc.moveDown(1);
        
        doc.text('The following sections provide detailed information about each identified vulnerability, ' +
                'including proof of concept, steps to reproduce, and remediation recommendations.', {
                    align: 'justify',
                    lineGap: 2
                });
        
        doc.addPage();
    }

    generateDetailedFindings(doc) {
        doc.fontSize(18).fillColor('#2c3e50')
           .text('2. Detailed Findings', {underline: true});
        
        doc.moveDown(1);
        
        if (this.findings.length === 0) {
            doc.fontSize(12).fillColor('black')
               .text('No findings were identified during the assessment.');
            return;
        }
        
        // Filter high confidence findings for detailed reporting
        const highConfidenceFindings = this.findings.filter(finding => 
            !finding.confidence || finding.confidence === 'High'
        );
        
        if (highConfidenceFindings.length === 0) {
            doc.fontSize(12).fillColor('black')
               .text('No high confidence findings were identified during the assessment.');
            return;
        }
        
        highConfidenceFindings.forEach((finding, index) => {
            // Finding title
            doc.fontSize(14).fillColor('#2c3e50')
               .text(`${index + 1}. ${finding.vulnerability}`, {bold: true});
            
            doc.moveDown(0.5);
            
            // Severity badge
            const severityColor = this.getSeverityColor(finding.severity);
            doc.fillColor(severityColor)
               .text(`Severity: ${finding.severity}`, {bold: true});
            
            doc.fillColor('black').moveDown(0.5);
            
            // Confidence level
            if (finding.confidence) {
                doc.text(`Confidence: ${finding.confidence}`);
                doc.moveDown(0.5);
            }
            
            // Details based on vulnerability type
            if (finding.vulnerability.includes('Command Injection')) {
                this.generateCommandInjectionDetails(doc, finding);
            } else if (finding.vulnerability.includes('XSS')) {
                this.generateXSSDetails(doc, finding);
            } else if (finding.vulnerability.includes('Security Headers')) {
                this.generateSecurityHeadersDetails(doc, finding);
            } else if (finding.vulnerability.includes('SQL')) {
                this.generateSQLInjectionDetails(doc, finding);
            } else {
                this.generateGenericFindingDetails(doc, finding);
            }
            
            doc.moveDown(1);
            
            // Add page break except for the last finding
            if (index < highConfidenceFindings.length - 1) {
                doc.addPage();
            }
        });
    }

    generateCommandInjectionDetails(doc, finding) {
        doc.fontSize(12).fillColor('black')
           .text('Description:', {bold: true})
           .moveDown(0.3)
           .text('Command injection vulnerabilities occur when an application incorporates user-controllable data ' +
                'into a command that is processed by a shell interpreter. This can allow attackers to execute ' +
                'arbitrary commands on the underlying system.')
           .moveDown(0.5);
        
        doc.text('Proof of Concept:', {bold: true})
           .moveDown(0.3)
           .text(`URL: ${finding.url}`)
           .moveDown(0.3)
           .text(`Payload: ${finding.payload}`)
           .moveDown(0.5);
        
        doc.text('Steps to Reproduce:', {bold: true})
           .moveDown(0.3)
           .text('1. Navigate to the vulnerable endpoint')
           .moveDown(0.3)
           .text('2. Submit the form with the payload in any input field')
           .moveDown(0.3)
           .text('3. Observe that the command is executed on the server')
           .moveDown(0.5);
        
        doc.text('Impact:', {bold: true})
           .moveDown(0.3)
           .text('This vulnerability could allow an attacker to execute arbitrary commands on the server, ' +
                'potentially leading to full system compromise, data theft, or service disruption.')
           .moveDown(0.5);
        
        doc.text('Remediation:', {bold: true})
           .moveDown(0.3)
           .text('• Validate and sanitize all user inputs')
           .moveDown(0.3)
           .text('• Use parameterized APIs instead of shell commands')
           .moveDown(0.3)
           .text('• Implement proper input filtering and escaping')
           .moveDown(0.3)
           .text('• Apply the principle of least privilege for application processes');
    }

    generateXSSDetails(doc, finding) {
        doc.fontSize(12).fillColor('black')
           .text('Description:', {bold: true})
           .moveDown(0.3)
           .text('Cross-Site Scripting (XSS) vulnerabilities occur when untrusted data is included in web pages ' +
                'without proper validation or escaping. This allows attackers to inject malicious scripts that ' +
                'execute in the context of other users\' browsers.')
           .moveDown(0.5);
        
        doc.text('Proof of Concept:', {bold: true})
           .moveDown(0.3)
           .text(`URL: ${finding.url}`)
           .moveDown(0.3)
           .text(`Payload: ${finding.payload}`)
           .moveDown(0.5);
        
        doc.text('Steps to Reproduce:', {bold: true})
           .moveDown(0.3)
           .text('1. Navigate to the vulnerable page')
           .moveDown(0.3)
           .text('2. Submit the form with the XSS payload in any input field')
           .moveDown(0.3)
           .text('3. Observe that the payload is reflected in the response')
           .moveDown(0.5);
        
        doc.text('Impact:', {bold: true})
           .moveDown(0.3)
           .text('This vulnerability could allow an attacker to steal session cookies, redirect users to malicious ' +
                'sites, or perform actions on behalf of authenticated users.')
           .moveDown(0.5);
        
        doc.text('Remediation:', {bold: true})
           .moveDown(0.3)
           .text('• Implement proper input validation and sanitization')
           .moveDown(0.3)
           .text('• Use context-aware output encoding')
           .moveDown(0.3)
           .text('• Implement Content Security Policy (CSP)')
           .moveDown(0.3)
           .text('• Set appropriate HTTP security headers');
    }

    generateSQLInjectionDetails(doc, finding) {
        doc.fontSize(12).fillColor('black')
           .text('Description:', {bold: true})
           .moveDown(0.3)
           .text('SQL injection vulnerabilities occur when untrusted data is incorporated into SQL queries without ' +
                'proper validation or parameterization. This can allow attackers to manipulate database queries ' +
                'and potentially access, modify, or delete sensitive data.')
           .moveDown(0.5);
        
        doc.text('Proof of Concept:', {bold: true})
           .moveDown(0.3)
           .text(`URL: ${finding.url}`)
           .moveDown(0.3)
           .text(`Payload: ${finding.payload}`)
           .moveDown(0.5);
        
        doc.text('Steps to Reproduce:', {bold: true})
           .moveDown(0.3)
           .text('1. Navigate to the vulnerable endpoint')
           .moveDown(0.3)
           .text('2. Submit the form with the SQL injection payload in any input field')
           .moveDown(0.3)
           .text('3. Observe SQL error messages or unexpected behavior')
           .moveDown(0.5);
        
        doc.text('Impact:', {bold: true})
           .moveDown(0.3)
           .text('This vulnerability could allow an attacker to access sensitive database information, ' +
                'modify or delete data, or potentially execute commands on the database server.')
           .moveDown(0.5);
        
        doc.text('Remediation:', {bold: true})
           .moveDown(0.3)
           .text('• Use parameterized queries or prepared statements')
           .moveDown(0.3)
           .text('• Implement proper input validation and sanitization')
           .moveDown(0.3)
           .text('• Apply the principle of least privilege for database accounts')
           .moveDown(0.3)
           .text('• Use stored procedures where appropriate');
    }

    generateSecurityHeadersDetails(doc, finding) {
        doc.fontSize(12).fillColor('black')
           .text('Description:', {bold: true})
           .moveDown(0.3)
           .text('Missing security headers reduce the application\'s protection against various client-side attacks. ' +
                'These headers provide additional layers of defense against XSS, clickjacking, MIME type sniffing, ' +
                'and other common web vulnerabilities.')
           .moveDown(0.5);
        
        doc.text('Missing Headers:', {bold: true})
           .moveDown(0.3);
        
        if (finding.missingHeaders) {
            finding.missingHeaders.forEach(header => {
                doc.text(`• ${header}`);
            });
        }
        
        if (finding.details) {
            doc.moveDown(0.5);
            doc.text('Detailed Information:', {bold: true})
               .moveDown(0.3);
            
            finding.details.forEach(detail => {
                doc.text(`${detail.name}: ${detail.recommended}`);
                doc.moveDown(0.2);
            });
        }
        
        doc.moveDown(0.5);
        
        doc.text('Impact:', {bold: true})
           .moveDown(0.3)
           .text('Without these security headers, the application is more vulnerable to client-side attacks such as ' +
                'XSS, clickjacking, and MIME type sniffing.')
           .moveDown(0.5);
        
        doc.text('Remediation:', {bold: true})
           .moveDown(0.3)
           .text('Implement the following security headers:')
           .moveDown(0.3);
        
        doc.text('• Strict-Transport-Security: Enforce HTTPS connections')
           .moveDown(0.3)
           .text('• Content-Security-Policy: Control resource loading')
           .moveDown(0.3)
           .text('• X-Frame-Options: Prevent clickjacking')
           .moveDown(0.3)
           .text('• X-Content-Type-Options: Prevent MIME type sniffing')
           .moveDown(0.3)
           .text('• X-XSS-Protection: Enable XSS filtering')
           .moveDown(0.3)
           .text('• Referrer-Policy: Control referrer information');
    }

    generateGenericFindingDetails(doc, finding) {
        doc.fontSize(12).fillColor('black')
           .text('Details:', {bold: true})
           .moveDown(0.3)
           .text(`URL: ${finding.url || 'N/A'}`)
           .moveDown(0.3);
        
        if (finding.payload) {
            doc.text(`Payload: ${finding.payload}`)
               .moveDown(0.3);
        }
        
        if (finding.securityScore) {
            doc.text(`Security Score: ${finding.securityScore}%`)
               .moveDown(0.3);
        }
        
        doc.text(`Timestamp: ${finding.timestamp || 'N/A'}`);
    }

    generateMethodology(doc) {
        doc.addPage();
        
        doc.fontSize(18).fillColor('#2c3e50')
           .text('3. Methodology', {underline: true});
        
        doc.moveDown(1);
        
        doc.fontSize(12).fillColor('black')
           .text('The security assessment was conducted using a combination of automated scanning tools and manual testing techniques. ' +
                'The following methodology was employed:')
           .moveDown(1);
        
        doc.text('1. Reconnaissance:')
           .moveDown(0.3)
           .text('• Identification of target assets')
           .moveDown(0.3)
           .text('• Enumeration of web applications and services')
           .moveDown(0.5);
        
        doc.text('2. Automated Scanning:')
           .moveDown(0.3)
           .text('• Vulnerability scanning using custom tools')
           .moveDown(0.3)
           .text('• Identification of common security misconfigurations')
           .moveDown(0.5);
        
        doc.text('3. Manual Testing:')
           .moveDown(0.3)
           .text('• Validation of automated findings')
           .moveDown(0.3)
           .text('• Exploitation attempts for confirmed vulnerabilities')
           .moveDown(0.5);
        
        doc.text('4. False Positive Reduction:')
           .moveDown(0.3)
           .text('• Implemented confidence scoring for findings')
           .moveDown(0.3)
           .text('• Used verification techniques to minimize false positives')
           .moveDown(0.3)
           .text('• Only high confidence findings included in this report')
           .moveDown(0.5);
        
        doc.text('5. Reporting:')
           .moveDown(0.3)
           .text('• Documentation of findings')
           .moveDown(0.3)
           .text('• Assignment of risk ratings')
           .moveDown(0.3)
           .text('• Provision of remediation guidance');
    }

    generateConclusion(doc) {
        doc.addPage();
        
        doc.fontSize(18).fillColor('#2c3e50')
           .text('4. Conclusion', {underline: true});
        
        doc.moveDown(1);
        
        doc.fontSize(12).fillColor('black')
           .text('The security assessment identified several vulnerabilities that require immediate attention. ' +
                'Addressing these issues will significantly improve the security posture of the application.')
           .moveDown(1);
        
        doc.text('It is recommended that the identified vulnerabilities be remediated according to the provided ' +
                'guidance, with priority given to critical and high severity issues. A follow-up assessment should ' +
                'be conducted after remediation to verify that the issues have been properly addressed.')
           .moveDown(1);
        
        doc.text('This report is confidential and intended solely for the use of the organization responsible ' +
                'for the assessed systems. Unauthorized distribution is prohibited.')
           .moveDown(2);
        
        doc.text('Report prepared by:')
           .moveDown(0.5)
           .text(this.reportMetadata.researcher);
    }

    getSeverityStatistics() {
        const stats = {};
        this.findings.forEach(finding => {
            const severity = finding.severity || 'Unknown';
            stats[severity] = (stats[severity] || 0) + 1;
        });
        return stats;
    }

    getConfidenceStatistics() {
        const stats = {
            High: 0,
            Low: 0,
            NotSpecified: 0
        };
        
        this.findings.forEach(finding => {
            if (finding.confidence) {
                stats[finding.confidence] = (stats[finding.confidence] || 0) + 1;
            } else {
                stats.NotSpecified++;
            }
        });
        
        return stats;
    }

    getSeverityColor(severity) {
        switch (severity.toLowerCase()) {
            case 'critical':
                return '#e74c3c'; // Red
            case 'high':
                return '#e67e22'; // Orange
            case 'medium':
                return '#f1c40f'; // Yellow
            case 'low':
                return '#2ecc71'; // Green
            default:
                return '#3498db'; // Blue
        }
    }
}

// Example usage
if (require.main === module) {
    const generator = new BugBountyReportGenerator();
    
    // Load findings from the latest scan results
    const resultFiles = fs.readdirSync('.')
        .filter(file => file.startsWith('verified-results-') && file.endsWith('.json'))
        .sort()
        .reverse();
    
    if (resultFiles.length > 0) {
        generator.loadFindingsFromFile(resultFiles[0]);
    } else {
        // Try regular results files
        const allResultFiles = fs.readdirSync('.')
            .filter(file => file.startsWith('scan-results-') && file.endsWith('.json'))
            .sort()
            .reverse();
        
        if (allResultFiles.length > 0) {
            generator.loadFindingsFromFile(allResultFiles[0]);
        } else {
            console.log('[INFO] No scan results found, using sample data');
            // Sample findings for demonstration
            generator.addFinding({
                url: "https://example.com/vulnerable-endpoint",
                vulnerability: "Command Injection",
                payload: "; ls",
                severity: "Critical",
                confidence: "High",
                timestamp: new Date().toISOString()
            });
            
            generator.addFinding({
                url: "https://example.com/form",
                vulnerability: "Reflected XSS",
                payload: "<script>alert('XSS')</script>",
                severity: "High",
                confidence: "High",
                timestamp: new Date().toISOString()
            });
        }
    }
    
    // Generate the report
    const reportName = `bug-bounty-report-${moment().format('YYYYMMDD-HHmmss')}.pdf`;
    generator.generatePDFReport(reportName);
}

module.exports = BugBountyReportGenerator;