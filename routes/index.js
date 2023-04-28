const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const User = require('../models/users');
const Message = require('../models/messages');

const router = express.Router();

router.get('/', (req, res, next) => {
    res.render('index', { title: 'Express' });
});

router.get('/sign-up', (req, res) => {
    res.render('sign-up', { user: null, errors: null });
});

router.post('/sign-up', [
    body('firstName').trim().notEmpty().escape(),
    body('lastName').trim().notEmpty().escape(),
    body('email')
        .trim()
        .notEmpty()
        .isEmail()
        .withMessage('Not a valid e-mail address')
        .escape()
        .custom(async (value) => {
            const user = await User.findOne({ email: value }).exec();
            if (user) {
                throw new Error('Email already in use');
            }
        }),
    body('pwd').trim().isLength({ min: 8 }).escape(),
    body('pwdConfirm')
        .trim()
        .escape()
        .custom((value, { req }) => value === req.body.pwd)
        .withMessage("Passwords don't match"),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.render('sign-up', {
                user: {
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                },
                errors: errors.array(),
            });
        }
        bcrypt.hash(
            req.body.pwd,
            10,
            asyncHandler(async (err, hashedPassword) => {
                if (err) {
                    return next(err);
                }
                const newUser = new User({
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                    email: req.body.email,
                    password: hashedPassword,
                });
                await newUser.save();
                res.redirect('/');
            })
        );
    },
]);

module.exports = router;
