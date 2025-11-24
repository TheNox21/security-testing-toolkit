# Delen Private Bank Bug Bounty Hunting Guide

This guide provides instructions on how to use the specialized Blind XSS detection tool for targeting Delen Private Bank assets within the Intigriti bug bounty program.

## Program Overview

Delen Private Bank is a family-based specialist in asset management, focused on wealth preservation, growth and careful planning. The bug bounty program offers rewards up to €15,000 for valid findings.

### In-Scope Assets

- api.digital.delen.be (Tier 2)
- api.digital.delen.lu (Tier 2)
- app.delen.be (Tier 2)
- app.delen.ch (Tier 2)
- app.delen.lu (Tier 2)
- auth.digital.delen.be (Tier 2)
- auth.digital.delen.lu (Tier 2)
- be.delen.digital (Tier 2 - Android app)
- delen/id1064839588 (Tier 2 - iOS app)
- login.delen.be (Tier 2)
- login.delen.ch (Tier 2)
- login.delen.lu (Tier 2)
- login.oyens.com (Tier 2)
- status.delen.be (Tier 2)
- sts.delen.be (Tier 2)
- www.cadelam.be (Tier 2)
- www.cadelux.lu/en (Tier 2)
- www.delen.bank (Tier 2)
- www.delen.be/en (Tier 2)

### Severity Ratings

- Exceptional (9.5-10.0): €15,000
- Critical (9.0-9.4): €8,000
- High (7.0-8.9): €2,500
- Medium (4.0-6.9): €250
- Low (0.1-3.9): €100

## Tool Setup

1. Install the tool:
   ```bash
   npm install
   ```

2. Configure MongoDB in `.env`:
   ```env
   MONGODB_URI=mongodb://localhost:27017/delen_xss
   PORT=3000
   ```

3. Start the server:
   ```bash
   npm run start-delen
   ```

## Payload Generation

Generate specialized payloads for Delen Private Bank:

```bash
# Generate a banking-specific payload
delen-blind-xss generate-payload -u "YOUR_USER_ID" -n "Delen Banking Payload" -t banking

# Generate a standard payload with high obfuscation
delen-blind-xss generate-payload -u "YOUR_USER_ID" -n "Delen Standard Payload" -o 3

# Generate a polyglot payload
delen-blind-xss generate-payload -u "YOUR_USER_ID" -n "Delen Polyglot Payload" -t polyglot
```

## Targeted Attack Vectors

### Authentication Systems
Focus on these high-value targets:
- login.delen.be
- login.delen.ch
- login.delen.lu
- auth.digital.delen.be
- auth.digital.delen.lu
- sts.delen.be

Test for:
- OAuth implementation flaws
- Session management issues
- Account takeover vectors

### Web Applications
Primary attack surface:
- app.delen.be
- app.delen.ch
- app.delen.lu

Look for:
- Stored XSS (highest payout)
- Business logic flaws
- Input validation issues
- Financial transaction manipulation

### APIs
Critical data exposure risk:
- api.digital.delen.be
- api.digital.delen.lu

Test for:
- Insecure direct object references
- Broken authentication
- Insufficient authorization
- Data exposure

## Payload Placement Strategies

### Input Fields
- Contact forms
- Search fields
- Comment sections
- Profile information
- Transaction details
- Account settings

### HTTP Headers
- User-Agent
- Referer
- Custom headers
- Cookie values

### File Uploads
- Profile pictures
- Document uploads
- Avatar images

## Testing Methodology

### 1. Reconnaissance
- Map all in-scope domains
- Identify input vectors
- Analyze client-side code
- Look for JSONP endpoints

### 2. Payload Injection
- Use generated payloads from the tool
- Test different contexts (HTML, JavaScript, CSS, URL)
- Try various obfuscation levels

### 3. Monitoring
- Check the dashboard for reports
- Monitor confidence scores
- Review verification results

### 4. Validation
- Confirm genuine XSS triggers
- Document exploitation steps
- Prepare PoC for submission

## Best Practices

### Quality Over Quantity
- Focus on high-impact findings
- Provide detailed reproduction steps
- Include clear attack scenarios
- Create step-by-step PoCs

### Avoiding False Positives
- The tool's confidence scoring helps filter these
- Review reports with low confidence scores
- Validate findings manually when possible

### Staying Within Scope
- Only test in-scope assets
- Respect rate limits (max 5 requests/sec)
- Follow Intigriti's safe harbor policy

## Report Analysis

### High Confidence Reports (90+)
- Prioritize for manual validation
- These are likely genuine findings
- Prepare detailed writeups

### Medium Confidence Reports (70-89)
- Review for potential false positives
- Manual validation recommended
- May require additional context

### Low Confidence Reports (<70)
- Likely false positives
- Review for learning opportunities
- Generally safe to ignore

## Intigriti Submission Guidelines

### Required Information
1. Detailed reproduction steps
2. Clear attack scenario
3. Step-by-step PoC
4. Impact assessment
5. Screenshots or video evidence

### Quality Tips
- Be concise but thorough
- Use clear, professional language
- Include technical details
- Demonstrate business impact

## Common Pitfalls to Avoid

### Out of Scope
- Brute force/automated scans
- Third-party services (unless misconfigured)
- Self-XSS without exploitation path
- Missing security headers
- CSRF with low impact

### Low-Quality Submissions
- Vague reproduction steps
- Missing impact assessment
- Insufficient evidence
- Duplicate reports

## Advanced Features

### Banking Data Collection
The specialized payloads automatically collect:
- Account-related input fields
- Transaction forms
- Payment processing elements
- Sensitive financial data

### Financial Context Detection
- Identifies banking-related keywords
- Detects financial transaction pages
- Recognizes payment forms
- Flags sensitive data exposure

### Enhanced Verification
- Multi-stage banking context validation
- Financial data integrity checks
- Specialized duplicate detection
- Advanced ML classification

## Troubleshooting

### No Reports Received
- Check server logs
- Verify payload placement
- Confirm network connectivity
- Review firewall settings

### Low Confidence Scores
- Review payload placement context
- Check for proper data collection
- Verify target domain is in scope
- Consider different obfuscation levels

### False Positives
- Review verification stage details
- Check for automation signatures
- Verify data integrity
- Confirm banking context

## Support

For issues with the tool, consult:
- GitHub issues
- Security community forums
- Intigriti support

Remember to always operate within the rules of engagement and obtain proper authorization before testing any applications.