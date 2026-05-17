const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

// Intercept HTML responses to inject mock-api.js
app.use((req, res, next) => {
  if (!req.path.endsWith('.html')) return next();
  const filePath = path.join(PUBLIC_DIR, req.path);
  if (!fs.existsSync(filePath)) return next();

  let html = fs.readFileSync(filePath, 'utf8');
  const scriptTag = '<script src="/js/mock-api.js"></script>\n';

  if (!html.includes('mock-api.js')) {
    html = html.replace('<script src="js/', scriptTag + '<script src="js/');
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

// Serve static files
app.use(express.static(PUBLIC_DIR));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor de demostración corriendo en http://localhost:${PORT}`);
  console.log(`Para compartir en red local, usa: http://<tu-ip>:${PORT}`);
});
