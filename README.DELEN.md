# Delen Private Bank Blind XSS Detection Tool

A specialized Blind XSS detection framework for targeting Delen Private Bank assets with enhanced accuracy and reduced false positives.

## Features

- Enhanced payload filtering specifically for financial institutions
- Advanced trigger validation mechanisms
- Machine learning-based classification of potential XSS triggers
- Improved reporting with confidence scoring
- Multi-stage verification process
- Customizable sensitivity settings
- Integration with Intigriti bug bounty platform
- Real-time alerting with deduplication
- Web dashboard for monitoring and payload generation
- Specialized detection for banking data (accounts, transactions, payments)

## Prerequisites

- Node.js 14+
- MongoDB 4.4+ (or MongoDB Atlas for cloud hosting)

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

3. Set up MongoDB:
   - Install MongoDB locally or use a cloud service like MongoDB Atlas
   - Update the `MONGODB_URI` in `.env` file with your MongoDB connection string

4. Configure the tool:
   - Copy `.env` to `.env.local` and customize settings
   - Copy `config.sample.json` to `config.json` and customize settings

## Usage

### Starting the Server

```bash
npm run start-delen
```

Or using the CLI:

```bash
delen-blind-xss start
```

### Generating Payloads

```bash
delen-blind-xss generate-payload -u USER_ID -n "Delen Banking Payload"
```

### Accessing the Dashboard

Open your browser and navigate to http://localhost:3000

## Configuration

Edit `config.delen.js` to customize settings. Key configuration options include:

- `minConfidenceScore`: Minimum confidence score required to report a finding (0-100)
- `enableMultiStageVerification`: Enable multi-stage verification process
- `duplicateDetectionWindow`: Time window for duplicate detection (in seconds)
- `enableMLClassification`: Enable machine learning classification

## Environment Variables

The following environment variables can be set in the `.env` file:

- `PORT`: Server port (default: 3000)
- `MONGODB_URI`: MongoDB connection string
- `MIN_CONFIDENCE_SCORE`: Minimum confidence score (default: 85)
- `ENABLE_MULTI_STAGE_VERIFICATION`: Enable multi-stage verification (default: true)
- `DUPLICATE_DETECTION_WINDOW`: Duplicate detection window in seconds (default: 600)
- `ENABLE_ML_CLASSIFICATION`: Enable ML classification (default: true)

## API Endpoints

- `POST /api/reports`: Receive XSS payload reports
- `GET /api/reports`: List reports with filtering options
- `GET /api/reports/:id`: Get detailed report information
- `POST /api/payloads`: Create new payloads
- `GET /api/payloads`: List payloads
- `GET /api/payloads/:id/script`: Get payload script
- `GET /health`: Health check endpoint
- `GET /delen-status`: Delen Private Bank specific status endpoint

## CLI Commands

- `generate-payload`: Generate a Blind XSS payload for Delen Private Bank
- `list-payloads`: List all payloads for a user
- `list-reports`: List XSS reports
- `show-report`: Show detailed information about a report
- `start`: Start the Delen Private Bank XSS server

## Architecture

The tool consists of several components:

1. **Payload Generation Engine**: Creates JavaScript payloads for Blind XSS detection
2. **Confidence Scoring System**: Assigns confidence scores to reports to reduce false positives
3. **Machine Learning Classifier**: Uses ML to classify reports as genuine XSS or false positives
4. **Multi-stage Verification**: Performs multiple checks to confirm report validity
5. **Duplicate Detection**: Identifies and filters duplicate reports
6. **Reporting and Alerting**: Manages storage and presentation of XSS reports
7. **Banking Data Collector**: Specialized component for collecting financial data

## Security Considerations

This tool is designed for authorized security testing only. Always obtain proper permission before testing any applications.

The tool implements several features to reduce false positives:

- Multi-factor confidence scoring
- Machine learning classification
- Multi-stage verification
- Duplicate detection
- Automation signature detection
- Behavioral analysis
- Banking context validation

## Contributing

Contributions are welcome! Please read the contributing guidelines before submitting pull requests.

## License

This project is licensed under the MIT License.