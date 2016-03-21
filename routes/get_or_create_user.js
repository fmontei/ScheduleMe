var express = require('express');
var sqlite3 = require('sqlite3').verbose();
var async = require('async');

var router = express.Router();
var db = new sqlite3.Database('scheduleme.db');

router.use(function(req, res, next) {
    var username = req.body.username;
    async.waterfall([
        function(callback) {
            db.all('select * from user where username = $username;', {
                $username: username
            }, function(err, rows) {
                if (err) {
                    callback(err);
                } else {
                    if (!rows || rows.length === 0) {
                        callback(null);
                    } else {
                        return res.status(200).send(rows[0]);
                    }
                }
            });
        },
        function(callback) {
            db.run('insert into user(username) select $username ' +
                'where not exists (select * from user where username = ' +
                '$username);', {
                $username: username,
            }, function(err) {
                if (err) {
                    callback(err);
                } else {
                    var newUserObj = {
                        'user_id': this.lastID,
                        'username': username,
                    };
                    return res.status(200).send(newUserObj);
                }
            });
        }
    ], function (err) {
        return res.status(200).send(err);
    });
});

module.exports = router;


