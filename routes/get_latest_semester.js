var express = require('express');
var sqlite3 = require('sqlite3').verbose();
var async = require('async');

var router = express.Router();
var db = new sqlite3.Database('scheduleme.db');

/**
 * Get latest semester.
 */
router.use(function(req, res, next) {
    async.waterfall([
        function(callback) {
            var query = "SELECT * FROM semester ORDER BY year, CASE term " +
                "WHEN 'Spring' THEN 1 " +
                "WHEN 'Summer' THEN 2 " +
                "WHEN 'Fall' THEN 3 END DESC LIMIT 1;"; 
            db.all(query, function(err, rows) {
                callback(null, rows);
            });
        }
    ], function (err, rows) {
        if (rows && rows.length > 0) {
            res.send(rows[0]);
        } else {
            res.status(404).send('No semesters found.');
        }
    });
});

module.exports = router;

