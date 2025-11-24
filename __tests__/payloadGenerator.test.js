const { generatePayloadScript, generateTestPayload, generatePolyglotPayload } = require('../utils/payloadGenerator');

describe('Payload Generator', () => {
  test('should generate a valid payload script', () => {
    const config = {
      collectUrl: true,
      collectUserAgent: true,
      collectCookies: true
    };
    
    const script = generatePayloadScript(config);
    expect(script).toContain('window.location.href');
    expect(script).toContain('navigator.userAgent');
    expect(script).toContain('document.cookie');
  });
  
  test('should generate a test payload', () => {
    const payload = generateTestPayload();
    expect(payload).toContain('script');
    expect(payload).toContain('Image');
  });
  
  test('should generate a polyglot payload', () => {
    const payload = generatePolyglotPayload();
    expect(payload).toBeDefined();
    expect(payload.length).toBeGreaterThan(0);
  });
});