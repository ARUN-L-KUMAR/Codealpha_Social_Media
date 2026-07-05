const axios = require('axios');
const jwt = require('jsonwebtoken');

// Create a test JWT token for the test user
const testUserId = '68a47540f3c9912c051a48d3';
const jwtSecret = 'IAmASuperSecretKey8778929845';

const token = jwt.sign({ id: testUserId }, jwtSecret, { expiresIn: '1h' });

async function testNotificationsAPI() {
  try {
    console.log('Testing notifications API...');
    console.log('User ID:', testUserId);
    console.log('Token:', token);

    const response = await axios.get('http://localhost:5000/api/notifications', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error testing API:', error.response?.data || error.message);
  }
}

testNotificationsAPI();
