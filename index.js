import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import routes from './routes.js';
import { initDemoDataIfEmpty } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount API routes
app.use('/api', routes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'RoomHisaab', timestamp: new Date().toISOString() });
});

// SEO: robots.txt
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(`User-agent: *
Allow: /
Disallow: /api/
Disallow: /data/
Disallow: /uploads/

Sitemap: https://roomhisab-m6pm.onrender.com/sitemap.xml`);
});

// SEO: sitemap.xml
app.get('/sitemap.xml', (req, res) => {
  res.type('application/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://roomhisab-m6pm.onrender.com/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`);
});

// Google Search Console Verification
app.get('/google3b82a2b02e1744dc.html', (req, res) => {
  res.type('text/html');
  res.send('google-site-verification: google3b82a2b02e1744dc.html');
});

// Serve frontend built assets from ./dist
const distDir = path.join(__dirname, 'dist');
app.use(express.static(distDir));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return next();
  }
  res.sendFile(path.join(distDir, 'index.html'), err => {
    if (err) {
      res.status(200).send('RoomHisaab Server Running.');
    }
  });
});

// Initialize database with demo data if empty
initDemoDataIfEmpty();

app.listen(PORT, () => {
  console.log(`🚀 RoomHisaab Backend server listening on http://localhost:${PORT}`);
});
