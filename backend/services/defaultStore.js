const path = require('path');
const { seedData } = require('../data/seedData');
const { createJsonStore } = require('./jsonStore');

const defaultStore = createJsonStore({
  filePath: process.env.SCOUT_LINK_DB_PATH || path.join(__dirname, '..', 'data', 'db.json'),
  seedData,
});

module.exports = {
  defaultStore,
};
