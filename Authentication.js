const express = require('express');
const router = express.Router();
var bcrypt = require('bcrypt');
require('dotenv').config();
const AWS = require('aws-sdk');

router.use(express.json());
var bodyParser = require('body-parser');
const { body, validationResult } = require('express-validator');

const logger = require('./logger');
const client = require('./metrics');

// AWS SETUP FOR SNS PUBLISH
const AWS_REGION = process.env.AWS_REGION;
const SNS_ARN = process.env.SNS_ARN;
AWS.config.update({
    region: AWS_REGION,
    SNS_ARN: SNS_ARN,
    // accessKeyId : 'AKIAWDIOEEHKSY7KYDXZ',
    // secretAccessKey : '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',
    // region: 'us-east-1'
});

const sns = new AWS.SNS();
//FOR ACCOUNT
const { Sequelize, DataTypes } = require('sequelize');
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


//FOR ASSIGNMENT
const sequelize2 = new Sequelize({
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
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    }
});

const Acc_Assignment = sequelize3.define('acc_assignment', {
    account_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    assignment_id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        unique: true
    }
}, {
    tableName: 'acc_assignment', // Specify the correct table name here
    timestamps: false,
});

//FOR SUBMISSION
const sequelize4 = new Sequelize({
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

const Submission = sequelize4.define('submission', {
    assignment_id: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    submission_url: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    createdAt: {
        field: 'submission_date',
        allowNull: false,
        type: DataTypes.DATE
    },
    updatedAt: {
        field: 'submission_updated',
        allowNull: false,
        type: DataTypes.DATE
    }
}, {
    tableName: 'submission', // Specify the correct table name here
});
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

// GET ALL ASSIGNMENTS ON AUTHENTICATION.
router.get('/v2/assignments', async (req, res) => {
    client.increment('get/v1/assignments');
    if (!req.headers.authorization || req.headers.authorization.indexOf('Basic') === -1) {
        logger.info('403 Forbidden');
        return res.status(403).json({
            message: 'Forbidden'
        })
    }
    const base64Credentials = req.headers.authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [email, password] = credentials.split(':');
    console.log(email, password);

    Account.findOne({
        where: {
            email: email,
        },
    })
        .then((account) => {
            if (account) {
                // Account found, now compare the provided password with the stored hashed password
                bcrypt.compare(password, account.password, (err, result) => {
                    if (err) {
                        logger.error('Error in comparing password for get/v1/assignments');
                        console.error(err);
                    } else if (result) {
                        // Passwords match, proceed with retrieving assignments
                        Assignment.findAll()
                            .then((assignments) => {
                                logger.info('200 OK');
                                res.status(200).json(assignments);
                            })
                            .catch((error) => {
                                logger.error('Error in finding assignments for get/v1/assignments')
                                console.error(error);
                            });
                    } else {
                        // Passwords do not match
                        logger.info('401 Unauthorized');
                        res.status(401).json({ error: 'Unauthorized' });
                    }
                });
            } else {
                // No account found with the provided email
                logger.info('401 Unauthorized');
                res.status(401).json({ error: 'Unauthorized' });
            }
        })
        .catch((error) => {
            logger.error('Error in finding account for get/v1/assignments');
            console.error(error);
        });
});

// INSERT ASSIGNMENT ON SUCCESSFUL AUTHENTICATION.
router.post('/v2/assignments', [
    body('name')
        .not().isEmpty().withMessage('Name cannot be empty')
        .isString().withMessage('Name must be a string'),

    body('points')
        .not().isEmpty().withMessage('Points cannot be empty')
        .isInt({ min: 0, max: 100 }).withMessage('Points must be an integer between 0 and 100'),

    body('num_of_attemps')
        .not().isEmpty().withMessage('Number of attempts cannot be empty')
        .isInt({ min: 0, max: 100 }).withMessage('Number of attempts must be an integer between 0 and 100'),

    body('deadline')
        .not().isEmpty().withMessage('Deadline cannot be empty')
        .isISO8601().withMessage('Deadline must be a valid ISO 8601 date string')
], async (req, res) => {
    client.increment('post/v1/assignments');
    if (!req.headers.authorization || req.headers.authorization.indexOf('Basic') === -1) {
        return res.status(403).json({
            message: 'Forbidden'
        })
    }
    const base64Credentials = req.headers.authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [email, password] = credentials.split(':');
    console.log(email, password);

    Account.findOne({
        where: {
            email: email,
        },
    })
        .then((account) => {
            if (account) {
                // Account found, now compare the provided password with the stored hashed password
                bcrypt.compare(password, account.password, (err, result) => {
                    if (err) {
                        logger.error('Error in comparing password for post/v1/assignments');
                        console.error(err);
                    } else if (result) {
                        if (Object.keys(req.body).length > 0) {
                            console.log(req.body.points)
                            // Check for validation errors
                            const errors = validationResult(req);
                            if (!errors.isEmpty()) {
                                res.status(400).json({ error: 'Incomplete or bad parameters, check table specifications.' });
                                logger.info('400 Bad Params in post/v1/assignments');
                                console.log(errors.array());
                            }

                            else {
                                // Passwords match, proceed with creating assignment.

                                const newAssignment = {
                                    name: req.body.name,
                                    points: req.body.points,
                                    num_of_attemps: req.body.num_of_attemps,
                                    deadline: req.body.deadline,
                                };

                                Assignment.create(newAssignment)
                                    .then((createdAssignment) => {
                                        logger.info('201 OK');
                                        res.status(201).json(createdAssignment);
                                        //Creating relation in acc_assignment table.
                                        const newAcc_Assignment = {
                                            account_id: account.id,
                                            assignment_id: createdAssignment.id
                                        };

                                        Acc_Assignment.create(newAcc_Assignment)
                                            .then((createdAccAssignment) => {
                                                logger.info('Created AccAssignment');
                                            })
                                            .catch((error) => {
                                                logger.error('Error in creating acc_assignment for post/v1/assignments')

                                                console.error(error);
                                            });
                                    })
                                    .catch((error) => {
                                        logger.error('Error in creating assignment for post/v1/assignments')

                                        console.error(error);
                                    });
                            }

                        }
                        else {
                            logger.info('400 Bad Params in post/v1/assignments');
                            res.status(400).json({ error: 'Incomplete or bad parameters, check table specifications.' });
                        }
                    } else {
                        // Passwords do not match
                        logger.info('401 Unauthorized');
                        res.status(401).json({ error: 'Unauthorized' });
                    }
                });
            } else {
                // No account found with the provided email
                logger.info('401 Unauthorized');
                res.status(401).json({ error: 'Unauthorized' });
            }
        })
        .catch((error) => {
            logger.error('Error in finding account for post/v1/assignments');
            console.error(error);
        });
});

// GET ALL ASSIGNMENTS/{id} ON AUTHENTICATION.
router.use('/v2/assignments/:id', function (req, res, next) {
    console.log('Assignment I.D.:', req.params.id);

    next();
});
router.get('/v2/assignments/:id', async (req, res) => {
    client.increment('get/v1/assignments/id');
    if (!req.headers.authorization || req.headers.authorization.indexOf('Basic') === -1) {
        logger.info('403 Forbidden');
        return res.status(403).json({
            message: 'Forbidden'
        })
    }
    const base64Credentials = req.headers.authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [email, password] = credentials.split(':');
    console.log(email, password);
    console.log(req.params.id);
    Account.findOne({
        where: {
            email: email,
        },
    })
        .then((account) => {
            console.log(account);
            if (account) {
                // Account found, now compare the provided password with the stored hashed password
                bcrypt.compare(password, account.password, (err, result) => {
                    if (err) {
                        logger.error('Error in comparing password for get/v1/assignments/id');
                        console.error(err);
                    } else if (result) {
                        // Passwords match, proceed with retrieving assignments
                        Acc_Assignment.findOne({
                            where: {
                                assignment_id: req.params.id,
                            },
                        })
                            .then((acc_assignment) => {
                                if (acc_assignment.account_id === account.id) {
                                    // Assignment with the specified ID found, respond with it
                                    Assignment.findOne({
                                        where: {
                                            id: req.params.id,
                                        },
                                    })
                                        .then((assignment) => {
                                            if (assignment) {
                                                // Assignment with the specified ID found, respond with it
                                                logger.info('200 OK');
                                                res.status(200).json(assignment);
                                            } else {
                                                // Assignment with the specified ID not found
                                                logger.info('404 Not found');
                                                res.status(404).json({ error: 'Assignment not found' });
                                            }
                                        })
                                        .catch((error) => {
                                            logger.error('Error in finding assignment for get/v1/assignments/id')
                                            console.error(error);
                                        });
                                } else {
                                    // Assignment with the specified ID not found
                                    logger.info('401 Unauthorized');
                                    res.status(401).json({ error: 'Unauthorized' });
                                }
                            })
                            .catch((error) => {
                                logger.error('Error in finding assignment for get/v1/assignments/id')
                                logger.info('404 Not found');
                                res.status(404).json({ error: 'Assignment not found' });
                                console.error(error);
                            });
                    } else {
                        // Passwords do not match
                        logger.info('401 Unauthorized');
                        res.status(401).json({ error: 'Unauthorized' });
                    }
                });
            } else {
                // No account found with the provided email
                logger.info('401 Unauthorized');
                res.status(401).json({ error: 'Unauthorized' });
            }
        })
        .catch((error) => {
            logger.error('Error in finding account for get/v1/assignments/id');
            console.error(error);
        });
});

// DELETE ALL ASSIGNMENTS/{id} ON AUTHENTICATION.
router.delete('/v2/assignments/:id', async (req, res) => {
    client.increment('delete/v1/assignments/id');
    if (!req.headers.authorization || req.headers.authorization.indexOf('Basic') === -1) {
        logger.info('403 Forbidden');
        return res.status(403).json({
            message: 'Forbidden'
        })
    }
    const base64Credentials = req.headers.authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [email, password] = credentials.split(':');
    console.log(email, password);
    console.log(req.params.id);
    Account.findOne({
        where: {
            email: email,
        },
    })
        .then((account) => {
            console.log(account);
            if (account) {
                // Account found, now compare the provided password with the stored hashed password
                bcrypt.compare(password, account.password, (err, result) => {
                    if (err) {
                        logger.error('Error in comparing password for delete/v1/assignments/id');
                        console.error(err);
                    } else if (result) {
                        // Passwords match, proceed with retrieving assignments
                        Acc_Assignment.findOne({
                            where: {
                                assignment_id: req.params.id,
                            },
                        })
                            .then((acc_assignment) => {
                                if (acc_assignment.account_id === account.id) {
                                    // Assignment with the specified ID found, respond with it
                                    Assignment.destroy({
                                        where: {
                                            id: req.params.id,
                                        },
                                    })
                                        .then((rowsDeleted) => {
                                            if (rowsDeleted > 0) {
                                                // Records deleted successfully
                                                logger.info('204 NO CONTENT');
                                                res.status(204).end(); // No content response
                                            } else {
                                                // Assignment with the specified ID not found
                                                logger.info('404 Not found');
                                                res.status(404).json({ error: 'Assignment not found' });
                                            }
                                        })
                                        .catch((error) => {
                                            logger.error('Error in deleting assignment for delete/v1/assignments/id')
                                            console.error(error);
                                        });
                                    Acc_Assignment.destroy({
                                        where: {
                                            assignment_id: req.params.id,
                                        },
                                    })
                                        .then((rowsDeleted) => {
                                            if (rowsDeleted > 0) {
                                                logger.info('204 NO CONTENT RECORD DELETED IN ACC_ASSIGNMENT');
                                                //res.status(204).end(); // No content response
                                            } else {

                                                logger.error('404 Not found');
                                                //res.status(404).json({ error: 'Assignment not found' });
                                            }
                                        })
                                        .catch((error) => {
                                            logger.error('Error in deleting assignment for delete/v1/assignments/id')
                                            console.error(error);
                                        });
                                    Submission.destroy({
                                        where: {
                                            assignment_id: req.params.id,
                                        },
                                    })
                                        .then((rowsDeleted) => {
                                            if (rowsDeleted > 0) {
                                                logger.info('204 NO CONTENT RECORD DELETED IN SUBMISSION');
                                                // res.status(204).end(); // No content response
                                            } else {
                                                logger.error('404 Not found');
                                                // res.status(404).json({ error: 'Submission not found' });
                                            }
                                        })
                                        .catch((error) => {
                                            logger.error('Error in deleting submission for delete/v1/assignments/id');
                                            console.error(error);
                                        });
                                } else {

                                    logger.info('401 Unauthorized');
                                    res.status(401).json({ error: 'Unauthorized' });
                                }
                            })
                            .catch((error) => {
                                logger.error('Error in finding assignment for delete/v1/assignments/id')
                                logger.info('404 Not found');
                                res.status(404).json({ error: 'Assignment not found' });
                                console.error(error);
                            });


                    } else {
                        // Passwords do not match
                        logger.info('401 Unauthorized');
                        res.status(401).json({ error: 'Unauthorized' });
                    }
                });
            } else {
                // No account found with the provided email
                logger.info('401 Unauthorized');
                res.status(401).json({ error: 'Unauthorized' });
            }
        })
        .catch((error) => {
            logger.error('Error in finding account for delete/v1/assignments/id');
            console.error(error);
        });
});

// UPDATE ALL ASSIGNMENTS/{id} ON AUTHENTICATION.
router.put('/v2/assignments/:id', [
    body('name')
        .not().isEmpty().withMessage('Name cannot be empty')
        .isString().withMessage('Name must be a string'),

    body('points')
        .not().isEmpty().withMessage('Points cannot be empty')
        .isInt({ min: 0, max: 100 }).withMessage('Points must be an integer between 0 and 100'),

    body('num_of_attemps')
        .not().isEmpty().withMessage('Number of attempts cannot be empty')
        .isInt({ min: 0, max: 100 }).withMessage('Number of attempts must be an integer between 0 and 100'),

    body('deadline')
        .not().isEmpty().withMessage('Deadline cannot be empty')
        .isISO8601().withMessage('Deadline must be a valid ISO 8601 date string')
], async (req, res) => {
    client.increment('put/v1/assignments/id');
    if (!req.headers.authorization || req.headers.authorization.indexOf('Basic') === -1) {
        logger.info('403 Forbidden');
        return res.status(403).json({
            message: 'Forbidden'
        })
    }
    const base64Credentials = req.headers.authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [email, password] = credentials.split(':');
    console.log(email, password);
    console.log(req.params.id);
    Account.findOne({
        where: {
            email: email,
        },
    })
        .then((account) => {
            console.log(account);
            if (account) {
                // Account found, now compare the provided password with the stored hashed password
                bcrypt.compare(password, account.password, (err, result) => {
                    if (err) {
                        logger.error('Error in comparing password for put/v1/assignments/id');
                        console.error(err);
                    } else if (result) {
                        // Passwords match, proceed with retrieving assignments
                        Acc_Assignment.findOne({
                            where: {
                                assignment_id: req.params.id,
                            },
                        })
                            .then((acc_assignment) => {
                                if (acc_assignment.account_id === account.id) {
                                    // Assignment with the specified ID found, respond with it
                                    if (Object.keys(req.body).length > 0) {
                                        console.log(req.body.points)
                                        // Check for validation errors
                                        const errors = validationResult(req);
                                        if (!errors.isEmpty()) {
                                            res.status(400).json({ error: 'Incomplete or bad parameters, check table specifications.' });
                                            logger.info('400 Bad Params in post/v1/assignments');
                                            console.log(errors.array());
                                        }
                                        else {
                                            // Passwords match, proceed with creating assignment.

                                            const updatedAssignment = {
                                                name: req.body.name,
                                                points: req.body.points,
                                                num_of_attemps: req.body.num_of_attemps,
                                                deadline: req.body.deadline,
                                            };

                                            Assignment.update(
                                                updatedAssignment,
                                                {
                                                    where: {
                                                        id: req.params.id,
                                                    },
                                                }
                                            )
                                                .then((rowsUpdated) => {
                                                    if (rowsUpdated > 0) {
                                                        // Records updated successfully
                                                        logger.info('204 OK');
                                                        res.status(204).json({ error: 'Record updated.' }); // No content response
                                                    } else {
                                                        // No changes made.
                                                        logger.info('404 Not found');
                                                        res.status(404).json({ error: 'No Changes made.' });
                                                    }
                                                })
                                                .catch((error) => {
                                                    logger.error('Error in updating assignment for put/v1/assignments/id')
                                                    console.error(error);
                                                });
                                        }

                                    }
                                    else {
                                        logger.info('400 Bad Params in post/v1/assignments');
                                        res.status(400).json({ error: 'Incomplete or bad parameters, check table specifications.' });
                                    }
                                } else {

                                    logger.info('401 Unauthorized');
                                    res.status(401).json({ error: 'Unauthorized' });
                                }
                            })
                            .catch((error) => {
                                logger.error('Error in finding assignment for put/v1/assignments/id')
                                logger.info('404 Not found');
                                res.status(404).json({ error: 'Assignment not found' });
                                console.error(error);
                            });

                    } else {
                        // Passwords do not match
                        logger.info('401 Unauthorized');
                        res.status(401).json({ error: 'Unauthorized' });
                    }
                });
            } else {
                // No account found with the provided email
                logger.info('401 Unauthorized');
                res.status(401).json({ error: 'Unauthorized' });
            }
        })
        .catch((error) => {
            logger.error('Error in finding account for put/v1/assignments/id');
            console.error(error);
        });
});

// INSERT SUBMISSION URLS ON SUCCESSFUL AUTHENTICATION.
router.post('/v2/assignments/:id/submission', [
    body('submission_url')
        .not().isEmpty().withMessage('Submission_URL cannot be empty')
        .isString().withMessage('Submission_URL must be a string')
        .isURL({ require_protocol: true }).withMessage('Submission_URL must include http:// or https://'),
], async (req, res) => {
    client.increment('post/v1/assignments/id/submission');
    if (!req.headers.authorization || req.headers.authorization.indexOf('Basic') === -1) {
        logger.info('403 Forbidden');
        return res.status(403).json({
            message: 'Forbidden'
        })
    }
    const base64Credentials = req.headers.authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [email, password] = credentials.split(':');
    console.log(email, password);
    console.log(req.params.id);
    Account.findOne({
        where: {
            email: email,
        },
    })
        .then((account) => {
            console.log(account);
            if (account) {
                // Account found, now compare the provided password with the stored hashed password
                bcrypt.compare(password, account.password, (err, result) => {
                    if (err) {
                        logger.error('Error in comparing password for post/v1/assignments/id/submission');
                        console.error(err);
                    } else if (result) {
                        // Passwords match, proceed with retrieving assignments
                        Acc_Assignment.findOne({
                            where: {
                                assignment_id: req.params.id,
                            },
                        })
                            .then((acc_assignment) => {
                                if (acc_assignment.account_id === account.id) {
                                    // Assignment with the specified ID found, respond with it
                                    if (Object.keys(req.body).length > 0) {
                                        console.log(req.body.points)
                                        // Check for validation errors
                                        const errors = validationResult(req);
                                        if (!errors.isEmpty()) {
                                            res.status(400).json({ error: 'Incomplete or bad parameters, check table specifications.' });
                                            logger.info('400 Bad Params in post/v1/assignments');
                                            console.log(errors.array());
                                        }
                                        else {
                                            // Find the assignment
                                            Assignment.findOne({
                                                where: {
                                                    id: req.params.id,
                                                },
                                            })
                                                .then((assignment) => {
                                                    // Create submission
                                                    const newSubmission = {
                                                        assignment_id: req.params.id,
                                                        submission_url: req.body.submission_url
                                                    };
                                                    //         assignmentId: req.params.id,
                                                    //         submissionUrl: req.body.submission_url,
                                                    //         userEmail: email, // Assuming this is the email of the user making the submission
                                                    //         userId: acc_assignment.account_id
                                                    //     }),
                                                    //     TopicArn: SNS_ARN // Replace with your SNS topic ARN

                                                    const message = {
                                                        submissionUrl: req.body.submission_url,
                                                        userEmail: email,
                                                        assignmentId: req.params.id,
                                                        userId: acc_assignment.account_id
                                                    }
                                                    logger.info("message", message.submissionUrl)
                                                    sns.publish({
                                                        TopicArn: SNS_ARN,
                                                        Message: JSON.stringify(message),
                                                    }, (err, data) => {
                                                        if (err) {
                                                            console.error('Error publishing to SNS:', err);
                                                            logger.error('Error publishing to SNS:', err);
                                                        } else {
                                                            console.log('Message published to SNS:', data);
                                                            logger.error('Message published to SNS:', data);
                                                        }
                                                    });
                                                    if (!assignment) {
                                                        return res.status(404).json({ error: 'Assignment not found' });
                                                    }

                                                    // Check if the current date is before the deadline
                                                    if (new Date() > assignment.deadline) {
                                                        return res.status(400).json({ error: 'Submission deadline has passed' });
                                                    }

                                                    // Check if there are enough attempts available
                                                    if (assignment.num_of_attemps <= 0) {
                                                        return res.status(400).json({ error: 'No more attempts available' });
                                                    }


                                                    Submission.create(newSubmission)
                                                        .then((createdSubmission) => {
                                                            logger.info('201 OK');
                                                            res.status(201).json(createdSubmission);

                                                            // Decrement the num_of_attempts by 1
                                                            Assignment.decrement(
                                                                'num_of_attemps', // field to decrement
                                                                {
                                                                    by: 1, // decrement value
                                                                    where: {
                                                                        id: req.params.id,
                                                                    },
                                                                }
                                                            )
                                                                .then((result) => {
                                                                    logger.info('Updated num_of_attemps for assignment');
                                                                    // Handle success (if needed)
                                                                })
                                                                .catch((error) => {
                                                                    logger.error('Error in decrementing num_of_attemps');
                                                                    console.error(error);
                                                                    // Handle error (if needed)
                                                                });

                                                            // // Publish message to SNS topic
                                                            // const snsParams = {
                                                            //     Message: JSON.stringify({
                                                            //         assignmentId: req.params.id,
                                                            //         submissionUrl: req.body.submission_url,
                                                            //         userEmail: email, // Assuming this is the email of the user making the submission
                                                            //         userId: acc_assignment.account_id
                                                            //     }),
                                                            //     TopicArn: SNS_ARN // Replace with your SNS topic ARN
                                                            // };

                                                            // sns.publish(snsParams, (err, data) => {
                                                            //     if (err) {
                                                            //         logger.error("Error publishing to SNS", err);
                                                            //     } else {
                                                            //         logger.info("Message published to SNS", data);
                                                            //     }
                                                            // });
                                                        })
                                                        .catch((error) => {
                                                            logger.error('Error in creating submission for post/v1/assignments/:id/submission')

                                                            console.error(error);
                                                        });
                                                })
                                                .catch((error) => {
                                                    logger.error('Error in finding assignment for post/v1/assignments/:id/submission')

                                                    console.error(error);
                                                });
                                        }
                                    }
                                    else {
                                        logger.info('400 Bad Params in post/v1/assignments/:id/submission');
                                        res.status(400).json({ error: 'Incomplete or bad parameters, check table specifications.' });
                                    }
                                } else {

                                    logger.info('401 Unauthorized');
                                    res.status(401).json({ error: 'Unauthorized' });
                                }
                            })
                            .catch((error) => {
                                logger.error('Error in finding assignment for post/v1/assignments/:id/submission')
                                logger.info('404 Not found');
                                res.status(404).json({ error: 'Assignment not found' });
                                console.error(error);
                            });

                    } else {
                        // Passwords do not match
                        logger.info('401 Unauthorized');
                        res.status(401).json({ error: 'Unauthorized' });
                    }
                });
            } else {
                // No account found with the provided email
                logger.info('401 Unauthorized');
                res.status(401).json({ error: 'Unauthorized' });
            }
        })
        .catch((error) => {
            logger.error('Error in finding account for put/v1/assignments/id');
            console.error(error);
        });
});


//Handling PATCH REQUESTS.
router.patch('/v2/assignments', (req, res) => {
    client.increment('patch/v1/assignments');
    res.status(405).send();
    logger.info('405');
    console.log("405");
});
router.patch('/v2/assignments/:id', (req, res) => {
    if (req.params.id) {
        client.increment('patch/v1/assignments/id');
        res.status(405).send();
        logger.info('405');
        console.log("405");
    }
});

module.exports = router






