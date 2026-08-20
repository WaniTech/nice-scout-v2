const http = require('http');
const { createApp } = require('./app');
const { defaultStore } = require('./services/defaultStore');
const { createSocketService } = require('./services/socketService');

const PORT = process.env.PORT || 5000;
const socketService = createSocketService({ store: defaultStore });
const app = createApp({ store: defaultStore, socketService });
const server = http.createServer(app);

socketService.attach(server);

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Scout Link Player API with Real-Time WebSockets running on port ${PORT}`);
  });
}

module.exports = {
  app,
  server,
  socketService,
};
