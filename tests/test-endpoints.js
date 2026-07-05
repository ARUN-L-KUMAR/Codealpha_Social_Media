const http = require('http');

// Test explore endpoint
console.log('Testing /api/posts/explore...');
http.get('http://localhost:5000/api/posts/explore', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Explore endpoint status:', res.statusCode);
    if (res.statusCode === 200) {
      const result = JSON.parse(data);
      console.log('Explore endpoint working! Returned', result.count || 0, 'posts');
    }
  });
}).on('error', err => console.log('Explore error:', err.message));

// Test trending endpoint
setTimeout(() => {
  console.log('\nTesting /api/posts/trending...');
  http.get('http://localhost:5000/api/posts/trending', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Trending endpoint status:', res.statusCode);
      if (res.statusCode === 200) {
        const result = JSON.parse(data);
        console.log('Trending endpoint working! Returned', result.data?.length || 0, 'topics');
      }
    });
  }).on('error', err => console.log('Trending error:', err.message));
}, 1000);
