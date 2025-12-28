/**
 * Database connection and models
 */
const { Sequelize } = require('sequelize');
const config = require('../../config');

// Create Sequelize instance
let sequelize;

if (config.database.url) {
  sequelize = new Sequelize(config.database.url, {
    dialect: 'postgres',
    logging: config.database.logging ? console.log : false,
    dialectOptions:
      config.env === 'production'
        ? { ssl: { require: true, rejectUnauthorized: false } }
        : {},
    pool: config.database.pool,
  });
} else {
  sequelize = new Sequelize(
    config.database.name,
    config.database.user,
    config.database.password,
    {
      host: config.database.host,
      port: config.database.port,
      dialect: 'postgres',
      logging: config.database.logging ? console.log : false,
      pool: config.database.pool,
    }
  );
}

// Import and initialize models
const Country = require('./Country')(sequelize);
const Region = require('./Region')(sequelize);
const Municipality = require('./Municipality')(sequelize);
const Flag = require('./Flag')(sequelize);
const User = require('./User')(sequelize);
const FlagInterest = require('./FlagInterest')(sequelize);
const FlagOwnership = require('./FlagOwnership')(sequelize);
const UserConnection = require('./UserConnection')(sequelize);
const Auction = require('./Auction')(sequelize);
const Bid = require('./Bid')(sequelize);

// Models object
const models = {
  Country,
  Region,
  Municipality,
  Flag,
  User,
  FlagInterest,
  FlagOwnership,
  UserConnection,
  Auction,
  Bid,
};

// Set up associations
Object.values(models).forEach((model) => {
  if (model.associate) {
    model.associate(models);
  }
});

// Test connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('[DATABASE] Connection established successfully.');
    return true;
  } catch (error) {
    console.error('[DATABASE] Unable to connect:', error.message);
    return false;
  }
};

module.exports = {
  ...models,
  sequelize,
  Sequelize,
  testConnection,
  // Sequelize CLI config
  development: {
    url: config.database.url,
    host: config.database.host,
    port: config.database.port,
    database: config.database.name,
    username: config.database.user,
    password: config.database.password,
    dialect: 'postgres',
  },
  production: {
    url: config.database.url,
    dialect: 'postgres',
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
  },
};
