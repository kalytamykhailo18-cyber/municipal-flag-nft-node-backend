/**
 * Routes index
 * Mounts all API routes to a single router
 */
const express = require('express');
const router = express.Router();
const config = require('../config');

// Route definitions: [path, routeModule]
const routeDefinitions = [
  ['/countries', './countryRoutes'],
  ['/regions', './regionRoutes'],
  ['/municipalities', './municipalityRoutes'],
  ['/flags', './flagRoutes'],
  ['/users', './userRoutes'],
  ['/auctions', './auctionRoutes'],
  ['/rankings', './rankingRoutes'],
  ['/admin', './adminRoutes'],
];

// Mount all routes
routeDefinitions.forEach(([path, modulePath]) => {
  router.use(path, require(modulePath));
});

// API root endpoint - list all available endpoints
router.get('/', (req, res) => {
  const endpoints = {};

  routeDefinitions.forEach(([path]) => {
    const name = path.replace('/', '');
    endpoints[name] = path;
  });

  res.json({
    name: config.projectName,
    version: '1.0.0',
    environment: config.env,
    endpoints,
  });
});

module.exports = router;
