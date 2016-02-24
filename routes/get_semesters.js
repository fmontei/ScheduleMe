var express = require('express');
var sqlite3 = require('sqlite3').verbose();
var async = require('async');

var router = express.Router();
var db = new sqlite3.Database('scheduleme.db');

/**
 * Get all semesters.
 */
router.use(function(req, res, next) {
    async.waterfall([
        function(callback) {
            var query = "SELECT * from semester;";
            db.all(query, function(err, rows) {
                callback(null, rows);
            });
        }
    ], function (err, rows) {
        if (rows && rows.length > 0) {
            res.send(rows);
        } else {
            res.status(404).send('No semesters found.');
        }
    });
});

module.exports = router;

