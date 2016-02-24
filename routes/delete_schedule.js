
var express = require('express');
var sqlite3 = require('sqlite3').verbose();
var async = require('async');

var router = express.Router();
var db = new sqlite3.Database('scheduleme.db');

router.use(function(req, res, next) {
    if (!req.body || !req.body.schedule_id) {
        return res.sendStatus(400);
    }
    
    async.waterfall([
        function(callback) {
            db.run('delete from sectionschedule where schedule_id = $schedule_id;', {
                $schedule_id: req.body.schedule_id.trim(),
            }, function(err) {
                callback(err);
            });
        },
        function(err, callback) {
            if (err) {
                return res.status(500).send(err);
            }
            db.run('delete from schedule where schedule_id = $schedule_id;', {
                $schedule_id: req.body.schedule_id.trim(),
            }, function(err) {
                callback(err);
            });
        }
    ], function (err) {
        if (err) {
            return res.status(500).send(err);
        } else {
            return res.status(200).redirect(req.header('Referer') || '/');
        }
    });
});

module.exports = router;


