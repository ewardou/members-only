const express = require('express');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const User = require('../models/users');
const Message = require('../models/messages');

const router = express.Router();
require('dotenv').config();

function checkAuthentication(req, res, next) {
    if (req.isAuthenticated()) {
        next();
    } else {
        res.redirect('/');
    }
}

passport.use(
    new LocalStrategy(
        { usernameField: 'email', passwordField: 'pwd' },
        async (username, password, done) => {
            try {
                const user = await User.findOne({ email: username });
                if (!user) {
                    return done(null, false, { message: 'Incorrect email' });
                }
                bcrypt.compare(password, user.password, (err, res) => {
                    if (res) {
                        return done(null, user);
                    }
                    return done(null, false, { message: 'Incorrect password' });
                });
            } catch (err) {
                return done(err);
            }
        }
    )
);

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err);
    }
});

router.use(
    session({
        secret: process.env.SECRET,
        resave: false,
        saveUninitialized: true,
    })
);
router.use(passport.initialize());
router.use(passport.session());

router.get(
    '/',
    asyncHandler(async (req, res, next) => {
        const messages = await Message.find().populate('author');
        res.render('index', {
            error: req.session.messages,
            user: req.user,
            messages,
        });
    })
);

router.get('/sign-up', (req, res) => {
    res.render('sign-up', { user: null, errors: null });
});

router.get('/join-club', checkAuthentication, (req, res) => {
    res.render('join-club', { isMember: req.user.isMember });
});

router.post(
    '/join-club',
    asyncHandler(async (req, res) => {
        const user = await User.findById(req.user._id);
        user.isMember = true;
        await user.save();
        res.redirect('/');
    })
);

router.get('/admin', checkAuthentication, (req, res) => {
    res.render('admin', { isAdmin: req.user.isAdmin });
});

router.post(
    '/admin',
    asyncHandler(async (req, res) => {
        await User.findByIdAndUpdate(req.user._id, { $set: { isAdmin: true } });
        res.redirect('/');
    })
);

router.post(
    '/delete/:id',
    asyncHandler(async (req, res) => {
        if (req.user.isAdmin) {
            await Message.findByIdAndRemove(req.params.id);
        }
        res.redirect('/');
    })
);

router.get('/new-message', checkAuthentication, (req, res) => {
    res.render('new-message');
});

router.post('/new-message', [
    body('title').trim().notEmpty().escape(),
    body('text').trim().notEmpty().escape(),
    asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty) {
            return res.render('new-message');
        }
        const newMsg = new Message({
            title: req.body.title,
            text: req.body.text,
            author: req.user._id,
        });
        await newMsg.save();
        res.redirect('/');
    }),
]);

router.get('/log-out', (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        res.redirect('/');
    });
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

router.post(
    '/log-in',
    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/',
        failureMessage: true,
    })
);

module.exports = router;
