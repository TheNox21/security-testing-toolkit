# Advanced Blind XSS Tool Usage

This tool is an enhanced Blind XSS detection framework based on ezXSS with improved accuracy and reduced false positives.

## Installation

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd advanced-blind-xss
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up MongoDB (required for data storage):
   - Install MongoDB locally or use a cloud service
   - Update the `MONGODB_URI` in `.env` file

4. Configure the tool:
   - Copy `.env` to `.env.local` and customize settings
   - Copy `config.sample.json` to `config.json` and customize settings

## Starting the Server

```bash
npm start
```

Or using the CLI:

```bash
node cli.js start
```

## Generating Payloads

Generate a standard payload:
```bash
node cli.js generate-payload -u USER_ID -n "My Payload"
```

Generate a polyglot payload:
```bash
node cli.js generate-payload -u USER_ID -n "Polyglot Payload" -t polyglot
```

Generate a test payload:
```bash
node cli.js generate-payload -u USER_ID -n "Test Payload" -t test
```

## Managing Payloads

List all payloads for a user:
```bash
node cli.js list-payloads -u USER_ID
```

## Viewing Reports

List all reports:
```bash
node cli.js list-reports
```

List reports with filters:
```bash
node cli.js list-reports -s verified -c 90
```

Show detailed report information:
```bash
node cli.js show-report REPORT_ID
```

## Key Features for Reducing False Positives

1. **Confidence Scoring**: Each report is assigned a confidence score (0-100) based on multiple heuristics.

2. **Machine Learning Classification**: Uses a trained model to classify reports as genuine XSS or false positives.

3. **Multi-stage Verification**: Implements a multi-stage verification process that checks temporal consistency, data integrity, and behavioral patterns.

4. **Duplicate Detection**: Identifies and filters duplicate reports to reduce noise.

5. **Automation Detection**: Recognizes automated scanning tools and bots that might trigger false positives.

6. **Configurable Sensitivity**: Adjust sensitivity settings to balance between catching real vulnerabilities and minimizing false positives.

## Configuration

Key configuration options in `.env`:

- `MIN_CONFIDENCE_SCORE`: Minimum confidence score required to report a finding (0-100)
- `ENABLE_MULTI_STAGE_VERIFICATION`: Enable multi-stage verification process
- `DUPLICATE_DETECTION_WINDOW`: Time window for duplicate detection (in seconds)
- `ENABLE_ML_CLASSIFICATION`: Enable machine learning classification
- `PAYLOAD_OBFUSCATION_LEVEL`: Payload obfuscation level (0-3)

## API Endpoints

- `POST /api/reports`: Receive XSS payload reports
- `GET /api/reports`: List reports with filtering options
- `GET /api/reports/:id`: Get detailed report information
- `POST /api/payloads`: Create new payloads
- `GET /api/payloads`: List payloads
- `GET /api/payloads/:id/script`: Get payload script
- `GET /health`: Health check endpoint

## Integration with Other Tools

The tool can receive reports via webhooks from other security tools and platforms, allowing for centralized XSS detection and analysis.