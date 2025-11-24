/**
 * Security Testing Suite
 * A unified interface for running all security testing tools
 */

const { spawn } = require('child_process');
const fs = require('fs');
const { exec } = require('child_process');

class SecuritySuite {
    constructor() {
        this.tools = {
            'vuln-scanner': {
                file: 'vuln-scanner.js',
                description: 'Scans for common web vulnerabilities',
                running: false
            },
            'form-tester': {
                file: 'form-tester.js',
                description: 'Tests web forms for vulnerabilities',
                running: false
            },
            'header-analyzer': {
                file: 'header-analyzer.js',
                description: 'Analyzes HTTP security headers',
                running: false
            }
        };
    }

    listTools() {
        console.log('=== Available Security Tools ===');
        for (const [name, tool] of Object.entries(this.tools)) {
            const status = tool.running ? 'RUNNING' : 'STOPPED';
            console.log(`${name}: ${tool.description} [${status}]`);
        }
    }

    runTool(toolName) {
        if (!this.tools[toolName]) {
            console.error(`[ERROR] Tool "${toolName}" not found`);
            return;
        }

        const tool = this.tools[toolName];
        if (tool.running) {
            console.log(`[INFO] Tool "${toolName}" is already running`);
            return;
        }

        console.log(`[INFO] Starting ${toolName}...`);
        
        const child = spawn('node', [tool.file], {
            cwd: process.cwd(),
            stdio: 'inherit'
        });

        tool.running = true;

        child.on('close', (code) => {
            tool.running = false;
            console.log(`[INFO] ${toolName} finished with exit code ${code}`);
        });

        child.on('error', (error) => {
            tool.running = false;
            console.error(`[ERROR] Failed to start ${toolName}: ${error.message}`);
        });
    }

    runAllTools() {
        console.log('=== Running All Security Tools ===');
        // First run all tools
        const toolNames = Object.keys(this.tools);
        let completed = 0;
        
        const checkCompletion = () => {
            completed++;
            if (completed === toolNames.length) {
                // All tools completed, generate report
                console.log('[INFO] All tools completed. Generating bug bounty report...');
                this.generateBugBountyReport();
            }
        };
        
        for (const toolName of toolNames) {
            if (!this.tools[toolName].running) {
                console.log(`[INFO] Starting ${toolName}...`);
                
                const child = spawn('node', [this.tools[toolName].file], {
                    cwd: process.cwd(),
                    stdio: 'inherit'
                });

                this.tools[toolName].running = true;

                child.on('close', (code) => {
                    this.tools[toolName].running = false;
                    console.log(`[INFO] ${toolName} finished with exit code ${code}`);
                    checkCompletion();
                });

                child.on('error', (error) => {
                    this.tools[toolName].running = false;
                    console.error(`[ERROR] Failed to start ${toolName}: ${error.message}`);
                    checkCompletion();
                });
            }
        }
    }

    generateBugBountyReport() {
        console.log('[INFO] Generating professional bug bounty report...');
        
        // Run the report generator
        const child = spawn('node', ['report-generator.js'], {
            cwd: process.cwd(),
            stdio: 'inherit'
        });

        child.on('close', (code) => {
            if (code === 0) {
                console.log('[SUCCESS] Bug bounty report generated successfully!');
                
                // Find the latest report
                const reports = fs.readdirSync('.')
                    .filter(file => file.startsWith('bug-bounty-report-') && file.endsWith('.pdf'))
                    .sort()
                    .reverse();
                
                if (reports.length > 0) {
                    console.log(`[INFO] Report saved as: ${reports[0]}`);
                    console.log('[INFO] You can open this PDF to view the professional bug bounty report');
                }
            } else {
                console.error('[ERROR] Failed to generate bug bounty report');
            }
        });
    }

    showDashboard() {
        console.log('=== Security Testing Dashboard ===');
        console.log('Open dashboard.html in your browser to view results');
        console.log('Available tools:');
        this.listTools();
        console.log('\nCommands:');
        console.log('  list - List all tools');
        console.log('  run <tool> - Run a specific tool');
        console.log('  run-all - Run all tools and generate report');
        console.log('  dashboard - Show this dashboard');
        console.log('  help - Show this help message');
        console.log('  exit - Exit the suite');
    }

    showHelp() {
        console.log('=== Security Testing Suite Help ===');
        console.log('This suite includes the following tools:');
        console.log('');
        console.log('1. Vulnerability Scanner (vuln-scanner)');
        console.log('   - Scans URLs for common vulnerabilities');
        console.log('   - Tests for XSS, SQLi, Command Injection');
        console.log('   - Checks security headers');
        console.log('');
        console.log('2. Form Tester (form-tester)');
        console.log('   - Analyzes web forms');
        console.log('   - Tests form inputs with malicious payloads');
        console.log('   - Detects form-based vulnerabilities');
        console.log('');
        console.log('3. Header Analyzer (header-analyzer)');
        console.log('   - Checks HTTP security headers');
        console.log('   - Identifies missing security controls');
        console.log('   - Provides security recommendations');
        console.log('');
        console.log('Additional Features:');
        console.log('   - Automatic bug bounty report generation (PDF)');
        console.log('   - Professional vulnerability documentation');
        console.log('   - Proof of concept and remediation guidance');
        console.log('');
        console.log('Usage:');
        console.log('  node security-suite.js [command]');
        console.log('  Commands: list, run, run-all, dashboard, help, exit');
    }
}

// CLI Interface
if (require.main === module) {
    const suite = new SecuritySuite();
    
    const args = process.argv.slice(2);
    const command = args[0];
    
    switch (command) {
        case 'list':
            suite.listTools();
            break;
        case 'run':
            if (args[1]) {
                suite.runTool(args[1]);
            } else {
                console.error('[ERROR] Please specify a tool to run');
            }
            break;
        case 'run-all':
            suite.runAllTools();
            break;
        case 'dashboard':
            suite.showDashboard();
            break;
        case 'help':
            suite.showHelp();
            break;
        case 'exit':
            process.exit(0);
            break;
        default:
            if (command) {
                console.error(`[ERROR] Unknown command: ${command}`);
            }
            suite.showDashboard();
            break;
    }
}

module.exports = SecuritySuite;