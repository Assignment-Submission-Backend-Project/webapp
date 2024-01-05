console.log("Starting program.")
// const flag = require('./databasepg')
const express = require('express');
var bodyParser = require('body-parser');
const nodemon = require('nodemon');
const app = express();
const { Sequelize, DataTypes } = require('sequelize');
const port = 3000; // Connects to localhost:3000
const router = express.Router();
router.use(express.json());
require('dotenv').config();
const mailgun = require("mailgun-js");
// const mg = mailgun.client({ username: '96194b167ba8649e193e9d2bc0c06bdc-8c9e82ec-b1942655', key: process.env.MAILGUN_API_KEY || '96194b167ba8649e193e9d2bc0c06bdc-8c9e82ec-b1942655' });
const logger = require('./logger');
const client2 = require('./metrics');

//
const { Pool } = require('pg');
const dbDialect = process.env.DB_DIALECT;
const dbHost = process.env.DB_HOST;
const dbName = process.env.DB_NAME;
const dbUser = process.env.DB_USER;
const dbPass = process.env.DB_PASS;
const sequelize = new Sequelize({
  dialect: dbDialect,
  host: dbHost,
  database: dbName,
  username: dbUser,
  password: dbPass,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});
async function checkDatabaseConnection() {
  // The object below has the postgres test DB credentials / configurations. Port : 5432, name : test, user : postgres.
  const dbConfig = {
    host: dbHost,
    user: dbUser,
    port: 5432,
    password: dbPass,
    database: dbName,
  };
  const pool = new Pool(dbConfig);


  try {
    // The line below connects to the main test postgres DB.
    const client = await pool.connect();
    // Releases the resource on successful connection.
    client.release();
    return true;
  } catch (error) {
    //console.error('Database connection error:', error);
    return false;
  } finally {
    pool.end();
  }

}
//aDaDaD@131313a
//C:\Users\aniru/.ssh/id_rsa
//SHA256:4r1PH9x3EYM9kI1gV16Y8/V1fxWvaQr6FxZiJ1AM+VA aniru@Anirudh

//ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQDSEvxhX6As9BtcMwYq8uhMi06Limf+gI39ug16TXspvgl3Jeb8eZ9oENmsSWX5bam/3tNKBtuRdhEV1cp8Sm1rGvfaspr8L2h9vOvGDzF0oLbggC0e81EoOON3JGnQ2irMHdDqnVx8GK7pJloJQMtgcuy+teHvTtkjF0wkOuk+THNEsi4+RbaGkGV+nXSSROkaZWbNCY5JOufmk99eVN2q+yXwBnYKBLUWFHH0m2RgDn9jTUMq9TiCv26U/OU3ndKqrtYmcxFRkHLVzcA6pcbYhR91I8g4CdcpGXKDXhuLEVlpbcVsUWTC94suvuzn8rXfZz4jz+SMddcOQN8bNFPVLYahK6UqHpHGko2A8ajwYpcxoC89d5nyXbvfYJ9aH+P7bnCAQgmuE3tx2rAhocPUt5+S2pnZaFJBzZKWEjC8IpFJ7rEJUqEfWjfC+YIPocZGnLJtkLptr6JOl7kEK45i27YaQWEMov9dvee60mpyGHuqbrPEYO4y9oOkyZkpFmc= aniru@Anirudh
//echo "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQDSEvxhX6As9BtcMwYq8uhMi06Limf+gI39ug16TXspvgl3Jeb8eZ9oENmsSWX5bam/3tNKBtuRdhEV1cp8Sm1rGvfaspr8L2h9vOvGDzF0oLbggC0e81EoOON3JGnQ2irMHdDqnVx8GK7pJloJQMtgcuy+teHvTtkjF0wkOuk+THNEsi4+RbaGkGV+nXSSROkaZWbNCY5JOufmk99eVN2q+yXwBnYKBLUWFHH0m2RgDn9jTUMq9TiCv26U/OU3ndKqrtYmcxFRkHLVzcA6pcbYhR91I8g4CdcpGXKDXhuLEVlpbcVsUWTC94suvuzn8rXfZz4jz+SMddcOQN8bNFPVLYahK6UqHpHGko2A8ajwYpcxoC89d5nyXbvfYJ9aH+P7bnCAQgmuE3tx2rAhocPUt5+S2pnZaFJBzZKWEjC8IpFJ7rEJUqEfWjfC+YIPocZGnLJtkLptr6JOl7kEK45i27YaQWEMov9dvee60mpyGHuqbrPEYO4y9oOkyZkpFmc= aniru@Anirudh" >> ~/.ssh/authorized_keys


router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: false }));
// Adds the Cache-control on the Header.
router.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache');
  if (req.method === 'GET' && (Object.keys(req.body).length > 0 || Object.keys(req.query).length > 0 || Object.keys(req.params).length > 0)) {
    console.log("400");
    logger.info('400');
    return res.status(400).send();

  }
  if (req.method === 'DELETE' && (Object.keys(req.body).length > 0 || Object.keys(req.query).length > 0 || Object.keys(req.params).length > 0)) {
    console.log("400");
    logger.info('400');
    return res.status(400).send();

  }
  next();

  // next();
});

// Health check endpoint
router.get('/healthz', (req, res) => {
  client2.increment('healthz');
  console.log(req.body)
  sequelize.authenticate()
    .then(() => {
      res.status(200).send();
      logger.info('200');
      console.log("200");
    })
    .catch(err => {
      res.status(503).send();
      logger.info('503');
      console.log("503");
    });
}

);
// The following code handles all other HTTP requests. Sends 405.
router.all('/healthz', (req, res) => {
  client2.increment('healthz');
  res.status(405).send();
  logger.info('405');
  console.log("405");
});


// Starts the server, on port 3000.
// app.listen(port, () => {
//   console.log(`Server is running on port ${port}`);
// });

module.exports = router
// Instructions for starting in terminal :
// npm init -y
// npm install express lodash pg nodemon
// npm start

// Instructions for cmd (postgres) :
// Run CMD as administrator
// pg_ctl -D "C:\Program Files\PostgreSQL\16\data" stop
// pg_ctl -D "C:\Program Files\PostgreSQL\16\data" start