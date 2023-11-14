const winston = require('winston');

const logger = winston.createLogger({
    level: 'info', // Set the log level
    format: winston.format.json(), // You can change the format as needed
    transports: [
      new winston.transports.Console(), // Log to the console
      new winston.transports.File({ filename: 'csye6225.log' }), // Log to a file
    ],
  });

  module.exports = logger;