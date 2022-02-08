require('dotenv').config();
const express = require('express');
const app = express();
const fs = require('node:fs');
const cookieParser = require('cookie-parser');
const flatfile = require('flatfile');
const nodemailer = require('nodemailer');
const pushbullet = require('pushbullet');

app.use(express.json());
app.use(cookieParser());
app.set('view engine', 'ejs');
app.use(express.static('wwwroot'));

// Routes
const apiRouter = require('./routes/api');
app.use('/api', apiRouter);

// Views
const viewsRouter = require('./routes/views');
const bcrypt = require('bcryptjs/dist/bcrypt');
app.use('/', viewsRouter);

// SEND ALERT
const sendAlert = (alertId) => {
    // GET ALERT FROM DATABASE
    flatfile.db('./database.json', async (err, data) => {
        if(err) {
            return false;
        };
        const alert = data.alerts.find(alert => alert.id === alertId);
        if(alertType === 'email') {
            // SEND EMAIL
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });
            const mailOptions = {
                from: '' + process.env.EMAIL_USER,
                to: alert.email,
                subject: 'Alert',
                text: 'Your alert has been triggered.'
            };
            transporter.sendMail(mailOptions, function(error, info) {
                if (error) {
                    console.log(error);
                } else {
                    console.log('Email sent: ' + info.response);
                };
            });
        } else if(alertType === 'push') {
            // SEND PUSH NOTIFICATION
            const pusher = new pushbullet(process.env.PUSHBULLET_API_KEY);
            pusher.note(alert.alertTarget, 'bellman', `${alert.coin} is ${alert.alertType} $${alert.price}.`, function(error, response) {
                if(error) {
                    console.log(error);
                } else {
                    console.log('Push notification sent.');
                    // UPDATE ALERT STATUS
                    alert.status = 'sent';
                    data.save();
                };
            });
        }
    });
}

// ALERT CHECKING SCHEDULE (every 1 minutes)
setInterval(() => {
    // GET ALERTS FROM DATABASE
    try {
        flatfile.db('./database.json', async (err, data) => {
            if(err) {
                console.log(err);
            };
            const alerts = data.alerts;
            const activeAlerts = alerts.filter(alert => alert.status === 'active');
            // DIVIDE ALERTS BASED ON CURRENCY
            const alertsByCurrency = {};
            activeAlerts.forEach(alert => {
                if(!alertsByCurrency[alert.coin]){
                    alertsByCurrency[alert.coin] = [];
                }
                alertsByCurrency[alert.coin].push(alert);
            });
            // CHECK EACH ALERT BASED ON CURRENCY
            for(let coin in alertsByCurrency){
                // GET COINID FROM COINGECKO
                const coinId = await axios.get(`https://api.coingecko.com/api/v3/coins/list`)
                    .then(res => {
                        const coin = res.data.find(coin => coin.symbol === coin);
                        return coin.id;
                    });
                // GET PRICE FROM COINGECKO
                const price = await axios.get(`https://api.coingecko.com/api/v3/coins/${coinId}`)
                    .then(res => {
                        return res.data.market_data.current_price[req.body.priceType];
                    });
                const alerts = alertsByCurrency[coin];
                alerts.forEach(alert => {
                    const priceType = alert.priceType;
                    const alertType = alert.alertType;
                    const alertTarget = alert.alertTarget;
                    const alertPrice = alert.alertPrice;
                    // GET PRICE
                    axios.get(`https://api.coinmarketcap.com/v1/ticker/${coin}`)
                    .then(response => {
                        const price = response.data[0][priceType];
                        // CHECK PRICE
                        if(alertType === 'above'){
                            if(price > alertTarget){
                                // SEND ALERT
                                sendAlert(alert.id);
                            }
                        } else if(alertType === 'below'){
                            if(price < alertTarget){
                                // SEND ALERT
                                sendAlert(alert.id);
                            }
                        }
                    });

                });
            }
        });
    } catch (err) {
        console.log(err);
    }
});

// START THE SERVER & CREATE THE DATABASE IF IT DOESN'T EXIST
const port = process.env.PORT || 3000;
app.listen(port, async () => {
    console.log(`Listening on port ${port}`)
    // CHECK IF DATABASE IS INITIALIZED
    const fileExists = false || await fs.promises.stat('database.json').catch(err => false);
    if(!fileExists) {
        console.log('Database not found, initializing...');
        const rawDB = {
            "settings": {
                coins: [
                    {
                        id: 'BTC',
                        name: 'Bitcoin'
                    },
                    {
                        id: 'ETH',
                        name: 'Ethereum'
                    },
                    {
                        id: 'XRP',
                        name: 'Ripple'
                    },
                    {
                        id: 'LTC',
                        name: 'Litecoin'
                    },
                    {
                        id: 'BCH',
                        name: 'Bitcoin Cash'
                    },
                    {
                        id: 'DOGE',
                        name: 'Dogecoin'
                    },
                    {
                        id: 'ADA',
                        name: 'Cardano'
                    },
                    {
                        id: 'BNB',
                        name: 'Binance Coin'
                    },
                ]
            },
            "alerts": []
        }
        fs.writeFileSync('./database.json', JSON.stringify(rawDB));
    }
});