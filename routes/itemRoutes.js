const express = require('express');
const router = express.Router();
const Item = require('../models/itemModel');
const User = require('../models/userModel');
const { v4: uuidv4 } = require('uuid');
const { setUser, getUser } = require('../service/auth');
const { restrictedLogin } = require('../middleware/auth');

// Middleware to fetch user items
const fetchUserItems = async (req, res, next) => {
    const sessionId = req.cookies.uid;
    const user = getUser(sessionId);

    try {
        const items = await Item.find({ userId: user._id });
        req.userItems = items; // Attach the items to the request object
        next();
    } catch (error) {
        return res.render('signup');
    }
};

router.get('/', fetchUserItems, (req, res) => {
    res.render('index', { items: req.userItems });
});

router.post('/items', restrictedLogin, async (req, res) => {
    const sessionId = req.cookies?.uid;
    const user = getUser(sessionId);

    if (!user) {
        return res.status(401).send('Unauthorized');
    }

    try {
        if (!req.body.name || !req.body.description || !req.body.quantity || !req.body.price) {
            return res.status(400).send('All fields are required');
        }

        const newItem = await Item.create({
            name: req.body.name,
            description: req.body.description,
            quantity: req.body.quantity,
            price: req.body.price,
            userId: user._id
        });

        res.redirect('/');
    } catch (err) {
        res.status(500).send('Error: ' + err);
    }
});

router.post('/items/update/:id', restrictedLogin, async (req, res) => {
    const sessionId = req.cookies?.uid;
    const user = getUser(sessionId);

    if (!user) {
        return res.status(401).send('Unauthorized');
    }

    try {
        const item = await Item.findById(req.params.id);

        if (!item || item.userId.toString() !== user._id.toString()) {
            return res.status(403).send('Forbidden');
        }

        await Item.findByIdAndUpdate(req.params.id, req.body);
        res.redirect('/');
    } catch (err) {
        res.status(500).send('Error: ' + err);
    }
});

router.get('/items/delete/:id', restrictedLogin, async (req, res) => {
    const sessionId = req.cookies?.uid;
    const user = getUser(sessionId);

    if (!user) {
        return res.status(401).send('Unauthorized');
    }

    try {
        const item = await Item.findById(req.params.id);

        if (!item || item.userId.toString() !== user._id.toString()) {
            return res.status(403).send('Forbidden');
        }

        await Item.findByIdAndDelete(req.params.id);
        res.redirect('/');
    } catch (error) {
        res.status(500).send("Error: " + error);
    }
});

router.get('/form', restrictedLogin, (req, res) => {
    res.render('form');
});

router.route('/signup')
    .get((req, res) => {
        res.render('signup');
    })
    .post(async (req, res) => {
        try {
            if (!req.body.email || !req.body.username || !req.body.password) {
                return res.status(400).send('All Fields are required');
            }
            const newUser = await User.create({
                email: req.body.email,
                username: req.body.username,
                password: req.body.password
            });

            const uuid = uuidv4();
            setUser(uuid, newUser);
            res.cookie('uid', uuid);

            res.redirect('/login');
        } catch (error) {
            return res.status(500).send('Error: ' + error);
        }
    });

router.route('/login')
    .get((req, res) => {
        res.render('login');
    })
    .post(async (req, res) => {
        try {
            if (!req.body.email || !req.body.password) {
                return res.status(400).send('All fields are required');
            }

            const user = await User.findOne({ email: req.body.email, password: req.body.password });

            if (!user) {
                return res.status(404).send('User not found');
            }

            const uuid = uuidv4();
            setUser(uuid, user);
            res.cookie('uid', uuid);

            const items = await Item.find({ userId: user._id });
            return res.render('index', { items });

        } catch (error) {
            return res.status(500).send('Error: ' + error);
        }
    });

module.exports = router;
