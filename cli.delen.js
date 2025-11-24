#!/usr/bin/env node

const { Command } = require('commander');
const program = new Command();
const Payload = require('./models/Payload');
const Report = require('./models/Report');
const { generateDelenPayloadScript, generateDelenTestPayload, generateDelenPolyglotPayload, generateBankingPayload } = require('./utils/delenPayloadGenerator');
const { obfuscateScript } = require('./utils/obfuscator');

program
  .name('delen-blind-xss')
  .description('Specialized Blind XSS detection tool for Delen Private Bank')
  .version('1.0.0');

// Generate payload command for Delen Private Bank
program
  .command('generate-payload')
  .description('Generate a Blind XSS payload for Delen Private Bank')
  .option('-u, --user <id>', 'User ID')
  .option('-n, --name <name>', 'Payload name')
  .option('-o, --obfuscation <level>', 'Obfuscation level (0-3)', '3')
  .option('-t, --type <type>', 'Payload type (standard, polyglot, test, banking)', 'banking')
  .option('-c, --config <path>', 'Configuration file path')
  .action(async (options) => {
    try {
      if (!options.user || !options.name) {
        console.error('Error: User ID and name are required');
        process.exit(1);
      }
      
      let config = {};
      if (options.config) {
        config = require(options.config);
      }
      
      let script;
      switch (options.type) {
        case 'polyglot':
          script = generateDelenPolyglotPayload();
          break;
        case 'test':
          script = generateDelenTestPayload();
          break;
        case 'banking':
          script = generateBankingPayload();
          break;
        case 'standard':
        default:
          script = generateDelenPayloadScript(config);
          break;
      }
      
      const obfuscatedScript = obfuscateScript(script, parseInt(options.obfuscation));
      
      console.log(obfuscatedScript);
    } catch (error) {
      console.error('Error generating payload:', error.message);
      process.exit(1);
    }
  });

// List payloads command
program
  .command('list-payloads')
  .description('List all payloads for a user')
  .option('-u, --user <id>', 'User ID')
  .action(async (options) => {
    try {
      if (!options.user) {
        console.error('Error: User ID is required');
        process.exit(1);
      }
      
      const payloads = await Payload.find({ userId: options.user });
      
      if (payloads.length === 0) {
        console.log('No payloads found for this user');
        return;
      }
      
      console.log('Payloads:');
      payloads.forEach(payload => {
        console.log(`  ${payload.id}: ${payload.name} (${payload.isActive ? 'active' : 'inactive'})`);
      });
    } catch (error) {
      console.error('Error listing payloads:', error.message);
      process.exit(1);
    }
  });

// List reports command
program
  .command('list-reports')
  .description('List XSS reports')
  .option('-p, --payload <id>', 'Filter by payload ID')
  .option('-s, --status <status>', 'Filter by verification status')
  .option('-c, --confidence <min>', 'Minimum confidence score')
  .option('-l, --limit <number>', 'Limit number of results', '50')
  .action(async (options) => {
    try {
      const filter = {};
      
      if (options.payload) filter.payloadId = options.payload;
      if (options.status) filter.verificationStatus = options.status;
      if (options.confidence) filter.confidenceScore = { $gte: parseInt(options.confidence) };
      
      const reports = await Report.find(filter)
        .sort({ createdAt: -1 })
        .limit(parseInt(options.limit));
      
      if (reports.length === 0) {
        console.log('No reports found matching criteria');
        return;
      }
      
      console.log('Reports:');
      reports.forEach(report => {
        console.log(`  ${report.id}: ${report.url} (Confidence: ${report.confidenceScore}%, Status: ${report.verificationStatus})`);
      });
    } catch (error) {
      console.error('Error listing reports:', error.message);
      process.exit(1);
    }
  });

// Show report details
program
  .command('show-report')
  .description('Show detailed information about a report')
  .argument('<id>', 'Report ID')
  .action(async (id) => {
    try {
      const report = await Report.findById(id);
      
      if (!report) {
        console.error('Report not found');
        process.exit(1);
      }
      
      console.log('Report Details:');
      console.log(`  ID: ${report.id}`);
      console.log(`  Payload ID: ${report.payloadId}`);
      console.log(`  URL: ${report.url}`);
      console.log(`  Confidence Score: ${report.confidenceScore}`);
      console.log(`  Verification Status: ${report.verificationStatus}`);
      console.log(`  Triggered At: ${report.triggeredAt}`);
      console.log(`  IP: ${report.ip}`);
      console.log(`  User Agent: ${report.userAgent}`);
      console.log(`  Referer: ${report.referer}`);
      console.log(`  Origin: ${report.origin}`);
      
      if (report.bankingData) {
        console.log('  Banking Data:');
        console.log(`    Account Fields: ${report.bankingData.accountFields || 0}`);
        console.log(`    Amount Fields: ${report.bankingData.amountFields || 0}`);
        console.log(`    Beneficiary Fields: ${report.bankingData.beneficiaryFields || 0}`);
        console.log(`    Sensitive Keywords: ${report.bankingData.sensitiveKeywords || 0}`);
      }
      
      if (report.financialForms && report.financialForms.length > 0) {
        console.log('  Financial Forms:');
        report.financialForms.forEach((form, index) => {
          console.log(`    Form ${index + 1}:`);
          console.log(`      Action: ${form.action}`);
          console.log(`      Method: ${form.method}`);
          console.log(`      Fields: ${form.fields ? form.fields.length : 0}`);
        });
      }
      
      if (report.cookies && Object.keys(report.cookies).length > 0) {
        console.log('  Cookies:');
        for (const [name, value] of Object.entries(report.cookies)) {
          console.log(`    ${name}: ${value}`);
        }
      }
      
      if (report.localStorage && Object.keys(report.localStorage).length > 0) {
        console.log('  Local Storage:');
        for (const [name, value] of Object.entries(report.localStorage)) {
          console.log(`    ${name}: ${value}`);
        }
      }
    } catch (error) {
      console.error('Error showing report:', error.message);
      process.exit(1);
    }
  });

// Start server command
program
  .command('start')
  .description('Start the Delen Private Bank Blind XSS server')
  .option('-p, --port <port>', 'Port to listen on', '3000')
  .action((options) => {
    process.env.PORT = options.port;
    require('./index.delen.js');
  });

program.parse();