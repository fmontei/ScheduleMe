
var express = require('express');
var sqlite3 = require('sqlite3').verbose();
var async = require('async');

var router = express.Router();
var db = new sqlite3.Database('scheduleme.db');

/**
 * Get all sections by class id.
 */
router.use(function(req, res, next) {
    var section_id = req.section_id;
    
    if (!section_id) {
        res.status(404).send(null);
        return;
    }

    async.waterfall([
        function(callback) {
            section_id = section_id.trim();
            var query = "SELECT * from timeslot WHERE section_id = '" + section_id + "';";
            db.all(query, function(err, rows) {
                callback(null, rows);
            });
        }
    ], function (err, rows) {
        if (rows && rows.length > 0) {
            res.send(rows);
        } else {
            res.status(404).send('Timeslot with section_id: ' + section_id + ' not found.');
        }
    });
});

module.exports = router;


