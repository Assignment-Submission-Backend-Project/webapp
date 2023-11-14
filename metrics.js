const StatsD = require('node-statsd');
const client = new StatsD({
    host: 'localhost', // Replace with your StatsD host
    port: 8125, // Default StatsD port
  });

module.exports = client;