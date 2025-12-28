/**
 * Server Entry Point
 * Starts the Express server and connects to the database
 */
const app = require('./app');
const config = require('./config');
const { sequelize, testConnection } = require('./database/models');

// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);

  try {
    await sequelize.close();
    console.log('Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

// Start server
const startServer = async () => {
  try {
    // Test database connection
    console.log('Testing database connection...');
    const dbConnected = await testConnection();

    if (!dbConnected) {
      console.error('Failed to connect to database. Exiting...');
      process.exit(1);
    }

    console.log('Database connection successful.');

    // Sync models in development (optional - prefer migrations in production)
    if (config.env === 'development' && process.env.SYNC_DB === 'true') {
      console.log('Syncing database models...');
      await sequelize.sync({ alter: true });
      console.log('Database models synced.');
    }

    // Start HTTP server
    const server = app.listen(config.port, () => {
      console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   ${config.projectName}
║                                                            ║
║   Server running on port ${config.port}
║   Environment: ${config.env}
║   API: http://localhost:${config.port}${config.apiPrefix}
║                                                            ║
╚════════════════════════════════════════════════════════════╝
      `);
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${config.port} is already in use`);
      } else {
        console.error('Server error:', error);
      }
      process.exit(1);
    });

    // Graceful shutdown handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Unhandled rejection handler
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    // Uncaught exception handler
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
