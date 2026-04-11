const http = require('http');

const data = JSON.stringify({
  title: 'Test notice',
  content: 'Here is some content for testing',
  priority: 'normal',
  targetRole: 'all'
});

const req = http.request({
  hostname: 'localhost',
  port: 5001,
  path: '/api/notices',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, res => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('Response:', res.statusCode, body));
});

req.on('error', e => console.log('Error:', e));
req.write(data);
req.end();
