const express = require('express');
const router = express.Router();
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../logger');
const connectToDatabase = require('../models/db');

const JWT_SECRET=process.env.JWT_SECRET;

// Register a new user
router.post('/register', async (req, res) => {
    try {
        // Task 1: Connect to MongoDB 
        const db = await connectToDatabase(); 

        // Task 2: Access the users collection
        const collection = db.collection("users");

        // Task 3: Check if user exists
        const existingEmail = await collection.findOne({ email: req.body.email });
        if (existingEmail) {
            logger.error('Email id already exists');
            return res.status(400).json({ error: 'Email id already exists' });
        }

        // Task 4: Hash the password
        const salt = await bcryptjs.genSalt(10);
        const hash = await bcryptjs.hash(req.body.password, salt);

        // Task 5: Insert the new user
        const newUser = await collection.insertOne({
            email: req.body.email,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            password: hash,
            createdAt: new Date(),
        });

        // Task 6: Create JWT token 
        const payload = { 
            user: {
                id: newUser.insertedId, // Use the newly inserted ID
            },
        };
        const authtoken = jwt.sign(payload, JWT_SECRET);

        // Task 7: Log successful registration
        logger.info('User registered successfully');

        // Task 8: Return token and email
        res.json({ authtoken, email: req.body.email });

    } catch (e) {
        logger.error('Error registering user:', e); // Log the error for debugging
        console.log("error", e)
        return res.status(500).send('Internal server error');
    }
});

router.post('/login', async (req, res) => {
    try {
        // Task 1: Connect to MongoDB 
        const db = await connectToDatabase(); 

        // Task 2: Access the users collection
        const collection = db.collection("users");

        // Task 3: Check for user credentials
        const theUser = await collection.findOne({ email: req.body.email });

        // Task 7: Handle user not found
        if (!theUser) {
            logger.error('User not found');
            return res.status(404).json({ error: 'User not found' });
        }

        // Task 4: Compare the password with the hash
        const isPasswordValid = await bcryptjs.compare(req.body.password, theUser.password);
        if (!isPasswordValid) {
            logger.error('Passwords do not match');
            return res.status(401).json({ error: 'Invalid email or password' }); // 401 for Unauthorized
        }

        // Task 5: Fetch user details (adjust if needed)
        const userName = theUser.firstName;
        const userEmail = theUser.email;

        // Task 6: Create JWT token 
        const payload = { 
            user: {
                id: theUser._id.toString(), // Convert _id to string
            },
        };
        const authtoken = jwt.sign(payload, JWT_SECRET);

        res.json({ authtoken, userName, userEmail });

    } catch (e) {
        logger.error('Error logging in user:', e);
        return res.status(500).send('Internal server error');
    }
});

module.exports = router; 
