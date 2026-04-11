const http = require('http');

http.get('http://localhost:5001/api/health', (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => console.log('Ping:', data));
});
