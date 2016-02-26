var express = require('express');
var sqlite3 = require('sqlite3').verbose();
var async = require('async');

var router = express.Router();
var db = new sqlite3.Database('scheduleme.db');

router.use(function(req, res, next) {
    if (!req.body || !req.body.user_id) {
        return res.status(400).send('user_id parameter is required.');
    }
    
    async.waterfall([
        function(callback) {
            db.run('insert into schedule(user_id, date) values($user_id, $date);', {
                $user_id: req.body.user_id.trim(),
                $date: req.body.date.trim() || Date.now()
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


