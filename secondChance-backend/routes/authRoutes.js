const express = require('express');
const router = express.Router();
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../logger');
const connectToDatabase = require('../models/db');

const JWT_SECRET=`${process.env.JWT_SECRET}`;

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

module.exports = router; 
