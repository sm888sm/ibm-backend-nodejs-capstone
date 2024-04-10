const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const connectToDatabase = require('../models/db');
const logger = require('../logger');

// Define the upload directory path
const directoryPath = 'public/images';

// Set up storage for uploaded files
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, directoryPath); // Specify the upload directory
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname); // Use the original file name
    },
});

const upload = multer({ storage: storage });


// Get all secondChanceItems
router.get('/', async (req, res, next) => {
    logger.info('/ called');
    try {
        // Step 2: Task 1 - Retrieve database connection 
        const db = await connectToDatabase(); 

        // Step 2: Task 2 - Access the secondChanceItems collection
        const collection = db.collection("secondChanceItems");

        // Step 2: Task 3 - Fetch all items  
        const secondChanceItems = await collection.find({}).toArray();

        // Step 2: Task 4 - Return items
        res.json(secondChanceItems);
    } catch (e) {
        logger.console.error('oops something went wrong', e)
        next(e);
    }
});

// Add a new item
router.post('/', upload.single('file'), async (req, res, next) => {
    try {
        // Step 3: Task 1 - Retrieve database connection 
        const db = await connectToDatabase(); 

        // Step 3: Task 2 - Access the secondChanceItems collection
        const collection = db.collection("secondChanceItems");

        // Step 3: Task 3 - Create new item from request body
        let secondChanceItem = req.body;

        // Step 3: Task 4 - Generate unique ID
        const lastItemQuery = await collection.find().sort({ 'id': -1 }).limit(1);
        await lastItemQuery.forEach(item => {
            secondChanceItem.id = (parseInt(item.id) + 1).toString();
        });

        // Step 3: Task 5 - Set the current date
        const date_added = Math.floor(new Date().getTime() / 1000);
        secondChanceItem.date_added = date_added

        // Step 3: Task 6 - Add item to database
        secondChanceItem = await collection.insertOne(secondChanceItem);

        // Step 3: Task 7 - Image Upload (assuming image is sent in 'file' field)
        if (req.file) {
            // Update the 'image' field with the uploaded filename
            secondChanceItem.image = `/images/${req.file.filename}`;
            await collection.updateOne(
                { _id: secondChanceItem.insertedId }, // Find the new item
                { $set: { image: `/images/${req.file.filename}` } } // Update image field
            );
        }

        res.status(201).json(secondChanceItem);
    } catch (e) {
        next(e);
    }
});


// Get a single secondChanceItem by ID
router.get('/:id', async (req, res, next) => {
    try {
        // Step 4: Task 1 - Retrieve database connection 
        const db = await connectToDatabase(); 

        // Step 4: Task 2 - Access the secondChanceItems collection
        const collection = db.collection("secondChanceItems");

        // Get the ID parameter from the URL
        const id = req.params.id; 

        // Step 4: Task 3 - Find item by ID
        const secondChanceItem = await collection.findOne({ id: id });

        // Step 4: Task 4 - Handle item not found
        if (!secondChanceItem) {
            return res.status(404).send("secondChanceItem not found");
        }

        res.json(secondChanceItem);
    } catch (e) {
        next(e);
    }
});

// Update and existing item
router.put('/:id', async (req, res, next) => {
    try {
        // Step 5: Task 1 - Retrieve database connection 
        const db = await connectToDatabase(); 

        // Step 5: Task 2 - Access the secondChanceItems collection
        const collection = db.collection("secondChanceItems");

        // Get the ID parameter from the URL
        const id = req.params.id; 

        // Step 5: Task 3 - Check if item exists
        const secondChanceItem = await collection.findOne({ id });
        if (!secondChanceItem) {
            logger.error('secondChanceItem not found');
            return res.status(404).json({ error: "secondChanceItem not found" });
        }

        // Step 5: Task 4 - Update item attributes
        secondChanceItem.category = req.body.category;
        secondChanceItem.condition = req.body.condition;
        secondChanceItem.age_days = req.body.age_days;
        secondChanceItem.description = req.body.description;
        secondChanceItem.age_years = Number((secondChanceItem.age_days / 365).toFixed(1));
        secondChanceItem.updatedAt = new Date();

        // Update the item in the database
        const updateResult = await collection.findOneAndUpdate(
            { id },
            { $set: secondChanceItem },
            { returnDocument: 'after' } // Return the updated document
        );

        // Step 5: Task 5 - Send confirmation
        res.json(updateResult.value); // Send the updated item

    } catch (e) {
        next(e);
    }
});

// Delete an existing item
router.delete('/:id', async (req, res, next) => {
    try {
        // Step 6: Task 1 - Retrieve database connection 
        const db = await connectToDatabase(); 

        // Step 6: Task 2 - Access the secondChanceItems collection
        const collection = db.collection("secondChanceItems");

        // Get the ID parameter from the URL
        const id = req.params.id; 

        // Step 6: Task 3 - Check if item exists
        const secondChanceItem = await collection.findOne({ id });
        if (!secondChanceItem) {
            logger.error('secondChanceItem not found');
            return res.status(404).json({ error: "secondChanceItem not found" });
        }

        // Step 6: Task 4 - Delete the item
        await collection.deleteOne({ id });
        res.json({ "deleted": "success" });

    } catch (e) {
        next(e);
    }
});

module.exports = router;
