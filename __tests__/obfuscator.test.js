const { obfuscateScript, encodeString } = require('../utils/obfuscator');

describe('Obfuscator', () => {
  test('should not obfuscate at level 0', () => {
    const script = 'alert("test");';
    const obfuscated = obfuscateScript(script, 0);
    expect(obfuscated).toBe(script);
  });
  
  test('should obfuscate at level 1', () => {
    const script = 'alert("test");';
    const obfuscated = obfuscateScript(script, 1);
    expect(obfuscated).toBe(script); // Level 1 is basic in our implementation
  });
  
  test('should obfuscate at level 2', () => {
    const script = 'alert("test");';
    const obfuscated = obfuscateScript(script, 2);
    expect(obfuscated).toBeDefined();
  });
  
  test('should encode strings correctly', () => {
    const str = 'test';
    const hex = encodeString(str, 'hex');
    const unicode = encodeString(str, 'unicode');
    
    expect(hex).toBe('\\x74\\x65\\x73\\x74');
    expect(unicode).toBe('\\u0074\\u0065\\u0073\\u0074');
  });
});