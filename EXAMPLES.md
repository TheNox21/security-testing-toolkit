# Advanced Blind XSS Tool Examples

This document provides practical examples of how to use the Advanced Blind XSS tool for detecting Blind XSS vulnerabilities.

## Basic Usage

### 1. Starting the Server

```bash
# Start the server with default settings
npm start

# Or using the CLI
node cli.js start --port 3000
```

### 2. Generating a Payload

```bash
# Generate a basic payload
node cli.js generate-payload -u "user123" -n "Basic Payload"

# Generate a payload with heavy obfuscation
node cli.js generate-payload -u "user123" -n "Obfuscated Payload" -o 3

# Generate a polyglot payload
node cli.js generate-payload -u "user123" -n "Polyglot Payload" -t polyglot
```

### 3. Viewing Reports

```bash
# List all reports
node cli.js list-reports

# List only verified reports with high confidence
node cli.js list-reports -s verified -c 90

# List reports for a specific payload
node cli.js list-reports -p "payload-id-123"
```

## Advanced Usage

### 1. Custom Configuration

Create a custom configuration file [config.json](file:///c%3A/Users/user23/Desktop/bounty/xss/config.json):

```json
{
  "security": {
    "minConfidenceScore": 85,
    "enableMultiStageVerification": true
  },
  "payloads": {
    "defaultOptions": {
      "collectUrl": true,
      "collectIp": true,
      "collectUserAgent": true,
      "collectCookies": false,
      "collectLocalStorage": false,
      "collectSessionStorage": false,
      "collectDom": true,
      "collectOrigin": true,
      "collectReferer": true,
      "takeScreenshot": false
    }
  }
}
```

Use the custom configuration:

```bash
node cli.js generate-payload -u "user123" -n "Custom Payload" -c ./config.json
```

### 2. Using the Web API

Create a payload via API:

```bash
curl -X POST http://localhost:3000/api/payloads \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "name": "API Payload",
    "config": {
      "collectUrl": true,
      "collectUserAgent": true,
      "collectCookies": true
    }
  }'
```

List reports via API:

```bash
curl http://localhost:3000/api/reports?minConfidenceScore=80
```

Get a specific report:

```bash
curl http://localhost:3000/api/reports/REPORT_ID
```

### 3. Webhook Integration

Set up a webhook to receive reports from other tools:

```bash
curl -X POST http://localhost:3000/api/webhooks/custom \
  -H "Content-Type: application/json" \
  -d '{
    "url": "http://target.com/vulnerable.php",
    "userAgent": "Mozilla/5.0...",
    "cookies": {"session": "abc123"}
  }'
```

## Integration Examples

### 1. Burp Suite Integration

You can use the generated payloads in Burp Suite's active scanner or manually insert them into requests:

1. Generate a payload:
   ```bash
   node cli.js generate-payload -u "burp-user" -n "Burp Payload"
   ```

2. Insert the payload into request parameters in Burp Suite

3. Monitor the dashboard for any triggered payloads

### 2. Automated Scanning Integration

Example script to integrate with an automated scanner:

```javascript
const axios = require('axios');

async function scanForXSS(targetUrl) {
  // Generate a payload for this scan
  const payloadResponse = await axios.post('http://localhost:3000/api/payloads', {
    userId: 'automated-scanner',
    name: `Scan ${targetUrl}`,
    config: {
      collectUrl: true,
      collectUserAgent: true,
      collectCookies: true
    }
  });
  
  const payload = payloadResponse.data;
  
  // Get the payload script
  const scriptResponse = await axios.get(`http://localhost:3000/api/payloads/${payload.id}/script`);
  const payloadScript = scriptResponse.data;
  
  // Inject the payload into the target application
  // ... scanning logic here ...
  
  // Check for results after scanning
  const reportsResponse = await axios.get(`http://localhost:3000/api/reports?payloadId=${payload.id}`);
  return reportsResponse.data.reports;
}
```

### 3. Continuous Integration Integration

Example GitHub Actions workflow:

```yaml
name: XSS Scan
on: [push, pull_request]

jobs:
  xss-scan:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v2
        
      - name: Start Advanced Blind XSS server
        run: |
          npm install
          npm start &
          sleep 10
          
      - name: Generate payload
        run: |
          PAYLOAD=$(node cli.js generate-payload -u "github-action" -n "CI Payload")
          echo "PAYLOAD_SCRIPT=$PAYLOAD" >> $GITHUB_ENV
          
      - name: Run security scan
        run: |
          # Use the payload in your security scanning tools
          echo "$PAYLOAD_SCRIPT"
          
      - name: Check for vulnerabilities
        run: |
          REPORTS=$(curl -s "http://localhost:3000/api/reports?minConfidenceScore=80")
          if [ "$REPORTS" != "[]" ]; then
            echo "Potential XSS vulnerabilities found!"
            echo "$REPORTS"
            exit 1
          fi
```

## Dashboard Usage

### 1. Accessing the Dashboard

Open your browser and navigate to http://localhost:3000

### 2. Monitoring Reports

The dashboard shows:
- Total reports received
- Verified XSS vulnerabilities
- Reports pending review
- False positives filtered out

### 3. Generating Payloads

Use the payload generation form on the dashboard:
1. Enter your User ID
2. Provide a name for the payload
3. Select obfuscation level
4. Click "Generate Payload"
5. Copy the generated payload for use in testing

## Best Practices

### 1. Reducing False Positives

- Set appropriate confidence score thresholds
- Enable multi-stage verification
- Use domain whitelisting when possible
- Regularly review and update the ML model

### 2. Payload Deployment

- Use context-appropriate payloads (e.g., polyglot for input fields)
- Apply appropriate obfuscation levels
- Monitor payload performance and adjust accordingly

### 3. Report Analysis

- Focus on high-confidence reports first
- Review "needs_review" reports periodically
- Use the dashboard filtering capabilities
- Correlate findings with other security tools

## Troubleshooting

### 1. No Reports Received

- Verify the payload is correctly deployed
- Check network connectivity to the collector
- Ensure the target application executes JavaScript
- Review server logs for errors

### 2. High False Positive Rate

- Adjust confidence score thresholds
- Review ML model performance
- Check for automation signatures in reports
- Verify payload configuration

### 3. Performance Issues

- Monitor MongoDB performance
- Review server resource usage
- Consider scaling the deployment
- Optimize database indexes

## Security Considerations

### 1. Data Protection

- Ensure reports are stored securely
- Protect access to the dashboard
- Use HTTPS for production deployments
- Regularly backup the database

### 2. Payload Security

- Review generated payloads for safety
- Avoid payloads that could cause harm
- Test payloads in safe environments
- Keep payload generation logic secure

This tool is designed for authorized security testing only. Always obtain proper permission before testing any applications.