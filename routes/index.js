const express = require('express');

const router = express.Router();

router.get('/', (req, res, next) => {
    res.render('index', { title: 'Express' });
});

router.get('/sign-up', (req, res) => {
    res.render('sign-up');
});

module.exports = router;
