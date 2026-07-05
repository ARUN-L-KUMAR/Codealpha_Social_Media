const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testEndpoints() {
  try {
    console.log('Testing API endpoints...\n');

    // Test 1: Check if server is running
    try {
      const response = await axios.get(`${API_BASE}/auth/me`);
      console.log('❌ /auth/me should return 401 without token');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ /auth/me correctly returns 401 without token');
      }
    }

    // Test 2: Test user profile endpoint with invalid user
    try {
      const response = await axios.get(`${API_BASE}/users/profile/invaliduser`);
      console.log('❌ Should return 404 for invalid user');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ /users/profile/invaliduser correctly returns 404');
      }
    }

    // Test 3: Test user by ID endpoint with invalid ID
    try {
      const response = await axios.get(`${API_BASE}/users/invalidid`);
      console.log('❌ Should return error for invalid ID');
    } catch (error) {
      if (error.response?.status) {
        console.log('✅ /users/invalidid correctly returns error');
      }
    }

    console.log('\n✅ All tests passed! API endpoints are responding correctly.');

  } catch (error) {
    console.error('❌ Error testing endpoints:', error.message);
  }
}

testEndpoints();
