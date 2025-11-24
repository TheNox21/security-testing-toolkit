#!/usr/bin/env node

const { Command } = require('commander');
const program = new Command();
const Payload = require('./models/Payload');
const Report = require('./models/Report');
const { generatePayloadScript, generateTestPayload, generatePolyglotPayload } = require('./utils/payloadGenerator');
const { obfuscateScript } = require('./utils/obfuscator');

program
  .name('advanced-blind-xss')
  .description('Advanced Blind XSS detection tool with reduced false positives')
  .version('1.0.0');

// Generate payload command
program
  .command('generate-payload')
  .description('Generate a Blind XSS payload')
  .option('-u, --user <id>', 'User ID')
  .option('-n, --name <name>', 'Payload name')
  .option('-o, --obfuscation <level>', 'Obfuscation level (0-3)', '2')
  .option('-t, --type <type>', 'Payload type (standard, polyglot, test)', 'standard')
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
          script = generatePolyglotPayload();
          break;
        case 'test':
          script = generateTestPayload();
          break;
        case 'standard':
        default:
          script = generatePayloadScript(config);
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
  .description('Start the Advanced Blind XSS server')
  .option('-p, --port <port>', 'Port to listen on', '3000')
  .action((options) => {
    process.env.PORT = options.port;
    require('./index.js');
  });

program.parse();