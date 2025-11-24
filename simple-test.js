// Simple test to verify our Blind XSS tool works
const axios = require('axios');

async function testPayload() {
    try {
        console.log('Testing Blind XSS payload delivery...');
        
        // Send a test report to our tool
        const testData = {
            url: 'http://localhost/test-page.html',
            userAgent: 'Mozilla/5.0 (Test Client)',
            referer: 'http://localhost/test-referrer',
            origin: 'http://localhost',
            timestamp: new Date().toISOString(),
            pageTitle: 'Test Page',
            testPayload: true,
            ip: '127.0.0.1'
        };
        
        const response = await axios.post('http://localhost:3000/api/reports', testData);
        console.log('Payload delivered successfully!');
        console.log('Response:', response.data);
        
        // Check the status
        const status = await axios.get('http://localhost:3000/delen-status');
        console.log('Tool status:', status.data);
        
    } catch (error) {
        console.error('Error testing payload:', error.message);
    }
}

testPayload();