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
    try {
        flatfile.db('./db/database.json', async (err, data) => {
            if(err) throw err;
            const alert = data.alerts.find(alert => alert.id === alertId);
            if(alert.alertType === 'email') {
                console.log('Sending email alert.');
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
                    html: `
                    <!doctype html>
                    <html style="font-size: 16px;">
                    <head>
                        <meta name="viewport" content="width=device-width">
                        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
                        <title>bellman - Get notified of cryptocurrency price changes.</title>
                        <link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;800&display=swap" rel="stylesheet">
                    </head>
                    <body style="background-color: #161f33; font-family: 'Crimson Pro', serif;">
                        <div style="background-color: #161f33;">
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
                        </div>
                    </body>
                    </html>                
                    `
                };
                transporter.sendMail(mailOptions, function(err, info) {
                    if (err) throw err
                    console.log('Email sent: ' + info.response);
                    // UPDATE ALERT STATUS
                    alert.status = 'sent';
                    data.save(function(err) {
                        if(err) throw err;
                    });
                });
            } else if(alert.alertType === 'push') {
                // SEND PUSH NOTIFICATION
                // WILL BE IMPLEMENTED LATER
            } else if(alert.alertType === 'sms') {
                // SEND SMS
                // WILL BE IMPLEMENTED LATER
            }
        });
    } catch (err) {
        console.log(err);
    }
}

// ALERT CHECKING SCHEDULE (every 1 minutes)
setInterval(() => {
    // GET ALERTS FROM DATABASE
    try {
        flatfile.db('./db/database.json', async (err, data) => {
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
                    const priceType = alert.priceType;
                    const alertPrice = parseFloat(alert.price);
                    const currentPrice = parseFloat(price);
                    console.log({
                        priceType: alert.priceType,
                        alertPrice: parseFloat(alert.price),
                        currentPrice: parseFloat(price)
                    })
                    // CHECK PRICE
                    if((priceType === 'above' && currentPrice > alertPrice) || (priceType === 'below' && currentPrice < alertPrice)) {
                        // SEND ALERT
                        console.log(`Sending alert for ${coin}`);
                        sendAlert(alert.id);
                    }
                });
            }
        });
    } catch (err) {
        console.log(err);
    }
}, 30000);

// START THE SERVER & CREATE THE DATABASE IF IT DOESN'T EXIST
const port = process.env.PORT || 3000;
app.listen(port, async () => {
    console.log(`Listening on port ${port}`)
    // CHECK IF DATABASE IS INITIALIZED
    const fileExists = false || await fs.promises.stat('db/database.json').catch(err => false);
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
        fs.writeFileSync('./db/database.json', JSON.stringify(rawDB));
    }
});