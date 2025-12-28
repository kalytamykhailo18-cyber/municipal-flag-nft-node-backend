/**
 * Simple Express server for serving the built Vite app
 * Used for Railway deployment
 */
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const distPath = path.join(__dirname, 'dist');
const indexPath = path.join(distPath, 'index.html');

// Check if dist folder exists
console.log(`Checking dist folder: ${distPath}`);
console.log(`Dist exists: ${fs.existsSync(distPath)}`);
if (fs.existsSync(distPath)) {
  console.log(`Dist contents: ${fs.readdirSync(distPath).join(', ')}`);
}
console.log(`Index.html exists: ${fs.existsSync(indexPath)}`);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', distExists: fs.existsSync(distPath) });
});

// Serve static files from dist directory
app.use(express.static(distPath));

// Handle React Router - return index.html for all routes
app.get('*', (req, res) => {
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(500).send('index.html not found. Build may have failed.');
  }
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Frontend server running on http://0.0.0.0:${PORT}`);
});

server.on('error', (err) => {
  console.error('Server error:', err);
});
