const express = require('express');
const router = express.Router();
const flatfile = require('flatfile');

// ADD ALERT
router.post('/addAlert', async (req, res) => {
    const alertData = {
        id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
        coin: req.body.coin,
        priceType: req.body.priceType,
        price: req.body.price,
        alertType: req.body.alertType,
        alertTarget: req.body.alertTarget,
        status: 'active',
        createDate: new Date().toUTCString()
    }
    // SAVE ALERT TO DATABASE
    try {
        flatfile.db('db/database.json', async (err, data) => {
            if(err) {
                res.status(500).json({
                    success: false,
                    message: 'Error saving alert.'
                });
            };
            data.alerts.push(alertData);
            data.save(function(err) {
                if(err) throw err;
                const returnData = {...alertData};
                delete returnData.id;
                delete returnData.createDate;
                delete returnData.status;
                res.json({
                    success: true,
                    message: 'Alert saved.',
                    data: returnData
                });
            });
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: 'Error saving alert.'
        });
    }
});

// GET ALERT
router.post('/getAlert', async (req, res) => {
    const alertId = req.body.alertId;
    // GET ALERT FROM DATABASE
    try {
        flatfile.db('db/database.json', async (err, data) => {
            if(err) {
                res.status(500).json({
                    success: false,
                    message: 'Error getting alert.'
                });
            };
            const alert = data.alerts.find(alert => alert.id === alertId);
            res.json({
                success: true,
                message: 'Alert retrieved.',
                data: alert
            });
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: 'Error getting alert.'
        });
    }
});

// GET ALERTS
router.post('/getAlerts', async (req, res) => {
    // GET ALERTS FROM DATABASE
    try {
        flatfile.db('db/database.json', async (err, data) => {
            if(err) {
                res.status(500).json({
                    success: false,
                    message: 'Error getting alerts.'
                });
            };
            const alerts = data.alerts;
            res.json({
                success: true,
                message: 'Alerts retrieved.',
                data: alerts
            });
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: 'Error getting alerts.'
        });
    }
});

// CANCEL ALERT
router.post('/cancelAlert', async (req, res) => {
    const alertId = req.body.alertId;
    // GET ALERT FROM DATABASE
    try {
        flatfile.db('db/database.json', async (err, data) => {
            if(err) {
                res.status(500).json({
                    success: false,
                    message: 'Error cancelling alert.'
                });
            };
            const alert = data.alerts.find(alert => alert.id === alertId);
            alert.status = 'cancelled';
            data.save(function(err) {
                if(err) throw err;
                res.json({
                    success: true,
                    message: 'Alert cancelled.',
                    data: alert
                });
            });
        });
    } catch(err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: 'Error cancelling alert.'
        });
    }
});

module.exports = router