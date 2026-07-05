const http = require('http');

const makeRequest = (url) => {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          resolve(data);
        }
      });
    }).on('error', reject);
  });
};

const testEndpoints = async () => {
  try {
    console.log('Testing trending endpoint...');
    const trendingResponse = await makeRequest('http://localhost:5000/api/posts/trending');
    console.log('✅ Trending endpoint working!');
    console.log('Trending data:', JSON.stringify(trendingResponse, null, 2));

    console.log('\nTesting explore endpoint...');
    const exploreResponse = await makeRequest('http://localhost:5000/api/posts/explore');
    console.log('✅ Explore endpoint working!');
    console.log(`Found ${exploreResponse.count} explore posts`);

    console.log('\nTesting regular posts endpoint...');
    const postsResponse = await makeRequest('http://localhost:5000/api/posts');
    console.log('✅ Posts endpoint working!');
    console.log(`Found ${postsResponse.count} total posts`);

  } catch (error) {
    console.error('❌ Error testing endpoints:', error.message);
  }
};

testEndpoints();
