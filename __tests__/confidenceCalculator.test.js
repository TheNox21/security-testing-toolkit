const { calculateConfidenceScore } = require('../utils/confidenceCalculator');

describe('Confidence Calculator', () => {
  test('should calculate confidence score for a valid report', async () => {
    const reportData = {
      url: 'http://example.com/test.php?id=123',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      ip: '192.168.1.100',
      cookies: { session: 'abc123', user: 'test' },
      localStorage: { token: 'xyz789' },
      dom: '<html><body><h1>Test Page</h1><p>This is a test</p></body></html>',
      referer: 'http://google.com',
      origin: 'http://example.com'
    };
    
    const score = await calculateConfidenceScore(reportData);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
  
  test('should give low confidence score to bot traffic', async () => {
    const reportData = {
      url: 'http://example.com/style.css',
      userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      ip: '192.168.1.100'
    };
    
    const score = await calculateConfidenceScore(reportData);
    expect(score).toBeLessThan(50);
  });
  
  test('should give low confidence score to static resources', async () => {
    const reportData = {
      url: 'http://example.com/script.js',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      ip: '192.168.1.100'
    };
    
    const score = await calculateConfidenceScore(reportData);
    expect(score).toBeLessThan(70);
  });
});