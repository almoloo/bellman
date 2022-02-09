require('dotenv').config();
const express = require('express');
const app = express();
const fs = require('node:fs');
const cookieParser = require('cookie-parser');
const flatfile = require('flatfile');
const nodemailer = require('nodemailer');
const pushbullet = require('pushbullet');
const axios = require('axios');

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
                host: process.env.MAIL_HOST,
                port: process.env.MAIL_PORT,
                tls: true,
                auth: {
                    user: process.env.MAIL_USER,
                    pass: process.env.MAIL_PASSWORD
                }
            });
            const mailOptions = {
                from: 'bellman <alert@bellman.top>',
                to: alert.alertTarget,
                subject: `Your ${alert.coin} alert has been triggered!`,
                html: ```
                <!doctype html>
                <html style="font-size: 16px;">
                  <head>
                    <meta name="viewport" content="width=device-width">
                    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
                    <title>bellman - Get notified of cryptocurrency price changes.</title>
                    <link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;800&display=swap" rel="stylesheet">
                  </head>
                  <body style="background-color: #161f33; font-family: 'Crimson Pro', serif;">
                    <div class="header" style="text-align: center; padding: 2rem 0;">
                        <a href="https://bellman.top" class="title-link" style="color: #6abe83;">
                            <h1 class="title-heading" style="color: #fff; margin: 0; font-weight: bolder;">bellman</h1>
                        </a>
                        <small class="subtitle" style="display: block; margin-top: 1rem; color: #aeaeae;">
                            Get notified of cryptocurrency price changes.
                        </small>
                    </div>
                    <div class="main" style="text-align: center; background-color: #588133; color: #fff; max-width: 90%; margin: auto; border-radius: .5rem; padding: 2rem 0;">
                        ${alert.coin} price is now ${alert.priceType} <strong>$${alert.price}</strong>.
                    </div>
                    <div class="footer" style="text-align: center; color: #aeaeae; padding: 2rem 0;">
                        This is an automated message from <a href="https://bellman.top" style="color: #6abe83;">bellman.top</a>
                    </div>
                  </body>
                </html>                
                ```
            };
            transporter.sendMail(mailOptions, function(error, info) {
                if (error) {
                    console.log(error);
                } else {
                    console.log('Email sent: ' + info.response);
                    // UPDATE ALERT STATUS
                    alert.status = 'sent';
                    data.save();
                };
            });
        } else if(alertType === 'push') {
            // SEND PUSH NOTIFICATION
            // WILL BE IMPLEMENTED LATER
        } else if(alertType === 'sms') {
            // SEND SMS
            // WILL BE IMPLEMENTED LATER
        }
    });
}

// ALERT CHECKING SCHEDULE (every 1 minutes)
setInterval(() => {
    // GET ALERTS FROM DATABASE
    try {
        flatfile.db('./database.json', async (err, data) => {
            if(err) {
                throw err;
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
                // GET COIN PRICE FROM BINANCE
                const price = await axios.get(`https://api.binance.com/api/v3/ticker/price?symbol=${coin}USDT`)
                .then(res => {
                    return res.data.price;
                })
                .catch(err => {
                    throw err;
                });
                const alerts = alertsByCurrency[coin];
                alerts.forEach(alert => {
                    console.log(coin, parseFloat(price))
                    const priceType = alert.priceType;
                    const alertType = alert.alertType;
                    const alertTarget = alert.alertTarget;
                    const alertPrice = parseFloat(alert.alertPrice);
                    const currentPrice = parseFloat(price);
                    // CHECK PRICE
                    if((alertType === 'above' && currentPrice > alertPrice) || (alertType === 'below' && currentPrice < alertPrice)) {
                        // SEND ALERT
                        sendAlert(alert.id);
                    }
                });
            }
        });
    } catch (err) {
        console.log(err);
    }
}, 10000);

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