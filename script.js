console.log("Starting program.")
// const flag = require('./databasepg')
const nodemon = require('nodemon');
const express = require('express');
const uuidv4 = require('uuid');
const fs = require('fs');
const app = express();
const port = 3000; // Connects to localhost:3000
const assignmentRouter = require('./Authentication')
const healthcheckRouter = require('./healthcheckAPI.js')
const csvParser = require('csv-parser');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config();

const logger = require('./logger');
const client = require('./metrics');

const { Sequelize, DataTypes } = require('sequelize');

// The following query was used to create the ACCOUNT table.
// CREATE TABLE IF NOT EXISTS ACCOUNT (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),first_name VARCHAR(255) NOT NULL, last_name VARCHAR(255) NOT NULL,  password VARCHAR(255) NOT NULL,  email VARCHAR(255) NOT NULL UNIQUE,  account_created TIMESTAMP DEFAULT NOW(),  account_updated TIMESTAMP DEFAULT NOW());
// The following query was used to create the ASSIGNMENT table.
// CREATE TABLE IF NOT EXISTS ASSIGNMENT (id UUID DEFAULT uuid_generate_v4(),name VARCHAR(255) NOT NULL,points NUMERIC(5, 2) NOT NULL CHECK (points >= 1 AND points <= 100),num_of_attempts INT NOT NULL CHECK (num_of_attempts >= 1 AND num_of_attempts <= 100),deadline TIMESTAMP WITH TIME ZONE NOT NULL,assignment_created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,assignment_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);
// The following query was used to create the relations table.
// CREATE TABLE IF NOT EXISTS acc_assignment (account_id UUID NOT NULL, assignment_id UUID UNIQUE NOT NULL,);

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
  // dialectOptions: {
  //   ssl: {
  //     require: true,
  //     rejectUnauthorized: false
  //   }
  // }
});


const Account = sequelize.define('account', {
  first_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  last_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  createdAt: {
    field: 'account_created',
    allowNull: false,
    type: DataTypes.DATE
  },
  updatedAt: {
    field: 'account_updated',
    allowNull: false,
    type: DataTypes.DATE
  }
}, {
  tableName: 'account', // Specify the correct table name here
});
//FOR ASSIGMENT
//const { Sequelize, DataTypes } = require('sequelize');
const sequelize2 = new Sequelize({
  dialect: dbDialect,
  host: dbHost,
  database: dbName,
  username: dbUser,
  password: dbPass,
  // dialectOptions: {
  //     ssl: {
  //         require: true,
  //         rejectUnauthorized: false
  //     }
  // }
});

const Assignment = sequelize2.define('assignment', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  points: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 100,
    },
  },
  num_of_attemps: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 100,
    },
  },
  deadline: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isDate: true
    },
  },
  createdAt: {
    field: 'assignment_created',
    allowNull: false,
    type: DataTypes.DATE
  },
  updatedAt: {
    field: 'assignment_updated',
    allowNull: false,
    type: DataTypes.DATE
  }
}, {
  tableName: 'assignment', // Specify the correct table name here
});

//FOR ACC_ASSIGNMENT
const sequelize3 = new Sequelize({
  dialect: dbDialect,
  host: dbHost,
  database: dbName,
  username: dbUser,
  password: dbPass,
  // dialectOptions: {
  //     ssl: {
  //         require: true,
  //         rejectUnauthorized: false
  //     }
  // }
});

const Acc_Assignment = sequelize3.define('acc_assignment', {
  account_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  assignment_id: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true
  }
}, {
  tableName: 'acc_assignment', // Specify the correct table name here
});
// Middleware to parse JSON requests
app.use(express.json());


app.use('/', healthcheckRouter);
app.use('/', assignmentRouter);

async function initializeDatabase() {

  try {
    // Check if the "ACCOUNT" table exists
    const AccountTableExists = await sequelize.getQueryInterface().showAllTables();

    if (!AccountTableExists.includes('account')) {
      // Create uuid-ossp extension
      await sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
      console.log('uuid-ossp extension created successfully');
      logger.info('Created uuid function "uuid-ossp" in RDS;');
      // The "ACCOUNT" table doesn't exist, so create it
      await sequelize.getQueryInterface().createTable('account', {
        id: {
          type: Sequelize.UUID,
          allowNull: false,
          primaryKey: true,
          defaultValue: sequelize.fn('uuid_generate_v4')
        },
        first_name: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        last_name: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        password: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        email: {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true,
        },
        account_created: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        account_updated: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
      });
    }
    // Check if the "ASSIGNMENT" table exists
    const AssignmentTableExists = await sequelize2.getQueryInterface().showAllTables();

    if (!AssignmentTableExists.includes('assignment')) {
      // The "ASSIGNMENT" table doesn't exist, so create it
      await sequelize2.getQueryInterface().createTable('assignment', {
        id: {
          type: Sequelize.UUID,
          allowNull: false,
          primaryKey: true,
          defaultValue: sequelize2.fn('uuid_generate_v4')
        },
        name: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        points: {
          type: Sequelize.INTEGER,
          allowNull: false,
          validate: {
            min: 1,
            max: 100,
          },
        },
        num_of_attemps: {
          type: Sequelize.INTEGER,
          allowNull: false,
          validate: {
            min: 1,
            max: 100,
          },
        },
        deadline: {
          type: Sequelize.DATE,
          allowNull: false,
        },
        assignment_created: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        assignment_updated: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
      });
    }
    // Check if the "ASSIGNMENT" table exists
    const Acc_AssignmentTableExists = await sequelize3.getQueryInterface().showAllTables();

    if (!Acc_AssignmentTableExists.includes('acc_assignment')) {
      // The "ACC_ASSIGNMENT" table doesn't exist, so create it
      await sequelize3.getQueryInterface().createTable('acc_assignment', {
        account_id: {
          type: Sequelize.UUID,
          allowNull: false
        },
        assignment_id: {
          type: Sequelize.UUID,
          allowNull: false,
          unique: true
        }
      });
    }
    // Load user data from CSV file and insert into the database
    fs.createReadStream('opt/users.csv')
      .pipe(csvParser())
      .on('data', async (row) => {
        // Finding an existing user
        const existingUser = await Account.findOne({ where: { email: row.email } });

        if (!existingUser) {
          // Hash the password using bcrypt
          const hashedPassword = await bcrypt.hash(row.password, 10);

          // Insert user data into the database
          try {
            await Account.create({
              first_name: row.first_name,
              last_name: row.last_name,
              password: hashedPassword,
              email: row.email,
            });
          } catch (error) {
            logger.error('Error loading data into account table.')
            console.error(error);
          }
        }
      })
      .on('end', () => {
        logger.info('CSV file loaded.');
        console.log('CSV file loaded.');
      });
  } catch (error) {
    logger.error('Error initializing database:');
    console.error('Error initializing database:', error);
  }
}

// Call the initialization function
initializeDatabase();
// Start the server
app.listen(port, () => {
  logger.info('Server is running on port 3000');
  console.log(`Server is running on port ${port}`);
});
//app.use('/', assignmentRouter);

