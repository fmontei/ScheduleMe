var express = require('express');
var sqlite3 = require('sqlite3').verbose();
var async = require('async');

var router = express.Router();
var db = new sqlite3.Database('scheduleme.db');

router.use(function(req, res, next) {
    if (!req.body || !req.body.username) {
        return res.sendStatus(400);
    }
    
    async.waterfall([
        function(callback) {
            var username = req.body.username;
            db.run('insert into user(username) values($username);', {
                $username: username,
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


