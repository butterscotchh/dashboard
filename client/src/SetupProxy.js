const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Proxy untuk development
  if (process.env.REACT_APP_API_URL?.includes('localhost')) {
    app.use(
      '/api',
      createProxyMiddleware({
        target: process.env.REACT_APP_API_URL.replace('/api', ''),
        changeOrigin: true,
        pathRewrite: {
          '^/api': '/api'
        }
      })
    );
  }
};