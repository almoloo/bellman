const express = require('express');
const router = express.Router();
const { default: axios } = require('axios');
const flatfile = require('flatfile');

router.get('/', (req, res) => {
    // GET LIST OF COINS FROM DB
    try {
        flatfile.db('./db/database.json', async (err, data) => {
            if(err) {
                console.log(err);
                res.status(500).send('There has been an error, please try again later.');
            };
            res.render('index', {
                coins: data.settings.coins
            });
        });
    } catch (err) {
        console.log(err);
        res.status(500).send('There has been an error, please try again later.');
    }
});

module.exports = router