const axios = require('axios');

async function testAPI() {
  try {
    // Test creating a payload
    console.log('Creating a test payload...');
    const payloadResponse = await axios.post('http://localhost:3000/api/payloads', {
      userId: 'test-user',
      name: 'API Test Payload',
      script: 'alert("test")'
    });
    
    console.log('Payload created:', payloadResponse.data);
    
    // Test creating a report
    console.log('Creating a test report...');
    const reportResponse = await axios.post('http://localhost:3000/api/reports', {
      payloadId: payloadResponse.data.id,
      url: 'https://app.delen.be/login',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      ip: '192.168.1.100',
      cookies: { session: 'abc123' },
      bankingData: {
        accountFields: 2,
        amountFields: 1,
        beneficiaryFields: 1,
        sensitiveKeywords: 3
      }
    });
    
    console.log('Report created:', reportResponse.data);
    
    // Test getting reports
    console.log('Getting reports...');
    const reportsResponse = await axios.get('http://localhost:3000/api/reports');
    console.log('Reports retrieved:', reportsResponse.data);
    
    // Test Delen status
    console.log('Checking Delen status...');
    const statusResponse = await axios.get('http://localhost:3000/delen-status');
    console.log('Status:', statusResponse.data);
    
  } catch (error) {
    console.error('Error testing API:', error.message);
  }
}

testAPI();