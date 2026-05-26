require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  protocol: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    },
    connectTimeout: 60000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000
  },
  pool: {
    max: 3,
    min: 0,
    acquire: 60000,
    idle: 10000,
    evict: 10000
  },
  retry: {
    max: 5
  },
  logging: false
});

module.exports = sequelize;